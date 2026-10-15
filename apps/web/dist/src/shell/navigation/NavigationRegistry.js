import { jsx as _jsx } from "react/jsx-runtime";
/**
 * NavigationRegistry — the set of reserved destinations plus active-destination
 * tracking (FR-010, FR-011, FR-012, FR-014, FR-015, FR-056).
 *
 * Destinations are registry *data*, not hard-coded layout: a future module
 * becoming available requires no change to the shell's layout or navigation
 * contract (FR-014) — it flips its availability entry and binds its route
 * (contracts/navigation.md, "Module extension contract").
 *
 * Mode filtering (T040): the `public` navigation set contains zero module
 * destinations — only the sign-in/sign-up entry points, presented as header
 * global actions (FR-058, A-08). The `authenticated` set contains the eight
 * reserved destinations (FR-043).
 */
import { createContext, useCallback, useContext, useMemo, useState, } from "react";
import { R01_RESERVED_DESTINATIONS, } from "@mahak/contracts";
import { useShellMode } from "../../providers/ShellModeProvider.js";
import { logShellEvent } from "../../logger/index.js";
/**
 * The R01 navigation registry data (contracts/navigation.md reserved
 * destination registry). Exactly one destination per future product module,
 * all `reserved`, all `authenticated`.
 */
export const R01_NAVIGATION_DESTINATIONS = R01_RESERVED_DESTINATIONS;
/**
 * The module destinations presented for a given shell mode (FR-043, FR-058).
 * Pure so it is testable without React.
 */
export function destinationsForMode(destinations, mode) {
    if (mode === "authenticated") {
        return destinations;
    }
    // A-08 / FR-058: the public navigation set contains zero module destinations.
    return [];
}
export function createNavigationRegistry(destinations = R01_NAVIGATION_DESTINATIONS) {
    return {
        destinations,
        findById: (id) => destinations.find((destination) => destination.id === id),
        findByRoutePath: (routePath) => destinations.find((destination) => destination.routePath === routePath),
    };
}
const NavigationContext = createContext(null);
export function NavigationProvider({ children, destinations, initialActiveId, }) {
    const { shellMode } = useShellMode();
    const registry = useMemo(() => createNavigationRegistry(destinations), [destinations]);
    const [activeDestinationId, setActiveDestinationId] = useState(() => initialActiveId ?? null);
    const visibleDestinations = useMemo(() => destinationsForMode(registry.destinations, shellMode), [registry.destinations, shellMode]);
    // A destination that is not visible in the active mode cannot remain active
    // (FR-044: public mode exposes no module destination).
    const effectiveActiveId = useMemo(() => {
        if (!activeDestinationId)
            return null;
        return visibleDestinations.some((d) => d.id === activeDestinationId)
            ? activeDestinationId
            : null;
    }, [activeDestinationId, visibleDestinations]);
    const activate = useCallback((destinationId) => {
        setActiveDestinationId(destinationId);
        logShellEvent("region-state", { activeDestination: destinationId });
    }, []);
    const clearActive = useCallback(() => setActiveDestinationId(null), []);
    const activeDestination = useMemo(() => (effectiveActiveId ? registry.findById(effectiveActiveId) ?? null : null), [effectiveActiveId, registry]);
    const value = useMemo(() => ({
        registry,
        visibleDestinations,
        activeDestinationId: effectiveActiveId,
        activeDestination,
        activate,
        clearActive,
    }), [registry, visibleDestinations, effectiveActiveId, activeDestination, activate, clearActive]);
    return _jsx(NavigationContext.Provider, { value: value, children: children });
}
export function useNavigation() {
    const context = useContext(NavigationContext);
    if (!context) {
        throw new Error("useNavigation must be used inside a NavigationProvider");
    }
    return context;
}
