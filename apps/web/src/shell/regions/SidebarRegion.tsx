/**
 * SidebarRegion — the stable navigation region anchor (FR-002, FR-034).
 *
 * The region is an independently addressable area whose position does not
 * change between destinations (FR-002) or between shell modes (FR-045). It is
 * itself the `navigation` landmark, so the shell exposes exactly one
 * navigation region per viewport class (FR-034). The navigation control
 * surface is rendered by the Sidebar component; the region only anchors it.
 */

import type { CSSProperties, ReactNode } from "react";
import { useLocale } from "../../providers/LocaleProvider.js";

export interface SidebarRegionProps {
  readonly children?: ReactNode;
  /** Inline presentation width — drives the collapse transition (NFR-003). */
  readonly style?: CSSProperties;
}

export function SidebarRegion({ children, style }: SidebarRegionProps) {
  const { t } = useLocale();
  return (
    <nav
      className="shell-sidebar-region"
      data-region="sidebar"
      // FR-034: the sidebar region IS the navigation landmark, so the frame
      // exposes exactly one navigation region and no redundant landmark.
      aria-label={t("region.sidebar")}
      style={style}
    >
      {children}
    </nav>
  );
}
