/**
 * Externalized string resources (FR-028).
 *
 * All user-visible shell text is held here, keyed by locale, and referenced by
 * key from components — never embedded as literals (contracts/theme.md rule 6,
 * A-04). Full localization management is owned by R03; R01 requires only the
 * resources and correct directional behavior.
 */
import { DEFAULT_LOCALE, isLocale } from "@mahak/contracts";
import fa from "./fa.json";
import ar from "./ar.json";
import en from "./en.json";
/**
 * The resource set, keyed by locale.
 */
export const RESOURCES = {
    fa,
    ar,
    en,
};
/**
 * Resolve a dot-path key (e.g. `state.empty.title`) against a resource tree.
 * Returns the key itself when no translation exists so a missing string is
 * always visible and never silently empty.
 */
export function translate(locale, key) {
    const tree = RESOURCES[locale] ?? RESOURCES[DEFAULT_LOCALE];
    const segments = key.split(".");
    let node = tree;
    for (const segment of segments) {
        if (node && typeof node === "object" && segment in node) {
            node = node[segment];
        }
        else {
            return key;
        }
    }
    return typeof node === "string" ? node : key;
}
export function createTranslator(locale) {
    return (key) => translate(locale, key);
}
/**
 * The locale to use when nothing is saved and the platform exposes no hint.
 */
export function resolveInitialLocale(saved, platformLocale) {
    if (saved && isLocale(saved))
        return saved;
    if (platformLocale) {
        const short = platformLocale.slice(0, 2).toLowerCase();
        if (isLocale(short))
            return short;
    }
    return DEFAULT_LOCALE;
}
