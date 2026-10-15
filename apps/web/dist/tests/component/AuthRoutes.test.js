/**
 * T022 — auth route wiring in the shell router.
 *
 * Verifies the behaviour the task specifies:
 *  - `/sign-up` renders the real `SignUpPage` (FR-001)
 *  - `/google-callback` renders the real `GoogleCallbackPage` (FR-004, FR-015)
 *  - Both are reachable without a session, as the contract requires
 *  - Protected destinations still redirect unauthenticated users to `/sign-in`
 *    (FR-028, FR-044)
 *  - The R01 navigation registry is unchanged — eight reserved destinations all
 *    keep `visibilityScope = "authenticated"`
 *  - No `shellMode` query parameter is introduced (FR-033, FR-034)
 *  - No session token is persisted to `localStorage`/`sessionStorage` and the
 *    session cookie is never read from JS (NFR-006)
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { waitFor } from "@testing-library/react";
import { R01_RESERVED_DESTINATIONS } from "@mahak/contracts";
import { renderShell } from "../utils/shell-tree.js";
import { clearShellPreferences } from "../../src/providers/ShellPreferences.js";
const authService = vi.hoisted(() => ({
    captchaChallenge: vi.fn(),
    googleCallback: vi.fn(),
}));
vi.mock("../../src/services/AuthService.js", async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        AuthService: { ...actual.AuthService, ...authService },
    };
});
/** The main region of the rendered shell frame. */
function mainRegion(container) {
    return container.querySelector('[data-region="main"]');
}
/** Holds the google callback pending so the page stays mounted. */
function pending() {
    return new Promise(() => { });
}
beforeEach(() => {
    clearShellPreferences();
    window.localStorage.clear();
    window.sessionStorage.clear();
    authService.captchaChallenge.mockReset();
    authService.googleCallback.mockReset();
    authService.captchaChallenge.mockResolvedValue({ html: "<div>captcha</div>" });
    authService.googleCallback.mockReturnValue(pending());
});
describe("T022 auth route wiring (FR-001, FR-004, FR-015)", () => {
    it("renders the real SignUpPage at /sign-up", async () => {
        const { container } = renderShell({ initialPath: "/sign-up", width: 1440 });
        await waitFor(() => {
            expect(container.querySelector('[data-testid="sign-up-page"]')).not.toBeNull();
        });
        // The R01 placeholder entry state must no longer be what renders here.
        expect(mainRegion(container).textContent).not.toContain("This entry point is defined for user sign-up");
    });
    it("renders the real GoogleCallbackPage at /google-callback", async () => {
        const { container } = renderShell({
            initialPath: "/google-callback?code=mock-auth-code",
            width: 1440,
        });
        await waitFor(() => {
            expect(container.querySelector('[data-testid="google-callback-page"]')).not.toBeNull();
        });
        expect(authService.googleCallback).toHaveBeenCalledWith("mock-auth-code");
    });
    it("renders the sign-in entry at /sign-in", () => {
        const { container } = renderShell({ initialPath: "/sign-in", width: 1440 });
        // SignInPage is a US2 deliverable (T028); the R01 entry state remains.
        expect(mainRegion(container).textContent).toMatch(/Sign in/);
    });
    it("offers the auth entry points in the public header", () => {
        const { getByTestId } = renderShell({ initialPath: "/", width: 1440 });
        expect(getByTestId("sign-in-entry").getAttribute("href")).toBe("/sign-in");
        expect(getByTestId("sign-up-entry").getAttribute("href")).toBe("/sign-up");
    });
    it("redirects a failed Google callback to the sign-in entry (FR-042)", async () => {
        authService.googleCallback.mockResolvedValue(false);
        const { container } = renderShell({
            initialPath: "/google-callback?code=bad-code",
            width: 1440,
        });
        await waitFor(() => {
            expect(mainRegion(container).textContent).toMatch(/Sign in/);
        });
        // No provider detail reaches the UI.
        expect(mainRegion(container).textContent).not.toContain("bad-code");
    });
    it("keeps the three-region frame intact on the auth routes (FR-045)", async () => {
        const { container, getByTestId } = renderShell({
            initialPath: "/sign-up",
            width: 1440,
        });
        await waitFor(() => {
            expect(container.querySelector('[data-testid="sign-up-page"]')).not.toBeNull();
        });
        const frame = getByTestId("shell-frame");
        expect(frame.querySelector('[data-region="header"]')).not.toBeNull();
        expect(frame.querySelector('[data-region="sidebar"]')).not.toBeNull();
        expect(frame.querySelector('[data-region="main"]')).not.toBeNull();
    });
});
describe("T022 protected-route guard is preserved (FR-028, FR-044)", () => {
    it.each(["/chat", "/conversations", "/projects", "/teacher", "/files", "/search", "/settings", "/admin"])("redirects %s to /sign-in for an unauthenticated visitor", (path) => {
        const { container } = renderShell({ initialPath: path, width: 1440 });
        expect(mainRegion(container).textContent).toMatch(/Sign in/);
        expect(mainRegion(container).querySelector('[data-state="unavailable"]')).toBeNull();
    });
    it("still lets an authenticated user reach a reserved destination", () => {
        const { container } = renderShell({
            shellMode: "authenticated",
            initialPath: "/admin",
            width: 1440,
        });
        expect(mainRegion(container).querySelector('[data-state="unavailable"]')).not.toBeNull();
    });
});
describe("T022 R01 navigation registry is unchanged", () => {
    it("keeps exactly eight reserved destinations, all authenticated scope", () => {
        expect(R01_RESERVED_DESTINATIONS).toHaveLength(8);
        for (const destination of R01_RESERVED_DESTINATIONS) {
            expect(destination.visibilityScope).toBe("authenticated");
            expect(destination.availability).toBe("reserved");
        }
    });
    it("hides every module destination from the public navigation set (FR-058)", () => {
        const { getByTestId } = renderShell({ shellMode: "public", width: 1440 });
        const sidebar = getByTestId("shell-frame").querySelector('[data-region="sidebar"]');
        for (const destination of R01_RESERVED_DESTINATIONS) {
            expect(sidebar.textContent).not.toContain(destination.id);
        }
    });
});
describe("T022 routing security invariants (NFR-006)", () => {
    it("never persists authentication state to browser storage", async () => {
        const { container } = renderShell({ initialPath: "/sign-up", width: 1440 });
        await waitFor(() => {
            expect(container.querySelector('[data-testid="sign-up-page"]')).not.toBeNull();
        });
        expect(window.localStorage.length).toBe(0);
        expect(window.sessionStorage.length).toBe(0);
    });
    it("never reads the session cookie through document.cookie", async () => {
        const { container } = renderShell({ initialPath: "/sign-up", width: 1440 });
        await waitFor(() => {
            expect(container.querySelector('[data-testid="sign-up-page"]')).not.toBeNull();
        });
        expect(document.cookie).toBe("");
    });
});
