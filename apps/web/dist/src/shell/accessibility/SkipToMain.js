import { jsx as _jsx } from "react/jsx-runtime";
/**
 * SkipToMain — the skip-to-main-content affordance (FR-035).
 *
 * Moves focus directly into the main content region. The main region carries
 * `tabindex="-1"` so it can receive programmatic focus, and the link is the
 * first focusable element in the frame so it is reached with a single Tab.
 */
import { useLocale } from "../../providers/LocaleProvider.js";
export const MAIN_CONTENT_ID = "mahak-main-content";
export function skipToMainTarget() {
    return `#${MAIN_CONTENT_ID}`;
}
export function focusMainContent() {
    if (typeof document === "undefined")
        return;
    const main = document.getElementById(MAIN_CONTENT_ID);
    if (main) {
        main.focus({ preventScroll: false });
    }
}
export function SkipToMain() {
    const { t } = useLocale();
    return (_jsx("a", { className: "shell-skip-link", href: skipToMainTarget(), onClick: (event) => {
            // Move focus into the region rather than only scrolling to it.
            event.preventDefault();
            focusMainContent();
        }, children: t("action.skipToMain") }));
}
