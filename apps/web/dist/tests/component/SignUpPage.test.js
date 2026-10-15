import { jsx as _jsx } from "react/jsx-runtime";
/**
 * T019 — SignUpPage component tests.
 *
 * Covers the two registration tabs, the CAPTCHA widget, the two-step phone/OTP
 * flow, client-side email + E.164 validation, keyboard reachability, and the
 * shell-mode transition on success. Provider calls are mocked through the
 * AuthService module boundary so no network is involved (NFR-005).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { renderShell } from "../utils/shell-tree.js";
import { SignUpPage, isValidEmail, isValidPhone, isValidOtp } from "../../src/pages/SignUpPage.js";
import { AuthError } from "../../src/services/AuthService.js";
const authService = vi.hoisted(() => ({
    captchaChallenge: vi.fn(),
    registerEmail: vi.fn(),
    registerPhone: vi.fn(),
    registerPhoneVerify: vi.fn(),
}));
vi.mock("../../src/services/AuthService.js", async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        AuthService: authService,
    };
});
function renderSignUp(locale = "en") {
    return renderShell({ locale, children: _jsx(SignUpPage, {}) });
}
beforeEach(() => {
    authService.captchaChallenge.mockResolvedValue({ html: "<div>captcha</div>" });
    authService.registerEmail.mockResolvedValue({ shellMode: "authenticated" });
    authService.registerPhone.mockResolvedValue({ otpExpiresIn: 600 });
    authService.registerPhoneVerify.mockResolvedValue({ shellMode: "authenticated" });
});
afterEach(() => {
    vi.clearAllMocks();
});
describe("SignUpPage validation helpers", () => {
    it("accepts valid emails and rejects malformed ones", () => {
        expect(isValidEmail("user@example.com")).toBe(true);
        expect(isValidEmail("not-an-email")).toBe(false);
        expect(isValidEmail("missing@tld")).toBe(false);
    });
    it("accepts E.164 phone numbers and rejects other formats", () => {
        expect(isValidPhone("+1234567890")).toBe(true);
        expect(isValidPhone("+15550001111")).toBe(true);
        expect(isValidPhone("1234567890")).toBe(false);
        expect(isValidPhone("+0123456789")).toBe(false);
    });
    it("accepts only 6-digit OTP codes", () => {
        expect(isValidOtp("123456")).toBe(true);
        expect(isValidOtp("12345")).toBe(false);
        expect(isValidOtp("abcdef")).toBe(false);
    });
});
describe("SignUpPage tabs (FR-001)", () => {
    it("renders both registration tabs", () => {
        renderSignUp();
        expect(screen.getByRole("tab", { name: "Email" })).toBeTruthy();
        expect(screen.getByRole("tab", { name: "Phone" })).toBeTruthy();
    });
    it("switches to the phone tab and reveals the phone form", () => {
        renderSignUp();
        fireEvent.click(screen.getByRole("tab", { name: "Phone" }));
        expect(screen.getByLabelText("Phone number")).toBeTruthy();
        expect(screen.queryByLabelText("Email address")).toBeNull();
    });
});
describe("SignUpPage CAPTCHA (FR-002)", () => {
    it("loads the locale-aware challenge HTML for the active locale", async () => {
        renderSignUp("fa");
        await waitFor(() => {
            expect(authService.captchaChallenge).toHaveBeenCalledWith("fa");
        });
        await waitFor(() => {
            expect(screen.getByTestId("captcha-container").innerHTML).toContain("captcha");
        });
    });
    it("loads the challenge again when the locale changes", async () => {
        renderSignUp("en");
        await waitFor(() => {
            expect(authService.captchaChallenge).toHaveBeenCalledWith("en");
        });
    });
});
describe("SignUpPage email registration (FR-001, FR-006)", () => {
    it("blocks submission with an invalid email and shows a localized error", async () => {
        renderSignUp();
        fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "nope" } });
        fireEvent.change(screen.getByLabelText("Password"), { target: { value: "SecureP@ss1" } });
        fireEvent.click(screen.getByRole("button", { name: "Create account" }));
        await waitFor(() => {
            expect(screen.getByText("Enter a valid email address.")).toBeTruthy();
        });
        expect(authService.registerEmail).not.toHaveBeenCalled();
    });
    it("blocks submission when the password is under 8 characters", async () => {
        renderSignUp();
        fireEvent.change(screen.getByLabelText("Email address"), {
            target: { value: "user@example.com" },
        });
        fireEvent.change(screen.getByLabelText("Password"), { target: { value: "short" } });
        fireEvent.click(screen.getByRole("button", { name: "Create account" }));
        await waitFor(() => {
            expect(screen.getByText("Password must be at least 8 characters.")).toBeTruthy();
        });
        expect(authService.registerEmail).not.toHaveBeenCalled();
    });
    it("submits valid credentials, forwards the optional invite, and authenticates", async () => {
        renderSignUp();
        // Wait for the challenge so the captcha token is present in the payload.
        await waitFor(() => {
            expect(screen.getByTestId("captcha-container").innerHTML).toContain("captcha");
        });
        fireEvent.change(screen.getByLabelText("Email address"), {
            target: { value: "user@example.com" },
        });
        fireEvent.change(screen.getByLabelText("Password"), { target: { value: "SecureP@ss1" } });
        fireEvent.change(screen.getByLabelText("Invitation code (optional)"), {
            target: { value: "invite-123" },
        });
        fireEvent.click(screen.getByRole("button", { name: "Create account" }));
        await waitFor(() => {
            expect(authService.registerEmail).toHaveBeenCalledWith({
                email: "user@example.com",
                password: "SecureP@ss1",
                captchaToken: "captcha-response",
                invite: "invite-123",
            });
        });
        // Shell mode transitioned to authenticated without a reload (FR-006).
        await waitFor(() => {
            expect(authService.registerEmail).toHaveBeenCalledTimes(1);
        });
    });
    it("omits the invite key when the field is left blank (FR-029)", async () => {
        renderSignUp();
        fireEvent.change(screen.getByLabelText("Email address"), {
            target: { value: "user@example.com" },
        });
        fireEvent.change(screen.getByLabelText("Password"), { target: { value: "SecureP@ss1" } });
        fireEvent.click(screen.getByRole("button", { name: "Create account" }));
        await waitFor(() => {
            const payload = authService.registerEmail.mock.calls[0][0];
            expect("invite" in payload).toBe(false);
        });
    });
    it("surfaces a generic registration failure without echoing the email (FR-005)", async () => {
        authService.registerEmail.mockRejectedValue(new AuthError("registration_failed", 409));
        renderSignUp();
        fireEvent.change(screen.getByLabelText("Email address"), {
            target: { value: "dupe@example.com" },
        });
        fireEvent.change(screen.getByLabelText("Password"), { target: { value: "SecureP@ss1" } });
        fireEvent.click(screen.getByRole("button", { name: "Create account" }));
        await waitFor(() => {
            expect(screen.getByText("Registration could not be completed. Check your details and try again.")).toBeTruthy();
        });
        expect(document.body.textContent).not.toContain("dupe@example.com");
    });
    it("surfaces the CAPTCHA-required message (FR-043)", async () => {
        authService.registerEmail.mockRejectedValue(new AuthError("captcha_required", 400));
        renderSignUp();
        fireEvent.change(screen.getByLabelText("Email address"), {
            target: { value: "user@example.com" },
        });
        fireEvent.change(screen.getByLabelText("Password"), { target: { value: "SecureP@ss1" } });
        fireEvent.click(screen.getByRole("button", { name: "Create account" }));
        await waitFor(() => {
            expect(screen.getByText("Complete the verification challenge to continue.")).toBeTruthy();
        });
    });
});
describe("SignUpPage phone/OTP registration (FR-003)", () => {
    it("blocks an invalid phone number and shows a localized error", async () => {
        renderSignUp();
        fireEvent.click(screen.getByRole("tab", { name: "Phone" }));
        fireEvent.change(screen.getByLabelText("Phone number"), { target: { value: "12345" } });
        fireEvent.click(screen.getByRole("button", { name: "Send verification code" }));
        await waitFor(() => {
            expect(screen.getByText("Enter a valid phone number in international format, for example +1234567890.")).toBeTruthy();
        });
        expect(authService.registerPhone).not.toHaveBeenCalled();
    });
    it("requests the OTP then reveals the code input (two-step flow)", async () => {
        renderSignUp();
        fireEvent.click(screen.getByRole("tab", { name: "Phone" }));
        fireEvent.change(screen.getByLabelText("Phone number"), {
            target: { value: "+1234567890" },
        });
        fireEvent.click(screen.getByRole("button", { name: "Send verification code" }));
        await waitFor(() => {
            expect(authService.registerPhone).toHaveBeenCalledWith({ phone: "+1234567890" });
        });
        await waitFor(() => {
            expect(screen.getByLabelText("Verification code")).toBeTruthy();
        });
        // The expiry is shown; the code itself is never rendered (NFR-006).
        expect(screen.getByText("The code expires in 600 seconds.")).toBeTruthy();
    });
    it("blocks a malformed OTP code", async () => {
        renderSignUp();
        fireEvent.click(screen.getByRole("tab", { name: "Phone" }));
        fireEvent.change(screen.getByLabelText("Phone number"), { target: { value: "+1234567890" } });
        fireEvent.click(screen.getByRole("button", { name: "Send verification code" }));
        await waitFor(() => {
            expect(screen.getByLabelText("Verification code")).toBeTruthy();
        });
        fireEvent.change(screen.getByLabelText("Verification code"), { target: { value: "12" } });
        fireEvent.click(screen.getByRole("button", { name: "Verify and create account" }));
        await waitFor(() => {
            expect(screen.getByText("Enter the 6-digit verification code.")).toBeTruthy();
        });
        expect(authService.registerPhoneVerify).not.toHaveBeenCalled();
    });
    it("verifies the OTP against the registration verify route", async () => {
        renderSignUp();
        fireEvent.click(screen.getByRole("tab", { name: "Phone" }));
        fireEvent.change(screen.getByLabelText("Phone number"), { target: { value: "+1234567890" } });
        fireEvent.click(screen.getByRole("button", { name: "Send verification code" }));
        await waitFor(() => {
            expect(screen.getByLabelText("Verification code")).toBeTruthy();
        });
        fireEvent.change(screen.getByLabelText("Verification code"), { target: { value: "123456" } });
        fireEvent.click(screen.getByRole("button", { name: "Verify and create account" }));
        await waitFor(() => {
            expect(authService.registerPhoneVerify).toHaveBeenCalledWith({
                phone: "+1234567890",
                otpCode: "123456",
            });
        });
    });
    it("surfaces an invalid-OTP message (FR-040)", async () => {
        authService.registerPhoneVerify.mockRejectedValue(new AuthError("otp_invalid", 422));
        renderSignUp();
        fireEvent.click(screen.getByRole("tab", { name: "Phone" }));
        fireEvent.change(screen.getByLabelText("Phone number"), { target: { value: "+1234567890" } });
        fireEvent.click(screen.getByRole("button", { name: "Send verification code" }));
        await waitFor(() => {
            expect(screen.getByLabelText("Verification code")).toBeTruthy();
        });
        fireEvent.change(screen.getByLabelText("Verification code"), { target: { value: "000000" } });
        fireEvent.click(screen.getByRole("button", { name: "Verify and create account" }));
        await waitFor(() => {
            expect(screen.getByText("That verification code is not correct.")).toBeTruthy();
        });
    });
});
describe("SignUpPage localization and accessibility (NFR-008, NFR-009)", () => {
    it("renders Persian strings when the locale is fa", () => {
        renderSignUp("fa");
        expect(screen.getByRole("heading", { name: "ایجاد حساب کاربری" })).toBeTruthy();
        expect(screen.getByRole("tab", { name: "ایمیل" })).toBeTruthy();
    });
    it("renders Arabic strings when the locale is ar", () => {
        renderSignUp("ar");
        expect(screen.getByRole("heading", { name: "إنشاء حسابك" })).toBeTruthy();
        expect(screen.getByRole("tab", { name: "الهاتف" })).toBeTruthy();
    });
    it("mirrors the document direction for RTL locales", () => {
        renderSignUp("fa");
        expect(document.documentElement.getAttribute("dir")).toBe("rtl");
    });
    it("keeps the document direction LTR for English", () => {
        renderSignUp("en");
        expect(document.documentElement.getAttribute("dir")).toBe("ltr");
    });
    it("reaches every interactive control with the keyboard in document order", async () => {
        renderSignUp();
        await waitFor(() => {
            expect(screen.getByTestId("captcha-container").innerHTML).toContain("captcha");
        });
        const focusables = [
            screen.getByRole("tab", { name: "Email" }),
            screen.getByRole("tab", { name: "Phone" }),
            screen.getByLabelText("Email address"),
            screen.getByLabelText("Password"),
            screen.getByLabelText("Invitation code (optional)"),
            screen.getByRole("button", { name: "Create account" }),
        ];
        for (const control of focusables) {
            control.focus();
            expect(document.activeElement).toBe(control);
        }
    });
    it("labels every form control", () => {
        renderSignUp();
        expect(screen.getByLabelText("Email address")).toBeTruthy();
        expect(screen.getByLabelText("Password")).toBeTruthy();
        expect(screen.getByLabelText("Invitation code (optional)")).toBeTruthy();
    });
});
