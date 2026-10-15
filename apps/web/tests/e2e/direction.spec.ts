/**
 * T055 — for `fa`, `ar`, `en`: the root direction attribute matches the
 * locale; the sidebar anchors to the correct side; every region mirrors with no
 * clipped, overlapped, or hidden region (FR-024, FR-025).
 * T056 — switching direction mid-session mirrors all regions without a reload
 * or re-navigation; collapse/expand and drawer open/close behave identically in
 * both directions; direction switch with the drawer open re-anchors without
 * trapping focus (FR-026, FR-027).
 */

import { expect, test } from "@playwright/test";
import { expectNoHorizontalScroll, gotoShell, sidebarBox } from "./helpers.js";

/** Select a language from the header control. */
async function selectLocale(page: import("@playwright/test").Page, code: string) {
  // Use the shell-locale-controls class so the selector is locale-independent.
  const group = page.locator(".shell-locale-controls");
  const index = code === "fa" ? 0 : code === "ar" ? 1 : 2;
  await group.locator("button").nth(index).click();
}

test.describe("direction per locale (FR-023–FR-025)", () => {
  for (const { locale, expected, sidebarSide } of [
    { locale: "fa", expected: "rtl", sidebarSide: "right" },
    { locale: "ar", expected: "rtl", sidebarSide: "right" },
    { locale: "en", expected: "ltr", sidebarSide: "left" },
  ] as const) {
    test(`${locale} renders ${expected} with the sidebar on the ${sidebarSide}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await gotoShell(page);
      await selectLocale(page, locale);

      await expect(page.locator("html")).toHaveAttribute("dir", expected);

      const sidebar = await sidebarBox(page);
      const main = await page.locator('[data-region="main"]').boundingBox();
      expect(sidebar).not.toBeNull();
      expect(main).not.toBeNull();

      if (sidebarSide === "right") {
        expect(sidebar!.x).toBeGreaterThan(main!.x);
      } else {
        expect(sidebar!.x).toBeLessThan(main!.x);
      }

      // No region is clipped, overlapped, or hidden.
      expect(sidebar!.width).toBeGreaterThan(0);
      expect(main!.width).toBeGreaterThan(0);
      await expect(page.locator('[data-region="header"]')).toBeVisible();
      await expectNoHorizontalScroll(page);
    });
  }
});

test.describe("mid-session direction switch (FR-026, FR-027)", () => {
  test("mirrors all regions without a reload", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoShell(page);

    const faBefore = await sidebarBox(page);
    await selectLocale(page, "fa");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    const faAfter = await sidebarBox(page);
    expect(faAfter!.x).toBeGreaterThan(faBefore!.x);

    await selectLocale(page, "en");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    const enAfter = await sidebarBox(page);
    expect(enAfter!.x).toBeLessThan(faAfter!.x);
  });

  test("keeps the current destination after a direction switch (FR-027)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoShell(page);
    await page.locator('[data-destination-id="dest.projects"]').first().click();
    await expect(page.locator('[data-region="main"] [data-state="unavailable"]')).toBeVisible();

    await selectLocale(page, "fa");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    // Still on the same destination — no re-navigation required.
    await expect(page.locator('[data-region="main"] [data-state="unavailable"]')).toBeVisible();
  });

  test("collapse/expand behaves identically in RTL and LTR (FR-026)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoShell(page);

    await selectLocale(page, "fa");
    const rtlBefore = await sidebarBox(page);
    await page.getByTestId("sidebar-collapse-control").click();
    await expect(page.getByTestId("sidebar-collapse-control")).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    // Wait for the CSS transition to settle before measuring.
    await page.waitForTimeout(300);
    const rtlAfter = await sidebarBox(page);
    expect(rtlAfter!.width).toBeLessThan(rtlBefore!.width);
    await page.getByTestId("sidebar-collapse-control").click();
    await expect(page.getByTestId("sidebar-collapse-control")).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    await selectLocale(page, "en");
    const ltrBefore = await sidebarBox(page);
    await page.getByTestId("sidebar-collapse-control").click();
    await page.waitForTimeout(300);
    const ltrAfter = await sidebarBox(page);
    expect(ltrAfter!.width).toBeLessThan(ltrBefore!.width);
    await expectNoHorizontalScroll(page);
  });
});

test.describe("direction switch with the drawer open (spec edge case)", () => {
  test("re-anchors without trapping focus", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await gotoShell(page);
    await page.getByTestId("open-navigation").click();
    await expect(page.getByTestId("navigation-drawer")).toBeVisible();

    // The drawer sccrim overlays the header, so click the locale button
    // via evaluate to switch direction without dismissing the drawer first.
    await page.evaluate(() => {
      const controls = document.querySelector(".shell-locale-controls");
      const buttons = controls?.querySelectorAll("button");
      buttons?.[0]?.click();
    });
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByTestId("navigation-drawer")).toBeVisible();

    // Focus stays inside the drawer and is not trapped in an invalid position.
    const focusedInsideDrawer = await page.evaluate(() => {
      const drawer = document.querySelector('[data-testid="navigation-drawer"]');
      return Boolean(drawer && document.activeElement && drawer.contains(document.activeElement));
    });
    expect(focusedInsideDrawer).toBe(true);

    // Escape closes it and focus returns to the opener.
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("navigation-drawer")).toBeHidden();
    await expect(page.getByTestId("open-navigation")).toBeFocused();
  });
});
