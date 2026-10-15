/**
 * T028 — activating a navigation destination marks it active and updates only
 * the main content area (FR-010, FR-003).
 * T093-support — a reserved destination renders the unavailable state into the
 * main region.
 */

import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderShell } from "../utils/shell-tree.js";
import { clearShellPreferences } from "../../src/providers/ShellPreferences.js";

function destinationLink(id: string): HTMLElement {
  return screen.getByTestId("navigation-list").querySelector(
    `[data-destination-id="${id}"]`,
  ) as HTMLElement;
}

describe("navigation registry activation (FR-010, FR-003)", () => {
  beforeEach(() => clearShellPreferences());

  it("keeps the sidebar and header in fixed positions and changes only the main area", () => {
    const { getByTestId } = renderShell({ shellMode: "authenticated", width: 1440 });
    const frame = getByTestId("shell-frame");
    const sidebar = frame.querySelector('[data-region="sidebar"]');
    const header = frame.querySelector('[data-region="header"]');
    const sidebarSignature = sidebar!.textContent;
    const headerSignature = header!.textContent;

    fireEvent.click(destinationLink("dest.general-chat"));

    // FR-002 / FR-003: only the main region's content changes.
    expect(frame.querySelector('[data-region="sidebar"]')!.textContent).toBe(sidebarSignature);
    expect(frame.querySelector('[data-region="header"]')!.textContent).toBe(headerSignature);
    expect(frame.querySelector('[data-region="main"]')!.textContent).not.toBe("");
  });

  it("renders the reserved destination's unavailable state into the main region", () => {
    const { getByTestId } = renderShell({ shellMode: "authenticated", width: 1440 });
    fireEvent.click(destinationLink("dest.projects"));

    const main = getByTestId("shell-frame").querySelector('[data-region="main"]');
    expect(main!.querySelector('[data-state="unavailable"]')).not.toBeNull();
  });
});
