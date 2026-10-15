import { jsx as _jsx } from "react/jsx-runtime";
/**
 * Sidebar presentation — how navigation is presented for the active viewport
 * class, and whether the sidebar is collapsed (FR-006, FR-017, FR-018,
 * FR-019, FR-062, FR-063).
 *
 * Presentation per class (contracts/navigation.md):
 *
 * | class    | presentation | note                                   |
 * |----------|--------------|----------------------------------------|
 * | desktop  | sidebar      | open or compact rail per preference    |
 * | tablet   | sidebar      | compact by default, expandable         |
 * | mobile   | drawer       | no permanent sidebar (FR-019)          |
 *
 * Precedence (FR-062, FR-063):
 * - first visit, no saved preference: desktop expanded, tablet compact,
 *   mobile always the drawer;
 * - the active class overrides an incompatible saved state: a saved
 *   `expanded` state resolves to compact in the tablet class and to the
 *   drawer pattern in the mobile class.
 *
 * State lives in a context so the region anchor (width) and the Sidebar
 * control (collapse/expand) share one source of truth.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, } from "react";
import { getSavedSidebarState, setSavedSidebarState, } from "../../providers/ShellPreferences.js";
import { logShellEvent } from "../../logger/index.js";
import { useViewportClass } from "../../providers/ViewportClassProvider.js";
/** Sidebar widths; inline so the collapse transition and the suites share one
 * measurable value (NFR-003, T026). */
export const SIDEBAR_WIDTH_EXPANDED = "16rem";
export const SIDEBAR_WIDTH_COMPACT = "4.5rem";
const SidebarPresentationContext = createContext(null);
/**
 * Resolve the sidebar state for a class from the saved preference.
 *
 * Returns `null` for the mobile class — the drawer owns navigation there and no
 * permanent sidebar state applies (FR-019).
 */
export function resolveSidebarCollapsed(viewportClass, saved) {
    if (viewportClass === "mobile")
        return null;
    if (viewportClass === "tablet") {
        // FR-062: compact by default on first visit. FR-063: the tablet class
        // takes precedence over a saved `expanded` state, which is incompatible
        // with the tablet width budget.
        return true;
    }
    // desktop: honor the saved state; default expanded on first visit (FR-062).
    return saved === "collapsed";
}
export function SidebarPresentationProvider({ children }) {
    const { viewportClass } = useViewportClass();
    const presentation = viewportClass === "mobile" ? "drawer" : "sidebar";
    const [collapsed, setCollapsedState] = useState(() => resolveSidebarCollapsed(viewportClass, getSavedSidebarState()) ?? false);
    // FR-022 / FR-063: settle into the new class's navigation mode whenever the
    // class changes (resize or reload into a different class).
    useEffect(() => {
        const resolved = resolveSidebarCollapsed(viewportClass, getSavedSidebarState());
        if (resolved !== null)
            setCollapsedState(resolved);
    }, [viewportClass]);
    const setCollapsed = useCallback((next) => {
        setCollapsedState(next);
        // FR-008: the selected state persists across reloads in the same browser.
        setSavedSidebarState(next ? "collapsed" : "expanded");
        logShellEvent("sidebar", { collapsed: next });
    }, []);
    const toggleCollapsed = useCallback(() => {
        setCollapsed(!collapsed);
    }, [collapsed, setCollapsed]);
    const value = useMemo(() => ({
        presentation,
        collapsed,
        width: collapsed ? SIDEBAR_WIDTH_COMPACT : SIDEBAR_WIDTH_EXPANDED,
        setCollapsed,
        toggleCollapsed,
    }), [presentation, collapsed, setCollapsed, toggleCollapsed]);
    return (_jsx(SidebarPresentationContext.Provider, { value: value, children: children }));
}
export function useSidebarPresentation() {
    const context = useContext(SidebarPresentationContext);
    if (!context) {
        throw new Error("useSidebarPresentation must be used inside a SidebarPresentationProvider");
    }
    return context;
}
