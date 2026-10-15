/**
 * Reserved slot — General AI Chat (module `GENERAL_CHAT`, R05/R10).
 *
 * Inert in R01: the identity is reserved and availability is `reserved`, so
 * activating the destination presents the defined unavailable state (FR-013).
 * When the module ships it defines its component and flips availability to
 * `available` here — the shell's regions and navigation contract stay
 * untouched (FR-014, FR-056).
 */
import { defineModuleBinding } from "../registry.js";
defineModuleBinding({ moduleId: "GENERAL_CHAT", availability: "reserved" });
export const MODULE_ID = "GENERAL_CHAT";
