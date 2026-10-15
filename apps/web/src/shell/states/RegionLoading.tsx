/**
 * RegionLoading — per-region loading state (FR-047).
 *
 * Loading one region MUST NOT block the rest of the shell: this component
 * renders only inside its own region (NFR-008, data-model.md state rules).
 */

import { useLocale } from "../../providers/LocaleProvider.js";

export interface RegionLoadingProps {
  readonly label?: string;
}

export function RegionLoading({ label }: RegionLoadingProps = {}) {
  const { t } = useLocale();
  return (
    <div
      className="shell-state"
      data-state="loading"
      role="status"
      aria-live="polite"
      aria-label={label ?? t("state.loading.title")}
    >
      <span className="shell-skeleton" aria-hidden="true" />
      <span className="shell-skeleton" aria-hidden="true" style={{ width: "62%" }} />
      <p className="shell-state-message">{t("state.loading.message")}</p>
    </div>
  );
}
