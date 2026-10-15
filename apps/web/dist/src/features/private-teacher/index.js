/**
 * Reserved slot — Private Teacher (module `PRIVATE_TEACHER`, R19–R22).
 *
 * Inert in R01 (see general-chat/index.ts). The Teacher is an independent
 * domain entity, not merely an LLM, provider, or prompt (constitution
 * Principle I).
 */
import { defineModuleBinding } from "../registry.js";
defineModuleBinding({ moduleId: "PRIVATE_TEACHER", availability: "reserved" });
export const MODULE_ID = "PRIVATE_TEACHER";
