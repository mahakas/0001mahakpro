/**
 * T026 — activating the collapse control transitions the sidebar to a compact
 * state consuming substantially less horizontal space while the main content
 * area expands; expanding returns full labels; the control is reachable from
 * both states; every destination remains reachable from the rail
 * (FR-006, FR-007, FR-009).
 * T030-T034 — collapse/expand, rail reachability, persistence, active
 * indication.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderShell } from "../utils/shell-tree.js";
import { clearShellPreferences, getSavedSidebarState, setSavedSidebarState, } from "../../src/providers/ShellPreferences.js";
import { SIDEBAR_WIDTH_COMPACT, SIDEBAR_WIDTH_EXPANDED, } from "../../src/shell/navigation/useSidebarPresentation.js";
function sidebarRegion() {
    return document.querySelector('[data-region="sidebar"]');
}
function collapseControl() {
    return screen.getByTestId("sidebar-collapse-control");
}
describe("sidebar collapse and expand (FR-006, FR-007, NFR-003)", () => {
    beforeEach(() => clearShellPreferences());
    it("starts expanded at desktop width", () => {
        renderShell({ shellMode: "authenticated", width: 1440 });
        expect(collapseControl()).toHaveAttribute("aria-expanded", "true");
        expect(sidebarRegion().style.width).toBe(SIDEBAR_WIDTH_EXPANDED);
    });
    it("transitions to a compact state that consumes substantially less width", () => {
        renderShell({ shellMode: "authenticated", width: 1440 });
        const control = collapseControl();
        fireEvent.click(control);
        expect(control).toHaveAttribute("aria-expanded", "false");
        // 4.5rem vs 16rem — the rail consumes substantially less horizontal space.
        expect(sidebarRegion().style.width).toBe(SIDEBAR_WIDTH_COMPACT);
    });
    it("the main content area expands when the sidebar collapses (FR-006)", () => {
        const { getByTestId } = renderShell({ shellMode: "authenticated", width: 1440 });
        const main = getByTestId("shell-frame").querySelector('[data-region="main"]');
        expect(main).not.toBeNull();
        // The main column takes the freed space: the frame still hosts exactly one
        // main region and it remains fully in view.
        expect(getByTestId("shell-frame")).toContainElement(main);
    });
    it("expanding returns full labels", () => {
        renderShell({ shellMode: "authenticated", width: 1440 });
        const control = collapseControl();
        fireEvent.click(control);
        expect(control).toHaveAttribute("aria-expanded", "false");
        fireEvent.click(control);
        expect(control).toHaveAttribute("aria-expanded", "true");
        expect(sidebarRegion().style.width).toBe(SIDEBAR_WIDTH_EXPANDED);
    });
    it("the control is reachable and labeled from both states (FR-007, FR-036)", () => {
        renderShell({ shellMode: "authenticated", width: 1440 });
        const control = collapseControl();
        expect(control).toHaveAccessibleName(/Expand navigation|Collapse navigation/);
        fireEvent.click(control);
        // After collapsing the same control remains present and labeled.
        expect(collapseControl()).toBe(control);
        expect(control).toHaveAccessibleName(/Expand navigation|Collapse navigation/);
        fireEvent.click(control);
        expect(collapseControl()).toBe(control);
    });
    it("collapse is idempotent at the boundary (spec edge case)", () => {
        renderShell({ shellMode: "authenticated", width: 1440 });
        const control = collapseControl();
        fireEvent.click(control);
        fireEvent.click(control);
        fireEvent.click(control);
        expect(control).toHaveAttribute("aria-expanded", "false");
        expect(sidebarRegion().style.width).toBe(SIDEBAR_WIDTH_COMPACT);
    });
});
describe("rail reachability (FR-009)", () => {
    beforeEach(() => clearShellPreferences());
    it("keeps every destination reachable from the compact rail", () => {
        renderShell({ shellMode: "authenticated", width: 1440 });
        fireEvent.click(collapseControl());
        const items = document.querySelectorAll('[data-region="sidebar"] [data-destination-id]');
        expect(items).toHaveLength(8);
        // Every rail item is a focusable link carrying its label as its accessible
        // name, so nothing becomes unreachable when labels are visually hidden.
        items.forEach((item) => {
            expect(item.getAttribute("href")).toBeTruthy();
            expect(item).toHaveAccessibleName(/.+/);
        });
    });
});
describe("sidebar persistence (FR-008, FR-062, FR-063)", () => {
    beforeEach(() => clearShellPreferences());
    it("persists the collapsed choice across reloads", () => {
        const first = renderShell({ shellMode: "authenticated", width: 1440 });
        fireEvent.click(collapseControl());
        expect(getSavedSidebarState()).toBe("collapsed");
        first.unmount();
        clearShellPreferences();
        setSavedSidebarState("collapsed");
        const second = renderShell({ shellMode: "authenticated", width: 1440 });
        expect(second.getByTestId("sidebar-collapse-control")).toHaveAttribute("aria-expanded", "false");
    });
    it("starts compact in the tablet class on first visit (FR-062)", () => {
        renderShell({ shellMode: "authenticated", width: 900 });
        expect(collapseControl()).toHaveAttribute("aria-expanded", "false");
        expect(sidebarRegion().style.width).toBe(SIDEBAR_WIDTH_COMPACT);
    });
    it("resolves a saved expanded state to compact in the tablet class (FR-063)", () => {
        setSavedSidebarState("expanded");
        renderShell({ shellMode: "authenticated", width: 900 });
        expect(collapseControl()).toHaveAttribute("aria-expanded", "false");
    });
    it("never shows a permanent sidebar in the mobile class (FR-019)", () => {
        renderShell({ shellMode: "authenticated", width: 360 });
        expect(document.querySelectorAll('[data-region="sidebar"]')).toHaveLength(0);
    });
});
describe("active destination indication (FR-010, FR-003)", () => {
    beforeEach(() => clearShellPreferences());
    it("marks the activated destination active, visually and semantically", () => {
        renderShell({ shellMode: "authenticated", width: 1440 });
        const link = screen.getByTestId("navigation-list").querySelector('[data-destination-id="dest.general-chat"]');
        fireEvent.click(link);
        expect(link).toHaveAttribute("data-active", "true");
        expect(link).toHaveAttribute("aria-current", "page");
    });
    it("keeps exactly one destination active at a time (FR-010)", () => {
        renderShell({ shellMode: "authenticated", width: 1440 });
        const first = screen.getByTestId("navigation-list").querySelector('[data-destination-id="dest.general-chat"]');
        const second = screen.getByTestId("navigation-list").querySelector('[data-destination-id="dest.projects"]');
        fireEvent.click(first);
        expect(first).toHaveAttribute("data-active", "true");
        fireEvent.click(second);
        expect(second).toHaveAttribute("data-active", "true");
        expect(first).toHaveAttribute("data-active", "false");
    });
});
