import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * HeaderRegion — the banner region: product identity and global actions
 * (FR-004).
 *
 * The header is the defined home of global actions and MUST NOT be used as a
 * substitute for primary navigation (FR-004). Its global actions are:
 *
 * - the persistent mobile navigation control (FR-019);
 * - the theme control (Light/Dark/System — FR-029);
 * - the language control, which drives layout direction (FR-023, FR-061);
 * - the public sign-in / sign-up entry points (FR-058, A-08) or the
 *   authenticated account area (FR-043).
 *
 * The header is a stable anchor whose position never changes between
 * destinations (FR-002) or modes (FR-045). Exposes the `banner` landmark
 * (FR-034).
 */
import { useRef } from "react";
import { Link } from "react-router-dom";
import { THEME_MODE_VALUES, LOCALE_VALUES } from "@mahak/contracts";
import { useLocale } from "../../providers/LocaleProvider.js";
import { useTheme } from "../../providers/ThemeProvider.js";
import { useShellMode } from "../../providers/ShellModeProvider.js";
import { useViewportClass } from "../../providers/ViewportClassProvider.js";
import { useDirection } from "../../providers/DirectionProvider.js";
import { useAnnouncer } from "../accessibility/AnnouncementProvider.js";
export function HeaderRegion({ onOpenNavigation, drawerOpenerRef }) {
    const { t, locale, setLocale } = useLocale();
    const { themeMode, setThemeMode } = useTheme();
    const { shellMode } = useShellMode();
    const { isMobile } = useViewportClass();
    const { direction } = useDirection();
    const announce = useAnnouncer();
    const openerRef = useRef(null);
    const openButtonRef = drawerOpenerRef ?? openerRef;
    const handleTheme = (mode) => {
        setThemeMode(mode);
        announce(`${t("action.theme.label")}: ${t(`action.theme.${mode}`)}`);
    };
    const handleLocale = (next) => {
        setLocale(next);
        announce(`${t("action.locale.label")}: ${t(`action.locale.${next}`)}`);
    };
    const openNavigation = () => {
        openButtonRef.current?.focus();
        onOpenNavigation?.();
    };
    return (_jsxs("header", { className: "shell-header-region", "data-region": "header", 
        // FR-034: the banner landmark.
        role: "banner", children: [isMobile ? (_jsx("button", { ref: openButtonRef, type: "button", className: "shell-button", "data-variant": "ghost", "data-testid": "open-navigation", "aria-label": t("action.openNavigation"), "aria-haspopup": "dialog", onClick: openNavigation, children: _jsx("span", { "aria-hidden": "true", className: "shell-nav-icon", children: "\u2630" }) })) : null, _jsx("span", { className: "shell-header-brand", "data-testid": "product-name", children: t("product.name") }), _jsxs("div", { className: "shell-header-actions", children: [_jsx("div", { className: "shell-theme-controls", role: "group", "aria-label": t("action.theme.label"), children: THEME_MODE_VALUES.map((mode) => (_jsx("button", { type: "button", className: "shell-segment", "data-active": themeMode === mode, "aria-pressed": themeMode === mode, "aria-label": `${t("action.theme.label")}: ${t(`action.theme.${mode}`)}`, onClick: () => handleTheme(mode), children: t(`action.theme.${mode}`) }, mode))) }), _jsx("div", { className: "shell-locale-controls", role: "group", "aria-label": t("action.locale.label"), children: LOCALE_VALUES.map((code) => (_jsx("button", { type: "button", className: "shell-segment", "data-active": locale === code, "aria-pressed": locale === code, "aria-label": `${t("action.locale.label")}: ${t(`action.locale.${code}`)}`, onClick: () => handleLocale(code), children: t(`action.locale.${code}`) }, code))) }), shellMode === "public" ? (_jsxs(_Fragment, { children: [_jsx(Link, { className: "shell-button", "data-testid": "sign-in-entry", to: "/sign-in", "aria-label": t("action.signIn"), children: t("action.signIn") }), _jsx(Link, { className: "shell-button", "data-variant": "primary", "data-testid": "sign-up-entry", to: "/sign-up", "aria-label": t("action.signUp"), children: t("action.signUp") })] })) : (
                    // FR-043: the authenticated shell presents the account area.
                    _jsx("button", { type: "button", className: "shell-button", "data-testid": "account-entry", "aria-label": t("action.account"), children: t("action.account") }))] }), _jsx("span", { className: "shell-sr-only", "data-testid": "direction-indicator", "aria-hidden": "true", children: direction })] }));
}
