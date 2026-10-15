import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * WholeFrameLoading — the startup state (FR-059, NFR-001).
 *
 * During initial shell load, all three regions are present but inert, then
 * transition to the interactive shell — including any per-region loading
 * states — once the shell is interactive, without a reload or a re-layout of
 * the core frame.
 *
 * The inert state is expressed as `data-shell-ready="false"` on the frame
 * (see themes/shell.css): the regions keep their stable positions while
 * becoming non-interactive and visually subdued, so the frame never appears
 * partially assembled (quickstart scenario 1).
 */
import { useLocale } from "../../providers/LocaleProvider.js";
export function WholeFrameLoading({ active }) {
    const { t } = useLocale();
    if (!active)
        return null;
    return (_jsx("div", { className: "shell-sr-only", role: "status", "aria-live": "polite", "data-testid": "whole-frame-loading", children: t("state.frameLoading") }));
}
/**
 * The inert skeleton rendered inside each region while the frame is not yet
 * ready. Present in all three regions so the whole frame appears together
 * (FR-059).
 */
export function WholeFrameSkeleton() {
    return (_jsxs("div", { className: "shell-state", "data-state": "loading", "aria-hidden": "true", children: [_jsx("span", { className: "shell-skeleton" }), _jsx("span", { className: "shell-skeleton", style: { width: "72%" } })] }));
}
