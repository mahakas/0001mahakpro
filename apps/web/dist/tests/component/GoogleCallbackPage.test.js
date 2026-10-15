import { jsx as _jsx } from "react/jsx-runtime";
/**
 * T020 — GoogleCallbackPage component tests.
 *
 * Covers:
 *  - Reads the `code` query parameter from the URL
 *  - Calls `AuthService.googleCallback(code)` on mount
 *  - On success navigates to `/` (shell mode set via cookie)
 *  - On failure shows generic error and redirects to `/sign-in`
 *  - When no code is supplied, shows generic error and redirects to `/sign-in`
 *  - Never stores provider tokens, secrets, or session tokens in browser code
 *  - Uses the ShellModeProvider seam; does NOT create an AuthProvider
 *  - Error messages never leak provider details (FR-042, FR-048)
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { GoogleCallbackPage } from "../../src/pages/GoogleCallbackPage.js";
import { ShellModeProvider } from "../../src/providers/ShellModeProvider.js";
import { LocaleProvider } from "../../src/providers/LocaleProvider.js";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockContainer = vi.hoisted(() => {
    const fn = { current: null };
    // Make the property a getter/setter so the hoisted mock factory always
    // reads the current spy (updated in beforeEach), not the initial null.
    return Object.defineProperty({}, "googleCallback", {
        get() { return fn.current; },
        set(v) { fn.current = v; },
        configurable: true,
    });
});
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});
vi.mock("../../src/services/AuthService.js", async (importOriginal) => {
    const actual = await importOriginal();
    // Capture ref so the getter is always evaluated fresh.
    const ref = mockContainer;
    // Return a wrapper that forwards calls to the current spy (set in beforeEach).
    return {
        ...actual,
        AuthService: {
            ...actual.AuthService,
            googleCallback: (...args) => ref.googleCallback(...args),
        },
    };
});
function renderWithRouter(initialPath) {
    render(_jsx(MemoryRouter, { initialEntries: [initialPath], children: _jsx(LocaleProvider, { children: _jsx(ShellModeProvider, { skipSeam: true, children: _jsx(GoogleCallbackPage, {}) }) }) }));
}
beforeEach(() => {
    mockNavigate.mockClear();
    mockContainer.googleCallback = vi.fn();
});
describe("GoogleCallbackPage (FR-004, FR-015, FR-042)", () => {
    it("reads the code query parameter and calls AuthService.googleCallback", async () => {
        mockContainer.googleCallback.mockResolvedValue(true);
        renderWithRouter("/google-callback?code=mock-auth-code");
        await waitFor(() => {
            expect(mockContainer.googleCallback).toHaveBeenCalledWith("mock-auth-code");
        });
    });
    it("redirects to / on success (shell picks up cookie)", async () => {
        mockContainer.googleCallback.mockResolvedValue(true);
        renderWithRouter("/google-callback?code=good-code");
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true });
        });
    });
    it("shows generic error and redirects to /sign-in when the callback fails", async () => {
        mockContainer.googleCallback.mockResolvedValue(false);
        renderWithRouter("/google-callback?code=bad-code");
        await waitFor(() => {
            expect(screen.getByText("Sign-in with Google failed. Please try again or sign in with email.")).toBeTruthy();
        });
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith("/sign-in", { replace: true });
        });
    });
    it("shows generic error and redirects to /sign-in on network failure", async () => {
        mockContainer.googleCallback.mockRejectedValue(new Error("network down"));
        renderWithRouter("/google-callback?code=another-code");
        await waitFor(() => {
            expect(screen.getByText("Sign-in with Google failed. Please try again or sign in with email.")).toBeTruthy();
        });
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith("/sign-in", { replace: true });
        });
    });
    it("handles a missing code parameter gracefully (FR-048)", async () => {
        renderWithRouter("/google-callback");
        await waitFor(() => {
            expect(mockContainer.googleCallback).not.toHaveBeenCalled();
        });
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith("/sign-in", { replace: true });
        });
    });
    it("never stores any provider token or secret in the browser", () => {
        mockContainer.googleCallback.mockResolvedValue(true);
        renderWithRouter("/google-callback?code=any-code");
        expect(window.localStorage.length).toBe(0);
        expect(window.sessionStorage.length).toBe(0);
        expect(document.cookie).toBe("");
    });
    it("does not leak the code value into the rendered DOM after navigation", async () => {
        mockContainer.googleCallback.mockResolvedValue(true);
        renderWithRouter("/google-callback?code=secret-code-123");
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalled();
        });
        const bodyText = document.body.textContent ?? "";
        expect(bodyText).not.toContain("secret-code-123");
    });
    it("renders a loading message while the callback is in flight", async () => {
        let resolve;
        const promise = new Promise((r) => { resolve = r; });
        mockContainer.googleCallback.mockReturnValue(promise);
        renderWithRouter("/google-callback?code=pending-code");
        await waitFor(() => {
            expect(screen.getByText("Completing sign-in with Google…")).toBeTruthy();
        });
        resolve(true);
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true });
        });
    });
});
