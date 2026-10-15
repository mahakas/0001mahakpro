/**
 * R02 authentication client — wraps the `/api/v1/auth/...` routes
 * (FR-001–FR-015, contracts/auth.md).
 *
 * Security boundaries (T018, NFR-006):
 *  - Every request is sent with `credentials: "include"` so the HttpOnly
 *    `mahak_session` cookie travels with the request. The cookie is the only
 *    session reference the browser holds; this client never reads it.
 *  - No session token, OTP code, password, or provider secret is ever stored in
 *    memory, `localStorage`, `sessionStorage`, or any module-level variable.
 *  - Error responses are normalized into typed `AuthError` objects matching the
 *    error shapes declared in contracts/auth.md, and never leak provider or
 *    internal details (FR-038, FR-042, FR-047).
 */

import type { ShellMode } from "@mahak/contracts";

/** Same-origin base; overridable for tests or a deployed api (mirrors ShellApiClient). */
function apiBaseUrl(): string {
  try {
    const env = (import.meta as { env?: Record<string, string> }).env;
    return env?.VITE_API_BASE_URL ?? "";
  } catch {
    return "";
  }
}

/** Response shape shared by every session-creating auth route. */
export interface AuthModeResponse {
  readonly shellMode: ShellMode;
}

/** Response shape of the OTP-issuing routes. */
export interface OtpExpiresResponse {
  readonly otpExpiresIn: number;
}

/** Response shape of the CAPTCHA challenge route. */
export interface CaptchaChallengeResponse {
  readonly html: string;
}

/** The stable set of error codes declared in contracts/auth.md. */
export const AUTH_ERROR_CODES = [
  "invalid_email",
  "invalid_phone",
  "invalid_otp_format",
  "otp_invalid",
  "otp_expired",
  "registration_failed",
  "sign_in_failed",
  "captcha_required",
  "rate_limit_exceeded",
  "service_unavailable",
  "unauthorized",
  "forbidden",
  "not_implemented",
  "network_error",
] as const;

export type AuthErrorCode = (typeof AUTH_ERROR_CODES)[number];

function isAuthErrorCode(value: string): value is AuthErrorCode {
  return (AUTH_ERROR_CODES as readonly string[]).includes(value);
}

/**
 * Typed error returned by every AuthService method. Never carries a password,
 * token, OTP code, or provider detail — only the stable code, the HTTP status,
 * and the retry hint when the api supplied one.
 */
export class AuthError extends Error {
  readonly code: AuthErrorCode;
  readonly status: number;
  readonly retryAfterSeconds: number | null;

  constructor(code: AuthErrorCode, status: number, retryAfterSeconds: number | null = null) {
    super(code);
    this.name = "AuthError";
    this.code = code;
    this.status = status;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

/**
 * Map an HTTP status to the contract's error code. The api's own `detail.error`
 * is honoured only when it is one of the declared codes; anything else falls
 * back to the status mapping so an unrecognised provider string never reaches
 * the UI as a raw message (FR-042, FR-047).
 */
function codeForStatus(status: number, detail: string | null): AuthErrorCode {
  if (detail && isAuthErrorCode(detail)) {
    return detail;
  }
  switch (status) {
    case 400:
      return "invalid_email";
    case 401:
      return "sign_in_failed";
    case 403:
      return "forbidden";
    case 409:
      return "registration_failed";
    case 410:
      return "otp_expired";
    case 422:
      return "otp_invalid";
    case 429:
      return "rate_limit_exceeded";
    case 501:
      return "not_implemented";
    case 503:
      return "service_unavailable";
    default:
      return "network_error";
  }
}

/** Read the api's `detail` object without leaking unknown fields. */
function readDetail(payload: unknown): { code: string | null; retryAfter: number | null } {
  if (typeof payload !== "object" || payload === null) {
    return { code: null, retryAfter: null };
  }
  const detail = (payload as { detail?: unknown }).detail;
  if (typeof detail === "string") {
    return { code: detail, retryAfter: null };
  }
  if (typeof detail === "object" && detail !== null) {
    const record = detail as Record<string, unknown>;
    const code = typeof record.error === "string" ? record.error : null;
    const retryAfter = typeof record.retryAfter === "number" ? record.retryAfter : null;
    return { code, retryAfter };
  }
  return { code: null, retryAfter: null };
}

/** Parse a JSON body defensively; an empty body is legitimate (204-style). */
async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function buildUrl(path: string): string {
  return `${apiBaseUrl()}${path}`;
}

async function post<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
  let response: Response;
  try {
    response = await fetch(buildUrl(path), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      // The HttpOnly session cookie travels with the request and is never read
      // by this client (NFR-006).
      credentials: "include",
      body: JSON.stringify(body),
      signal,
    });
  } catch {
    throw new AuthError("network_error", 0);
  }
  if (!response.ok) {
    const payload = await readJson(response);
    const { code, retryAfter } = readDetail(payload);
    throw new AuthError(codeForStatus(response.status, code), response.status, retryAfter);
  }
  return (await readJson(response)) as T;
}

async function get<T>(path: string, signal?: AbortSignal): Promise<T> {
  let response: Response;
  try {
    response = await fetch(buildUrl(path), {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "include",
      signal,
    });
  } catch {
    throw new AuthError("network_error", 0);
  }
  if (!response.ok) {
    const payload = await readJson(response);
    const { code, retryAfter } = readDetail(payload);
    throw new AuthError(codeForStatus(response.status, code), response.status, retryAfter);
  }
  return (await readJson(response)) as T;
}

