/**
 * T071 — browser-support smoke: the shell is structurally sound on all
 * browser targets configured in playwright.config.ts (NFR-004). This spec
 * runs only for the cross-browser projects and verifies the shell renders
 * the frame, header, and main region without errors.
 */

import { expect, test } from "@playwright/test";
import { gotoShell } from "./helpers.js";

test.describe("browser-support smoke (NFR-004)", () => {
  test("shell renders the frame on any browser target", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoShell(page);

    await expect(page.getByTestId("shell-frame")).toBeVisible();
    await expect(page.getByTestId("shell-frame")).toHaveAttribute("data-shell-ready", "true");
    await expect(page.locator('[data-region="header"]')).toBeVisible();
    await expect(page.locator('[data-region="main"]')).toBeVisible();
  });

  test("sidebar navigation renders with destination links", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoShell(page);

    await expect(page.locator('[data-destination-id]')).toHaveCount(8);
  });

  test("theme and locale controls render", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoShell(page);

    await expect(page.locator(".shell-theme-controls")).toBeVisible();
    await expect(page.locator(".shell-locale-controls")).toBeVisible();
  });

  test("no JavaScript errors on load", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoShell(page);

    await expect(page.getByTestId("shell-frame")).toHaveAttribute("data-shell-ready", "true");
    expect(errors).toHaveLength(0);
  });
});
