import { jsx as _jsx } from "react/jsx-runtime";
import { useLocale } from "../../providers/LocaleProvider.js";
export function SidebarRegion({ children, style }) {
    const { t } = useLocale();
    return (_jsx("nav", { className: "shell-sidebar-region", "data-region": "sidebar", "aria-label": t("region.sidebar"), style: style, children: children }));
}
