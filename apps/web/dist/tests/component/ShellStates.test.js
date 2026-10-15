import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * T077 — a region whose content is still preparing shows a loading state inside
 * that region while the rest of the shell stays usable; a region with no
 * content shows the defined empty state (FR-047, FR-048).
 * T078 — a failing region shows an error state with a plain-language message and
 * a retry action where retrying is meaningful (FR-049).
 * T081 — loading, empty, error, and unavailable states render correctly in the
 * active theme and direction (FR-052).
 * T088-support — an unexpected failure in one region MUST NOT take down the
 * whole shell frame (NFR-008).
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { LocaleProvider } from "../../src/providers/LocaleProvider.js";
import { ThemeProvider } from "../../src/providers/ThemeProvider.js";
import { DirectionProvider } from "../../src/providers/DirectionProvider.js";
import { EmptyState } from "../../src/shell/states/EmptyState.js";
import { ErrorState } from "../../src/shell/states/ErrorState.js";
import { RegionLoading } from "../../src/shell/states/RegionLoading.js";
import { UnavailableState } from "../../src/shell/states/UnavailableState.js";
import { OfflineIndicator } from "../../src/shell/states/OfflineIndicator.js";
import { RegionBoundary } from "../../src/shell/RegionBoundary.js";
import { clearShellPreferences } from "../../src/providers/ShellPreferences.js";
function StateHarness({ theme = "light", locale = "en", children, }) {
    return (_jsx(LocaleProvider, { initialLocale: locale, children: _jsx(ThemeProvider, { initialMode: theme, children: _jsx(DirectionProvider, { children: _jsx("div", { "data-theme": theme, dir: locale === "en" ? "ltr" : "rtl", children: children }) }) }) }));
}
describe("per-region loading state (FR-047)", () => {
    beforeEach(() => clearShellPreferences());
    it("shows a loading state inside the region", () => {
        render(_jsx(StateHarness, { children: _jsx(RegionLoading, {}) }));
        expect(screen.getByText(/This region is still getting ready/)).toBeInTheDocument();
    });
    it("keeps the rest of the shell usable while one region loads", () => {
        render(_jsxs(StateHarness, { children: [_jsx("aside", { "data-region": "sidebar", children: "navigation" }), _jsx("main", { "data-region": "main", children: _jsx(RegionLoading, {}) })] }));
        expect(screen.getByText("navigation")).toBeInTheDocument();
        expect(screen.getByRole("status")).toBeInTheDocument();
    });
});
describe("empty state (FR-048)", () => {
    beforeEach(() => clearShellPreferences());
    it("explains the condition in plain language", () => {
        render(_jsx(StateHarness, { children: _jsx(EmptyState, {}) }));
        expect(screen.getByText("Nothing to show yet")).toBeInTheDocument();
    });
});
describe("error state (FR-049)", () => {
    beforeEach(() => clearShellPreferences());
    it("states the failure in plain language", () => {
        render(_jsx(StateHarness, { children: _jsx(ErrorState, {}) }));
        expect(screen.getByText("Failed to load")).toBeInTheDocument();
    });
    it("offers a retry action where retrying is meaningful", () => {
        const onRetry = vi.fn();
        render(_jsx(StateHarness, { children: _jsx(ErrorState, { onRetry: onRetry }) }));
        const retry = screen.getByRole("button", { name: /Try again/ });
        fireEvent.click(retry);
        expect(onRetry).toHaveBeenCalledTimes(1);
    });
    it("offers no retry when retrying is not meaningful", () => {
        render(_jsx(StateHarness, { children: _jsx(ErrorState, {}) }));
        expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });
});
describe("unavailable state is distinct (FR-050, FR-013)", () => {
    beforeEach(() => clearShellPreferences());
    it("presents the unavailable state, not loading, empty, or error", () => {
        const { container } = render(_jsx(StateHarness, { children: _jsx(UnavailableState, { destinationLabel: "General AI Chat" }) }));
        const block = container.querySelector('[data-state="unavailable"]');
        expect(block).not.toBeNull();
        expect(block.textContent).toMatch(/Not available yet/);
        expect(container.querySelector('[data-state="loading"]')).toBeNull();
        expect(container.querySelector('[data-state="empty"]')).toBeNull();
        expect(container.querySelector('[data-state="error"]')).toBeNull();
    });
});
describe("offline indication (FR-051)", () => {
    beforeEach(() => clearShellPreferences());
    it("indicates an interrupted condition when the network goes away", () => {
        Object.defineProperty(navigator, "onLine", { value: true, configurable: true });
        render(_jsx(StateHarness, { children: _jsx(OfflineIndicator, {}) }));
        expect(screen.queryByText("Connection interrupted")).not.toBeInTheDocument();
        Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
        fireEvent(window, new Event("offline"));
        expect(screen.getByText("Connection interrupted")).toBeInTheDocument();
    });
    it("clears the indication when connectivity returns", () => {
        Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
        render(_jsx(StateHarness, { children: _jsx(OfflineIndicator, {}) }));
        expect(screen.getByText("Connection interrupted")).toBeInTheDocument();
        Object.defineProperty(navigator, "onLine", { value: true, configurable: true });
        fireEvent(window, new Event("online"));
        expect(screen.queryByText("Connection interrupted")).not.toBeInTheDocument();
    });
});
describe("graceful degradation (NFR-008)", () => {
    beforeEach(() => clearShellPreferences());
    it("confines a region failure to that region and keeps the frame intact", () => {
        function BrokenRegion() {
            throw new Error("region exploded");
        }
        render(_jsxs(StateHarness, { children: [_jsx("header", { "data-region": "header", children: "header" }), _jsx(RegionBoundary, { region: "main", children: _jsx(BrokenRegion, {}) }), _jsx("footer", { "data-region": "main-aux", children: "still visible" })] }));
        expect(screen.getByText("header")).toBeInTheDocument();
        expect(screen.getByText("still visible")).toBeInTheDocument();
        expect(screen.getByText(/Failed to load/)).toBeInTheDocument();
    });
});
describe("states honor theme and direction (FR-052)", () => {
    beforeEach(() => clearShellPreferences());
    it.each([
        ["light", "en", "ltr"],
        ["dark", "en", "ltr"],
        ["light", "fa", "rtl"],
        ["dark", "fa", "rtl"],
    ])("renders the four states in %s theme and %s direction", (theme, locale, dir) => {
        const { container } = render(_jsxs(StateHarness, { theme: theme, locale: locale, children: [_jsx(RegionLoading, {}), _jsx(EmptyState, {}), _jsx(ErrorState, { onRetry: () => undefined }), _jsx(UnavailableState, { destinationLabel: "Projects" })] }));
        expect(container.closest("[data-theme]")?.getAttribute("data-theme")).toBe(theme);
        expect(container.closest("[dir]")?.getAttribute("dir")).toBe(dir);
        expect(container.querySelectorAll("[data-state]")).toHaveLength(4);
    });
});
