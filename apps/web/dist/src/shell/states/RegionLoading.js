import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * RegionLoading — per-region loading state (FR-047).
 *
 * Loading one region MUST NOT block the rest of the shell: this component
 * renders only inside its own region (NFR-008, data-model.md state rules).
 */
import { useLocale } from "../../providers/LocaleProvider.js";
export function RegionLoading({ label } = {}) {
    const { t } = useLocale();
    return (_jsxs("div", { className: "shell-state", "data-state": "loading", role: "status", "aria-live": "polite", "aria-label": label ?? t("state.loading.title"), children: [_jsx("span", { className: "shell-skeleton", "aria-hidden": "true" }), _jsx("span", { className: "shell-skeleton", "aria-hidden": "true", style: { width: "62%" } }), _jsx("p", { className: "shell-state-message", children: t("state.loading.message") })] }));
}
