import { jsx as _jsx } from "react/jsx-runtime";
/**
 * ViewportClassProvider — desktop / tablet / mobile resolution (FR-016,
 * FR-021, FR-022, FR-062, FR-063).
 *
 * - Resolves exactly one class from viewport width only, against the fixed
 *   boundaries in `packages/contracts`. Pointer type and device hints are
 *   never consulted, so a wide touch device resolves to `desktop` and a
 *   narrow desktop window resolves to `mobile` (FR-016, A-02).
 * - The active class is the single source of truth for responsive navigation
 *   behavior and overrides an incompatible saved sidebar state (FR-063).
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, } from "react";
import { resolveViewportClass } from "@mahak/contracts";
import { logShellEvent } from "../logger/index.js";
const ViewportClassContext = createContext(null);
function readWidth() {
    try {
        if (typeof window === "undefined")
            return 1280;
        return window.innerWidth;
    }
    catch {
        return 1280;
    }
}
export function ViewportClassProvider({ children, initialWidth }) {
    const [width, setWidthState] = useState(() => initialWidth ?? readWidth());
    // FR-022 / T052: crossing a breakpoint must leave no residual overlay or
    // scrim. The drawer consumer reads `viewportClass` and closes itself when the
    // class leaves `mobile`; a resize listener is the trigger.
    useEffect(() => {
        if (typeof window === "undefined")
            return;
        let previous = resolveViewportClass(window.innerWidth);
        const handleResize = () => {
            const nextWidth = window.innerWidth;
            const nextClass = resolveViewportClass(nextWidth);
            setWidthState(nextWidth);
            if (nextClass !== previous) {
                logShellEvent("viewport-class", { from: previous, to: nextClass, width: nextWidth });
                previous = nextClass;
            }
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);
    const setWidth = useCallback((next) => {
        setWidthState(next);
        logShellEvent("viewport-class", { width: next, class: resolveViewportClass(next) });
    }, []);
    const viewportClass = useMemo(() => resolveViewportClass(width), [width]);
    const value = useMemo(() => ({
        viewportClass,
        width,
        isMobile: viewportClass === "mobile",
        isTablet: viewportClass === "tablet",
        isDesktop: viewportClass === "desktop",
        setWidth,
    }), [viewportClass, width, setWidth]);
    return (_jsx(ViewportClassContext.Provider, { value: value, children: children }));
}
export function useViewportClass() {
    const context = useContext(ViewportClassContext);
    if (!context) {
        throw new Error("useViewportClass must be used inside a ViewportClassProvider");
    }
    return context;
}
