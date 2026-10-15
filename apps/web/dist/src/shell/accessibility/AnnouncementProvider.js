import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * AnnouncementProvider — communicates shell state changes to assistive
 * technology (FR-040).
 *
 * Sidebar collapsed/expanded, drawer opened/closed, and theme changes are
 * announced through a polite live region. The provider sits outermost so both
 * the presentation providers and the shell regions can announce.
 */
import { createContext, useCallback, useContext, useMemo, useRef, useState, } from "react";
const AnnouncerContext = createContext(() => {
    /* no-op outside a provider */
});
export function AnnouncementProvider({ children }) {
    const [message, setMessage] = useState("");
    const timer = useRef(null);
    const announce = useCallback((next) => {
        // Clear-then-set so repeated identical messages re-announce.
        setMessage("");
        if (timer.current)
            clearTimeout(timer.current);
        timer.current = setTimeout(() => setMessage(next), 30);
    }, []);
    const value = useMemo(() => announce, [announce]);
    return (_jsxs(AnnouncerContext.Provider, { value: value, children: [children, _jsx("div", { className: "shell-sr-only", role: "status", "aria-live": "polite", "data-testid": "shell-announcer", children: message })] }));
}
export function useAnnouncer() {
    return useContext(AnnouncerContext);
}
