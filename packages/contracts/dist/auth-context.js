/**
 * R02 — Identity, Authentication & Authorization contracts.
 *
 * This module carries only shared type definitions consumed by the web client
 * (via AuthProvider / ShellModeProvider) and by the api when building shell
 * responses. No runtime business logic lives here (plan.md boundary rule 3,
 * FR-053, FR-056, FR-057).
 */
/**
 * Guard: is the given value one of the declared R02 roles?
 */
export function isRole(value) {
    return typeof value === "string" && ["user", "admin"].includes(value);
}
