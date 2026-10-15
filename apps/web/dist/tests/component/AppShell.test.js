/**
 * T019 — rendering the shell shows exactly one sidebar region, one header
 * region, and one main content region, each visually distinguishable
 * (FR-001, FR-002).
 */
import { beforeEach, describe, expect, it } from "vitest";
import { renderShell } from "../utils/shell-tree.js";
import { clearShellPreferences } from "../../src/providers/ShellPreferences.js";
function regionCounts() {
    return {
        sidebar: document.querySelectorAll('[data-region="sidebar"]').length,
        header: document.querySelectorAll('[data-region="header"]').length,
        main: document.querySelectorAll('[data-region="main"]').length,
    };
}
describe("application shell regions (FR-001, FR-002)", () => {
    beforeEach(() => clearShellPreferences());
    it("renders exactly one of each of the three region types", () => {
        renderShell({ shellMode: "authenticated", width: 1440 });
        expect(regionCounts()).toEqual({ sidebar: 1, header: 1, main: 1 });
    });
    it("renders no fourth region type", () => {
        renderShell({ shellMode: "authenticated", width: 1440 });
        const regions = document.querySelectorAll("[data-region]");
        const kinds = new Set(Array.from(regions).map((node) => node.getAttribute("data-region")));
        expect(kinds).toEqual(new Set(["sidebar", "header", "main"]));
    });
    it("exposes the three regions as distinct semantic landmarks (FR-034)", () => {
        renderShell({ shellMode: "authenticated", width: 1440 });
        expect(document.querySelectorAll("nav")).toHaveLength(1);
        expect(document.querySelectorAll("header[role='banner']")).toHaveLength(1);
        expect(document.querySelectorAll("main")).toHaveLength(1);
    });
    it("keeps the three regions distinguishable in the mobile class too", () => {
        renderShell({ shellMode: "authenticated", width: 360 });
        // Mobile has no permanent sidebar region — navigation is the drawer.
        expect(regionCounts()).toEqual({ sidebar: 0, header: 1, main: 1 });
    });
});
