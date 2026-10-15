/**
 * RegionBoundary — graceful degradation (NFR-008).
 *
 * An unexpected failure in one region MUST NOT take down the whole shell frame:
 * the boundary catches the error, logs it with structured fields, and renders
 * the defined error state inside the affected region while the other regions
 * keep working.
 */

import { Component, type ErrorInfo, type ReactNode } from "react";
import { ErrorState } from "./states/ErrorState.js";
import { logShellEvent } from "../logger/index.js";

interface RegionBoundaryProps {
  readonly region: string;
  readonly children: ReactNode;
}

interface RegionBoundaryState {
  readonly error: Error | null;
}

export class RegionBoundary extends Component<RegionBoundaryProps, RegionBoundaryState> {
  override state: RegionBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): RegionBoundaryState {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    // Structured fields, no secrets (NFR-006).
    logShellEvent("region-state", {
      region: this.props.region,
      fault: "region-error",
      message: error.message,
      stack: typeof info.componentStack === "string" ? info.componentStack.slice(0, 400) : undefined,
    });
  }

  override render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;
    // The error is confined to this region; the rest of the frame is intact.
    return <ErrorState message={error.message} />;
  }
}
