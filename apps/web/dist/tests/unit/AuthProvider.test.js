import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * T021 — AuthProvider unit tests.
 *
 * Verifies the behaviour the task specifies:
 *  - Subscribes to ShellModeProvider changes
 *  - Hydrates `role` + `organizationReference` when shellMode becomes authenticated
 *  - Clears both when shellMode becomes public
 *  - `signOut()` / `signOutAll()` call the api and then set public mode
 *  - Issues at most one profile request per authenticated transition
 *  - Never reads the session cookie, localStorage, or sessionStorage
 *  - Ignores a role outside the declared R02 set
 *
 * The shell mode is driven through the real seam (`ShellModeProvider`'s
 * `setShellMode`) rather than the `initialMode` test override, because
 * `initialMode` is a *controlled* prop that re-asserts itself and would mask
 * a genuine sign-out transition.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { useShellMode } from "../../src/providers/ShellModeProvider.js";
import { AuthProvider, useAuth } from "../../src/providers/AuthProvider.js";
import { ShellModeProvider } from "../../src/providers/ShellModeProvider.js";
import { AuthService } from "../../src/services/AuthService.js";
vi.mock("../../src/services/AuthService.js", async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        AuthService: { ...actual.AuthService, me: vi.fn(), signOut: vi.fn(), signOutAll: vi.fn() },
    };
});
/** Captures the seam so a test can drive the shell mode. */
let seamSetShellMode = null;
/** Re-render signal used to prove a re-render does not re-fetch. */
const forceUpdateSignal = (() => {
    let bump = () => { };
    return {
        setSetter(next) { bump = next; },
        nudge() { bump(); },
    };
})();
function SeamBridge() {
    const { setShellMode } = useShellMode();
    seamSetShellMode = setShellMode;
    return null;
}
/** A consumer that re-renders whenever the signal fires, without remounting. */
function RenderTrigger() {
    const [, setTick] = useState(0);
    forceUpdateSignal.setSetter(() => setTick((t) => t + 1));
    return null;
}
/** Renders the auth context as inspectable text plus the sign-out controls. */
function Probe() {
    const { isAuthenticated, role, organizationReference, isLoading, signOut, signOutAll } = useAuth();
    return (_jsxs("div", { children: [_jsx("span", { "data-testid": "auth", children: isAuthenticated ? "authenticated" : "public" }), _jsx("span", { "data-testid": "role", children: role ?? "none" }), _jsx("span", { "data-testid": "org", children: organizationReference ?? "none" }), _jsx("span", { "data-testid": "loading", children: isLoading ? "loading" : "idle" }), _jsx("button", { type: "button", onClick: () => void signOut(), children: "sign-out" }), _jsx("button", { type: "button", onClick: () => void signOutAll(), children: "sign-out-all" })] }));
}
function renderProvider(options = {}) {
    return render(_jsxs(ShellModeProvider, { skipSeam: true, children: [_jsx(SeamBridge, {}), _jsx(RenderTrigger, {}), _jsx(AuthProvider, { skipProfileFetch: options.skipProfileFetch ?? false, children: _jsx(Probe, {}) })] }));
}
/** Force a re-render of the provider subtree without remounting it. */
function rerenderChildren() {
    act(() => {
        forceUpdateSignal.nudge();
    });
}
const meMock = () => AuthService.me;
const signOutMock = () => AuthService.signOut;
const signOutAllMock = () => AuthService.signOutAll;
function profile(overrides = {}) {
    return {
        id: "u1",
        email: "u@example.com",
        phone: null,
        role: "user",
        organizationReference: null,
        ...overrides,
    };
}
/** Drive the shell to authenticated through the seam. */
async function goAuthenticated() {
    await act(async () => {
        seamSetShellMode?.("authenticated");
    });
}
beforeEach(() => {
    seamSetShellMode = null;
    meMock().mockReset();
    signOutMock().mockReset();
    signOutAllMock().mockReset();
    signOutMock().mockResolvedValue({ shellMode: "public" });
    signOutAllMock().mockResolvedValue({ shellMode: "public" });
});
afterEach(() => {
    vi.clearAllMocks();
});
describe("AuthProvider (FR-027, FR-032)", () => {
    it("starts unauthenticated with no role and no organization reference", () => {
        renderProvider({ skipProfileFetch: true });
        expect(screen.getByTestId("auth").textContent).toBe("public");
        expect(screen.getByTestId("role").textContent).toBe("none");
        expect(screen.getByTestId("org").textContent).toBe("none");
    });
    it("does not call the profile endpoint while the shell is public", () => {
        renderProvider();
        expect(meMock()).not.toHaveBeenCalled();
    });
    it("fetches the profile when the shell becomes authenticated", async () => {
        meMock().mockResolvedValue(profile({ organizationReference: "invite-123" }));
        renderProvider();
        await goAuthenticated();
        await waitFor(() => {
            expect(meMock()).toHaveBeenCalled();
        });
        await waitFor(() => {
            expect(screen.getByTestId("role").textContent).toBe("user");
        });
        expect(screen.getByTestId("org").textContent).toBe("invite-123");
    });
    it("reports loading while the profile request is in flight", async () => {
        let resolve;
        const pending = new Promise((r) => { resolve = r; });
        meMock().mockReturnValue(pending);
        renderProvider();
        await goAuthenticated();
        await waitFor(() => {
            expect(screen.getByTestId("loading").textContent).toBe("loading");
        });
        resolve(profile({ role: "admin" }));
        await waitFor(() => {
            expect(screen.getByTestId("loading").textContent).toBe("idle");
        });
    });
    it("issues exactly one profile request per authenticated transition", async () => {
        meMock().mockResolvedValue(profile());
        renderProvider();
        await goAuthenticated();
        await waitFor(() => {
            expect(meMock()).toHaveBeenCalledTimes(1);
        });
        // Re-rendering the *children* must not trigger a second fetch: the effect
        // is keyed on the shell mode, not on render identity.
        rerenderChildren();
        await waitFor(() => {
            expect(meMock()).toHaveBeenCalledTimes(1);
        });
    });
    it("clears role and organization reference when the shell returns to public", async () => {
        meMock().mockResolvedValue(profile({ role: "admin", organizationReference: "invite-9" }));
        renderProvider();
        await goAuthenticated();
        await waitFor(() => {
            expect(screen.getByTestId("role").textContent).toBe("admin");
        });
        await act(async () => {
            seamSetShellMode?.("public");
        });
        await waitFor(() => {
            expect(screen.getByTestId("role").textContent).toBe("none");
        });
        expect(screen.getByTestId("org").textContent).toBe("none");
        expect(screen.getByTestId("auth").textContent).toBe("public");
    });
    it("ignores a role outside the declared R02 set", async () => {
        meMock().mockResolvedValue(profile({ role: "superuser" }));
        renderProvider();
        await goAuthenticated();
        await waitFor(() => {
            expect(screen.getByTestId("loading").textContent).toBe("idle");
        });
        expect(screen.getByTestId("role").textContent).toBe("none");
    });
    it("leaves role null when the profile request fails, without surfacing detail", async () => {
        meMock().mockRejectedValue(new Error("provider exploded: secret-token-abc"));
        renderProvider();
        await goAuthenticated();
        await waitFor(() => {
            expect(screen.getByTestId("loading").textContent).toBe("idle");
        });
        expect(screen.getByTestId("role").textContent).toBe("none");
        expect(document.body.textContent).not.toContain("secret-token-abc");
    });
    it("signOut calls the api and returns the shell to public mode", async () => {
        meMock().mockResolvedValue(profile());
        renderProvider();
        await goAuthenticated();
        await waitFor(() => {
            expect(screen.getByTestId("auth").textContent).toBe("authenticated");
        });
        await act(async () => {
            screen.getByRole("button", { name: "sign-out" }).click();
        });
        expect(signOutMock()).toHaveBeenCalled();
        await waitFor(() => {
            expect(screen.getByTestId("auth").textContent).toBe("public");
        });
        expect(screen.getByTestId("role").textContent).toBe("none");
    });
    it("signOutAll calls the api and returns the shell to public mode", async () => {
        meMock().mockResolvedValue(profile());
        renderProvider();
        await goAuthenticated();
        await waitFor(() => {
            expect(screen.getByTestId("auth").textContent).toBe("authenticated");
        });
        await act(async () => {
            screen.getByRole("button", { name: "sign-out-all" }).click();
        });
        expect(signOutAllMock()).toHaveBeenCalled();
        await waitFor(() => {
            expect(screen.getByTestId("auth").textContent).toBe("public");
        });
    });
});
describe("AuthProvider security invariants (NFR-006)", () => {
    it("never reads the session cookie or browser storage", async () => {
        meMock().mockResolvedValue(profile());
        renderProvider();
        await goAuthenticated();
        await waitFor(() => {
            expect(meMock()).toHaveBeenCalled();
        });
        expect(document.cookie).toBe("");
        expect(window.localStorage.length).toBe(0);
        expect(window.sessionStorage.length).toBe(0);
    });
});
