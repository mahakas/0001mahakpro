/**
 * T027 — a saved sidebar value is restored on startup without extra action
 * (FR-008).
 * T047 — first-visit defaults and class precedence (FR-062, FR-063).
 * T061-support — first-visit theme/direction defaults (FR-060, FR-061).
 */

import { beforeEach, describe, expect, it } from "vitest";
import {
  clearShellPreferences,
  getSavedDirection,
  getSavedLocale,
  getSavedSidebarState,
  getSavedTheme,
  isFirstVisit,
  setSavedDirection,
  setSavedLocale,
  setSavedSidebarState,
  setSavedTheme,
  SHELL_PREFERENCE_KEYS,
} from "../../src/providers/ShellPreferences.js";
import { resolveSidebarCollapsed } from "../../src/shell/navigation/useSidebarPresentation.js";

describe("shell preference keys (data-model.md, verbatim)", () => {
  beforeEach(() => clearShellPreferences());

  it("uses the exact namespaced keys", () => {
    expect(SHELL_PREFERENCE_KEYS.theme).toBe("mahak.shell.theme");
    expect(SHELL_PREFERENCE_KEYS.direction).toBe("mahak.shell.direction");
    expect(SHELL_PREFERENCE_KEYS.sidebar).toBe("mahak.shell.sidebar");
    expect(SHELL_PREFERENCE_KEYS.locale).toBe("mahak.shell.locale");
  });
});

describe("sidebar persistence (FR-008)", () => {
  beforeEach(() => clearShellPreferences());

  it("restores a saved collapsed value with no additional user action", () => {
    setSavedSidebarState("collapsed");
    expect(getSavedSidebarState()).toBe("collapsed");
  });

  it("restores a saved expanded value", () => {
    setSavedSidebarState("expanded");
    expect(getSavedSidebarState()).toBe("expanded");
  });

  it("reports no saved value on first visit", () => {
    expect(getSavedSidebarState()).toBeNull();
  });
});

describe("first-visit sidebar defaults (FR-062)", () => {
  beforeEach(() => clearShellPreferences());

  it("expands on desktop and collapses on tablet; mobile uses the drawer", () => {
    expect(resolveSidebarCollapsed("desktop", null)).toBe(false);
    expect(resolveSidebarCollapsed("tablet", null)).toBe(true);
    expect(resolveSidebarCollapsed("mobile", null)).toBeNull();
  });
});

describe("class precedence over a saved sidebar state (FR-063)", () => {
  beforeEach(() => clearShellPreferences());

  it("resolves a saved expanded state to compact in the tablet class", () => {
    setSavedSidebarState("expanded");
    const saved = getSavedSidebarState();
    expect(resolveSidebarCollapsed("tablet", saved)).toBe(true);
  });

  it("resolves a saved expanded state to the drawer pattern in the mobile class", () => {
    setSavedSidebarState("expanded");
    const saved = getSavedSidebarState();
    expect(resolveSidebarCollapsed("mobile", saved)).toBeNull();
  });

  it("honors a saved collapsed state on desktop", () => {
    setSavedSidebarState("collapsed");
    const saved = getSavedSidebarState();
    expect(resolveSidebarCollapsed("desktop", saved)).toBe(true);
  });

  it("never applies a permanent sidebar state in the mobile class", () => {
    setSavedSidebarState("expanded");
    // Mobile always uses the overlay drawer, so no permanent sidebar state is
    // returned regardless of what was saved (FR-019, FR-063).
    expect(resolveSidebarCollapsed("mobile", getSavedSidebarState())).toBeNull();
  });
});

describe("first-visit theme and direction defaults (FR-060, FR-061)", () => {
  beforeEach(() => clearShellPreferences());

  it("reports a first visit when nothing shell-namespaced is saved", () => {
    expect(isFirstVisit()).toBe(true);
    setSavedTheme("dark");
    expect(isFirstVisit()).toBe(false);
  });

  it("defaults the theme to system when nothing is saved", () => {
    expect(getSavedTheme()).toBeNull();
  });

  it("persists the selected theme (FR-032)", () => {
    setSavedTheme("dark");
    expect(getSavedTheme()).toBe("dark");
  });

  it("persists an explicit direction and locale", () => {
    setSavedDirection("ltr");
    setSavedLocale("en");
    expect(getSavedDirection()).toBe("ltr");
    expect(getSavedLocale()).toBe("en");
  });
});
