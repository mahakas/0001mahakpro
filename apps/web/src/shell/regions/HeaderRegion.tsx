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

import { useRef, type RefObject } from "react";
import { Link } from "react-router-dom";
import type { Locale, ThemeMode } from "@mahak/contracts";
import { THEME_MODE_VALUES, LOCALE_VALUES } from "@mahak/contracts";
import { useLocale } from "../../providers/LocaleProvider.js";
import { useTheme } from "../../providers/ThemeProvider.js";
import { useShellMode } from "../../providers/ShellModeProvider.js";
import { useViewportClass } from "../../providers/ViewportClassProvider.js";
import { useDirection } from "../../providers/DirectionProvider.js";
import { useAnnouncer } from "../accessibility/AnnouncementProvider.js";

export interface HeaderRegionProps {
  readonly onOpenNavigation?: () => void;
  /** Ref of the persistent drawer-open control, so focus returns to it
   * when the drawer closes (FR-039). */
  readonly drawerOpenerRef?: RefObject<HTMLButtonElement | null>;
}

export function HeaderRegion({ onOpenNavigation, drawerOpenerRef }: HeaderRegionProps) {
  const { t, locale, setLocale } = useLocale();
  const { themeMode, setThemeMode } = useTheme();
  const { shellMode } = useShellMode();
  const { isMobile } = useViewportClass();
  const { direction } = useDirection();
  const announce = useAnnouncer();
  const openerRef = useRef<HTMLButtonElement>(null);
  const openButtonRef = drawerOpenerRef ?? openerRef;

  const handleTheme = (mode: ThemeMode) => {
    setThemeMode(mode);
    announce(`${t("action.theme.label")}: ${t(`action.theme.${mode}`)}`);
  };

  const handleLocale = (next: Locale) => {
    setLocale(next);
    announce(`${t("action.locale.label")}: ${t(`action.locale.${next}`)}`);
  };

  const openNavigation = () => {
    openButtonRef.current?.focus();
    onOpenNavigation?.();
  };

  return (
    <header
      className="shell-header-region"
      data-region="header"
      // FR-034: the banner landmark.
      role="banner"
    >
      {/* FR-019: the persistent control that opens the mobile drawer. */}
      {isMobile ? (
        <button
          ref={openButtonRef}
          type="button"
          className="shell-button"
          data-variant="ghost"
          data-testid="open-navigation"
          aria-label={t("action.openNavigation")}
          aria-haspopup="dialog"
          onClick={openNavigation}
        >
          <span aria-hidden="true" className="shell-nav-icon">
            ☰
          </span>
        </button>
      ) : null}

      <span className="shell-header-brand" data-testid="product-name">
        {t("product.name")}
      </span>

      <div className="shell-header-actions">
        {/* FR-029 / FR-060: theme is a shell-level global action. */}
        <div className="shell-theme-controls" role="group" aria-label={t("action.theme.label")}>
          {THEME_MODE_VALUES.map((mode) => (
            <button
              key={mode}
              type="button"
              className="shell-segment"
              data-active={themeMode === mode}
              aria-pressed={themeMode === mode}
              aria-label={`${t("action.theme.label")}: ${t(`action.theme.${mode}`)}`}
              onClick={() => handleTheme(mode)}
            >
              {t(`action.theme.${mode}`)}
            </button>
          ))}
        </div>

        {/* FR-023 / FR-061: the language control drives layout direction. */}
        <div className="shell-locale-controls" role="group" aria-label={t("action.locale.label")}>
          {LOCALE_VALUES.map((code) => (
            <button
              key={code}
              type="button"
              className="shell-segment"
              data-active={locale === code}
              aria-pressed={locale === code}
              aria-label={`${t("action.locale.label")}: ${t(`action.locale.${code}`)}`}
              onClick={() => handleLocale(code)}
            >
              {t(`action.locale.${code}`)}
            </button>
          ))}
        </div>

        {/* FR-058 / A-08: public entry points live in the header. R01
            implements no authentication — these are contract entry points
            that R02 will wire to real sign-in (FR-046). */}
        {shellMode === "public" ? (
          <>
            <Link
              className="shell-button"
              data-testid="sign-in-entry"
              to="/sign-in"
              aria-label={t("action.signIn")}
            >
              {t("action.signIn")}
            </Link>
            <Link
              className="shell-button"
              data-variant="primary"
              data-testid="sign-up-entry"
              to="/sign-up"
              aria-label={t("action.signUp")}
            >
              {t("action.signUp")}
            </Link>
          </>
        ) : (
          // FR-043: the authenticated shell presents the account area.
          <button
            type="button"
            className="shell-button"
            data-testid="account-entry"
            aria-label={t("action.account")}
          >
            {t("action.account")}
          </button>
        )}
      </div>

      {/* Direction is surfaced for observability/assertion by the suites; it is
          derived from the active language (FR-061) and is not a per-region
          concern. */}
      <span className="shell-sr-only" data-testid="direction-indicator" aria-hidden="true">
        {direction}
      </span>
    </header>
  );
}
