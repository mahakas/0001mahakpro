/**
 * T067 — automated accessibility test: the three regions are exposed as
 * distinct semantic navigation/banner/main landmarks; every interactive shell
 * control exposes a meaningful accessible name (FR-034, FR-036).
 * FR-037 — every interactive control presents a visible focus indicator.
 */

import { beforeEach, describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { axe } from "jest-axe";
import { MemoryRouter } from "react-router-dom";
import { renderShell } from "../utils/shell-tree.js";
import { clearShellPreferences } from "../../src/providers/ShellPreferences.js";
import { Sidebar } from "../../src/shell/navigation/Sidebar.js";
import { SidebarRegion } from "../../src/shell/regions/SidebarRegion.js";
import { AnnouncementProvider } from "../../src/shell/accessibility/AnnouncementProvider.js";
import { LocaleProvider } from "../../src/providers/LocaleProvider.js";
import { ViewportClassProvider } from "../../src/providers/ViewportClassProvider.js";
import { ShellModeProvider } from "../../src/providers/ShellModeProvider.js";
import { NavigationProvider } from "../../src/shell/navigation/NavigationRegistry.js";
import { SidebarPresentationProvider } from "../../src/shell/navigation/useSidebarPresentation.js";
import shellCss from "../../src/themes/shell.css?raw";

function renderSidebarOnly(width: number) {
  return render(
    <AnnouncementProvider>
      <LocaleProvider initialLocale="en">
        <ViewportClassProvider initialWidth={width}>
          <ShellModeProvider initialMode="authenticated" skipSeam>
            <NavigationProvider>
              <MemoryRouter initialEntries={["/"]}>
                <SidebarPresentationProvider>
                  <SidebarRegion>
                    <Sidebar />
                  </SidebarRegion>
                </SidebarPresentationProvider>
              </MemoryRouter>
            </NavigationProvider>
          </ShellModeProvider>
        </ViewportClassProvider>
      </LocaleProvider>
    </AnnouncementProvider>,
  );
}

describe("shell landmarks (FR-034)", () => {
  beforeEach(() => clearShellPreferences());

  it("exposes navigation, banner, and main landmarks", () => {
    const { container } = renderShell({ shellMode: "authenticated", width: 1440 });
    expect(container.querySelector("nav")).not.toBeNull();
    expect(container.querySelector("header[role='banner']")).not.toBeNull();
    expect(container.querySelector("main")).not.toBeNull();
  });

  it("exposes exactly one of each landmark", () => {
    const { container } = renderShell({ shellMode: "authenticated", width: 1440 });
    expect(container.querySelectorAll("nav")).toHaveLength(1);
    expect(container.querySelectorAll("header[role='banner']")).toHaveLength(1);
    expect(container.querySelectorAll("main")).toHaveLength(1);
  });
});

describe("accessible names (FR-036)", () => {
  beforeEach(() => clearShellPreferences());

  it("names the collapse control from externalized resources", () => {
    const { getByTestId } = renderShell({ shellMode: "authenticated", width: 1440 });
    expect(getByTestId("sidebar-collapse-control")).toHaveAccessibleName(
      "Collapse navigation",
    );
  });

  it("names every navigation destination", () => {
    const { getByTestId } = renderShell({ shellMode: "authenticated", width: 1440 });
    const links = getByTestId("navigation-list").querySelectorAll("[data-destination-id]");
    links.forEach((link) => {
      expect(link).toHaveAccessibleName(/.+/);
    });
  });

  it("names the theme and locale controls", () => {
    const { getByRole } = renderShell({ shellMode: "authenticated", width: 1440 });
    expect(getByRole("group", { name: /Theme/ })).toBeInTheDocument();
    expect(getByRole("group", { name: /Language/ })).toBeInTheDocument();
  });

  it("names the drawer-open control on mobile", () => {
    const { getByTestId } = renderShell({ shellMode: "authenticated", width: 360 });
    expect(getByTestId("open-navigation")).toHaveAccessibleName("Open navigation menu");
  });

  it("names the public entry points", () => {
    const { getByTestId } = renderShell({ shellMode: "public", width: 1440 });
    expect(getByTestId("sign-in-entry")).toHaveAccessibleName("Sign in");
    expect(getByTestId("sign-up-entry")).toHaveAccessibleName("Sign up");
  });
});

describe("visible focus indicator (FR-037)", () => {
  beforeEach(() => clearShellPreferences());

  it("defines a visible focus indicator for interactive controls", () => {
    // The indicator is asserted structurally: themes/shell.css declares a
    // :focus-visible rule consuming the focus-ring token.
    expect(shellCss).toContain(":focus-visible");
    expect(shellCss).toContain("outline:");
  });

  it("moves focus to the collapse control", () => {
    const { getByTestId } = renderShell({ shellMode: "authenticated", width: 1440 });
    const control = getByTestId("sidebar-collapse-control");
    control.focus();
    expect(control).toHaveFocus();
  });

  it("moves focus to a navigation destination", () => {
    const { getByTestId } = renderShell({ shellMode: "authenticated", width: 1440 });
    const link = getByTestId("navigation-list").querySelector(
      '[data-destination-id="dest.general-chat"]',
    ) as HTMLElement;
    link.focus();
    expect(link).toHaveFocus();
  });
});

describe("axe automated scan (FR-034, FR-036, NFR-005)", () => {
  beforeEach(() => clearShellPreferences());

  it("reports no violations for the authenticated desktop shell", async () => {
    const { container } = renderShell({ shellMode: "authenticated", width: 1440 });
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });

  it("reports no violations for the public shell", async () => {
    const { container } = renderShell({ shellMode: "public", width: 1440 });
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });

  it("reports no violations for the mobile shell", async () => {
    const { container } = renderShell({ shellMode: "authenticated", width: 360 });
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });

  it("reports no violations for the isolated sidebar (no duplicate landmarks)", async () => {
    const { container } = renderSidebarOnly(1440);
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });
});
