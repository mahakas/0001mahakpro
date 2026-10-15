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

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  NavigationDestination,
  ShellMode,
} from "@mahak/contracts";
import {
  R01_RESERVED_DESTINATIONS,
} from "@mahak/contracts";
import { useShellMode } from "../../providers/ShellModeProvider.js";
import { logShellEvent } from "../../logger/index.js";

/**
 * The R01 navigation registry data (contracts/navigation.md reserved
 * destination registry). Exactly one destination per future product module,
 * all `reserved`, all `authenticated`.
 */
export const R01_NAVIGATION_DESTINATIONS: readonly NavigationDestination[] =
  R01_RESERVED_DESTINATIONS;

/**
 * The module destinations presented for a given shell mode (FR-043, FR-058).
 * Pure so it is testable without React.
 */
export function destinationsForMode(
  destinations: readonly NavigationDestination[],
  mode: ShellMode,
): readonly NavigationDestination[] {
  if (mode === "authenticated") {
    return destinations;
  }
  // A-08 / FR-058: the public navigation set contains zero module destinations.
  return [];
}

/**
 * The registry interface. Instances are created from data, never from layout.
 */
export interface NavigationRegistry {
  readonly destinations: readonly NavigationDestination[];
  findById(id: string): NavigationDestination | undefined;
  findByRoutePath(routePath: string): NavigationDestination | undefined;
}

export function createNavigationRegistry(
  destinations: readonly NavigationDestination[] = R01_NAVIGATION_DESTINATIONS,
): NavigationRegistry {
  return {
    destinations,
    findById: (id) => destinations.find((destination) => destination.id === id),
    findByRoutePath: (routePath) =>
      destinations.find((destination) => destination.routePath === routePath),
  };
}

interface NavigationContextValue {
  readonly registry: NavigationRegistry;
  /** Module destinations visible for the active shell mode. */
  readonly visibleDestinations: readonly NavigationDestination[];
  /** The active destination id, or `null` when none is active. */
  readonly activeDestinationId: string | null;
  readonly activeDestination: NavigationDestination | null;
  activate(destinationId: string): void;
  clearActive(): void;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

export interface NavigationProviderProps {
  readonly children?: ReactNode;
  readonly destinations?: readonly NavigationDestination[];
  /** Override the initial active destination (tests). */
  readonly initialActiveId?: string | null;
}

export function NavigationProvider({
  children,
  destinations,
  initialActiveId,
}: NavigationProviderProps) {
  const { shellMode } = useShellMode();
  const registry = useMemo(() => createNavigationRegistry(destinations), [destinations]);

  const [activeDestinationId, setActiveDestinationId] = useState<string | null>(
    () => initialActiveId ?? null,
  );

  const visibleDestinations = useMemo(
    () => destinationsForMode(registry.destinations, shellMode),
    [registry.destinations, shellMode],
  );

  // A destination that is not visible in the active mode cannot remain active
  // (FR-044: public mode exposes no module destination).
  const effectiveActiveId = useMemo(() => {
    if (!activeDestinationId) return null;
    return visibleDestinations.some((d) => d.id === activeDestinationId)
      ? activeDestinationId
      : null;
  }, [activeDestinationId, visibleDestinations]);

  const activate = useCallback((destinationId: string) => {
    setActiveDestinationId(destinationId);
    logShellEvent("region-state", { activeDestination: destinationId });
  }, []);

  const clearActive = useCallback(() => setActiveDestinationId(null), []);

  const activeDestination = useMemo(
    () => (effectiveActiveId ? registry.findById(effectiveActiveId) ?? null : null),
    [effectiveActiveId, registry],
  );

  const value = useMemo<NavigationContextValue>(
    () => ({
      registry,
      visibleDestinations,
      activeDestinationId: effectiveActiveId,
      activeDestination,
      activate,
      clearActive,
    }),
    [registry, visibleDestinations, effectiveActiveId, activeDestination, activate, clearActive],
  );

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
}

export function useNavigation(): NavigationContextValue {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used inside a NavigationProvider");
  }
  return context;
}
