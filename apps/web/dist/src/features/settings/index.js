/**
 * Reserved slot — Settings (module `SETTINGS`, R03).
 *
 * Inert in R01 (see general-chat/index.ts).
 */
import { defineModuleBinding } from "../registry.js";
defineModuleBinding({ moduleId: "SETTINGS", availability: "reserved" });
export const MODULE_ID = "SETTINGS";
