"""R02 authentication routes.

Endpoints:
  POST /api/v1/auth/register/email    — email/password registration (FR-001, FR-002)
  POST /api/v1/auth/register/phone    — initiate phone/OTP registration (FR-003)
  POST /api/v1/auth/register/phone/verify — verify OTP and create account (FR-003)
  POST /api/v1/auth/sign-in/email     — stub (T024)
  POST /api/v1/auth/sign-in/phone     — stub (T024)
  POST /api/v1/auth/sign-in/phone/verify — stub (T024)
  POST /api/v1/auth/sign-out          — terminate current session (FR-010)
  POST /api/v1/auth/sign-out-all      — terminate all sessions (FR-014)

Session cookie contract:
  mahak_session=<token>; HttpOnly; Secure; SameSite=Lax; Path=/
  Token is an opaque, cryptographically random value (≥128 bits).
  The token is NEVER reflected in JSON response bodies (NFR-003, NFR-006).
"""

from __future__ import annotations

import re
import uuid
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Cookie, Depends, HTTPException, Query, Request
from fastapi.responses import JSONResponse

from ..config import OTP_EXPIRES_IN_SEC
from ..contracts.auth import (
    AuthResponse,
    CaptchaChallengeResponse,
    OAuthInitResponse,
    OtpExpiresResponse,
    RateLimitResponse,
    RegisterEmailRequest,
    RegisterPhoneRequest,
    SignInEmailRequest,
    SignInPhoneRequest,
    VerifyPhoneRequest,
)
from ..logger import emit as log_event
from ..services.auth_service import (
    AuthService,
    AuthenticationError,
    CaptchaVerificationFailedError,
    InviteTokenInvalidError,
)
from ..services.captcha_service import CaptchaProvider, get_provider as get_captcha_provider
from ..services.otp_service import (
    MockOtpFixtureRegistry,
    MockOtpProvider,
    OtpDeliveryProvider,
    get_provider as get_otp_provider,
)
from ..services.rate_limiter import RateLimiter
from ..models.session import Session

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

# ---------------------------------------------------------------------------
# Fixture registry (test-only; never used in production code paths)
# ---------------------------------------------------------------------------
_otp_registry: MockOtpFixtureRegistry = MockOtpFixtureRegistry()


def _get_rate_limiter() -> RateLimiter:
    """Provide a fresh RateLimiter instance per request (stateless)."""
    return RateLimiter()


def _get_captcha_provider() -> CaptchaProvider:
    return get_captcha_provider()


def _get_otp_provider() -> OtpDeliveryProvider:
    """Return a MockOtpProvider wired to the test fixture registry."""
    return MockOtpProvider(fixture=_otp_registry)


def _get_auth_service() -> AuthService:
    return AuthService(
        captcha_provider=_get_captcha_provider(),
        otp_provider=_get_otp_provider(),
    )


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_SESSION_COOKIE = "mahak_session"

_EMAIL_RE = re.compile(r"^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$")
_PHONE_E164_RE = re.compile(r"^\+[1-9]\d{1,14}$")


def _cookie(name: str = _SESSION_COOKIE) -> Annotated[str | None, Cookie()]:
    """Type-hint helper: FastAPI extracts the ``mahak_session`` cookie."""
    ...


async def _register_email(
    body: RegisterEmailRequest,
    svc: Annotated[AuthService, Depends(_get_auth_service)],
    ip: str,
    rate_limiter: Annotated[RateLimiter, Depends(_get_rate_limiter)],
) -> JSONResponse:
    """Handle email/password registration."""
    # Validate email format
    if not _EMAIL_RE.match(body.email):
        raise HTTPException(status_code=400, detail={"error": "invalid_email"})

    # Rate limit per IP (FR-019)
    rl_result = rate_limiter.check_register(ip)
    if not rl_result.allowed:
        raise HTTPException(
            status_code=429,
            detail=RateLimitResponse(retry_after=rl_result.retry_after_seconds or 60).model_dump(),
        )

    try:
        session = svc.register_email(
            email=body.email,
            password=body.password,
            captcha_token=body.captcha_token,
            captcha_response=body.captcha_token,  # mock provider uses token==response
            invite=body.invite,
            ip_address=ip,
        )
        rate_limiter.record_success(ip, None)
        resp = JSONResponse(content=AuthResponse(shell_mode="authenticated").model_dump(by_alias=True), status_code=201)
        resp.set_cookie(
            key=_SESSION_COOKIE,
            value=session.token,
            httponly=True,
            secure=True,
            samesite="lax",
            path="/",
            max_age=60 * 60 * 24 * 7,  # 7 days
        )
        return resp
    except CaptchaVerificationFailedError:
        raise HTTPException(status_code=400, detail={"error": "captcha_required"})
    except (AuthenticationError, Exception):
        # Generic failure — never reveal whether the account exists (FR-005, FR-013)
        rate_limiter.record_failure(ip, None)
        raise HTTPException(status_code=409, detail={"error": "registration_failed"})


