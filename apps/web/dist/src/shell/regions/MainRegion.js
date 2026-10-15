import { jsx as _jsx } from "react/jsx-runtime";
import { useLocale } from "../../providers/LocaleProvider.js";
import { MAIN_CONTENT_ID } from "../accessibility/SkipToMain.js";
export function MainRegion({ children }) {
    const { t } = useLocale();
    return (_jsx("main", { id: MAIN_CONTENT_ID, className: "shell-main-region", "data-region": "main", tabIndex: -1, "aria-label": t("region.main"), children: children }));
}
