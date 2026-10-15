/**
 * T063 — keyboard accessibility: Tab reaches every interactive shell control
 * and never lands on the inert whole-frame overlay; Escape closes the mobile
 * drawer; focus moves into the drawer on open and returns to the opener on
 * close (FR-038, FR-039).
 *
 * T064 — the skip link (SkipToMain) is the first focusable element in the tab
 * order and reveals the main region when activated (FR-005).
 *
 * T069 — shell state changes are communicated to assistive technology via the
 * polite live region exposed by AnnouncementProvider (FR-040).
 */

import { expect, test } from "@playwright/test";
import { gotoShell } from "./helpers.js";

/**
 * Wait until the announce live region contains text matching the given regex.
 * AnnouncementProvider batches the state update through a 30 ms setTimeout,
 * so a single synchronous assertion would race. This helper polls with a 500 ms
 * budget, which is well within Playwright's default expect timeout.
 */
async function expectAnnouncement(
  page: import("@playwright/test").Page,
  pattern: RegExp,
): Promise<void> {
  await expect(page.getByTestId("shell-announcer")).toHaveText(pattern, { timeout: 500 });
}

test.describe("keyboard navigation reach (FR-038)", () => {
  test("Tab order reaches the sidebar collapse control after navigation links", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoShell(page);
    await expect(page.getByTestId("shell-frame")).toHaveAttribute("data-shell-ready", "true");

    // Skip link is first.
    await page.keyboard.press("Tab");
    await expect(page.locator('a[href="#mahak-main-content"]')).toBeFocused();

    // Tab through the 8 navigation links, then one more to reach the collapse control.
    for (let i = 0; i < 9; i++) {
      await page.keyboard.press("Tab");
    }
    await expect(page.getByTestId("sidebar-collapse-control")).toBeFocused();
  });

  test("the inert loading overlay is never in the tab order", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoShell(page);
    await expect(page.getByTestId("shell-frame")).toHaveAttribute("data-shell-ready", "true");
    // The whole-frame loading element is removed from the DOM when ready.
    await expect(page.getByTestId("whole-frame-loading")).toHaveCount(0);
  });
});

test.describe("mobile drawer focus trap (FR-038, FR-039)", () => {
  test("Open focuses close button; Escape closes and returns focus to opener", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await gotoShell(page);

    await page.getByTestId("open-navigation").click();
    await expect(page.getByTestId("navigation-drawer")).toBeVisible();

    // FocusTrap moves focus to the first focusable element (close button) on open.
    await expect(page.getByTestId("close-navigation")).toBeFocused();

    // Escape closes the drawer.
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("navigation-drawer")).toBeHidden();

    // Focus returns to the opener.
    await expect(page.getByTestId("open-navigation")).toBeFocused();
  });

  test("Shift+Tab from the first focusable element wraps to the last", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await gotoShell(page);

    await page.getByTestId("open-navigation").click();
    await expect(page.getByTestId("navigation-drawer")).toBeVisible();

    // Close button is the first focusable element (already focused on open).
    await expect(page.getByTestId("close-navigation")).toBeFocused();

    // Shift+Tab wraps to the last focusable element in the drawer.
    await page.keyboard.press("Shift+Tab");
    const links = page.locator('[data-destination-id]');
    expect(await links.count()).toBe(8);
    const lastLink = links.last();
    await expect(lastLink).toBeFocused();
  });
});

test.describe("skip to main (FR-005)", () => {
  test("skip link is the first focusable element and reveals main on activation", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoShell(page);

    // The skip link is the very first focusable element.
    await page.keyboard.press("Tab");
    await expect(page.locator('a[href="#mahak-main-content"]')).toBeFocused();

    // Activating the skip link focuses the main region.
    await page.keyboard.press("Enter");
    await expect(page.locator('[data-region="main"]')).toBeFocused();
  });
});

test.describe("assistive-technology announcements (FR-040)", () => {
  test("collapsing the sidebar is announced to assistive technology", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoShell(page);

    // Sidebar starts expanded at desktop; collapse it.
    await page.getByTestId("sidebar-collapse-control").click();
    await expect(page.getByTestId("sidebar-collapse-control")).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    await expectAnnouncement(page, /Collapse navigation/);
  });

  test("expanding the sidebar is announced to assistive technology", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoShell(page);

    // Collapse then expand to verify both directions are announced.
    await page.getByTestId("sidebar-collapse-control").click();
    await expect(page.getByTestId("sidebar-collapse-control")).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    await page.getByTestId("sidebar-collapse-control").click();
    await expect(page.getByTestId("sidebar-collapse-control")).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    await expectAnnouncement(page, /Expand navigation/);
  });

  test("opening the mobile drawer is announced to assistive technology", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await gotoShell(page);

    await page.getByTestId("open-navigation").click();
    await expect(page.getByTestId("navigation-drawer")).toBeVisible();
    await expectAnnouncement(page, /Open navigation menu/);
  });

  test("closing the mobile drawer is announced to assistive technology", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await gotoShell(page);

    await page.getByTestId("open-navigation").click();
    await expect(page.getByTestId("navigation-drawer")).toBeVisible();

    await page.getByTestId("close-navigation").click();
    await expect(page.getByTestId("navigation-drawer")).toBeHidden();
    await expectAnnouncement(page, /Close navigation menu/);
  });

  test("changing the theme is announced to assistive technology", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoShell(page);

    // Select Dark theme via evaluate so the selector is locale-independent.
    await page.evaluate(() => {
      const controls = document.querySelector(".shell-theme-controls");
      const buttons = controls?.querySelectorAll("button");
      buttons?.[1]?.click();
    });

    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expectAnnouncement(page, /Theme: Dark/);
  });
});
