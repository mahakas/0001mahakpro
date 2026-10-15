/**
 * T062 — Light and Dark apply to every region including the drawer with no
 * unthemed region; the selection persists across a reload; no theme disables a
 * navigation or shell control (FR-030, FR-032, FR-033).
 */

import { expect, test, type Page } from "@playwright/test";
import { gotoShell, reloadKeepingPreferences } from "./helpers.js";

async function selectTheme(page: Page, name: "Light" | "Dark" | "System") {
  // Click via evaluate so the selector is locale-independent (the aria-label is
  // translated in fa/ar) and works even when the header control is outside the
  // viewport at mobile widths.
  const index = name === "Light" ? 0 : name === "Dark" ? 1 : 2;
  await page.evaluate((i) => {
    const controls = document.querySelector(".shell-theme-controls");
    const buttons = controls?.querySelectorAll("button");
    buttons?.[i]?.click();
  }, index);
}

test.describe("theme application (FR-030)", () => {
  test("Light applies to every region including the drawer", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await gotoShell(page);
    await selectTheme(page, "Light");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

    await page.getByTestId("open-navigation").click();
    await expect(page.getByTestId("navigation-drawer")).toBeVisible();

    const backgrounds = await page.evaluate(() => {
      const read = (selector: string) => {
        const el = document.querySelector(selector);
        return el ? getComputedStyle(el).backgroundColor : null;
      };
      return {
        main: read('[data-region="main"]'),
        header: read('[data-region="header"]'),
        drawer: read('[data-testid="navigation-drawer"]'),
      };
    });
    // Every region resolves a themed background (none is transparent/unthemed).
    for (const value of Object.values(backgrounds)) {
      expect(value).not.toBeNull();
      expect(value).not.toBe("rgba(0, 0, 0, 0)");
    }
  });

  test("Dark applies consistently with no glaringly bright region", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoShell(page);
    await selectTheme(page, "Dark");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

    const darkish = await page.evaluate(() => {
      const root = document.querySelector(".shell-frame");
      const header = document.querySelector('[data-region="header"]');
      const parse = (rgb: string) => {
        const match = rgb.match(/\d+/g) ?? ["0", "0", "0"];
        return match.slice(0, 3).map(Number);
      };
      const contrastish = (el: Element | null) => {
        const [r, g, b] = parse(getComputedStyle(el as Element).backgroundColor);
        return r + g + b;
      };
      return { root: contrastish(root), header: contrastish(header) };
    });
    // Sum of RGB channels stays low in dark mode: no bright region.
    expect(darkish.root).toBeLessThan(120);
    expect(darkish.header).toBeLessThan(200);
  });
});

test.describe("theme persistence (FR-032)", () => {
  test("preserves the Dark selection across a reload", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoShell(page);
    await selectTheme(page, "Dark");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

    await reloadKeepingPreferences(page);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.locator(".shell-theme-controls button").nth(1)).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  test("preserves the Light selection across a reload", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoShell(page);
    await selectTheme(page, "Light");
    await reloadKeepingPreferences(page);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  });
});

test.describe("System theme (FR-031)", () => {
  test("follows the device preference and a runtime change", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ colorScheme: "dark" });
    await gotoShell(page);
    await selectTheme(page, "System");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

    await page.emulateMedia({ colorScheme: "light" });
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  });
});

test.describe("no theme disables a control (FR-033)", () => {
  for (const theme of ["Light", "Dark", "System"] as const) {
    test(`${theme} keeps navigation and shell controls enabled`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await gotoShell(page);
      await selectTheme(page, theme);

      await expect(page.getByTestId("sidebar-collapse-control")).toBeEnabled();
      const links = page.locator('[data-destination-id]');
      expect(await links.count()).toBe(8);
      for (let index = 0; index < (await links.count()); index += 1) {
        await expect(links.nth(index)).toBeEnabled();
      }
    });
  }
});
