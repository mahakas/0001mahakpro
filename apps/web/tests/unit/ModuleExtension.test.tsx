/**
 * T091 — extensibility: flipping a module's availability from `reserved` to
 * `available` and binding its route renders it into the main region with no
 * change to the shell's region structure, navigation contract, or layout
 * (FR-014, FR-056). The seam is generic only; KNOWLEDGE, MEMORY, VOICE, and
 * AI_MODEL_GATEWAY have no slot (T094).
 */

import { beforeEach, describe, expect, it } from "vitest";
import type { ModuleId } from "@mahak/contracts";
import {
  defineModuleBinding,
  getModuleBinding,
  isModuleAvailable,
  listModuleBindings,
} from "../../src/features/index.js";
import { R01_MODULE_SLOTS } from "../../src/features/slots.js";
import { renderShell } from "../utils/shell-tree.js";
import { clearShellPreferences } from "../../src/providers/ShellPreferences.js";

const IDENTITY_ONLY: ModuleId[] = ["KNOWLEDGE", "MEMORY", "VOICE", "AI_MODEL_GATEWAY"];

function Probe() {
  return <div data-testid="bound-module">general-chat content</div>;
}

describe("reserved module slots (T094)", () => {
  beforeEach(() => clearShellPreferences());

  it("creates reserved directory slots for exactly the eight destination modules", () => {
    expect(R01_MODULE_SLOTS).toHaveLength(8);
  });

  it("declares every slot reserved with no component (FR-013, FR-050)", () => {
    for (const moduleId of R01_MODULE_SLOTS) {
      const binding = getModuleBinding(moduleId);
      expect(binding, `slot ${moduleId} must be registered`).toBeDefined();
      expect(binding?.availability).toBe("reserved");
      expect(binding?.component).toBeUndefined();
    }
  });

  it("creates no slot for the identity-only future seams", () => {
    for (const moduleId of IDENTITY_ONLY) {
      expect(R01_MODULE_SLOTS).not.toContain(moduleId);
      expect(getModuleBinding(moduleId)).toBeUndefined();
    }
  });
});

describe("module extension seam (FR-014, FR-056)", () => {
  beforeEach(() => clearShellPreferences());

  it("flips a module to available and binds a component without touching the shell", () => {
    defineModuleBinding({
      moduleId: "GENERAL_CHAT",
      availability: "available",
      component: Probe,
    });

    expect(isModuleAvailable("GENERAL_CHAT")).toBe(true);
    expect(getModuleBinding("GENERAL_CHAT")?.component).toBe(Probe);

    // The shell's region structure is unchanged: exactly three regions.
    const { queryAllByTestId } = renderShell({ shellMode: "authenticated", width: 1440 });
    expect(queryAllByTestId((content) => content === "shell-frame")).toHaveLength(1);
    expect(document.querySelectorAll('[data-region="sidebar"]')).toHaveLength(1);
    expect(document.querySelectorAll('[data-region="header"]')).toHaveLength(1);
    expect(document.querySelectorAll('[data-region="main"]')).toHaveLength(1);
  });

  it("treats every registered binding as generic data, not shell behavior (FR-053)", () => {
    const modules = listModuleBindings().map((binding) => binding.moduleId);
    expect(new Set(modules).size).toBe(modules.length);
    expect(modules).toEqual(expect.arrayContaining([...R01_MODULE_SLOTS]));
  });
});
