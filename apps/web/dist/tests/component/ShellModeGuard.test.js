/**
 * T037 — attempting to reach an authenticated destination from public mode
 * routes to the defined sign-in entry point rather than exposing protected
 * content (FR-044, FR-058).
 */
import { beforeEach, describe, expect, it } from "vitest";
import { renderShell } from "../utils/shell-tree.js";
import { clearShellPreferences } from "../../src/providers/ShellPreferences.js";
describe("public-mode route guard (FR-044)", () => {
    beforeEach(() => clearShellPreferences());
    it.each([
        ["/chat"],
        ["/conversations"],
        ["/projects"],
        ["/teacher"],
        ["/files"],
        ["/search"],
        ["/settings"],
        ["/admin"],
    ])("reaching %s in public mode resolves to the sign-in entry point", (path) => {
        const { getByTestId } = renderShell({
            shellMode: "public",
            width: 1440,
            initialPath: path,
        });
        const main = getByTestId("shell-frame").querySelector('[data-region="main"]');
        expect(main.textContent).toMatch(/Sign in/);
    });
    it("exposes no module content while public (FR-058)", () => {
        const { getByTestId } = renderShell({
            shellMode: "public",
            width: 1440,
            initialPath: "/admin",
        });
        const main = getByTestId("shell-frame").querySelector('[data-region="main"]');
        expect(main.querySelector('[data-state="unavailable"]')).toBeNull();
    });
    it("lets an authenticated user reach the reserved destination", () => {
        const { getByTestId } = renderShell({
            shellMode: "authenticated",
            width: 1440,
            initialPath: "/admin",
        });
        const main = getByTestId("shell-frame").querySelector('[data-region="main"]');
        expect(main.querySelector('[data-state="unavailable"]')).not.toBeNull();
    });
    it("keeps the three-region frame intact while guarding (FR-045)", () => {
        const { getByTestId } = renderShell({
            shellMode: "public",
            width: 1440,
            initialPath: "/chat",
        });
        const frame = getByTestId("shell-frame");
        expect(frame.querySelector('[data-region="header"]')).not.toBeNull();
        expect(frame.querySelector('[data-region="main"]')).not.toBeNull();
    });
});
