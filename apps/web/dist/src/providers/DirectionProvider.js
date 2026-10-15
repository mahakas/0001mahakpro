import { jsx as _jsx } from "react/jsx-runtime";
/**
 * DirectionProvider — RTL/LTR layout direction (FR-023, FR-024, FR-025,
 * FR-026, FR-027, FR-061).
 *
 * - The active direction is set on the application root and is the single
 *   source of truth for layout direction (FR-024).
 * - The active language is the single source of truth for the *initial*
 *   direction when no saved preference exists, so the two cannot diverge at
 *   first paint (FR-061).
 * - Switching direction mirrors every region via logical CSS properties and
 *   requires no reload and no re-navigation (FR-025, FR-027).
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, } from "react";
import { resolveDirectionForLocale } from "@mahak/contracts";
import { getSavedDirection, setSavedDirection } from "./ShellPreferences.js";
import { logShellEvent } from "../logger/index.js";
import { LocaleContext } from "./LocaleProvider.js";
const DirectionContext = createContext(null);
export function DirectionProvider({ children, initialDirection }) {
    // LocaleContext may be absent when DirectionProvider is used standalone in
    // a test; fall back to the default locale resolution.
    const localeContext = useContext(LocaleContext);
    const locale = localeContext?.locale ?? "fa";
    const [direction, setDirectionState] = useState(() => initialDirection ?? getSavedDirection() ?? resolveDirectionForLocale(locale));
    // FR-061: when the active language changes and no explicit direction
    // preference has been saved, the direction follows the language.
    useEffect(() => {
        if (getSavedDirection())
            return;
        setDirectionState(resolveDirectionForLocale(locale));
        logShellEvent("direction", { from: "locale", locale, direction: resolveDirectionForLocale(locale) });
    }, [locale]);
    // FR-024: the root `dir` attribute is the single source of truth. Logical
    // CSS properties mirror every region from it (FR-025).
    useEffect(() => {
        if (typeof document === "undefined")
            return;
        document.documentElement.setAttribute("dir", direction);
    }, [direction]);
    const setDirection = useCallback((next) => {
        setDirectionState(next);
        setSavedDirection(next);
        logShellEvent("direction", { direction: next, explicit: true });
    }, []);
    const value = useMemo(() => ({ direction, setDirection, isLocaleDriven: !getSavedDirection() }), [direction, setDirection]);
    return _jsx(DirectionContext.Provider, { value: value, children: children });
}
export function useDirection() {
    const context = useContext(DirectionContext);
    if (!context) {
        throw new Error("useDirection must be used inside a DirectionProvider");
    }
    return context;
}
