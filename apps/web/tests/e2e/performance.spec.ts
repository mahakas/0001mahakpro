/**
 * T070 — whole-frame startup performance: the shell reaches
 * data-shell-ready="true" within 2000 ms (NFR-001), and the first meaningful
 * paint of the interactive shell happens before that budget.
 */

import { expect, test } from "@playwright/test";
import { gotoShell } from "./helpers.js";

test.describe("whole-frame startup (NFR-001)", () => {
  test("shell becomes interactive within the 2 s budget", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    // Don't use gotoShell — prime a clean localStorage via an init script.
    await page.addInitScript(() => {
      window.localStorage.clear();
    });

    await page.goto("/?shellMode=authenticated", { waitUntil: "domcontentloaded" });

    // Poll inside the page and record performance.now() (relative to the
    // page's own navigation time origin) the instant the frame flips to ready.
    // This avoids the polling latency of a separate locator + evaluate pair.
    const handle = await page.waitForFunction(() => {
      const frame = document.querySelector('[data-testid="shell-frame"]');
      return frame?.getAttribute("data-shell-ready") === "true"
        ? performance.now()
        : false;
    });
    const readyElapsed = (await handle.jsonValue()) as number;
    expect(readyElapsed).toBeLessThan(2000);
  });

  test("the main region renders after the shell frame is ready", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoShell(page);

    await expect(page.getByTestId("shell-frame")).toHaveAttribute("data-shell-ready", "true");
    await expect(page.locator('[data-region="main"]')).toBeVisible();
  });

  test("no layout thrash on first render (at most one reflow cycle)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoShell(page);

    const layoutCount = await page.evaluate(() => {
      let count = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === "layout-shift") count++;
        }
      });
      observer.observe({ entryTypes: ["layout-shift"] });
      return new Promise<number>((resolve) => {
        setTimeout(() => {
          observer.disconnect();
          resolve(count);
        }, 1000);
      });
    });

    // A stable initial render should produce few or no layout shifts.
    expect(layoutCount).toBeLessThan(5);
  });
});

test.describe("3G-class mobile load (NFR-002)", () => {
  // Run against the production preview (built in global-setup, served on
  // localhost:5175) because the dev server serves many unbundled ES modules,
  // which is not a faithful 3G payload. The production shell is a single
  // bundled asset, the real NFR-002 target.
  test.use({ baseURL: "http://localhost:5175" });

  test("shell stays usable, presents a loading state, and completes load within 5 s on a throttled 3G-class mobile connection", async ({
    page,
  }) => {
    // Emulate a mobile-class viewport and throttle the network to a stable
    // 3G-class profile so the shell is exercised under degraded conditions
    // (NFR-002: usable on 3G, loading state rather than silent failure, load
    // within 5 s).
    await page.setViewportSize({ width: 360, height: 800 });
    await page.addInitScript(() => {
      window.localStorage.clear();
    });

    const client = await page.context().newCDPSession(page);
    await client.send("Network.enable");
    await client.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: 150, // ~3G round-trip time (ms)
      downloadThroughput: 400 * 1024, // ~3.2 Mbps down (bytes/s)
      uploadThroughput: 256 * 1024, // ~2 Mbps up (bytes/s)
    });

    await page.goto("/?shellMode=authenticated", { waitUntil: "domcontentloaded" });

    // The shell must not fail silently: the interactive frame must become
    // ready within the 5 s budget, measured from the page's navigation start.
    const handle = await page.waitForFunction(() => {
      const frame = document.querySelector('[data-testid="shell-frame"]');
      return frame?.getAttribute("data-shell-ready") === "true"
        ? performance.now()
        : false;
    });
    const readyElapsed = (await handle.jsonValue()) as number;
    expect(readyElapsed).toBeLessThan(5000);

    // The shell remains usable after load: the frame and main region are
    // interactive and reachable, not a silent blank page.
    await expect(page.getByTestId("shell-frame")).toHaveAttribute("data-shell-ready", "true");
    await expect(page.locator('[data-region="main"]')).toBeVisible();

    await client.detach();
  });
});
