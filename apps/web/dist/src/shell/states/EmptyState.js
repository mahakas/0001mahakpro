import { jsx as _jsx } from "react/jsx-runtime";
/**
 * EmptyState — the defined state shown when a region has no content, never a
 * blank or broken page (FR-048, FR-002). Text from externalized resources
 * (FR-028).
 */
import { useLocale } from "../../providers/LocaleProvider.js";
import { ShellState } from "./ShellState.js";
export function EmptyState({ title, message } = {}) {
    const { t } = useLocale();
    return (_jsx(ShellState, { state: "empty", title: title ?? t("state.empty.title"), message: message ?? t("state.empty.message") }));
}
