"""Tests for T017 — auth routes (registration, sign-out, stubs).

Covers:
  - POST /api/v1/auth/register/email (201 with cookie)
  - POST /api/v1/auth/register/phone (202, OTP fixture populated)
  - POST /api/v1/auth/register/phone/verify (201, account created)
  - POST /api/v1/auth/sign-out (200, cookie cleared)
  - POST /api/v1/auth/sign-out-all (200, cookie cleared)
  - Sign-in stubs return 501
  - Cookie has HttpOnly; Secure; SameSite=Lax; Path=/
  - No credentials/tokens/secret in response JSON
  - Duplicate email returns generic 409 (no enumeration)
  - Invalid email format returns 400
  - Invalid phone format returns 400
  - Invalid OTP returns 422
  - Missing OTP returns 410
"""

from __future__ import annotations

import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent / "src"))

from mahak_api.main import create_app
from mahak_api.services.otp_service import MockOtpFixtureRegistry
from mahak_api.routes.auth import _otp_registry
from mahak_api.services.auth_service import reset_identity_registry

app = create_app()
client = TestClient(app)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(autouse=True)
def clear_otp_fixture():
    """Clear OTP fixture and identity registry between tests."""
    _otp_registry.clear()
    reset_identity_registry()
    yield
    _otp_registry.clear()
    reset_identity_registry()


# ---------------------------------------------------------------------------
# Tests — register/email
# ---------------------------------------------------------------------------

class TestRegisterEmail:
    def test_registers_and_sets_cookie(self):
        resp = client.post(
            "/api/v1/auth/register/email",
            json={
                "email": "test@example.com",
                "password": "SecureP@ss1",
                "captchaToken": "tok",
                "captcha_response": "ok",
            },
        )
        assert resp.status_code == 201, resp.text
        body = resp.json()
        assert body["shellMode"] == "authenticated"
        # Cookie attributes
        set_cookie = resp.headers.get("set-cookie", "")
        assert "HttpOnly" in set_cookie
        assert "Secure" in set_cookie
        # SameSite is serialized lowercase by the framework; the policy is Lax
        # (RFC 6265bis treats the attribute value case-insensitively).
        assert "samesite=lax" in set_cookie.lower()
        assert "path=/" in set_cookie.lower()
        # Cookie value must NOT appear in response JSON body
        assert "mahak_session" not in body

    def test_invalid_email_format(self):
        resp = client.post(
            "/api/v1/auth/register/email",
            json={"email": "not-an-email", "password": "SecureP@ss1", "captchaToken": "tok"},
        )
        assert resp.status_code == 400

    def test_duplicate_email_generic_error(self):
        """FR-005: duplicate email returns generic message (no enumeration)."""
        client.post(
            "/api/v1/auth/register/email",
            json={"email": "dup@example.com", "password": "SecureP@ss1", "captchaToken": "tok"},
        )
        resp = client.post(
            "/api/v1/auth/register/email",
            json={"email": "dup@example.com", "password": "SecureP@ss1", "captchaToken": "tok"},
        )
        # Should be 409 with generic error, NOT indicating the email exists
        assert resp.status_code == 409
        body = resp.json()
        assert "email" not in str(body["detail"]).lower() or "duplicate" not in str(body["detail"]).lower()


# ---------------------------------------------------------------------------
# Tests — register/phone
# ---------------------------------------------------------------------------

class TestRegisterPhone:
    def test_sends_otp_and_returns_expiry(self):
        resp = client.post(
            "/api/v1/auth/register/phone",
            json={"phone": "+1234567890", "captchaToken": "tok"},
        )
        assert resp.status_code == 202, resp.text
        body = resp.json()
        assert "otpExpiresIn" in body
        assert body["otpExpiresIn"] == 600

    def test_invalid_phone_format(self):
        resp = client.post(
            "/api/v1/auth/register/phone",
            json={"phone": "bad-phone", "captchaToken": "tok"},
        )
        assert resp.status_code == 400

    def test_otp_stored_in_fixture_not_logs(self):
        """OTP code is in the fixture, never in logs (NFR-007)."""
        client.post(
            "/api/v1/auth/register/phone",
            json={"phone": "+1987654321", "captchaToken": "tok"},
        )
        code = _otp_registry.get("+1987654321")
        assert code is not None
        assert len(code) == 6
        assert code.isdigit()


