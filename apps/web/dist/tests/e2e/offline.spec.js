/**
 * T069 — offline resilience: the shell frame stays intact, the offline
 * indicator appears, and reserved destinations present the unavailable state
 * (FR-051). No crash or blank screen (NFR-008).
 */
import { expect, test } from "@playwright/test";
import { gotoShell } from "./helpers.js";
test.describe("offline resilience (FR-051, NFR-008)", () => {
    test("the offline indicator appears when the browser reports offline", async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await gotoShell(page);
        await page.evaluate(() => {
            Object.defineProperty(window.navigator, "onLine", { value: false, configurable: true });
            window.dispatchEvent(new Event("offline"));
        });
        await expect(page.getByTestId("shell-frame")).toHaveAttribute("data-shell-ready", "true");
        await expect(page.locator('[data-state="offline"]')).toBeVisible();
    });
    test("reserved destinations present the unavailable state while offline", async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await gotoShell(page);
        // Simulate offline.
        await page.evaluate(() => {
            Object.defineProperty(window.navigator, "onLine", { value: false, configurable: true });
            window.dispatchEvent(new Event("offline"));
        });
        // Navigate to a reserved destination — it should show the unavailable
        // state, not an error or crash.
        await page.locator('[data-destination-id="dest.general-chat"]').first().click();
        await expect(page.locator('[data-state="unavailable"]')).toBeVisible();
    });
    test("the shell does not crash when offline and a destination is activated", async ({ page, }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await gotoShell(page);
        await page.evaluate(() => {
            Object.defineProperty(window.navigator, "onLine", { value: false, configurable: true });
            window.dispatchEvent(new Event("offline"));
        });
        const consoleErrors = [];
        page.on("console", (msg) => {
            if (msg.type() === "error")
                consoleErrors.push(msg.text());
        });
        await page.locator('[data-destination-id="dest.projects"]').first().click();
        await page.waitForTimeout(500);
        const shellStillIntact = await page.getByTestId("shell-frame").isVisible();
        expect(shellStillIntact).toBe(true);
        expect(consoleErrors).toHaveLength(0);
    });
    test("going back online clears the offline indicator", async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await gotoShell(page);
        await page.evaluate(() => {
            Object.defineProperty(window.navigator, "onLine", { value: false, configurable: true });
            window.dispatchEvent(new Event("offline"));
        });
        await expect(page.locator('[data-state="offline"]')).toBeVisible();
        await page.evaluate(() => {
            Object.defineProperty(window.navigator, "onLine", { value: true, configurable: true });
            window.dispatchEvent(new Event("online"));
        });
        await expect(page.locator('[data-state="offline"]')).toBeHidden();
    });
});
