/**
 * Shared Playwright helpers for the R01 shell E2E suites.
 *
 * The shell is fully functional with the api unreachable (client resilience
 * rule), so no backend is started. Shell mode is driven through the documented
 * R01 seam: `?shellMode=authenticated` (R01 implements no login — FR-046).
 */
import { expect } from "@playwright/test";
/** Clear shell preferences before any page script runs. */
export async function primeCleanPreferences(page) {
    await page.addInitScript(() => {
        try {
            if (window.localStorage.getItem("__mahak_keep_prefs") === "1")
                return;
            window.localStorage.clear();
        }
        catch {
            /* ignore */
        }
    });
}
/**
 * Reload the page without wiping saved preferences, so persistence behavior
 * can be verified across a real reload (FR-008, FR-032).
 */
export async function reloadKeepingPreferences(page) {
    await page.evaluate(() => {
        try {
            window.localStorage.setItem("__mahak_keep_prefs", "1");
        }
        catch {
            /* ignore */
        }
    });
    await page.reload();
    await expect(page.getByTestId("shell-frame")).toHaveAttribute("data-shell-ready", "true");
    await page.evaluate(() => {
        try {
            window.localStorage.removeItem("__mahak_keep_prefs");
        }
        catch {
            /* ignore */
        }
    });
}
/** Navigate to the shell and wait until the interactive frame is ready. */
export async function gotoShell(page, options = {}) {
    const { mode = "authenticated", path = "/", query = "" } = options;
    await primeCleanPreferences(page);
    const suffix = query ? `&${query}` : "";
    await page.goto(`${path}?shellMode=${mode}${suffix}`);
    await expect(page.getByTestId("shell-frame")).toBeVisible();
    await expect(page.getByTestId("shell-frame")).toHaveAttribute("data-shell-ready", "true");
}
/** Current viewport class as reported by the frame (FR-016). */
export async function viewportClass(page) {
    return (await page.getByTestId("shell-frame").getAttribute("data-viewport")) ?? "";
}
/** Assert the page does not require horizontal scrolling (FR-021). */
export async function expectNoHorizontalScroll(page, tolerance = 1) {
    const metrics = await page.evaluate(() => {
        const root = document.documentElement;
        return {
            scrollWidth: root.scrollWidth,
            bodyScrollWidth: document.body.scrollWidth,
            innerWidth: window.innerWidth,
            overflowX: getComputedStyle(root).overflowX,
        };
    });
    expect(metrics.overflowX === "clip" || metrics.overflowX === "hidden").toBe(true);
    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.innerWidth + tolerance);
    expect(metrics.bodyScrollWidth).toBeLessThanOrEqual(metrics.innerWidth + tolerance);
}
/** The bounding box of the sidebar region, or null when it is not rendered. */
export async function sidebarBox(page) {
    const sidebar = page.locator('[data-region="sidebar"]');
    if ((await sidebar.count()) === 0)
        return null;
    return sidebar.first().boundingBox();
}
/** Click a reserved destination in the primary navigation. */
export async function activateDestination(page, destinationId) {
    await page.locator(`[data-destination-id="${destinationId}"]`).first().click();
}
