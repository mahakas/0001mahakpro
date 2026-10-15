import { jsx as _jsx } from "react/jsx-runtime";
/**
 * AuthProvider — authorization-aware application state (FR-027, FR-032).
 *
 * The provider *observes* the shell-mode seam and derives the richer
 * authentication context from it. It never introduces a second shell-state
 * system and never replaces `ShellModeProvider`:
 *
 *   AuthProvider (auth state) → ShellModeProvider (public/authenticated shell)
 *
 * Behaviour required by T021:
 *  - Subscribes to `ShellModeProvider` changes.
 *  - When `shellMode` becomes `authenticated`, fetches the user profile from
 *    the api and populates `role` and `organizationReference`.
 *  - When `shellMode` becomes `public`, clears `role` and
 *    `organizationReference`.
 *  - Exposes `signOut()` and `signOutAll()`, which call the auth api and then
 *    set shell mode to `public`.
 *
 * Security boundaries:
 *  - Session state is never read from `document.cookie`, `localStorage`, or
 *    `sessionStorage`. The HttpOnly `mahak_session` cookie is the only session
 *    reference and the server/database remains authoritative (NFR-006).
 *  - No session token, password hash, or OTP value is ever placed in this
 *    context (NFR-003, NFR-007).
 *  - A browser-side `role` is presentational only; authorization is always
 *    enforced server-side (FR-022, FR-027).
 *  - A profile request is issued once per authenticated transition, so a shell
 *    re-render can never produce duplicate concurrent fetches.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, } from "react";
import { isRole } from "@mahak/contracts";
import { useShellMode } from "./ShellModeProvider.js";
import { AuthService } from "../services/AuthService.js";
const AuthContext = createContext(null);
export { AuthContext };
export function AuthProvider({ children, skipProfileFetch, loadProfile }) {
    const { shellMode, setShellMode } = useShellMode();
    const isAuthenticated = shellMode === "authenticated";
    const [role, setRole] = useState(null);
    const [organizationReference, setOrganizationReference] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    // One in-flight request at most: a re-render or a duplicate mode notification
    // must not produce concurrent profile fetches.
    const inFlight = useRef(null);
    const resolveProfile = loadProfile ??
        (async () => {
            const profile = await AuthService.me();
            return { role: profile.role, organizationReference: profile.organizationReference };
        });
    useEffect(() => {
        if (!isAuthenticated) {
            // Cancel any request that is still running for the previous session.
            inFlight.current?.abort();
            inFlight.current = null;
            setIsLoading(false);
            setRole(null);
            setOrganizationReference(null);
            return;
        }
        if (skipProfileFetch)
            return;
        const controller = new AbortController();
        inFlight.current = controller;
        setIsLoading(true);
        resolveProfile()
            .then((profile) => {
            if (controller.signal.aborted || inFlight.current !== controller)
                return;
            if (!profile)
                return;
            // Only the declared R02 roles populate the context; anything else is
            // ignored rather than surfaced (FR-022, FR-025).
            setRole(isRole(profile.role) ? profile.role : null);
            setOrganizationReference(profile.organizationReference ?? null);
        })
            .catch(() => {
            // A failed profile fetch must not surface raw provider detail; the
            // session itself remains valid and the shell stays authenticated.
            if (controller.signal.aborted || inFlight.current !== controller)
                return;
            setRole(null);
            setOrganizationReference(null);
        })
            .finally(() => {
            if (inFlight.current === controller) {
                inFlight.current = null;
                setIsLoading(false);
            }
        });
        return () => {
            controller.abort();
        };
        // `resolveProfile` is intentionally not a dependency: it is recreated on
        // every render, and re-fetching on each render would defeat the once-per-
        // transition guarantee. The effect keys on the shell mode instead.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, skipProfileFetch]);
    const signOut = useCallback(async () => {
        await AuthService.signOut();
        setShellMode("public");
    }, [setShellMode]);
    const signOutAll = useCallback(async () => {
        await AuthService.signOutAll();
        setShellMode("public");
    }, [setShellMode]);
    const value = useMemo(() => ({
        isAuthenticated,
        role,
        organizationReference,
        isLoading,
        signOut,
        signOutAll,
    }), [isAuthenticated, role, organizationReference, isLoading, signOut, signOutAll]);
    return _jsx(AuthContext.Provider, { value: value, children: children });
}
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used inside an AuthProvider");
    }
    return context;
}
