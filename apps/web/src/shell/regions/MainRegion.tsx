/**
 * MainRegion — the single destination for feature content and the only region
 * whose content changes when moving between navigation destinations (FR-003).
 *
 * Exposes the `main` landmark (FR-034) and is the skip-link target
 * (FR-035: `tabindex="-1"` lets it receive programmatic focus).
 */

import type { ReactNode } from "react";
import { useLocale } from "../../providers/LocaleProvider.js";
import { MAIN_CONTENT_ID } from "../accessibility/SkipToMain.js";

export interface MainRegionProps {
  readonly children?: ReactNode;
}

export function MainRegion({ children }: MainRegionProps) {
  const { t } = useLocale();
  return (
    <main
      id={MAIN_CONTENT_ID}
      className="shell-main-region"
      data-region="main"
      tabIndex={-1}
      aria-label={t("region.main")}
    >
      {children}
    </main>
  );
}
