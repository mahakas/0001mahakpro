/**
 * T054 — DirectionProvider: `fa` and `ar` resolve to `rtl`, `en` to `ltr`;
 * with no saved direction preference the active language is the single source
 * of truth so the two cannot diverge at first paint (FR-023, FR-061).
 */

import { beforeEach, describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { LocaleProvider } from "../../src/providers/LocaleProvider.js";
import { DirectionProvider, useDirection } from "../../src/providers/DirectionProvider.js";
import { clearShellPreferences, getSavedDirection } from "../../src/providers/ShellPreferences.js";

function DirectionProbe() {
  const { direction, isLocaleDriven } = useDirection();
  return (
    <div>
      <span data-testid="direction">{direction}</span>
      <span data-testid="locale-driven">{String(isLocaleDriven)}</span>
    </div>
  );
}

function renderWithLocale(locale: "fa" | "ar" | "en") {
  return render(
    <LocaleProvider initialLocale={locale}>
      <DirectionProvider>
        <DirectionProbe />
      </DirectionProvider>
    </LocaleProvider>,
  );
}

describe("locale to direction mapping (FR-023)", () => {
  beforeEach(() => clearShellPreferences());

  it("resolves fa and ar to rtl and en to ltr", () => {
    const fa = renderWithLocale("fa");
    expect(fa.getByTestId("direction")).toHaveTextContent("rtl");
    fa.unmount();

    const ar = renderWithLocale("ar");
    expect(ar.getByTestId("direction")).toHaveTextContent("rtl");
    ar.unmount();

    const en = renderWithLocale("en");
    expect(en.getByTestId("direction")).toHaveTextContent("ltr");
  });

  it("sets the root dir attribute as the single source of truth (FR-024)", () => {
    const tree = renderWithLocale("fa");
    expect(document.documentElement.getAttribute("dir")).toBe("rtl");
    tree.unmount();

    const en = renderWithLocale("en");
    expect(document.documentElement.getAttribute("dir")).toBe("ltr");
    en.unmount();
  });

  it("keeps direction derived from the language at first paint (FR-061)", () => {
    const tree = renderWithLocale("fa");
    expect(tree.getByTestId("locale-driven")).toHaveTextContent("true");
    expect(getSavedDirection()).toBeNull();
    tree.unmount();
  });
});
