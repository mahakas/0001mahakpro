import { jsx as _jsx } from "react/jsx-runtime";
/**
 * ThemeProvider — Light / Dark / System theme resolution and persistence
 * (FR-029, FR-030, FR-031, FR-032, FR-033, FR-060; A-07).
 *
 * - Supports exactly three modes: `light`, `dark`, `system` (FR-029).
 * - In `system` mode it subscribes to the device appearance preference and
 *   follows changes at runtime (FR-031); OSes exposing no preference fall back
 *   to `light` (A-07).
 * - First visit with nothing saved defaults to `system` (FR-060).
 * - The selection persists across reloads in the same browser (FR-032).
 * - The resolved theme is written to the root `data-theme` attribute, which
 *   switches the shared design tokens so every region — including the drawer —
 *   re-themes with no unthemed region (FR-030, FR-052).
 * - No theme disables any navigation or shell control (FR-033).
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, } from "react";
import { DEFAULT_RESOLVED_THEME, DEFAULT_THEME_MODE, } from "@mahak/contracts";
import { getSavedTheme, setSavedTheme } from "./ShellPreferences.js";
import { logShellEvent } from "../logger/index.js";
const DARK_MEDIA_QUERY = "(prefers-color-scheme: dark)";
const ThemeContext = createContext(null);
function readSystemPreference(override) {
    if (override)
        return override;
    try {
        if (typeof window === "undefined" || !window.matchMedia)
            return DEFAULT_RESOLVED_THEME;
        return window.matchMedia(DARK_MEDIA_QUERY).matches ? "dark" : "light";
    }
    catch {
        return DEFAULT_RESOLVED_THEME;
    }
}
export function ThemeProvider({ children, initialMode, initialSystemPreference, }) {
    const [themeMode, setThemeModeState] = useState(() => initialMode ?? getSavedTheme() ?? DEFAULT_THEME_MODE);
    const [systemPreference, setSystemPreference] = useState(() => readSystemPreference(initialSystemPreference));
    // FR-031: follow the device appearance preference while in `system` mode.
    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia)
            return;
        const query = window.matchMedia(DARK_MEDIA_QUERY);
        const handleChange = (event) => {
            setSystemPreference(event.matches ? "dark" : "light");
        };
        query.addEventListener("change", handleChange);
        return () => query.removeEventListener("change", handleChange);
    }, []);
    const resolvedTheme = useMemo(() => (themeMode === "system" ? systemPreference : themeMode), [themeMode, systemPreference]);
    // Apply the resolved theme to the application root so the token set switches
    // (FR-030). Never set any other attribute here — the root is shared with
    // DirectionProvider's `dir`.
    useEffect(() => {
        if (typeof document === "undefined")
            return;
        document.documentElement.setAttribute("data-theme", resolvedTheme);
    }, [resolvedTheme]);
    const setThemeMode = useCallback((mode) => {
        setThemeModeState(mode);
        setSavedTheme(mode);
        logShellEvent("theme", { mode });
    }, []);
    const value = useMemo(() => ({ themeMode, resolvedTheme, setThemeMode }), [themeMode, resolvedTheme, setThemeMode]);
    return _jsx(ThemeContext.Provider, { value: value, children: children });
}
export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used inside a ThemeProvider");
    }
    return context;
}
