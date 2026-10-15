/**
 * ErrorState — plain-language failure message with a retry action where
 * retrying is meaningful (FR-049). One region in `error` MUST NOT force
 * another region out of its own state (NFR-008).
 */

import { useLocale } from "../../providers/LocaleProvider.js";
import { ShellState } from "./ShellState.js";

export interface ErrorStateProps {
  readonly title?: string;
  readonly message?: string;
  readonly retryLabel?: string;
  /** When omitted, no retry is offered (retry only where meaningful). */
  readonly onRetry?: () => void;
}

export function ErrorState({ title, message, retryLabel, onRetry }: ErrorStateProps = {}) {
  const { t } = useLocale();
  return (
    <ShellState
      state="error"
      title={title ?? t("state.error.title")}
      message={message ?? t("state.error.message")}
      retryLabel={onRetry ? (retryLabel ?? t("state.error.retry")) : undefined}
      onRetry={onRetry}
    />
  );
}