/** Request payload for `POST /api/v1/auth/register/email`. */
export interface RegisterEmailInput {
  readonly email: string;
  readonly password: string;
  readonly captchaToken: string;
  readonly invite?: string;
}

/** Request payload for `POST /api/v1/auth/sign-in/email`. */
export interface SignInEmailInput {
  readonly email: string;
  readonly password: string;
  readonly captchaToken?: string;
}

/** Request payload for the phone OTP routes. */
export interface PhoneOtpInput {
  readonly phone: string;
}

/** Request payload for the phone OTP verification routes. */
export interface PhoneOtpVerifyInput {
  readonly phone: string;
  readonly otpCode: string;
}

/**
 * The authenticated user profile as returned by `GET /api/v1/auth/me`.
 *
 * Only non-sensitive identity attributes are exposed. Password hashes, OTP
 * values, and session tokens are never part of this contract (NFR-003,
 * NFR-006, FR-006).
 */
export interface UserProfile {
  readonly id: string;
  readonly email: string | null;
  readonly phone: string | null;
  /** Exactly `user` or `admin` in R02; extensible for future roles (FR-022). */
  readonly role: string;
  /** Opaque invite token, or null when absent / invalid (FR-029, FR-031). */
  readonly organizationReference: string | null;
}

/**
 * R02 web auth client. Every method maps 1:1 onto a route declared in
 * contracts/auth.md.
 */
export const AuthService = {
  /** `POST /api/v1/auth/register/email` → 201 with `mahak_session` cookie. */
  async registerEmail(input: RegisterEmailInput, signal?: AbortSignal): Promise<AuthModeResponse> {
    return post<AuthModeResponse>("/api/v1/auth/register/email", input, signal);
  },

  /** `POST /api/v1/auth/register/phone` → 202 OTP issuance. */
  async registerPhone(input: PhoneOtpInput, signal?: AbortSignal): Promise<OtpExpiresResponse> {
    return post<OtpExpiresResponse>("/api/v1/auth/register/phone", input, signal);
  },

  /** `POST /api/v1/auth/register/phone/verify` → 201 account + session. */
  async registerPhoneVerify(
    input: PhoneOtpVerifyInput,
    signal?: AbortSignal,
  ): Promise<AuthModeResponse> {
    return post<AuthModeResponse>("/api/v1/auth/register/phone/verify", input, signal);
  },

  /** `POST /api/v1/auth/sign-in/email` → 200 session. */
  async signInEmail(input: SignInEmailInput, signal?: AbortSignal): Promise<AuthModeResponse> {
    return post<AuthModeResponse>("/api/v1/auth/sign-in/email", input, signal);
  },

  /** `POST /api/v1/auth/sign-in/phone` → 202 OTP issuance. */
  async signInPhone(input: PhoneOtpInput, signal?: AbortSignal): Promise<OtpExpiresResponse> {
    return post<OtpExpiresResponse>("/api/v1/auth/sign-in/phone", input, signal);
  },

  /** `POST /api/v1/auth/sign-in/phone/verify` → 200 session. */
  async signInPhoneVerify(
    input: PhoneOtpVerifyInput,
    signal?: AbortSignal,
  ): Promise<AuthModeResponse> {
    return post<AuthModeResponse>("/api/v1/auth/sign-in/phone/verify", input, signal);
  },

  /** `POST /api/v1/auth/sign-out` → 200; clears the cookie with Max-Age=0. */
  async signOut(signal?: AbortSignal): Promise<AuthModeResponse> {
    return post<AuthModeResponse>("/api/v1/auth/sign-out", {}, signal);
  },

  /**
   * Complete the Google OAuth 2.0 callback. The api exchanges the authorization
   * code, creates the server session (sets the HttpOnly cookie), and redirects
   * to the application root. Returns `true` when the exchange succeeded; the
   * caller is expected to navigate to `/` so the shell picks up the new session.
   *
   * Returns `false` when no code is supplied or the api responds with a
   * non-redirect error — the caller must surface a generic failure message.
   */
  async googleCallback(code: string, signal?: AbortSignal): Promise<boolean> {
    if (!code) return false;
    try {
      const response = await fetch(
        `${apiBaseUrl()}/api/v1/auth/google/callback?code=${encodeURIComponent(code)}`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: "include",
          redirect: "manual", // we do not follow the redirect here; the caller redirects
          signal,
        },
      );
      // A 3xx redirect means the callback succeeded (cookie already set server-side).
      return response.status >= 300 && response.status < 400;
    } catch {
      return false;
    }
  },

  /** `POST /api/v1/auth/sign-out-all` → 200; revokes every session. */
  async signOutAll(signal?: AbortSignal): Promise<AuthModeResponse> {
    return post<AuthModeResponse>("/api/v1/auth/sign-out-all", {}, signal);
  },

  /**
   * `GET /api/v1/auth/me` → 200 with the authenticated user's profile.
   *
   * Used by `AuthProvider` to hydrate `role` and `organizationReference` once
   * the shell resolves `authenticated`. The session cookie travels with the
   * request automatically; no token is ever read or stored in JS (NFR-006).
   */
  async me(signal?: AbortSignal): Promise<UserProfile> {
    return get<UserProfile>("/api/v1/auth/me", signal);
  },

  /** `GET /api/v1/auth/captcha/challenge` → 200 locale-aware challenge HTML. */
  async captchaChallenge(locale: "fa" | "ar" | "en", signal?: AbortSignal): Promise<CaptchaChallengeResponse> {
    return get<CaptchaChallengeResponse>(`/api/v1/auth/captcha/challenge?locale=${locale}`, signal);
  },
} as const;

export type AuthService = typeof AuthService;
