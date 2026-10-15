/**
 * T061 — ThemeProvider: exactly three theme modes; `system` resolves to light
 * or dark via the device preference and follows a preference change at
 * runtime; first visit with nothing saved defaults to `system`
 * (FR-029, FR-031, FR-060).
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, render } from "@testing-library/react";
import { THEME_MODE_VALUES } from "@mahak/contracts";
import { ThemeProvider, useTheme } from "../../src/providers/ThemeProvider.js";
import { clearShellPreferences, getSavedTheme } from "../../src/providers/ShellPreferences.js";

function ThemeProbe() {
  const { themeMode, resolvedTheme } = useTheme();
  return (
    <div>
      <span data-testid="mode">{themeMode}</span>
      <span data-testid="resolved">{resolvedTheme}</span>
    </div>
  );
}

/** A controllable matchMedia stub for the device appearance preference. */
function installMatchMedia(initialMatches: boolean) {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  let matches = initialMatches;
  const query = {
    matches,
    media: "(prefers-color-scheme: dark)",
    onchange: null,
    addEventListener: (_: string, listener: (event: MediaQueryListEvent) => void) =>
      listeners.add(listener),
    removeEventListener: (_: string, listener: (event: MediaQueryListEvent) => void) =>
      listeners.delete(listener),
    dispatchEvent: () => false,
  } as unknown as MediaQueryList;

  const setPreference = (next: boolean) => {
    matches = next;
    Object.defineProperty(query, "matches", { value: next, configurable: true });
    act(() => {
      listeners.forEach((listener) =>
        // jsdom does not implement MediaQueryListEvent; a plain event shape is
        // sufficient for the provider's handler.
        listener({ matches: next, media: query.media } as MediaQueryListEvent),
      );
    });
  };

  const original = window.matchMedia;
  window.matchMedia = (media: string) =>
    media === "(prefers-color-scheme: dark)" ? query : original(media);

  return {
    setPreference,
    restore() {
      window.matchMedia = original;
    },
  };
}

describe("theme modes (FR-029)", () => {
  beforeEach(() => clearShellPreferences());

  it("supports exactly three theme modes", () => {
    expect(THEME_MODE_VALUES).toEqual(["light", "dark", "system"]);
    expect(THEME_MODE_VALUES).toHaveLength(3);
  });

  it("defaults to system on first visit with nothing saved (FR-060)", () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );
    expect(getByTestId("mode")).toHaveTextContent("system");
    expect(getSavedTheme()).toBeNull();
  });
});

describe("system mode resolution (FR-031, A-07)", () => {
  let media: ReturnType<typeof installMatchMedia>;

  beforeEach(() => {
    clearShellPreferences();
    media = installMatchMedia(false);
  });

  afterEach(() => media.restore());

  it("resolves system to the device preference", () => {
    media.setPreference(true);
    const { getByTestId } = render(
      <ThemeProvider initialMode="system">
        <ThemeProbe />
      </ThemeProvider>,
    );
    expect(getByTestId("mode")).toHaveTextContent("system");
    expect(getByTestId("resolved")).toHaveTextContent("dark");
  });

  it("falls back to light when the OS exposes no preference (A-07)", () => {
    const { getByTestId } = render(
      <ThemeProvider initialMode="system">
        <ThemeProbe />
      </ThemeProvider>,
    );
    expect(getByTestId("resolved")).toHaveTextContent("light");
  });

  it("follows a device preference change at runtime (FR-031)", () => {
    const { getByTestId } = render(
      <ThemeProvider initialMode="system">
        <ThemeProbe />
      </ThemeProvider>,
    );
    expect(getByTestId("resolved")).toHaveTextContent("light");

    media.setPreference(true);
    expect(getByTestId("resolved")).toHaveTextContent("dark");

    media.setPreference(false);
    expect(getByTestId("resolved")).toHaveTextContent("light");
  });

  it("writes the resolved theme to the root data-theme attribute (FR-030)", () => {
    render(
      <ThemeProvider initialMode="system">
        <ThemeProbe />
      </ThemeProvider>,
    );
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");

    media.setPreference(true);
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });
});

describe("explicit selections (FR-032)", () => {
  beforeEach(() => clearShellPreferences());

  it("resolves an explicit light selection without following the device", () => {
    const { getByTestId } = render(
      <ThemeProvider initialMode="light">
        <ThemeProbe />
      </ThemeProvider>,
    );
    expect(getByTestId("mode")).toHaveTextContent("light");
    expect(getByTestId("resolved")).toHaveTextContent("light");
  });

  it("resolves an explicit dark selection", () => {
    const { getByTestId } = render(
      <ThemeProvider initialMode="dark">
        <ThemeProbe />
      </ThemeProvider>,
    );
    expect(getByTestId("mode")).toHaveTextContent("dark");
    expect(getByTestId("resolved")).toHaveTextContent("dark");
  });
});