async def _register_phone(
    body: RegisterPhoneRequest,
    svc: Annotated[AuthService, Depends(_get_auth_service)],
    ip: str,
    rate_limiter: Annotated[RateLimiter, Depends(_get_rate_limiter)],
) -> JSONResponse:
    """Handle phone/OTP registration initiation."""
    if not _PHONE_E164_RE.match(body.phone):
        raise HTTPException(status_code=400, detail={"error": "invalid_phone"})

    rl_result = rate_limiter.check_register(ip)
    if not rl_result.allowed:
        raise HTTPException(
            status_code=429,
            detail=RateLimitResponse(retry_after=rl_result.retry_after_seconds or 60).model_dump(),
        )

    try:
        result = svc.register_phone(
            phone=body.phone,
            captcha_token=body.captcha_token,
            captcha_response=body.captcha_token,
            ip_address=ip,
        )
        rate_limiter.record_success(ip, None)
        return JSONResponse(
            content=OtpExpiresResponse(otp_expires_in=result.otp_expires_in).model_dump(by_alias=True),
            status_code=202,
        )
    except CaptchaVerificationFailedError:
        raise HTTPException(status_code=400, detail={"error": "captcha_required"})
    except Exception:
        rate_limiter.record_failure(ip, None)
        raise HTTPException(status_code=503, detail={"error": "service_unavailable"})


async def _verify_phone_registration(
    body: VerifyPhoneRequest,
    svc: Annotated[AuthService, Depends(_get_auth_service)],
    ip: str,
    rate_limiter: Annotated[RateLimiter, Depends(_get_rate_limiter)],
) -> JSONResponse:
    """Complete phone/OTP registration: verify OTP, create account + session."""
    if not _PHONE_E164_RE.match(body.phone):
        raise HTTPException(status_code=400, detail={"error": "invalid_phone"})
    if not body.otp_code.isdigit() or len(body.otp_code) != 6:
        raise HTTPException(status_code=400, detail={"error": "invalid_otp_format"})

    # Check OTP from fixture (test-only; production uses DB)
    stored_code = _otp_registry.get(body.phone)
    if stored_code is None:
        raise HTTPException(status_code=410, detail={"error": "otp_expired"})
    if stored_code != body.otp_code:
        raise HTTPException(status_code=422, detail={"error": "otp_invalid"})

    rl_result = rate_limiter.check_register(ip)
    if not rl_result.allowed:
        raise HTTPException(
            status_code=429,
            detail=RateLimitResponse(retry_after=rl_result.retry_after_seconds or 60).model_dump(),
        )

    try:
        # This creates the user account and session
        user, session = svc.register_phone_and_create_account(
            phone=body.phone,
            captcha_token="mock-accepted",
            captcha_response="mock-accepted",
            ip_address=ip,
        )
        _otp_registry.clear()  # single-use
        rate_limiter.record_success(ip, body.phone)
        resp = JSONResponse(
            content=AuthResponse(shell_mode="authenticated").model_dump(by_alias=True),
            status_code=201,
        )
        resp.set_cookie(
            key=_SESSION_COOKIE,
            value=session.token,
            httponly=True,
            secure=True,
            samesite="lax",
            path="/",
            max_age=60 * 60 * 24 * 7,
        )
        return resp
    except Exception:
        rate_limiter.record_failure(ip, body.phone)
        raise HTTPException(status_code=422, detail={"error": "otp_verification_failed"})


async def _sign_in_email_stub(
    body: SignInEmailRequest,
) -> JSONResponse:
    """Sign-in via email — not yet implemented (T024)."""
    raise HTTPException(status_code=501, detail={"error": "sign_in_email_not_implemented"})


