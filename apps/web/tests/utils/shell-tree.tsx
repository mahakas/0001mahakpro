/**
 * Shared test tree for the shell — assembles the presentation providers and the
 * router exactly as `App.tsx` does, with test hooks for the viewport width,
 * shell mode, locale, and theme so suites are deterministic (NFR-005).
 */

import { render, type RenderOptions, type RenderResult } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import type { Locale, ShellMode, ThemeMode } from "@mahak/contracts";
import { AnnouncementProvider } from "../../src/shell/accessibility/AnnouncementProvider.js";
import { AppShell } from "../../src/shell/AppShell.js";
import { DirectionProvider } from "../../src/providers/DirectionProvider.js";
import { LocaleProvider } from "../../src/providers/LocaleProvider.js";
import { NavigationProvider } from "../../src/shell/navigation/NavigationRegistry.js";
import { ShellModeProvider } from "../../src/providers/ShellModeProvider.js";
import { ThemeProvider } from "../../src/providers/ThemeProvider.js";
import { ViewportClassProvider } from "../../src/providers/ViewportClassProvider.js";

export interface ShellTreeOptions {
  readonly width?: number;
  readonly shellMode?: ShellMode;
  readonly locale?: Locale;
  readonly themeMode?: ThemeMode;
  readonly initialPath?: string;
  readonly skipSeam?: boolean;
  readonly initialReady?: boolean;
  readonly children?: ReactNode;
}

export function ShellTree({
  width = 1440,
  shellMode = "public",
  locale = "en",
  themeMode,
  initialPath = "/",
  skipSeam = true,
  initialReady = true,
  children,
}: ShellTreeOptions) {
  return (
    <AnnouncementProvider>
      <LocaleProvider initialLocale={locale}>
        <ThemeProvider initialMode={themeMode}>
          <DirectionProvider>
            <ViewportClassProvider initialWidth={width}>
              <ShellModeProvider initialMode={shellMode} skipSeam={skipSeam}>
                <NavigationProvider>
                  <MemoryRouter initialEntries={[initialPath]}>
                    <AppShell initialReady={initialReady}>{children}</AppShell>
                  </MemoryRouter>
                </NavigationProvider>
              </ShellModeProvider>
            </ViewportClassProvider>
          </DirectionProvider>
        </ThemeProvider>
      </LocaleProvider>
    </AnnouncementProvider>
  );
}

export function renderShell(
  options: ShellTreeOptions = {},
  renderOptions?: RenderOptions,
): RenderResult {
  const ui = <ShellTree {...options} />;
  return render(ui, renderOptions);
}

export function asElement(node: ReactNode): ReactElement {
  return node as ReactElement;
}
