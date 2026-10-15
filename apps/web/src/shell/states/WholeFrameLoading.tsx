/**
 * WholeFrameLoading — the startup state (FR-059, NFR-001).
 *
 * During initial shell load, all three regions are present but inert, then
 * transition to the interactive shell — including any per-region loading
 * states — once the shell is interactive, without a reload or a re-layout of
 * the core frame.
 *
 * The inert state is expressed as `data-shell-ready="false"` on the frame
 * (see themes/shell.css): the regions keep their stable positions while
 * becoming non-interactive and visually subdued, so the frame never appears
 * partially assembled (quickstart scenario 1).
 */

import { useLocale } from "../../providers/LocaleProvider.js";

export interface WholeFrameLoadingProps {
  readonly active: boolean;
}

export function WholeFrameLoading({ active }: WholeFrameLoadingProps) {
  const { t } = useLocale();
  if (!active) return null;
  return (
    <div
      className="shell-sr-only"
      role="status"
      aria-live="polite"
      data-testid="whole-frame-loading"
    >
      {t("state.frameLoading")}
    </div>
  );
}

/**
 * The inert skeleton rendered inside each region while the frame is not yet
 * ready. Present in all three regions so the whole frame appears together
 * (FR-059).
 */
export function WholeFrameSkeleton() {
  return (
    <div className="shell-state" data-state="loading" aria-hidden="true">
      <span className="shell-skeleton" />
      <span className="shell-skeleton" style={{ width: "72%" }} />
    </div>
  );
}
