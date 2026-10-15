/**
 * T090 — activating a reserved destination presents the defined unavailable
 * state and does not imply the feature exists (FR-013, FR-050).
 */
import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderShell } from "../utils/shell-tree.js";
import { clearShellPreferences } from "../../src/providers/ShellPreferences.js";
function openDestination(id) {
    fireEvent.click(screen.getByTestId("navigation-list").querySelector(`[data-destination-id="${id}"]`));
}
describe("reserved destinations present the unavailable state (FR-013, FR-050)", () => {
    beforeEach(() => clearShellPreferences());
    it("shows the unavailable state for every reserved destination", () => {
        const { getByTestId } = renderShell({ shellMode: "authenticated", width: 1440 });
        const ids = [
            "dest.general-chat",
            "dest.conversations",
            "dest.projects",
            "dest.private-teacher",
            "dest.files",
            "dest.search",
            "dest.settings",
            "dest.admin",
        ];
        for (const id of ids) {
            openDestination(id);
            const main = getByTestId("shell-frame").querySelector('[data-region="main"]');
            const block = main.querySelector('[data-state="unavailable"]');
            expect(block, `${id} must present the unavailable state`).not.toBeNull();
            expect(block.textContent).toMatch(/Not available yet/);
        }
    });
    it("does not imply the feature exists", () => {
        const { getByTestId } = renderShell({ shellMode: "authenticated", width: 1440 });
        openDestination("dest.private-teacher");
        const main = getByTestId("shell-frame").querySelector('[data-region="main"]');
        expect(main.textContent).not.toMatch(/Teacher is ready|Start learning|Ask anything/);
    });
    it("is distinct from the loading, empty, and error states (FR-050)", () => {
        const { getByTestId } = renderShell({ shellMode: "authenticated", width: 1440 });
        openDestination("dest.files");
        const main = getByTestId("shell-frame").querySelector('[data-region="main"]');
        expect(main.querySelector('[data-state="unavailable"]')).not.toBeNull();
        expect(main.querySelector('[data-state="loading"]')).toBeNull();
        expect(main.querySelector('[data-state="empty"]')).toBeNull();
        expect(main.querySelector('[data-state="error"]')).toBeNull();
    });
});
