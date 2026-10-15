import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
    return (_jsxs("div", { children: [_jsx("span", { "data-testid": "mode", children: themeMode }), _jsx("span", { "data-testid": "resolved", children: resolvedTheme })] }));
}
/** A controllable matchMedia stub for the device appearance preference. */
function installMatchMedia(initialMatches) {
    const listeners = new Set();
    let matches = initialMatches;
    const query = {
        matches,
        media: "(prefers-color-scheme: dark)",
        onchange: null,
        addEventListener: (_, listener) => listeners.add(listener),
        removeEventListener: (_, listener) => listeners.delete(listener),
        dispatchEvent: () => false,
    };
    const setPreference = (next) => {
        matches = next;
        Object.defineProperty(query, "matches", { value: next, configurable: true });
        act(() => {
            listeners.forEach((listener) => 
            // jsdom does not implement MediaQueryListEvent; a plain event shape is
            // sufficient for the provider's handler.
            listener({ matches: next, media: query.media }));
        });
    };
    const original = window.matchMedia;
    window.matchMedia = (media) => media === "(prefers-color-scheme: dark)" ? query : original(media);
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
        const { getByTestId } = render(_jsx(ThemeProvider, { children: _jsx(ThemeProbe, {}) }));
        expect(getByTestId("mode")).toHaveTextContent("system");
        expect(getSavedTheme()).toBeNull();
    });
});
describe("system mode resolution (FR-031, A-07)", () => {
    let media;
    beforeEach(() => {
        clearShellPreferences();
        media = installMatchMedia(false);
    });
    afterEach(() => media.restore());
    it("resolves system to the device preference", () => {
        media.setPreference(true);
        const { getByTestId } = render(_jsx(ThemeProvider, { initialMode: "system", children: _jsx(ThemeProbe, {}) }));
        expect(getByTestId("mode")).toHaveTextContent("system");
        expect(getByTestId("resolved")).toHaveTextContent("dark");
    });
    it("falls back to light when the OS exposes no preference (A-07)", () => {
        const { getByTestId } = render(_jsx(ThemeProvider, { initialMode: "system", children: _jsx(ThemeProbe, {}) }));
        expect(getByTestId("resolved")).toHaveTextContent("light");
    });
    it("follows a device preference change at runtime (FR-031)", () => {
        const { getByTestId } = render(_jsx(ThemeProvider, { initialMode: "system", children: _jsx(ThemeProbe, {}) }));
        expect(getByTestId("resolved")).toHaveTextContent("light");
        media.setPreference(true);
        expect(getByTestId("resolved")).toHaveTextContent("dark");
        media.setPreference(false);
        expect(getByTestId("resolved")).toHaveTextContent("light");
    });
    it("writes the resolved theme to the root data-theme attribute (FR-030)", () => {
        render(_jsx(ThemeProvider, { initialMode: "system", children: _jsx(ThemeProbe, {}) }));
        expect(document.documentElement.getAttribute("data-theme")).toBe("light");
        media.setPreference(true);
        expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    });
});
describe("explicit selections (FR-032)", () => {
    beforeEach(() => clearShellPreferences());
    it("resolves an explicit light selection without following the device", () => {
        const { getByTestId } = render(_jsx(ThemeProvider, { initialMode: "light", children: _jsx(ThemeProbe, {}) }));
        expect(getByTestId("mode")).toHaveTextContent("light");
        expect(getByTestId("resolved")).toHaveTextContent("light");
    });
    it("resolves an explicit dark selection", () => {
        const { getByTestId } = render(_jsx(ThemeProvider, { initialMode: "dark", children: _jsx(ThemeProbe, {}) }));
        expect(getByTestId("mode")).toHaveTextContent("dark");
        expect(getByTestId("resolved")).toHaveTextContent("dark");
    });
});
