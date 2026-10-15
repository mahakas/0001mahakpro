/**
 * Theme contracts — selectable theme modes and the resolved theme that is
 * actually rendered.
 *
 * Contract (contracts/theme.md):
 *
 * ```text
 * ThemeMode      ::= "light" | "dark" | "system"
 * ResolvedTheme  ::= "light" | "dark"
 * ```
 *
 * Exactly three selectable modes (FR-029). `system` resolves to a
 * `ResolvedTheme` by subscribing to the device appearance preference; OSes
 * exposing no preference fall back to `light` (A-07).
 */
/**
 * The three selectable theme modes.
 */
export type ThemeMode = "light" | "dark" | "system";
/**
 * The theme that is actually rendered.
 */
export type ResolvedTheme = "light" | "dark";
/**
 * The exhaustive set of selectable theme modes.
 */
export declare const THEME_MODE_VALUES: readonly ThemeMode[];
/**
 * The exhaustive set of resolved themes.
 */
export declare const RESOLVED_THEME_VALUES: readonly ResolvedTheme[];
/**
 * R01's first-visit default theme mode (FR-060, A-05).
 */
export declare const DEFAULT_THEME_MODE: ThemeMode;
/**
 * Fallback resolved theme when the OS exposes no appearance preference (A-07).
 */
export declare const DEFAULT_RESOLVED_THEME: ResolvedTheme;
/**
 * Guard: is the given value one of the three selectable theme modes?
 */
export declare function isThemeMode(value: unknown): value is ThemeMode;
/**
 * Guard: is the given value one of the two resolved themes?
 */
export declare function isResolvedTheme(value: unknown): value is ResolvedTheme;
//# sourceMappingURL=theme.d.ts.map