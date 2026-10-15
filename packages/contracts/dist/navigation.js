/**
 * Navigation contract — stable module identities and the destination registry.
 *
 * Contract (contracts/navigation.md, data-model.md). These identities are
 * stable for the platform's lifetime and MUST NOT be renumbered or reused
 * (mirrors the roadmap's stable-ID rule).
 */
/**
 * The exhaustive set of module identities.
 */
export const MODULE_ID_VALUES = [
    "GENERAL_CHAT",
    "CONVERSATIONS",
    "PROJECTS",
    "PRIVATE_TEACHER",
    "FILES",
    "SEARCH",
    "SETTINGS",
    "ADMIN_CONTROL_CENTER",
    "KNOWLEDGE",
    "MEMORY",
    "VOICE",
    "AI_MODEL_GATEWAY",
];
/**
 * The eight module identities that carry a reserved navigation destination in
 * R01 (FR-012). The remaining four identities are reserved seams with no
 * destination (data-model.md).
 */
export const DESTINATION_MODULE_IDS = [
    "GENERAL_CHAT",
    "CONVERSATIONS",
    "PROJECTS",
    "PRIVATE_TEACHER",
    "FILES",
    "SEARCH",
    "SETTINGS",
    "ADMIN_CONTROL_CENTER",
];
/**
 * The module identities that remain identity-only future seams in R01 — no
 * destination, no feature slot, no implementation (FR-054, FR-056, FR-057;
 * tasks.md T094).
 */
export const IDENTITY_ONLY_MODULE_IDS = [
    "KNOWLEDGE",
    "MEMORY",
    "VOICE",
    "AI_MODEL_GATEWAY",
];
/**
 * The reserved destination registry for R01 (contracts/navigation.md,
 * data-model.md). Exactly one destination per future product module, all
 * `reserved` and all `authenticated`.
 */
export const R01_RESERVED_DESTINATIONS = [
    { id: "dest.general-chat", moduleId: "GENERAL_CHAT", labelKey: "dest.general-chat", routePath: "/chat", availability: "reserved", visibilityScope: "authenticated" },
    { id: "dest.conversations", moduleId: "CONVERSATIONS", labelKey: "dest.conversations", routePath: "/conversations", availability: "reserved", visibilityScope: "authenticated" },
    { id: "dest.projects", moduleId: "PROJECTS", labelKey: "dest.projects", routePath: "/projects", availability: "reserved", visibilityScope: "authenticated" },
    { id: "dest.private-teacher", moduleId: "PRIVATE_TEACHER", labelKey: "dest.private-teacher", routePath: "/teacher", availability: "reserved", visibilityScope: "authenticated" },
    { id: "dest.files", moduleId: "FILES", labelKey: "dest.files", routePath: "/files", availability: "reserved", visibilityScope: "authenticated" },
    { id: "dest.search", moduleId: "SEARCH", labelKey: "dest.search", routePath: "/search", availability: "reserved", visibilityScope: "authenticated" },
    { id: "dest.settings", moduleId: "SETTINGS", labelKey: "dest.settings", routePath: "/settings", availability: "reserved", visibilityScope: "authenticated" },
    { id: "dest.admin", moduleId: "ADMIN_CONTROL_CENTER", labelKey: "dest.admin", routePath: "/admin", availability: "reserved", visibilityScope: "authenticated" },
];
/**
 * Guard: is the given value a recognized module identity?
 */
export function isModuleId(value) {
    return typeof value === "string" && MODULE_ID_VALUES.includes(value);
}
