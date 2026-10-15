import { jsx as _jsx } from "react/jsx-runtime";
/**
 * LocaleProvider — owns the active interface language and the translator
 * built from the externalized string resources (FR-028).
 *
 * Presentation state only; localization *management* (preferences UI,
 * pluralization, formatting) is owned by R03 (A-04). The active locale feeds
 * the initial direction via DirectionProvider (FR-061).
 */
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { resolveInitialLocale } from "../i18n/index.js";
import { createTranslator } from "../i18n/index.js";
import { getSavedLocale, setSavedLocale } from "./ShellPreferences.js";
import { logShellEvent } from "../logger/index.js";
const LocaleContext = createContext(null);
export { LocaleContext };
function platformLocale() {
    try {
        return typeof navigator !== "undefined" ? navigator.language : null;
    }
    catch {
        return null;
    }
}
export function LocaleProvider({ children, initialLocale }) {
    const [locale, setLocaleState] = useState(() => initialLocale ?? resolveInitialLocale(getSavedLocale(), platformLocale()));
    const setLocale = useCallback((next) => {
        setLocaleState(next);
        setSavedLocale(next);
        // Direction follows the active locale when no explicit direction
        // preference is saved (FR-061); DirectionProvider emits the log record.
        logShellEvent("direction", { locale: next });
    }, []);
    const value = useMemo(() => ({ locale, t: createTranslator(locale), setLocale }), [locale, setLocale]);
    return _jsx(LocaleContext.Provider, { value: value, children: children });
}
export function useLocale() {
    const context = useContext(LocaleContext);
    if (!context) {
        throw new Error("useLocale must be used inside a LocaleProvider");
    }
    return context;
}
