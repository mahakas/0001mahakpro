import { jsx as _jsx } from "react/jsx-runtime";
/**
 * Shared test tree for the shell — assembles the presentation providers and the
 * router exactly as `App.tsx` does, with test hooks for the viewport width,
 * shell mode, locale, and theme so suites are deterministic (NFR-005).
 */
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AnnouncementProvider } from "../../src/shell/accessibility/AnnouncementProvider.js";
import { AppShell } from "../../src/shell/AppShell.js";
import { DirectionProvider } from "../../src/providers/DirectionProvider.js";
import { LocaleProvider } from "../../src/providers/LocaleProvider.js";
import { NavigationProvider } from "../../src/shell/navigation/NavigationRegistry.js";
import { ShellModeProvider } from "../../src/providers/ShellModeProvider.js";
import { ThemeProvider } from "../../src/providers/ThemeProvider.js";
import { ViewportClassProvider } from "../../src/providers/ViewportClassProvider.js";
export function ShellTree({ width = 1440, shellMode = "public", locale = "en", themeMode, initialPath = "/", skipSeam = true, initialReady = true, children, }) {
    return (_jsx(AnnouncementProvider, { children: _jsx(LocaleProvider, { initialLocale: locale, children: _jsx(ThemeProvider, { initialMode: themeMode, children: _jsx(DirectionProvider, { children: _jsx(ViewportClassProvider, { initialWidth: width, children: _jsx(ShellModeProvider, { initialMode: shellMode, skipSeam: skipSeam, children: _jsx(NavigationProvider, { children: _jsx(MemoryRouter, { initialEntries: [initialPath], children: _jsx(AppShell, { initialReady: initialReady, children: children }) }) }) }) }) }) }) }) }));
}
export function renderShell(options = {}, renderOptions) {
    const ui = _jsx(ShellTree, { ...options });
    return render(ui, renderOptions);
}
export function asElement(node) {
    return node;
}
