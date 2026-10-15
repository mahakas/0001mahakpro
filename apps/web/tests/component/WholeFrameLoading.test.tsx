/**
 * T082 — during initial load all three regions are present but inert and
 * transition to the interactive shell once ready, with no reload or core-frame
 * re-layout (FR-059, NFR-001).
 */

import { beforeEach, describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { ShellTree } from "../utils/shell-tree.js";
import { clearShellPreferences } from "../../src/providers/ShellPreferences.js";

describe("whole-frame startup loading (FR-059)", () => {
  beforeEach(() => clearShellPreferences());

  it("presents all three regions but inert while the shell prepares", () => {
    const { getByTestId } = render(
      <ShellTree shellMode="authenticated" width={1440} initialReady={false} locale="en" />,
    );
    const frame = getByTestId("shell-frame");

    expect(frame.getAttribute("data-shell-ready")).toBe("false");
    expect(frame.querySelector('[data-region="sidebar"]')).not.toBeNull();
    expect(frame.querySelector('[data-region="header"]')).not.toBeNull();
    expect(frame.querySelector('[data-region="main"]')).not.toBeNull();
    // The main region shows its per-region loading state during startup.
    expect(frame.querySelector('[data-region="main"] [data-state="loading"]')).not.toBeNull();
  });

  it("transitions to the interactive shell once ready with no frame re-layout", () => {
    const { getByTestId, rerender } = render(
      <ShellTree shellMode="authenticated" width={1440} initialReady={false} locale="en" />,
    );
    const frame = getByTestId("shell-frame");

    rerender(<ShellTree shellMode="authenticated" width={1440} initialReady locale="en" />);

    // Same frame element: no reload, no core-frame re-layout.
    expect(getByTestId("shell-frame")).toBe(frame);
    expect(frame.getAttribute("data-shell-ready")).toBe("true");
    expect(frame.querySelector('[data-region="main"] [data-state="empty"]')).not.toBeNull();
  });

  it("keeps exactly three region types throughout the transition", () => {
    const { getByTestId, rerender } = render(
      <ShellTree shellMode="authenticated" width={1440} initialReady={false} locale="en" />,
    );
    const frame = getByTestId("shell-frame");

    const kinds = () =>
      new Set(
        Array.from(frame.querySelectorAll("[data-region]")).map((node) =>
          node.getAttribute("data-region"),
        ),
      );

    expect(kinds()).toEqual(new Set(["sidebar", "header", "main"]));
    rerender(<ShellTree shellMode="authenticated" width={1440} initialReady locale="en" />);
    expect(kinds()).toEqual(new Set(["sidebar", "header", "main"]));
  });
});
