/**
 * NavDrawer — the mobile overlay navigation drawer (FR-019, FR-020, FR-022,
 * FR-026, FR-039, FR-040, NFR-003).
 *
 * - Mobile navigation consumes no permanent screen space; it opens as an
 *   overlay via the persistent header control (FR-019).
 * - Dismissible by its close affordance, by selecting a destination, and by
 *   activating the scrim/backdrop (FR-020).
 * - Focus moves in on open and returns to the opening control on close
 *   (FR-039); Tab stays inside the intentionally modal drawer (FR-038).
 * - Crossing to the tablet/desktop class closes it with no residual overlay or
 *   scrim (FR-022).
 * - Anchored to the correct side in both directions via logical properties
 *   (FR-026), and open/close visibly completes within 300 ms (NFR-003).
 */

import { useEffect, useState, type RefObject } from "react";
import { Link } from "react-router-dom";
import { useNavigation } from "./NavigationRegistry.js";
import { useLocale } from "../../providers/LocaleProvider.js";
import { useViewportClass } from "../../providers/ViewportClassProvider.js";
import { useAnnouncer } from "../accessibility/AnnouncementProvider.js";
import { FocusTrap } from "../accessibility/FocusTrap.js";
import { DestinationIcon } from "./DestinationIcon.js";

export interface NavDrawerProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly openerRef?: RefObject<HTMLButtonElement | null>;
}

export function NavDrawer({ open, onClose, openerRef }: NavDrawerProps) {
  const { visibleDestinations, activeDestinationId, activate } = useNavigation();
  const { t } = useLocale();
  const { isMobile } = useViewportClass();
  const announce = useAnnouncer();

  // Two-phase mount so open AND close animate (NFR-003): the panel stays in the
  // DOM only while it can be seen, so a closed drawer is never focusable
  // (FR-038) and never leaves a residual overlay (FR-022).
  const [rendered, setRendered] = useState<boolean>(open);
  const [revealed, setRevealed] = useState<boolean>(false);

  useEffect(() => {
    if (open) {
      setRendered(true);
      const frame = requestAnimationFrame(() => setRevealed(true));
      return () => cancelAnimationFrame(frame);
    }
    setRevealed(false);
    const timeout = setTimeout(() => setRendered(false), 260);
    return () => clearTimeout(timeout);
  }, [open]);

  // FR-022: leaving the mobile class dismisses the drawer cleanly.
  useEffect(() => {
    if (!isMobile && open) {
      onClose();
    }
  }, [isMobile, open, onClose]);

  // FR-040: announce drawer state changes to assistive technology.
  useEffect(() => {
    if (!rendered) return;
    announce(open ? t("action.openNavigation") : t("action.closeNavigation"));
  }, [open, rendered, announce, t]);

  if (!rendered) return null;

  const handleSelect = (destinationId: string) => {
    activate(destinationId);
    onClose();
  };

  return (
    <>
      <div
        className="shell-scrim"
        data-open={revealed}
        data-testid="navigation-scrim"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="shell-drawer"
        data-open={revealed}
        data-testid="navigation-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={t("region.sidebar")}
        // A closed drawer is inert so it leaves the tab order (FR-038).
        inert={!revealed}
      >
        <FocusTrap active={open} onRequestClose={onClose} openerRef={openerRef}>
          <div className="shell-drawer-header">
            <span className="shell-header-brand">{t("product.name")}</span>
            <button
              type="button"
              className="shell-button"
              data-variant="ghost"
              data-testid="close-navigation"
              aria-label={t("action.closeNavigation")}
              onClick={onClose}
            >
              <span aria-hidden="true" className="shell-nav-icon">
                ✕
              </span>
            </button>
          </div>
          <nav aria-label={t("region.sidebar")}>
            <ul className="shell-nav-list">
              {visibleDestinations.map((destination) => {
                const isActive = activeDestinationId === destination.id;
                return (
                  <li className="shell-nav-item" key={destination.id}>
                    <Link
                      to={destination.routePath}
                      className="shell-nav-link"
                      data-active={isActive}
                      aria-current={isActive ? "page" : undefined}
                      data-destination-id={destination.id}
                      onClick={() => handleSelect(destination.id)}
                    >
                      <DestinationIcon moduleId={destination.moduleId} />
                      <span className="shell-nav-label">{t(destination.labelKey)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </FocusTrap>
      </div>
    </>
  );
}
