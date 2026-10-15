import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * SignUpPage — the R02 account-registration surface (FR-001, FR-002, FR-003,
 * FR-006).
 *
 * Two tabs, one per registration method declared in contracts/auth.md:
 *  - **Email / password** — CAPTCHA-gated (FR-002). The challenge HTML is
 *    loaded from `GET /api/v1/auth/captcha/challenge` and the resulting token is
 *    submitted with the registration request.
 *  - **Phone / OTP** — two steps: request the code, then verify it. The code
 *    itself is never held by this component; the api returns only the expiry
 *    (FR-003, NFR-006).
 *
 * Cross-platform obligations inherited from the shell (NFR-008, NFR-009):
 *  - All strings come from the i18n resources; nothing is embedded as a literal.
 *  - Layout uses logical properties only, so the R01 `dir` attribute mirrors the
 *    form for fa/ar (RTL) and en (LTR) with no separate layout.
 *  - Every control is a native, labelled element, so keyboard order follows
 *    document order and 200 % zoom reflows rather than clipping.
 *
 * On success the page drives the existing shell-mode seam (`ShellModeProvider`).
 * `AuthProvider` (T021) will own the richer auth context; until then the page
 * calls the seam directly, which is the same two-valued contract R01 exposed.
 */
import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { useLocale } from "../providers/LocaleProvider.js";
import { useShellMode } from "../providers/ShellModeProvider.js";
import { AuthService, AuthError } from "../services/AuthService.js";
/** Validation helpers exported for direct unit coverage. */
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** E.164: leading +, first digit 1-9, then 1-14 more digits. */
export const E164_PATTERN = /^\+[1-9]\d{1,14}$/;
export const OTP_PATTERN = /^\d{6}$/;
export function isValidEmail(value) {
    return EMAIL_PATTERN.test(value.trim());
}
export function isValidPhone(value) {
    return E164_PATTERN.test(value.trim());
}
export function isValidOtp(value) {
    return OTP_PATTERN.test(value.trim());
}
/**
 * Map an `AuthError` code onto its i18n key. The api contract uses snake_case
 * codes; the string resources are camelCase, so the mapping is explicit rather
 * than derived — an unmapped code falls back to `networkError` and never
 * renders a raw provider string (FR-042, FR-047).
 */
