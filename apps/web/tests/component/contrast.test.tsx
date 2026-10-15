/**
 * T063 — automated contrast test: all shell text meets >= 4.5:1 against its
 * background in both Light and Dark resolved themes (FR-041, SC-008).
 *
 * jest-axe cannot resolve CSS custom properties in jsdom, so the ratios are
 * computed with real WCAG math from the palette that mirrors the runtime
 * tokens, and a drift check asserts every palette value is actually present in
 * tokens.css so the two cannot diverge.
 */

import { beforeEach, describe, expect, it } from "vitest";
import { PALETTES, CONTRAST_THRESHOLD, contrastRatio } from "../../src/themes/palette.js";
import tokensCss from "../../src/themes/tokens.css?raw";

describe("theme palette mirrors the runtime tokens (no drift)", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("data-theme");
  });

  it("contains every light-palette color in tokens.css", () => {
    const values = new Set(
      [PALETTES.light.background, PALETTES.light.backgroundElevated, ...PALETTES.light.pairs.flatMap((pair) => [pair.foreground, pair.background])],
    );
    for (const value of values) {
      expect(tokensCss, `tokens.css must declare ${value}`).toContain(value);
    }
  });

  it("contains every dark-palette color in tokens.css", () => {
    const values = new Set(
      [PALETTES.dark.background, PALETTES.dark.backgroundElevated, ...PALETTES.dark.pairs.flatMap((pair) => [pair.foreground, pair.background])],
    );
    for (const value of values) {
      expect(tokensCss, `tokens.css must declare ${value}`).toContain(value);
    }
  });
});

describe("contrast ratios (FR-041, SC-008)", () => {
  it("meets the 4.5:1 threshold for normal text in the light theme", () => {
    for (const pair of PALETTES.light.pairs) {
      const ratio = contrastRatio(pair.foreground, pair.background);
      expect(ratio, `light/${pair.name}: ${ratio}:1`).toBeGreaterThanOrEqual(
        CONTRAST_THRESHOLD,
      );
    }
  });

  it("meets the 4.5:1 threshold for normal text in the dark theme", () => {
    for (const pair of PALETTES.dark.pairs) {
      const ratio = contrastRatio(pair.foreground, pair.background);
      expect(ratio, `dark/${pair.name}: ${ratio}:1`).toBeGreaterThanOrEqual(
        CONTRAST_THRESHOLD,
      );
    }
  });

  it("computes the canonical white-on-black ratio", () => {
    expect(contrastRatio("#ffffff", "#000000")).toBeCloseTo(21, 0);
  });
});
