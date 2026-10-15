import { jsx as _jsx } from "react/jsx-runtime";
/**
 * RegionBoundary — graceful degradation (NFR-008).
 *
 * An unexpected failure in one region MUST NOT take down the whole shell frame:
 * the boundary catches the error, logs it with structured fields, and renders
 * the defined error state inside the affected region while the other regions
 * keep working.
 */
import { Component } from "react";
import { ErrorState } from "./states/ErrorState.js";
import { logShellEvent } from "../logger/index.js";
export class RegionBoundary extends Component {
    state = { error: null };
    static getDerivedStateFromError(error) {
        return { error };
    }
    componentDidCatch(error, info) {
        // Structured fields, no secrets (NFR-006).
        logShellEvent("region-state", {
            region: this.props.region,
            fault: "region-error",
            message: error.message,
            stack: typeof info.componentStack === "string" ? info.componentStack.slice(0, 400) : undefined,
        });
    }
    render() {
        const { error } = this.state;
        if (!error)
            return this.props.children;
        // The error is confined to this region; the rest of the frame is intact.
        return _jsx(ErrorState, { message: error.message });
    }
}
