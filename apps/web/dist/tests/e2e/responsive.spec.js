/**
 * T045 — responsive validation over widths 360, 480, 768, 900, 1024, 1440,
 * 1920: desktop keeps an open sidebar, tablet offers the compact form, mobile
 * shows no permanent sidebar and opens the drawer via a persistent control; no
 * viewport class requires horizontal scrolling (FR-017, FR-018, FR-019,
 * FR-021).
 * T046 — crossing a breakpoint settles into the new class's navigation mode
 * with no residual overlay, scrim, or duplicated navigation; opening the
 * mobile drawer then resizing to desktop dismisses it cleanly (FR-022).
 */
import { expect, test } from "@playwright/test";
import { activateDestination, expectNoHorizontalScroll, gotoShell, sidebarBox, viewportClass, } from "./helpers.js";
const CLASSES = [
    { width: 360, expected: "mobile" },
    { width: 480, expected: "mobile" },
    { width: 768, expected: "tablet" },
    { width: 900, expected: "tablet" },
    { width: 1024, expected: "desktop" },
    { width: 1440, expected: "desktop" },
    { width: 1920, expected: "desktop" },
];
test.describe("responsive navigation presentation (FR-016–FR-021)", () => {
    for (const { width, expected } of CLASSES) {
        test(`resolves ${width}px to the ${expected} class with the correct navigation`, async ({ page, }) => {
            await page.setViewportSize({ width, height: 900 });
            await gotoShell(page);
            expect(await viewportClass(page)).toBe(expected);
            if (expected === "mobile") {
                // No permanent sidebar; a persistent control opens the overlay.
                expect(await sidebarBox(page)).toBeNull();
                await expect(page.getByTestId("open-navigation")).toBeVisible();
                await page.getByTestId("open-navigation").click();
                await expect(page.getByTestId("navigation-drawer")).toBeVisible();
            }
            else if (expected === "tablet") {
                // Compact form by default.
                const box = await sidebarBox(page);
                expect(box).not.toBeNull();
                expect(box.width).toBeLessThan(120);
                await expect(page.getByTestId("sidebar-collapse-control")).toBeVisible();
            }
            else {
                // Open sidebar by default.
                const box = await sidebarBox(page);
                expect(box).not.toBeNull();
                expect(box.width).toBeGreaterThan(180);
            }
            await expectNoHorizontalScroll(page);
        });
    }
});
test.describe("tablet compact form is expandable (FR-018)", () => {
    test("expands from compact to full width in the tablet class", async ({ page }) => {
        await page.setViewportSize({ width: 900, height: 900 });
        await gotoShell(page);
        const before = await sidebarBox(page);
        expect(before).not.toBeNull();
        await page.getByTestId("sidebar-collapse-control").click();
        await expect(page.getByTestId("sidebar-collapse-control")).toHaveAttribute("aria-expanded", "true");
        const after = await sidebarBox(page);
        expect(after).not.toBeNull();
        expect(after.width).toBeGreaterThan(before.width);
        await expectNoHorizontalScroll(page);
    });
});
test.describe("desktop sidebar capability (FR-017)", () => {
    test("can remain open beside the main content area", async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await gotoShell(page);
        const sidebar = await sidebarBox(page);
        const main = await page.locator('[data-region="main"]').boundingBox();
        expect(sidebar).not.toBeNull();
        expect(main).not.toBeNull();
        // Both are visible side by side without overlap.
        expect(sidebar.width).toBeGreaterThan(180);
        expect(main.width).toBeGreaterThan(400);
    });
});
test.describe("mobile drawer dismissal (FR-020)", () => {
    test("closes via the close affordance", async ({ page }) => {
        await page.setViewportSize({ width: 360, height: 800 });
        await gotoShell(page);
        await page.getByTestId("open-navigation").click();
        await expect(page.getByTestId("navigation-drawer")).toBeVisible();
        await page.getByTestId("close-navigation").click();
        await expect(page.getByTestId("navigation-drawer")).toBeHidden();
    });
    test("closes via the scrim/backdrop", async ({ page }) => {
        await page.setViewportSize({ width: 360, height: 800 });
        await gotoShell(page);
        await page.getByTestId("open-navigation").click();
        await expect(page.getByTestId("navigation-drawer")).toBeVisible();
        await page.getByTestId("navigation-scrim").click({ position: { x: 350, y: 400 } });
        await expect(page.getByTestId("navigation-drawer")).toBeHidden();
    });
    test("closes on destination selection and updates the main region", async ({ page }) => {
        await page.setViewportSize({ width: 360, height: 800 });
        await gotoShell(page);
        await page.getByTestId("open-navigation").click();
        await activateDestination(page, "dest.general-chat");
        await expect(page.getByTestId("navigation-drawer")).toBeHidden();
        await expect(page.locator('[data-region="main"] [data-state="unavailable"]')).toBeVisible();
    });
});
test.describe("breakpoint crossing settles cleanly (FR-022)", () => {
    test("mobile → tablet leaves no residual overlay, scrim, or duplicate navigation", async ({ page, }) => {
        await page.setViewportSize({ width: 360, height: 800 });
        await gotoShell(page);
        await page.getByTestId("open-navigation").click();
        await expect(page.getByTestId("navigation-drawer")).toBeVisible();
        await page.setViewportSize({ width: 900, height: 800 });
        await expect(page.getByTestId("navigation-drawer")).toBeHidden();
        await expect(page.getByTestId("navigation-scrim")).toBeHidden();
        expect(await viewportClass(page)).toBe("tablet");
        // Exactly one navigation landmark, one sidebar region, one drawer control gone.
        await expect(page.locator("nav")).toHaveCount(1);
        await expect(page.locator('[data-region="sidebar"]')).toHaveCount(1);
        await expect(page.getByTestId("open-navigation")).toHaveCount(0);
    });
    test("tablet → mobile switches to the drawer with no permanent sidebar", async ({ page }) => {
        await page.setViewportSize({ width: 900, height: 800 });
        await gotoShell(page);
        await expect(page.locator('[data-region="sidebar"]')).toHaveCount(1);
        await page.setViewportSize({ width: 480, height: 800 });
        await expect(page.locator('[data-testid="shell-frame"]')).toHaveAttribute("data-viewport", "mobile");
        expect(await viewportClass(page)).toBe("mobile");
        await expect(page.locator('[data-region="sidebar"]')).toHaveCount(0);
        await expect(page.getByTestId("open-navigation")).toBeVisible();
        await expectNoHorizontalScroll(page);
    });
    test("desktop → tablet resolves the sidebar to compact (FR-063)", async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await gotoShell(page);
        expect((await sidebarBox(page)).width).toBeGreaterThan(180);
        await page.setViewportSize({ width: 800, height: 900 });
        await expect(page.locator('[data-testid="shell-frame"]')).toHaveAttribute("data-viewport", "tablet");
        expect(await viewportClass(page)).toBe("tablet");
        // Wait for the resize effect + collapse state to settle.
        await page.waitForFunction(() => document.querySelector('[data-testid="sidebar-collapse-control"]')?.getAttribute("aria-expanded") ===
            "false", { timeout: 5000 });
        await expect(page.getByTestId("sidebar-collapse-control")).toHaveAttribute("aria-expanded", "false");
    });
});
test.describe("reloading a saved state into another class (FR-063)", () => {
    test("an expanded state reloaded into tablet resolves to compact", async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await gotoShell(page);
        // Desktop starts expanded; persist that choice explicitly via the control.
        await page.getByTestId("sidebar-collapse-control").click(); // collapse
        await page.getByTestId("sidebar-collapse-control").click(); // expand → saved "expanded"
        await page.setViewportSize({ width: 900, height: 900 });
        await page.reload();
        await expect(page.getByTestId("shell-frame")).toHaveAttribute("data-shell-ready", "true");
        expect(await viewportClass(page)).toBe("tablet");
        await expect(page.getByTestId("sidebar-collapse-control")).toHaveAttribute("aria-expanded", "false");
    });
    test("a collapsed state reloaded into mobile resolves to the drawer", async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await gotoShell(page);
        await page.getByTestId("sidebar-collapse-control").click(); // collapse → saved "collapsed"
        await page.setViewportSize({ width: 360, height: 800 });
        await page.reload();
        await expect(page.getByTestId("shell-frame")).toHaveAttribute("data-shell-ready", "true");
        expect(await viewportClass(page)).toBe("mobile");
        await expect(page.locator('[data-region="sidebar"]')).toHaveCount(0);
        await expect(page.getByTestId("open-navigation")).toBeVisible();
    });
    test("a first visit in desktop expands and in tablet collapses (FR-062)", async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await gotoShell(page);
        await expect(page.getByTestId("sidebar-collapse-control")).toHaveAttribute("aria-expanded", "true");
        await page.setViewportSize({ width: 900, height: 900 });
        await gotoShell(page); // clears preferences — a fresh first visit
        await expect(page.getByTestId("sidebar-collapse-control")).toHaveAttribute("aria-expanded", "false");
    });
});