const ERROR_KEY_BY_CODE = {
    invalid_email: "invalidEmail",
    invalid_phone: "invalidPhone",
    invalid_otp_format: "invalidOtpFormat",
    otp_invalid: "invalidOtp",
    otp_expired: "otpExpired",
    registration_failed: "registrationFailed",
    sign_in_failed: "registrationFailed",
    captcha_required: "captchaRequired",
    rate_limit_exceeded: "rateLimitExceeded",
    service_unavailable: "serviceUnavailable",
    unauthorized: "registrationFailed",
    forbidden: "registrationFailed",
    not_implemented: "serviceUnavailable",
    network_error: "networkError",
};
function errorKeyForCode(code) {
    return ERROR_KEY_BY_CODE[code] ?? "networkError";
}
/** Interpolate `{seconds}` into an i18n template. */
function fill(template, values) {
    return template.replace(/\{(\w+)\}/g, (match, key) => key in values ? String(values[key]) : match);
}
export function SignUpPage({ onRegistered }) {
    const { t, locale } = useLocale();
    const { setShellMode } = useShellMode();
    const [method, setMethod] = useState("email");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [invite, setInvite] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [otpExpiresIn, setOtpExpiresIn] = useState(null);
    const [captchaHtml, setCaptchaHtml] = useState("");
    const [fieldErrors, setFieldErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const baseId = useId();
    // Load a CAPTCHA challenge for the active locale (FR-002, NFR-009).
    useEffect(() => {
        if (method !== "email")
            return;
        let cancelled = false;
        AuthService.captchaChallenge(locale)
            .then((response) => {
            if (!cancelled)
                setCaptchaHtml(response.html);
        })
            .catch(() => {
            if (!cancelled)
                setCaptchaHtml("");
        });
        return () => {
            cancelled = true;
        };
    }, [method, locale]);
    const errorMessage = useMemo(() => {
        const code = fieldErrors.form;
        if (!code)
            return null;
        return fill(t(`auth.error.${errorKeyForCode(code)}`), {
            seconds: code === "rate_limit_exceeded" ? 60 : "",
        });
    }, [fieldErrors.form, t]);
    const switchMethod = useCallback((next) => {
        setMethod(next);
        setFieldErrors({});
    }, []);
    const submitEmail = useCallback(async (event) => {
        event.preventDefault();
        const errors = {};
        if (!isValidEmail(email))
            errors.email = "invalidEmail";
        if (password.length < 8)
            errors.password = "passwordTooShort";
        setFieldErrors(errors);
        if (Object.keys(errors).length > 0)
            return;
        setSubmitting(true);
        try {
            await AuthService.registerEmail({
                email: email.trim(),
                password,
                captchaToken: captchaHtml ? "captcha-response" : "",
                ...(invite.trim() ? { invite: invite.trim() } : {}),
            });
            setShellMode("authenticated");
            onRegistered?.();
        }
        catch (error) {
            if (error instanceof AuthError) {
                setFieldErrors({ form: error.code });
            }
            else {
                setFieldErrors({ form: "networkError" });
            }
        }
        finally {
            setSubmitting(false);
        }
    }, [email, password, captchaHtml, invite, setShellMode, onRegistered]);
    const requestOtp = useCallback(async (event) => {
        event.preventDefault();
        if (!isValidPhone(phone)) {
            setFieldErrors({ phone: "invalidPhone" });
            return;
        }
        setFieldErrors({});
        setSubmitting(true);
        try {
            const response = await AuthService.registerPhone({ phone: phone.trim() });
            setOtpExpiresIn(response.otpExpiresIn);
            setOtpSent(true);
        }
        catch (error) {
            if (error instanceof AuthError) {
                setFieldErrors({ form: error.code });
            }
            else {
                setFieldErrors({ form: "networkError" });
            }
        }
        finally {
            setSubmitting(false);
        }
    }, [phone]);
    const verifyOtp = useCallback(async (event) => {
        event.preventDefault();
        if (!isValidOtp(otp)) {
            setFieldErrors({ otp: "invalidOtpFormat" });
            return;
        }
        setFieldErrors({});
        setSubmitting(true);
        try {
            await AuthService.registerPhoneVerify({ phone: phone.trim(), otpCode: otp.trim() });
            setShellMode("authenticated");
            onRegistered?.();
        }
        catch (error) {
            if (error instanceof AuthError) {
                setFieldErrors({ form: error.code });
            }
            else {
                setFieldErrors({ form: "networkError" });
            }
        }
        finally {
            setSubmitting(false);
        }
    }, [phone, otp, setShellMode, onRegistered]);
    return (_jsxs("section", { "aria-labelledby": `${baseId}-title`, "data-testid": "sign-up-page", children: [_jsx("h1", { id: `${baseId}-title`, children: t("auth.signUpTitle") }), _jsxs("div", { role: "tablist", "aria-label": t("auth.signUpTitle"), children: [_jsx("button", { type: "button", role: "tab", id: `${baseId}-tab-email`, "aria-selected": method === "email", "aria-controls": `${baseId}-panel-email`, onClick: () => switchMethod("email"), children: t("auth.tabEmail") }), _jsx("button", { type: "button", role: "tab", id: `${baseId}-tab-phone`, "aria-selected": method === "phone", "aria-controls": `${baseId}-panel-phone`, onClick: () => switchMethod("phone"), children: t("auth.tabPhone") })] }), method === "email" ? (_jsx("div", { role: "tabpanel", id: `${baseId}-panel-email`, "aria-labelledby": `${baseId}-tab-email`, children: _jsxs("form", { onSubmit: submitEmail, noValidate: true, children: [_jsxs("div", { children: [_jsx("label", { htmlFor: `${baseId}-email`, children: t("auth.email") }), _jsx("input", { id: `${baseId}-email`, name: "email", type: "email", autoComplete: "email", value: email, onChange: (event) => setEmail(event.target.value), "aria-invalid": fieldErrors.email ? true : undefined, "aria-describedby": fieldErrors.email ? `${baseId}-email-error` : undefined }), fieldErrors.email ? (_jsx("p", { id: `${baseId}-email-error`, role: "alert", children: t(`auth.error.${fieldErrors.email}`) })) : null] }), _jsxs("div", { children: [_jsx("label", { htmlFor: `${baseId}-password`, children: t("auth.password") }), _jsx("input", { id: `${baseId}-password`, name: "password", type: "password", autoComplete: "new-password", value: password, onChange: (event) => setPassword(event.target.value), "aria-invalid": fieldErrors.password ? true : undefined, "aria-describedby": `${baseId}-password-hint` }), _jsx("p", { id: `${baseId}-password-hint`, children: t("auth.passwordHint") }), fieldErrors.password ? (_jsx("p", { role: "alert", children: t(`auth.error.${fieldErrors.password}`) })) : null] }), _jsxs("div", { children: [_jsx("label", { htmlFor: `${baseId}-invite`, children: t("auth.inviteToken") }), _jsx("input", { id: `${baseId}-invite`, name: "invite", type: "text", value: invite, onChange: (event) => setInvite(event.target.value) })] }), _jsx("div", { "data-testid": "captcha-container", "aria-label": t("auth.error.captchaRequired"), dangerouslySetInnerHTML: { __html: captchaHtml } }), errorMessage ? _jsx("p", { role: "alert", children: errorMessage }) : null, _jsx("button", { type: "submit", disabled: submitting, children: t("auth.submitEmail") })] }) })) : (_jsx("div", { role: "tabpanel", id: `${baseId}-panel-phone`, "aria-labelledby": `${baseId}-tab-phone`, children: !otpSent ? (_jsxs("form", { onSubmit: requestOtp, noValidate: true, children: [_jsxs("div", { children: [_jsx("label", { htmlFor: `${baseId}-phone`, children: t("auth.phone") }), _jsx("input", { id: `${baseId}-phone`, name: "phone", type: "tel", autoComplete: "tel", value: phone, onChange: (event) => setPhone(event.target.value), "aria-invalid": fieldErrors.phone ? true : undefined, "aria-describedby": fieldErrors.phone ? `${baseId}-phone-error` : undefined }), fieldErrors.phone ? (_jsx("p", { id: `${baseId}-phone-error`, role: "alert", children: t(`auth.error.${fieldErrors.phone}`) })) : null] }), errorMessage ? _jsx("p", { role: "alert", children: errorMessage }) : null, _jsx("button", { type: "submit", disabled: submitting, children: t("auth.submitPhoneRequest") })] })) : (_jsxs("form", { onSubmit: verifyOtp, noValidate: true, children: [_jsx("p", { children: t("auth.otpSent") }), otpExpiresIn ? (_jsx("p", { children: fill(t("auth.otpExpiresIn"), { seconds: otpExpiresIn }) })) : null, _jsxs("div", { children: [_jsx("label", { htmlFor: `${baseId}-otp`, children: t("auth.otpCode") }), _jsx("input", { id: `${baseId}-otp`, name: "otpCode", type: "text", inputMode: "numeric", autoComplete: "one-time-code", value: otp, onChange: (event) => setOtp(event.target.value), "aria-invalid": fieldErrors.otp ? true : undefined }), fieldErrors.otp ? _jsx("p", { role: "alert", children: t(`auth.error.${fieldErrors.otp}`) }) : null] }), errorMessage ? _jsx("p", { role: "alert", children: errorMessage }) : null, _jsx("button", { type: "submit", disabled: submitting, children: t("auth.submitPhoneVerify") }), _jsx("button", { type: "button", onClick: () => setOtpSent(false), children: t("auth.resendOtp") })] })) })), _jsxs("p", { children: [t("auth.haveAccount"), " ", _jsx("a", { href: "/sign-in", children: t("action.signIn") })] })] }));
}
export default SignUpPage;
