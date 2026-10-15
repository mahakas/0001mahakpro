/**
 * Direction and locale contracts.
 *
 * Contract (contracts/theme.md, data-model.md):
 *
 * ```text
 * Direction   ::= "rtl" | "ltr"
 * Locale      ::= "fa" | "ar" | "en"
 * ```
 *
 * Locale → direction map (verbatim from data-model.md): `fa → rtl`,
 * `ar → rtl`, `en → ltr`.
 */
/**
 * The two layout directions.
 */
export type Direction = "rtl" | "ltr";
/**
 * The interface languages the shell supports in R01.
 */
export type Locale = "fa" | "ar" | "en";
/**
 * The exhaustive set of directions.
 */
export declare const DIRECTION_VALUES: readonly Direction[];
/**
 * The exhaustive set of supported locales.
 */
export declare const LOCALE_VALUES: readonly Locale[];
/**
 * Locale → direction map, verbatim from data-model.md (FR-023, FR-061).
 *
 * The active language is the single source of truth for the initial direction
 * when no saved direction preference exists (FR-061).
 */
export declare const LOCALE_DIRECTION_MAP: Readonly<Record<Locale, Direction>>;
/**
 * R01's default locale when no saved preference and no platform default exist.
 */
export declare const DEFAULT_LOCALE: Locale;
/**
 * Resolve the direction for a locale. Unknown locales fall back to `ltr`.
 */
export declare function resolveDirectionForLocale(locale: string): Direction;
/**
 * Guard: is the given value one of the two directions?
 */
export declare function isDirection(value: unknown): value is Direction;
/**
 * Guard: is the given value one of the supported locales?
 */
export declare function isLocale(value: unknown): value is Locale;
//# sourceMappingURL=direction.d.ts.map