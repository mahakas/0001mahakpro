/**
 * T038 — switching shell mode changes the navigation set without reloading or
 * redesigning the core shell frame (FR-045).
 */

import { beforeEach, describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { ShellTree } from "../utils/shell-tree.js";
import { clearShellPreferences } from "../../src/providers/ShellPreferences.js";

describe("mode transition (FR-045)", () => {
  beforeEach(() => clearShellPreferences());

  it("swaps navigation sets without unmounting the shell frame", () => {
    const { getByTestId, rerender } = render(
      <ShellTree shellMode="public" width={1440} locale="en" />,
    );
    const frame = getByTestId("shell-frame");
    // A-08 / FR-058: the region anchor stays (uniform frame), but its
    // navigation set is empty in public mode.
    const publicSidebar = frame.querySelector('[data-region="sidebar"]');
    expect(publicSidebar).not.toBeNull();
    expect(publicSidebar!.querySelectorAll("[data-destination-id]")).toHaveLength(0);
    expect(getByTestId("sign-in-entry")).toBeInTheDocument();

    // Same frame element identity across the mode switch: no reload, no
    // restructure of the core shell frame.
    rerender(<ShellTree shellMode="authenticated" width={1440} locale="en" />);
    expect(getByTestId("shell-frame")).toBe(frame);
    const sidebar = frame.querySelector('[data-region="sidebar"]');
    expect(sidebar).not.toBeNull();
    expect(sidebar!.querySelectorAll("[data-destination-id]")).toHaveLength(8);
  });

  it("swaps the header global actions between modes", () => {
    const { getByTestId, queryByTestId, rerender } = render(
      <ShellTree shellMode="public" width={1440} locale="en" />,
    );
    expect(getByTestId("sign-in-entry")).toBeInTheDocument();
    expect(queryByTestId("account-entry")).not.toBeInTheDocument();

    rerender(<ShellTree shellMode="authenticated" width={1440} locale="en" />);
    expect(getByTestId("account-entry")).toBeInTheDocument();
    expect(queryByTestId("sign-in-entry")).not.toBeInTheDocument();
  });

  it("keeps the main region present in both modes", () => {
    const { getByTestId, rerender } = render(
      <ShellTree shellMode="public" width={1440} locale="en" />,
    );
    const frame = getByTestId("shell-frame");
    expect(frame.querySelector('[data-region="main"]')).not.toBeNull();

    rerender(<ShellTree shellMode="authenticated" width={1440} locale="en" />);
    expect(getByTestId("shell-frame").querySelector('[data-region="main"]')).not.toBeNull();
  });
});
