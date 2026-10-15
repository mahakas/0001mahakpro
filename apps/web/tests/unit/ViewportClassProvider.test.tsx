/**
 * T044 — ViewportClassProvider resolves the class from viewport width only, at
 * the fixed boundaries (FR-016, A-02).
 */

import { afterEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import {
  resolveViewportClass,
  VIEWPORT_BOUNDARIES,
} from "@mahak/contracts";
import { ViewportClassProvider, useViewportClass } from "../../src/providers/ViewportClassProvider.js";

function Probe() {
  const { viewportClass, width } = useViewportClass();
  return (
    <div>
      <span data-testid="class">{viewportClass}</span>
      <span data-testid="width">{width}</span>
    </div>
  );
}

function renderAt(width: number) {
  return render(
    <ViewportClassProvider initialWidth={width}>
      <Probe />
    </ViewportClassProvider>,
  );
}

describe("viewport class boundaries (FR-016)", () => {
  it("uses the exact fixed boundaries from the contracts package", () => {
    expect(VIEWPORT_BOUNDARIES.mobileMaxExclusive).toBe(768);
    expect(VIEWPORT_BOUNDARIES.desktopMin).toBe(1024);
  });

  it.each([
    [0, "mobile"],
    [360, "mobile"],
    [480, "mobile"],
    [767, "mobile"],
    [768, "tablet"],
    [900, "tablet"],
    [1023, "tablet"],
    [1024, "desktop"],
    [1440, "desktop"],
    [1920, "desktop"],
  ])("resolves width %ipx to %s", (width, expected) => {
    expect(resolveViewportClass(width)).toBe(expected);
  });

  it("resolves from width only — a wide viewport is desktop regardless of device", () => {
    // The provider accepts a width only; no pointer or device hint is consulted.
    const { getByTestId } = renderAt(1440);
    expect(getByTestId("class")).toHaveTextContent("desktop");
  });

  it("resolves from width only — a narrow window is mobile", () => {
    const { getByTestId } = renderAt(360);
    expect(getByTestId("class")).toHaveTextContent("mobile");
  });
});

describe("viewport class updates on resize", () => {
  afterEach(() => {
    fireEvent(window, new Event("resize"));
  });

  it("follows the live viewport width", () => {
    const { getByTestId } = renderAt(1024);
    expect(getByTestId("class")).toHaveTextContent("desktop");

    window.innerWidth = 500;
    fireEvent(window, new Event("resize"));
    expect(getByTestId("class")).toHaveTextContent("mobile");

    window.innerWidth = 900;
    fireEvent(window, new Event("resize"));
    expect(getByTestId("class")).toHaveTextContent("tablet");

    window.innerWidth = 1920;
    fireEvent(window, new Event("resize"));
    expect(getByTestId("class")).toHaveTextContent("desktop");
  });
});

describe("exactly one class is active (FR-016)", () => {
  it("exposes exactly three classes", () => {
    expect(screen.queryAllByTestId("class")).toHaveLength(0);
    const { getByTestId } = renderAt(800);
    expect(["mobile", "tablet", "desktop"]).toContain(getByTestId("class").textContent);
  });
});
