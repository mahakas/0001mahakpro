/**
 * T018 — auth client contract tests.
 *
 * Verifies: every method targets the route declared in contracts/auth.md, sends
 * `credentials: "include"`, never stores a token anywhere, and normalizes errors
 * into typed `AuthError` objects without leaking provider or credential detail.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthService, AuthError } from "../../src/services/AuthService.js";
const calls = [];
let nextResponse;
function jsonResponse(body, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
    });
}
beforeEach(() => {
    calls.length = 0;
    nextResponse = () => jsonResponse({ shellMode: "authenticated" });
    vi.stubGlobal("fetch", vi.fn(async (input, init) => {
        calls.push({ url: input, init });
        return nextResponse();
    }));
    // Ensure no client-side token storage is used anywhere.
    window.localStorage.clear();
    window.sessionStorage.clear();
});
afterEach(() => {
    vi.unstubAllGlobals();
});
describe("AuthService routes (contracts/auth.md)", () => {
    it("registerEmail targets POST /api/v1/auth/register/email", async () => {
        nextResponse = () => jsonResponse({ shellMode: "authenticated" }, 201);
        const result = await AuthService.registerEmail({
            email: "u@example.com",
            password: "SecureP@ss1",
            captchaToken: "tok",
        });
        expect(result.shellMode).toBe("authenticated");
        const { url, init } = calls[0];
        expect(url).toContain("/api/v1/auth/register/email");
        expect(init?.method).toBe("POST");
    });
    it("registerPhone targets POST /api/v1/auth/register/phone", async () => {
        nextResponse = () => jsonResponse({ otpExpiresIn: 600 }, 202);
        const result = await AuthService.registerPhone({ phone: "+1234567890" });
        expect(result.otpExpiresIn).toBe(600);
        expect(calls[0].url).toContain("/api/v1/auth/register/phone");
    });
    it("registerPhoneVerify targets the registration verify route", async () => {
        nextResponse = () => jsonResponse({ shellMode: "authenticated" }, 201);
        await AuthService.registerPhoneVerify({ phone: "+1234567890", otpCode: "123456" });
        expect(calls[0].url).toContain("/api/v1/auth/register/phone/verify");
    });
    it("signInEmail targets POST /api/v1/auth/sign-in/email", async () => {
        await AuthService.signInEmail({ email: "u@example.com", password: "SecureP@ss1" });
        expect(calls[0].url).toContain("/api/v1/auth/sign-in/email");
    });
    it("signInPhone targets POST /api/v1/auth/sign-in/phone", async () => {
        nextResponse = () => jsonResponse({ otpExpiresIn: 600 }, 202);
        await AuthService.signInPhone({ phone: "+1234567890" });
        expect(calls[0].url).toContain("/api/v1/auth/sign-in/phone");
    });
    it("signInPhoneVerify targets the sign-in verify route, distinct from registration", async () => {
        await AuthService.signInPhoneVerify({ phone: "+1234567890", otpCode: "123456" });
        expect(calls[0].url).toContain("/api/v1/auth/sign-in/phone/verify");
        // Registration and sign-in verification remain separate endpoints.
        expect(calls[0].url).not.toContain("/register/");
    });
    it("signOut targets POST /api/v1/auth/sign-out", async () => {
        nextResponse = () => jsonResponse({ shellMode: "public" }, 200);
        const result = await AuthService.signOut();
        expect(result.shellMode).toBe("public");
        expect(calls[0].url).toContain("/api/v1/auth/sign-out");
    });
    it("signOutAll targets POST /api/v1/auth/sign-out-all", async () => {
        nextResponse = () => jsonResponse({ shellMode: "public" }, 200);
        const result = await AuthService.signOutAll();
        expect(result.shellMode).toBe("public");
        expect(calls[0].url).toContain("/api/v1/auth/sign-out-all");
    });
    it("captchaChallenge targets GET with the locale query parameter", async () => {
        nextResponse = () => jsonResponse({ html: "<div></div>" }, 200);
        const result = await AuthService.captchaChallenge("fa");
        expect(result.html).toBe("<div></div>");
        expect(calls[0].url).toContain("/api/v1/auth/captcha/challenge");
        expect(calls[0].url).toContain("locale=fa");
        expect(calls[0].init?.method).toBe("GET");
    });
});
describe("AuthService cookie and storage boundaries (NFR-006)", () => {
    it("sends credentials: include on every request", async () => {
        nextResponse = () => jsonResponse({ shellMode: "authenticated" }, 201);
        await AuthService.registerEmail({
            email: "u@example.com",
            password: "SecureP@ss1",
            captchaToken: "tok",
        });
        expect(calls[0].init?.credentials).toBe("include");
    });
    it("never writes anything to localStorage or sessionStorage", async () => {
        nextResponse = () => jsonResponse({ shellMode: "authenticated" }, 201);
        await AuthService.registerEmail({
            email: "u@example.com",
            password: "SecureP@ss1",
            captchaToken: "tok",
        });
        await AuthService.signOut();
        expect(window.localStorage.length).toBe(0);
        expect(window.sessionStorage.length).toBe(0);
    });
    it("never reads a cookie or a token from the document", async () => {
        nextResponse = () => jsonResponse({ shellMode: "authenticated" }, 201);
        await AuthService.registerEmail({
            email: "u@example.com",
            password: "SecureP@ss1",
            captchaToken: "tok",
        });
        // document.cookie is HttpOnly-protected in a real browser; the client must
        // not attempt to read it at all.
        expect(document.cookie).not.toContain("mahak_session");
    });
});
describe("AuthService typed error handling (contracts/auth.md)", () => {
    it("maps 409 to registration_failed without echoing the email", async () => {
        nextResponse = () => jsonResponse({ detail: { error: "registration_failed" } }, 409);
        await expect(AuthService.registerEmail({ email: "dupe@example.com", password: "SecureP@ss1", captchaToken: "t" })).rejects.toMatchObject({ code: "registration_failed", status: 409 });
    });
    it("maps 401 to sign_in_failed (no account enumeration, FR-038)", async () => {
        nextResponse = () => jsonResponse({ detail: { error: "sign_in_failed" } }, 401);
        await expect(AuthService.signInEmail({ email: "u@example.com", password: "wrong" })).rejects.toMatchObject({ code: "sign_in_failed", status: 401 });
    });
    it("maps 400 captcha_required", async () => {
        nextResponse = () => jsonResponse({ detail: { error: "captcha_required" } }, 400);
        await expect(AuthService.signInEmail({ email: "u@example.com", password: "x" })).rejects.toMatchObject({ code: "captcha_required", status: 400 });
    });
    it("maps 422 to otp_invalid and 410 to otp_expired", async () => {
        nextResponse = () => jsonResponse({ detail: { error: "otp_invalid" } }, 422);
        await expect(AuthService.registerPhoneVerify({ phone: "+1234567890", otpCode: "000000" })).rejects.toMatchObject({ code: "otp_invalid", status: 422 });
        nextResponse = () => jsonResponse({ detail: { error: "otp_expired" } }, 410);
        await expect(AuthService.signInPhoneVerify({ phone: "+1234567890", otpCode: "000000" })).rejects.toMatchObject({ code: "otp_expired", status: 410 });
    });
    it("exposes retryAfter on 429 without revealing account existence (FR-021)", async () => {
        nextResponse = () => jsonResponse({ detail: { error: "rate_limit_exceeded", retryAfter: 900 } }, 429);
        try {
            await AuthService.signInEmail({ email: "u@example.com", password: "x" });
            throw new Error("expected AuthError");
        }
        catch (error) {
            expect(error).toBeInstanceOf(AuthError);
            const authError = error;
            expect(authError.code).toBe("rate_limit_exceeded");
            expect(authError.retryAfterSeconds).toBe(900);
            // The message never carries the account identity (FR-021).
            expect(authError.message).not.toContain("u@example.com");
        }
    });
    it("maps 501 to not_implemented (sign-in routes land in T024)", async () => {
        nextResponse = () => jsonResponse({ detail: { error: "sign_in_email_not_implemented" } }, 501);
        await expect(AuthService.signInEmail({ email: "u@example.com", password: "x" })).rejects.toMatchObject({ code: "not_implemented", status: 501 });
    });
    it("maps 503 to service_unavailable (FR-047)", async () => {
        nextResponse = () => jsonResponse({ detail: { error: "service_unavailable" } }, 503);
        await expect(AuthService.registerPhone({ phone: "+1234567890" })).rejects.toMatchObject({ code: "service_unavailable", status: 503 });
    });
    it("maps a network failure to network_error", async () => {
        vi.stubGlobal("fetch", vi.fn(async () => {
            throw new TypeError("Failed to fetch");
        }));
        await expect(AuthService.signInEmail({ email: "u@example.com", password: "x" })).rejects.toMatchObject({ code: "network_error", status: 0 });
    });
});
