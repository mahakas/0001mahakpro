/**
 * Shell state presentation (FR-047–FR-052).
 *
 * One presentational component backs every shell state so loading, empty,
 * error, and unavailable are visually and semantically distinct from each
 * other (FR-050) while sharing the themed token surface (FR-052). All text is
 * externalized (FR-028).
 */

import type { ReactNode } from "react";
import { useLocale } from "../../providers/LocaleProvider.js";

export type ShellStateKind =
  | "loading"
  | "empty"
  | "error"
  | "unavailable"
  | "offline"
  /** A defined public entry point (sign-in / sign-up) — not a module state. */
  | "entry";

export interface ShellStateProps {
  readonly state: ShellStateKind;
  readonly title: string;
  readonly message: string;
  /** Retry action; offered only where retrying is meaningful (FR-049). */
  readonly retryLabel?: string;
  readonly onRetry?: () => void;
  readonly children?: ReactNode;
}

/**
 * A themed shell state block. The `data-state` attribute selects the themed
 * token pair from themes/tokens.css (FR-052).
 */
export function ShellState({
  state,
  title,
  message,
  retryLabel,
  onRetry,
  children,
}: ShellStateProps) {
  const { t } = useLocale();

  return (
    <div className="shell-state" data-state={state} role="status">
      <p className="shell-state-title">{title}</p>
      <p className="shell-state-message">{message}</p>
      {children}
      {onRetry && retryLabel ? (
        <button type="button" className="shell-button" data-variant="primary" onClick={onRetry}>
          {retryLabel ?? t("state.error.retry")}
        </button>
      ) : null}
    </div>
  );
}
