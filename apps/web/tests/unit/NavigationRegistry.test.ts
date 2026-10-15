/**
 * T089 — exactly one destination exists per module id, all `reserved` and all
 * `authenticated`, verifiable against ROADMAP.md (FR-012, FR-015, SC-001).
 * T092-support — the registry ids, module bindings, and route paths match
 * contracts/navigation.md.
 */

import { describe, expect, it } from "vitest";
import {
  DESTINATION_MODULE_IDS,
  IDENTITY_ONLY_MODULE_IDS,
  MODULE_ID_VALUES,
  R01_RESERVED_DESTINATIONS,
} from "@mahak/contracts";
import {
  createNavigationRegistry,
  destinationsForMode,
} from "../../src/shell/navigation/NavigationRegistry.js";

const EXPECTED_ID_TO_MODULE: Record<string, string> = {
  "dest.general-chat": "GENERAL_CHAT",
  "dest.conversations": "CONVERSATIONS",
  "dest.projects": "PROJECTS",
  "dest.private-teacher": "PRIVATE_TEACHER",
  "dest.files": "FILES",
  "dest.search": "SEARCH",
  "dest.settings": "SETTINGS",
  "dest.admin": "ADMIN_CONTROL_CENTER",
};

const EXPECTED_ID_TO_ROUTE: Record<string, string> = {
  "dest.general-chat": "/chat",
  "dest.conversations": "/conversations",
  "dest.projects": "/projects",
  "dest.private-teacher": "/teacher",
  "dest.files": "/files",
  "dest.search": "/search",
  "dest.settings": "/settings",
  "dest.admin": "/admin",
};

/**
 * The eight future product modules ROADMAP.md names for R01's reserved entry
 * points (spec.md US9, SC-001): General AI Chat, conversations/history,
 * projects, Private Teacher, files, search, settings, Admin Control Center.
 */
const ROADMAP_MODULES = [
  "GENERAL_CHAT",
  "CONVERSATIONS",
  "PROJECTS",
  "PRIVATE_TEACHER",
  "FILES",
  "SEARCH",
  "SETTINGS",
  "ADMIN_CONTROL_CENTER",
] as const;

describe("reserved destination registry (FR-012, SC-001)", () => {
  it("reserves exactly one destination per future product module", () => {
    expect(R01_RESERVED_DESTINATIONS).toHaveLength(8);
    for (const [id, moduleId] of Object.entries(EXPECTED_ID_TO_MODULE)) {
      const destination = R01_RESERVED_DESTINATIONS.find((d) => d.id === id);
      expect(destination, `destination ${id} must exist`).toBeDefined();
      expect(destination?.moduleId).toBe(moduleId);
      expect(destination?.routePath).toBe(EXPECTED_ID_TO_ROUTE[id]);
    }
  });

  it("covers every module ROADMAP.md assigns to R01 and no others", () => {
    const moduleIds = R01_RESERVED_DESTINATIONS.map((d) => d.moduleId).sort();
    expect(moduleIds).toEqual([...ROADMAP_MODULES].sort());
  });

  it("uses each module id exactly once (FR-012)", () => {
    const ids = R01_RESERVED_DESTINATIONS.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
    const modules = R01_RESERVED_DESTINATIONS.map((d) => d.moduleId);
    expect(new Set(modules).size).toBe(modules.length);
  });

  it("marks every module destination reserved and authenticated (FR-013, FR-015)", () => {
    for (const destination of R01_RESERVED_DESTINATIONS) {
      expect(destination.availability).toBe("reserved");
      expect(destination.visibilityScope).toBe("authenticated");
    }
  });

  it("keeps ids stable and label-independent (FR-011)", () => {
    for (const destination of R01_RESERVED_DESTINATIONS) {
      expect(destination.id).toMatch(/^dest\./);
      expect(destination.labelKey).toBe(destination.id);
    }
  });
});

describe("module identity set (FR-053, FR-056)", () => {
  it("defines exactly twelve module identities", () => {
    expect(MODULE_ID_VALUES).toHaveLength(12);
  });

  it("keeps KNOWLEDGE, MEMORY, VOICE, and AI_MODEL_GATEWAY identity-only", () => {
    expect(IDENTITY_ONLY_MODULE_IDS).toEqual([
      "KNOWLEDGE",
      "MEMORY",
      "VOICE",
      "AI_MODEL_GATEWAY",
    ]);
    for (const moduleId of IDENTITY_ONLY_MODULE_IDS) {
      expect(R01_RESERVED_DESTINATIONS.find((d) => d.moduleId === moduleId)).toBeUndefined();
    }
  });

  it("separates destination modules from identity-only seams", () => {
    expect(DESTINATION_MODULE_IDS).toHaveLength(8);
    expect(DESTINATION_MODULE_IDS).toEqual(ROADMAP_MODULES);
  });
});

describe("registry lookups (FR-011, FR-014)", () => {
  it("finds destinations by id and by route path", () => {
    const registry = createNavigationRegistry();
    expect(registry.findById("dest.admin")?.moduleId).toBe("ADMIN_CONTROL_CENTER");
    expect(registry.findByRoutePath("/teacher")?.id).toBe("dest.private-teacher");
    expect(registry.findById("dest.unknown")).toBeUndefined();
  });

  it("filters the navigation set by shell mode (FR-043, FR-058)", () => {
    expect(destinationsForMode(R01_RESERVED_DESTINATIONS, "authenticated")).toHaveLength(8);
    expect(destinationsForMode(R01_RESERVED_DESTINATIONS, "public")).toHaveLength(0);
  });
});
