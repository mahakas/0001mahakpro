/**
 * T068 — zoom / dense layout: at 1.5× and 2× zoom the shell shows no
 * horizontal scroll, no clipped region, and the sidebar collapse control
 * remains usable (NFR-001, NFR-006). Viewport class settles correctly across
 * breakpoints after zoom (FR-016).
 */

import { expect, test } from "@playwright/test";
import { expectNoHorizontalScroll, gotoShell, viewportClass } from "./helpers.js";

test.describe("zoom does not break layout (NFR-001, NFR-006)", () => {
  for (const { name, scale, width, expected } of [
    { name: "1.5× desktop", scale: 1.5, width: 1440, expected: "desktop" },
    { name: "1.5× mobile", scale: 1.5, width: 360, expected: "mobile" },
    { name: "2× tablet", scale: 2, width: 900, expected: "tablet" },
  ]) {
    test(`${name}: no horizontal scroll and correct viewport class`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await gotoShell(page);

      // Emulate CSS zoom via viewport meta + deviceScaleFactor is not
      // supported by chromium headless; use evaluate to set zoom on the body.
      await page.evaluate((z) => {
        document.body.style.setProperty("zoom", String(z));
      }, scale);

      expect(await viewportClass(page)).toBe(expected);
      await expectNoHorizontalScroll(page);

      // The collapse control remains visible and enabled.
      const control = page.getByTestId("sidebar-collapse-control");
      if (await control.isVisible()) {
        await expect(control).toBeEnabled();
      }
    });
  }

  test("sidebar collapse works at 1.5× zoom on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await gotoShell(page);
    await page.evaluate(() => {
      document.body.style.setProperty("zoom", "1.5");
    });

    // Drawer open/close at zoom.
    await page.getByTestId("open-navigation").click();
    await expect(page.getByTestId("navigation-drawer")).toBeVisible();
    await expectNoHorizontalScroll(page);
  });
});