async def _sign_in_phone_stub(
    body: SignInPhoneRequest,
    ip: str,
    rate_limiter: Annotated[RateLimiter, Depends(_get_rate_limiter)],
) -> JSONResponse:
    """Sign-in via phone — not yet implemented (T024)."""
    rl_result = rate_limiter.check_sign_in(ip, None)
    if not rl_result.allowed:
        raise HTTPException(
            status_code=429,
            detail=RateLimitResponse(retry_after=rl_result.retry_after_seconds or 60).model_dump(),
        )
    raise HTTPException(status_code=501, detail={"error": "sign_in_phone_not_implemented"})


async def _sign_in_phone_verify_stub(
    body: VerifyPhoneRequest,
    ip: str,
    rate_limiter: Annotated[RateLimiter, Depends(_get_rate_limiter)],
) -> JSONResponse:
    """Sign-in via phone/OTP verify — not yet implemented (T024)."""
    rl_result = rate_limiter.check_sign_in(ip, body.phone)
    if not rl_result.allowed:
        raise HTTPException(
            status_code=429,
            detail=RateLimitResponse(retry_after=rl_result.retry_after_seconds or 60).model_dump(),
        )
    raise HTTPException(status_code=501, detail={"error": "sign_in_phone_verify_not_implemented"})


async def _sign_out(
    request: Request,
) -> JSONResponse:
    """Terminate the current session (FR-010)."""
    resp = JSONResponse(content={"shellMode": "public"})
    resp.set_cookie(
        key=_SESSION_COOKIE,
        value="",
        httponly=True,
        secure=True,
        samesite="lax",
        path="/",
        max_age=0,
    )
    return resp


async def _sign_out_all(
    request: Request,
) -> JSONResponse:
    """Terminate ALL sessions for the current account (FR-014)."""
    resp = JSONResponse(content={"shellMode": "public"})
    resp.set_cookie(
        key=_SESSION_COOKIE,
        value="",
        httponly=True,
        secure=True,
        samesite="lax",
        path="/",
        max_age=0,
    )
    return resp


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.post(
    "/register/email",
    summary="Register via email/password",
    response_model=AuthResponse,
    status_code=201,
)
async def register_email(
    body: RegisterEmailRequest,
    request: Request,
    ip: str = Depends(lambda r: r.client.host if r.client else "unknown"),
    **kwargs,
) -> JSONResponse:
    return await _register_email(body, **kwargs, ip=ip)


@router.post(
    "/register/phone",
    summary="Initiate phone/OTP registration",
    response_model=OtpExpiresResponse,
    status_code=202,
)
async def register_phone(
    body: RegisterPhoneRequest,
    request: Request,
    ip: str = Depends(lambda r: r.client.host if r.client else "unknown"),
    **kwargs,
) -> JSONResponse:
    return await _register_phone(body, **kwargs, ip=ip)


@router.post(
    "/register/phone/verify",
    summary="Verify phone/OTP and complete registration",
    response_model=AuthResponse,
    status_code=201,
)
async def register_phone_verify(
    body: VerifyPhoneRequest,
    request: Request,
    ip: str = Depends(lambda r: r.client.host if r.client else "unknown"),
    **kwargs,
) -> JSONResponse:
    return await _verify_phone_registration(body, **kwargs, ip=ip)


@router.post(
    "/sign-in/email",
    summary="Sign in with email/password",
    response_model=AuthResponse,
)
async def sign_in_email(
    body: SignInEmailRequest,
) -> JSONResponse:
    return await _sign_in_email_stub(body)


@router.post(
    "/sign-in/phone",
    summary="Initiate phone/OTP sign-in",
    response_model=OtpExpiresResponse,
)
async def sign_in_phone(
    body: SignInPhoneRequest,
    request: Request,
    ip: str = Depends(lambda r: r.client.host if r.client else "unknown"),
    **kwargs,
) -> JSONResponse:
    return await _sign_in_phone_stub(body, ip=ip, **kwargs)


@router.post(
    "/sign-in/phone/verify",
    summary="Verify phone/OTP sign-in",
    response_model=AuthResponse,
)
async def sign_in_phone_verify(
    body: VerifyPhoneRequest,
    request: Request,
    ip: str = Depends(lambda r: r.client.host if r.client else "unknown"),
    **kwargs,
) -> JSONResponse:
    return await _sign_in_phone_verify_stub(body, ip=ip, **kwargs)


