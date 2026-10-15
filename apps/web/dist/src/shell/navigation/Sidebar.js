import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Sidebar — expanded and compact-rail primary navigation (FR-005, FR-006,
 * FR-007, FR-008, FR-009, FR-010, FR-017, FR-018, FR-026, FR-053).
 *
 * - A single control collapses the sidebar to a compact rail and expands it
 *   back (FR-006), reachable from both states (FR-007).
 * - Every destination stays reachable from the rail, through icons when labels
 *   are hidden (FR-009).
 * - The active destination is indicated visually and semantically (FR-010),
 *   and activating one updates only the main content area (FR-003).
 * - The chosen state persists across reloads (FR-008).
 * - Desktop can stay open beside the main content area (FR-017); tablet offers
 *   the compact form (FR-018). Collapse/expand behaves identically in RTL and
 *   LTR (FR-026) — the region is anchored by logical properties.
 *
 * Navigation items are registry data rendered generically — no module business
 * logic lives here (FR-053).
 */
import { Link } from "react-router-dom";
import { useNavigation } from "./NavigationRegistry.js";
import { useSidebarPresentation } from "./useSidebarPresentation.js";
import { useLocale } from "../../providers/LocaleProvider.js";
import { useAnnouncer } from "../accessibility/AnnouncementProvider.js";
import { DestinationIcon } from "./DestinationIcon.js";
export function Sidebar() {
    const { visibleDestinations, activeDestinationId, activate } = useNavigation();
    const { collapsed, toggleCollapsed } = useSidebarPresentation();
    const { t } = useLocale();
    const announce = useAnnouncer();
    const handleToggle = () => {
        toggleCollapsed();
        announce(collapsed ? t("action.expand") : t("action.collapse"));
    };
    return (_jsxs("div", { className: "shell-nav", "data-collapsed": collapsed, "data-testid": "sidebar-navigation", children: [_jsx("ul", { className: "shell-nav-list", "data-testid": "navigation-list", children: visibleDestinations.map((destination) => {
                    const isActive = activeDestinationId === destination.id;
                    return (_jsx("li", { className: "shell-nav-item", children: _jsxs(Link, { to: destination.routePath, className: "shell-nav-link", "data-active": isActive, "aria-current": isActive ? "page" : undefined, "data-destination-id": destination.id, onClick: () => activate(destination.id), children: [_jsx(DestinationIcon, { moduleId: destination.moduleId }), _jsx("span", { className: "shell-nav-label", children: t(destination.labelKey) })] }) }, destination.id));
                }) }), _jsxs("button", { type: "button", className: "shell-button shell-collapse-control", "data-testid": "sidebar-collapse-control", "aria-expanded": !collapsed, "aria-label": collapsed ? t("action.expand") : t("action.collapse"), onClick: handleToggle, children: [_jsx("span", { "aria-hidden": "true", className: "shell-nav-icon", children: collapsed ? "»" : "«" }), _jsx("span", { className: "shell-nav-label", children: collapsed ? t("action.expand") : t("action.collapse") })] })] }));
}
