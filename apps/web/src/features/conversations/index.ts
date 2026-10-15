/**
 * Reserved slot — Conversations / history (module `CONVERSATIONS`, R06).
 *
 * Inert in R01 (see general-chat/index.ts).
 */

import { defineModuleBinding } from "../registry.js";

defineModuleBinding({ moduleId: "CONVERSATIONS", availability: "reserved" });

export const MODULE_ID = "CONVERSATIONS" as const;
