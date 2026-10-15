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
/** Same-origin base; overridable for tests or a deployed api (mirrors ShellApiClient). */
function apiBaseUrl() {
    try {
        const env = import.meta.env;
        return env?.VITE_API_BASE_URL ?? "";
    }
    catch {
        return "";
    }
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
];
function isAuthErrorCode(value) {
    return AUTH_ERROR_CODES.includes(value);
}
/**
 * Typed error returned by every AuthService method. Never carries a password,
 * token, OTP code, or provider detail — only the stable code, the HTTP status,
 * and the retry hint when the api supplied one.
 */
export class AuthError extends Error {
    code;
    status;
    retryAfterSeconds;
    constructor(code, status, retryAfterSeconds = null) {
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
function codeForStatus(status, detail) {
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
function readDetail(payload) {
    if (typeof payload !== "object" || payload === null) {
        return { code: null, retryAfter: null };
    }
    const detail = payload.detail;
    if (typeof detail === "string") {
        return { code: detail, retryAfter: null };
    }
    if (typeof detail === "object" && detail !== null) {
        const record = detail;
        const code = typeof record.error === "string" ? record.error : null;
        const retryAfter = typeof record.retryAfter === "number" ? record.retryAfter : null;
        return { code, retryAfter };
    }
    return { code: null, retryAfter: null };
}
/** Parse a JSON body defensively; an empty body is legitimate (204-style). */
async function readJson(response) {
    try {
        return await response.json();
    }
    catch {
        return null;
    }
}
function buildUrl(path) {
    return `${apiBaseUrl()}${path}`;
}
async function post(path, body, signal) {
    let response;
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
    }
    catch {
        throw new AuthError("network_error", 0);
    }
    if (!response.ok) {
        const payload = await readJson(response);
        const { code, retryAfter } = readDetail(payload);
        throw new AuthError(codeForStatus(response.status, code), response.status, retryAfter);
    }
    return (await readJson(response));
}
async function get(path, signal) {
    let response;
    try {
        response = await fetch(buildUrl(path), {
            method: "GET",
            headers: { Accept: "application/json" },
            credentials: "include",
            signal,
        });
    }
    catch {
        throw new AuthError("network_error", 0);
    }
    if (!response.ok) {
        const payload = await readJson(response);
        const { code, retryAfter } = readDetail(payload);
        throw new AuthError(codeForStatus(response.status, code), response.status, retryAfter);
    }
    return (await readJson(response));
}
/**
 * R02 web auth client. Every method maps 1:1 onto a route declared in
 * contracts/auth.md.
 */
export const AuthService = {
    /** `POST /api/v1/auth/register/email` → 201 with `mahak_session` cookie. */
    async registerEmail(input, signal) {
        return post("/api/v1/auth/register/email", input, signal);
    },
    /** `POST /api/v1/auth/register/phone` → 202 OTP issuance. */
    async registerPhone(input, signal) {
        return post("/api/v1/auth/register/phone", input, signal);
    },
    /** `POST /api/v1/auth/register/phone/verify` → 201 account + session. */
    async registerPhoneVerify(input, signal) {
        return post("/api/v1/auth/register/phone/verify", input, signal);
    },
    /** `POST /api/v1/auth/sign-in/email` → 200 session. */
    async signInEmail(input, signal) {
        return post("/api/v1/auth/sign-in/email", input, signal);
    },
    /** `POST /api/v1/auth/sign-in/phone` → 202 OTP issuance. */
    async signInPhone(input, signal) {
        return post("/api/v1/auth/sign-in/phone", input, signal);
    },
    /** `POST /api/v1/auth/sign-in/phone/verify` → 200 session. */
    async signInPhoneVerify(input, signal) {
        return post("/api/v1/auth/sign-in/phone/verify", input, signal);
    },
    /** `POST /api/v1/auth/sign-out` → 200; clears the cookie with Max-Age=0. */
    async signOut(signal) {
        return post("/api/v1/auth/sign-out", {}, signal);
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
    async googleCallback(code, signal) {
        if (!code)
            return false;
        try {
            const response = await fetch(`${apiBaseUrl()}/api/v1/auth/google/callback?code=${encodeURIComponent(code)}`, {
                method: "GET",
                headers: { Accept: "application/json" },
                credentials: "include",
                redirect: "manual", // we do not follow the redirect here; the caller redirects
                signal,
            });
            // A 3xx redirect means the callback succeeded (cookie already set server-side).
            return response.status >= 300 && response.status < 400;
        }
        catch {
            return false;
        }
    },
    /** `POST /api/v1/auth/sign-out-all` → 200; revokes every session. */
    async signOutAll(signal) {
        return post("/api/v1/auth/sign-out-all", {}, signal);
    },
    /**
     * `GET /api/v1/auth/me` → 200 with the authenticated user's profile.
     *
     * Used by `AuthProvider` to hydrate `role` and `organizationReference` once
     * the shell resolves `authenticated`. The session cookie travels with the
     * request automatically; no token is ever read or stored in JS (NFR-006).
     */
    async me(signal) {
        return get("/api/v1/auth/me", signal);
    },
    /** `GET /api/v1/auth/captcha/challenge` → 200 locale-aware challenge HTML. */
    async captchaChallenge(locale, signal) {
        return get(`/api/v1/auth/captcha/challenge?locale=${locale}`, signal);
    },
};