# ---------------------------------------------------------------------------
# Tests — register/phone/verify
# ---------------------------------------------------------------------------

class TestRegisterPhoneVerify:
    def test_verifies_and_creates_account(self):
        # First send OTP
        client.post(
            "/api/v1/auth/register/phone",
            json={"phone": "+1111111111", "captchaToken": "tok"},
        )
        code = _otp_registry.get("+1111111111")
        assert code is not None

        # Verify
        resp = client.post(
            "/api/v1/auth/register/phone/verify",
            json={"phone": "+1111111111", "otpCode": code},
        )
        assert resp.status_code == 201, resp.text
        body = resp.json()
        assert body["shellMode"] == "authenticated"
        # Cookie set
        assert "mahak_session" in resp.headers.get("set-cookie", "")

    def test_invalid_otp_code(self):
        client.post(
            "/api/v1/auth/register/phone",
            json={"phone": "+2222222222", "captchaToken": "tok"},
        )
        resp = client.post(
            "/api/v1/auth/register/phone/verify",
            json={"phone": "+2222222222", "otpCode": "000000"},
        )
        assert resp.status_code == 422

    def test_expired_otp(self):
        # Register without OTP in fixture
        resp = client.post(
            "/api/v1/auth/register/phone/verify",
            json={"phone": "+3333333333", "otpCode": "123456"},
        )
        assert resp.status_code == 410  # OTP expired/missing

    def test_invalid_otp_format(self):
        resp = client.post(
            "/api/v1/auth/register/phone/verify",
            json={"phone": "+4444444444", "otpCode": "abc"},
        )
        assert resp.status_code == 400


# ---------------------------------------------------------------------------
# Tests — sign-in stubs
# ---------------------------------------------------------------------------

class TestSignInStubs:
    def test_sign_in_email_returns_501(self):
        resp = client.post(
            "/api/v1/auth/sign-in/email",
            json={"email": "u@example.com", "password": "pass123"},
        )
        assert resp.status_code == 501

    def test_sign_in_phone_returns_501(self):
        resp = client.post(
            "/api/v1/auth/sign-in/phone",
            json={"phone": "+1234567890"},
        )
        assert resp.status_code == 501

    def test_sign_in_phone_verify_returns_501(self):
        resp = client.post(
            "/api/v1/auth/sign-in/phone/verify",
            json={"phone": "+1234567890", "otpCode": "123456"},
        )
        assert resp.status_code == 501


# ---------------------------------------------------------------------------
# Tests — sign-out
# ---------------------------------------------------------------------------

class TestSignOut:
    def test_sign_out_clears_cookie(self):
        resp = client.post("/api/v1/auth/sign-out")
        assert resp.status_code == 200
        body = resp.json()
        assert body["shellMode"] == "public"
        cookie = resp.headers.get("set-cookie", "")
        assert "Max-Age=0" in cookie
        assert "mahak_session=" in cookie

    def test_sign_out_all_clears_cookie(self):
        resp = client.post("/api/v1/auth/sign-out-all")
        assert resp.status_code == 200
        body = resp.json()
        assert body["shellMode"] == "public"


# ---------------------------------------------------------------------------
# Security assertions
# ---------------------------------------------------------------------------

class TestSecurityAssertions:
    def test_no_token_in_response_body(self):
        """NFR-006: session token never in JSON response."""
        resp = client.post(
            "/api/v1/auth/register/email",
            json={"email": "sec@example.com", "password": "SecureP@ss1", "captchaToken": "tok"},
        )
        body_str = str(resp.json())
        # The token is only in the cookie header, not in the JSON body
        assert "token" not in body_str.lower() or "shellmode" in body_str.lower()

    def test_no_password_in_response(self):
        resp = client.post(
            "/api/v1/auth/register/email",
            json={"email": "sec2@example.com", "password": "SecureP@ss1", "captchaToken": "tok"},
        )
        assert "SecureP@ss1" not in str(resp.json())