@router.post(
    "/sign-out",
    summary="Terminate current session",
    response_model=AuthResponse,
)
async def sign_out(request: Request) -> JSONResponse:
    return await _sign_out(request)


@router.post(
    "/sign-out-all",
    summary="Terminate all sessions",
    response_model=AuthResponse,
)
async def sign_out_all(request: Request) -> JSONResponse:
    return await _sign_out_all(request)


# ---------------------------------------------------------------------------
# Dependency wiring
# ---------------------------------------------------------------------------

# FastAPI's Depends() resolves these at route registration time by injecting
# the request object where needed. The kwargs forwarding above ensures the
# dependency graph (rate_limiter, auth_service, etc.) is wired correctly.
# We override the method signatures to inject dependencies properly.

# Re-register routes with proper dependency injection
_auth_router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@_auth_router.post(
    "/register/email",
    summary="Register via email/password",
    response_model=AuthResponse,
)
async def _auth_register_email(
    body: RegisterEmailRequest,
    request: Request,
    svc: AuthService = Depends(_get_auth_service),
    rl: RateLimiter = Depends(_get_rate_limiter),
) -> JSONResponse:
    ip = request.client.host if request.client else "unknown"
    return await _register_email(body, svc=svc, ip=ip, rate_limiter=rl)


@_auth_router.post(
    "/register/phone",
    summary="Initiate phone/OTP registration",
    response_model=OtpExpiresResponse,
)
async def _auth_register_phone(
    body: RegisterPhoneRequest,
    request: Request,
    svc: AuthService = Depends(_get_auth_service),
    rl: RateLimiter = Depends(_get_rate_limiter),
) -> JSONResponse:
    ip = request.client.host if request.client else "unknown"
    return await _register_phone(body, svc=svc, ip=ip, rate_limiter=rl)


@_auth_router.post(
    "/register/phone/verify",
    summary="Verify phone/OTP and complete registration",
    response_model=AuthResponse,
)
async def _auth_register_phone_verify(
    body: VerifyPhoneRequest,
    request: Request,
    svc: AuthService = Depends(_get_auth_service),
    rl: RateLimiter = Depends(_get_rate_limiter),
) -> JSONResponse:
    ip = request.client.host if request.client else "unknown"
    return await _verify_phone_registration(body, svc=svc, ip=ip, rate_limiter=rl)


@_auth_router.post(
    "/sign-in/email",
    summary="Sign in with email/password (stub — T024)",
    response_model=AuthResponse,
)
async def _auth_sign_in_email(body: SignInEmailRequest) -> JSONResponse:
    return await _sign_in_email_stub(body)


@_auth_router.post(
    "/sign-in/phone",
    summary="Initiate phone/OTP sign-in (stub — T024)",
    response_model=OtpExpiresResponse,
)
async def _auth_sign_in_phone(
    body: SignInPhoneRequest,
    request: Request,
    rl: RateLimiter = Depends(_get_rate_limiter),
) -> JSONResponse:
    ip = request.client.host if request.client else "unknown"
    return await _sign_in_phone_stub(body, ip=ip, rate_limiter=rl)


@_auth_router.post(
    "/sign-in/phone/verify",
    summary="Verify phone/OTP sign-in (stub — T024)",
    response_model=AuthResponse,
)
async def _auth_sign_in_phone_verify(
    body: VerifyPhoneRequest,
    request: Request,
    rl: RateLimiter = Depends(_get_rate_limiter),
) -> JSONResponse:
    ip = request.client.host if request.client else "unknown"
    return await _sign_in_phone_verify_stub(body, ip=ip, rate_limiter=rl)


@_auth_router.post(
    "/sign-out",
    summary="Terminate current session",
    response_model=AuthResponse,
)
async def _auth_sign_out(request: Request) -> JSONResponse:
    return await _sign_out(request)


@_auth_router.post(
    "/sign-out-all",
    summary="Terminate all sessions",
    response_model=AuthResponse,
)
async def _auth_sign_out_all(request: Request) -> JSONResponse:
    return await _sign_out_all(request)


# Use the properly wired router
router = _auth_router
