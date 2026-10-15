/**
 * EmptyState — the defined state shown when a region has no content, never a
 * blank or broken page (FR-048, FR-002). Text from externalized resources
 * (FR-028).
 */

import { useLocale } from "../../providers/LocaleProvider.js";
import { ShellState } from "./ShellState.js";

export interface EmptyStateProps {
  /** Override the message for a specific region (tests / future modules). */
  readonly title?: string;
  readonly message?: string;
}

export function EmptyState({ title, message }: EmptyStateProps = {}) {
  const { t } = useLocale();
  return (
    <ShellState
      state="empty"
      title={title ?? t("state.empty.title")}
      message={message ?? t("state.empty.message")}
    />
  );
}
