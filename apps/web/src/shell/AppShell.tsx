/**
 * AppShell — the single top-level application shell (FR-001).
 *
 * Composes exactly three primary region types — sidebar/navigation, header/top
 * action, main content — and nothing else ("exactly three primary region
 * types", FR-001). The frame:
 *
 * - renders the theme, direction, viewport-class, and shell-mode providers
 *   behind stable presentation state (FR-030, FR-024, FR-016, FR-042);
 * - shows a whole-frame loading state at startup, then per-region states
 *   (FR-059);
 * - degrades gracefully so one region's failure cannot take down the frame
 *   (NFR-008);
 * - keeps navigation reachable in every mode and viewport class (FR-005),
 *   using the permanent sidebar on desktop/tablet and the overlay drawer on
 *   mobile (FR-017–FR-019).
 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import { SidebarRegion } from "./regions/SidebarRegion.js";
import { HeaderRegion } from "./regions/HeaderRegion.js";
import { MainRegion } from "./regions/MainRegion.js";
import { Sidebar } from "./navigation/Sidebar.js";
import { NavDrawer } from "./navigation/NavDrawer.js";
import { OfflineIndicator } from "./states/OfflineIndicator.js";
import { RegionLoading } from "./states/RegionLoading.js";
import { WholeFrameLoading } from "./states/WholeFrameLoading.js";
import { SkipToMain } from "./accessibility/SkipToMain.js";
import { RegionBoundary } from "./RegionBoundary.js";
import { useViewportClass } from "../providers/ViewportClassProvider.js";
import {
  SidebarPresentationProvider,
  useSidebarPresentation,
} from "./navigation/useSidebarPresentation.js";
import { ShellRoutes } from "../router/index.js";
import { logShellEvent } from "../logger/index.js";

export interface AppShellProps {
  /** Force the whole-frame loading state (tests). Uncontrolled by default. */
  readonly initialReady?: boolean;
  readonly children?: ReactNode;
}

function useWholeFrameReady(controlled: boolean): boolean {
  const [ready, setReady] = useState<boolean>(false);

  // FR-059: the inert frame paints once, then transitions to the interactive
  // shell without a reload or re-layout. Two animation frames guarantee the
  // inert state is painted before the transition, while staying far inside the
  // 2 s interactive budget (NFR-001).
  useEffect(() => {
    if (controlled) return;
    let outer = 0;
    let inner = 0;
    outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => {
        setReady(true);
        logShellEvent("shell-ready", { ready: true });
      });
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [controlled]);

  return ready;
}

function ShellFrame({ initialReady }: { initialReady?: boolean }) {
  const { viewportClass } = useViewportClass();
  const { presentation, width } = useSidebarPresentation();
  const controlled = typeof initialReady === "boolean";
  const ready = useWholeFrameReady(controlled);
  const effectiveReady = controlled ? Boolean(initialReady) : ready;

  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const openerRef = useRef<HTMLButtonElement>(null);

  const closeDrawer = () => setDrawerOpen(false);
  const openDrawer = () => setDrawerOpen(true);

  return (
    <div
      className="shell-frame"
      data-viewport={viewportClass}
      data-shell-ready={effectiveReady}
      data-testid="shell-frame"
    >
      <SkipToMain />
      <WholeFrameLoading active={!effectiveReady} />
      <OfflineIndicator />
      <div className="shell-body">
        {presentation === "sidebar" ? (
          <RegionBoundary region="sidebar">
            <SidebarRegion style={{ width }}>
              <Sidebar />
            </SidebarRegion>
          </RegionBoundary>
        ) : null}
        <div className="shell-main-column">
          <RegionBoundary region="header">
            <HeaderRegion onOpenNavigation={openDrawer} drawerOpenerRef={openerRef} />
          </RegionBoundary>
          <RegionBoundary region="main">
            <MainRegion>
              {effectiveReady ? (
                <ShellRoutes />
              ) : (
                // FR-059: per-region loading state while the shell prepares.
                <RegionLoading />
              )}
            </MainRegion>
          </RegionBoundary>
        </div>
      </div>
      {presentation === "drawer" ? (
        <NavDrawer open={drawerOpen} onClose={closeDrawer} openerRef={openerRef} />
      ) : null}
    </div>
  );
}

export function AppShell({ initialReady, children }: AppShellProps) {
  // The sidebar presentation provider is scoped here so the frame and the
  // sidebar share one source of truth for collapse state and width.
  return (
    <SidebarPresentationProvider>
      <ShellFrame initialReady={initialReady} />
      {children}
    </SidebarPresentationProvider>
  );
}
