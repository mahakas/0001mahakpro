/**
 * T020 — when the main content area has no feature content, a defined empty
 * state is shown inside the main area, not a blank or broken page
 * (FR-002, FR-048).
 */
import { beforeEach, describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderShell } from "../utils/shell-tree.js";
import { clearShellPreferences } from "../../src/providers/ShellPreferences.js";
describe("main region empty state (FR-048)", () => {
    beforeEach(() => clearShellPreferences());
    it("shows the defined empty state when there is no feature content", () => {
        const { getByTestId } = renderShell({
            shellMode: "authenticated",
            width: 1440,
            initialPath: "/",
        });
        const main = getByTestId("shell-frame").querySelector('[data-region="main"]');
        expect(main).not.toBeNull();
        expect(main.textContent).toMatch(/Nothing to show yet/);
    });
    it("renders the empty state inside the main area only, leaving the frame intact", () => {
        const { getByTestId } = renderShell({ shellMode: "authenticated", width: 1440 });
        const main = getByTestId("shell-frame").querySelector('[data-region="main"]');
        const empty = main.querySelector('[data-state="empty"]');
        expect(empty).not.toBeNull();
        // The sidebar and header regions do not carry the empty state.
        const sidebar = getByTestId("shell-frame").querySelector('[data-region="sidebar"]');
        expect(sidebar.querySelector('[data-state="empty"]')).toBeNull();
    });
    it("never renders a blank main area", () => {
        const { getByTestId } = renderShell({ shellMode: "authenticated", width: 1440 });
        const main = getByTestId("shell-frame").querySelector('[data-region="main"]');
        expect(main.textContent.trim().length).toBeGreaterThan(0);
    });
    it("uses the externalized empty-state text for the active locale (FR-028)", () => {
        renderShell({ shellMode: "authenticated", width: 1440, locale: "fa", initialPath: "/" });
        expect(screen.getByText("چیزی برای نمایش نیست")).toBeInTheDocument();
    });
});
