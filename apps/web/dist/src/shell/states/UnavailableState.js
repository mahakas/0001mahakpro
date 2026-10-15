import { jsx as _jsx } from "react/jsx-runtime";
/**
 * UnavailableState — the defined state for a reserved destination whose feature
 * is not yet implemented (FR-013, FR-050).
 *
 * This state is distinct from loading, empty, and error: it says the module is
 * reserved, not broken or loading. Activating a reserved destination MUST NOT
 * imply the feature exists (FR-013). Text from externalized resources
 * (FR-028).
 */
import { useLocale } from "../../providers/LocaleProvider.js";
import { ShellState } from "./ShellState.js";
export function UnavailableState({ destinationLabel } = {}) {
    const { t } = useLocale();
    return (_jsx(ShellState, { state: "unavailable", title: t("state.unavailable.title"), message: destinationLabel
            ? `${t("state.unavailable.message")} — ${destinationLabel}`
            : t("state.unavailable.message") }));
}
