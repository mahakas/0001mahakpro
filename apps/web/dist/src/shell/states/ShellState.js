import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useLocale } from "../../providers/LocaleProvider.js";
/**
 * A themed shell state block. The `data-state` attribute selects the themed
 * token pair from themes/tokens.css (FR-052).
 */
export function ShellState({ state, title, message, retryLabel, onRetry, children, }) {
    const { t } = useLocale();
    return (_jsxs("div", { className: "shell-state", "data-state": state, role: "status", children: [_jsx("p", { className: "shell-state-title", children: title }), _jsx("p", { className: "shell-state-message", children: message }), children, onRetry && retryLabel ? (_jsx("button", { type: "button", className: "shell-button", "data-variant": "primary", onClick: onRetry, children: retryLabel ?? t("state.error.retry") })) : null] }));
}
