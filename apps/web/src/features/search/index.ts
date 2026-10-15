/**
 * Reserved slot — Search (module `SEARCH`, R06).
 *
 * Inert in R01 (see general-chat/index.ts).
 */

import { defineModuleBinding } from "../registry.js";

defineModuleBinding({ moduleId: "SEARCH", availability: "reserved" });

export const MODULE_ID = "SEARCH" as const;
