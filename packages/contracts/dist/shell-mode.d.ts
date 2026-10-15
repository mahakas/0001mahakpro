/**
 * ShellMode — the application's authentication mode contract.
 *
 * Contract (data-model.md): `ShellMode ::= "public" | "authenticated"`
 *
 * Exactly two values exist; no third (e.g. "loading") mode is permitted
 * (FR-042). R01 resolves the value from the shell-mode seam, never from any
 * login implementation (FR-046). R02 later makes the resolution session-aware
 * while preserving these two values.
 */
/**
 * The two permitted shell-mode values.
 */
export type ShellMode = "public" | "authenticated";
/**
 * The exhaustive set of shell-mode values. Use this to validate foreign input
 * (e.g. an api payload) without introducing a third value.
 */
export declare const SHELL_MODE_VALUES: readonly ShellMode[];
/**
 * R01's declared default shell mode. The api resolves `public` until R02 makes
 * the resolution session-aware (contracts/shell-mode.md, rule "Consumption seam").
 */
export declare const DEFAULT_SHELL_MODE: ShellMode;
/**
 * Guard: is the given value one of the two permitted shell modes?
 */
export declare function isShellMode(value: unknown): value is ShellMode;
//# sourceMappingURL=shell-mode.d.ts.map