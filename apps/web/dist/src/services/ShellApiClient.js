/**
 * Shell contract client — consumes `GET /api/v1/shell` (FR-055).
 *
 * The client is the declared source of shell mode and feature availability,
 * but the shell is fully functional when the api is unreachable: theme,
 * direction, viewport class, sidebar state, and offline indication all resolve
 * locally, and this client returns `null` on any failure so callers fall back
 * to local defaults (contracts/api.md, "Client resilience rule").
 */
import { isShellMode } from "@mahak/contracts";
import { R01_API_FEATURE_AVAILABILITY } from "@mahak/contracts";
/** Local fallback used when the seam is unreachable (client resilience rule). */
export const LOCAL_SHELL_CONTRACT = {
    apiVersion: "v1",
    shellMode: "public",
    features: R01_API_FEATURE_AVAILABILITY,
    locales: {
        supported: ["fa", "ar", "en"],
        direction: { fa: "rtl", ar: "rtl", en: "ltr" },
    },
};
/** Same-origin base; overridable for tests or a deployed api. */
function apiBaseUrl() {
    try {
        const env = import.meta.env;
        return env?.VITE_API_BASE_URL ?? "";
    }
    catch {
        return "";
    }
}
function isPlainObject(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
/**
 * Validate a foreign payload against the contract shape (FR-055). Invalid
 * shapes yield `null` rather than a thrown error so the shell keeps working.
 */
export function parseShellContract(payload) {
    if (!isPlainObject(payload))
        return null;
    const { apiVersion, shellMode, features, locales } = payload;
    if (typeof apiVersion !== "string")
        return null;
    if (!isShellMode(shellMode))
        return null;
    if (!isPlainObject(features))
        return null;
    if (!isPlainObject(locales))
        return null;
    const { supported, direction } = locales;
    if (!Array.isArray(supported))
        return null;
    if (!isPlainObject(direction))
        return null;
    return { apiVersion, shellMode, features: features, locales: { supported, direction: direction } };
}
/**
 * Fetch the shell contract. Returns `null` on any failure — network error,
 * non-200 status, or an invalid payload — so callers fall back to local
 * resolution (contracts/api.md client resilience rule).
 */
export async function fetchShellContract(signal) {
    try {
        if (typeof fetch !== "function")
            return null;
        const response = await fetch(`${apiBaseUrl()}/api/v1/shell`, {
            method: "GET",
            headers: { Accept: "application/json" },
            // No credentials are sent or accepted (NFR-006).
            credentials: "omit",
            signal,
        });
        if (!response.ok)
            return null;
        return parseShellContract(await response.json());
    }
    catch {
        return null;
    }
}
