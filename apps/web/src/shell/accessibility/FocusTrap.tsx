/**
 * FocusTrap — drawer focus management (FR-039).
 *
 * When the mobile drawer opens, keyboard focus moves into it; when it closes,
 * focus returns to the control that opened it. Tab cycles within the drawer
 * (the intentionally modal region — FR-038 allows exactly this trap), and
 * Escape requests a close.
 *
 * Direction switching with the drawer open re-anchors without trapping focus
 * (spec edge case "Direction switch while the drawer is open"): the trap is
 * scoped to the drawer container, which itself is anchored by logical
 * properties, so the focusable elements stay valid across the mirror.
 */

import { type ReactNode, useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export interface FocusTrapProps {
  readonly active: boolean;
  readonly children: ReactNode;
  readonly onRequestClose: () => void;
  /** The element that opened the drawer; focus returns here on close. */
  readonly openerRef?: { current: HTMLElement | null };
}

function focusables(container: HTMLElement | null): HTMLElement[] {
  if (!container) return [];
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  ).filter((element) => element.offsetParent !== null || element === document.activeElement);
}

export function FocusTrap({ active, children, onRequestClose, openerRef }: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  // FR-039: move focus into the drawer on open.
  useEffect(() => {
    if (!active) return;
    const opener = openerRef?.current ?? null;
    previousFocus.current =
      (document.activeElement as HTMLElement | null) ?? opener;
    const container = containerRef.current;
    if (!container) return;
    const candidates = focusables(container);
    if (candidates.length > 0) {
      candidates[0].focus();
    } else {
      container.setAttribute("tabindex", "-1");
      container.focus();
    }

    return () => {
      // FR-039: return focus to the control that opened the drawer.
      const restore = previousFocus.current ?? opener;
      if (restore && document.contains(restore)) {
        restore.focus();
      }
    };
  }, [active, openerRef]);

  // Trap Tab / Shift+Tab and close on Escape.
  useEffect(() => {
    if (!active) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onRequestClose();
        return;
      }
      if (event.key !== "Tab") return;
      const container = containerRef.current;
      const candidates = focusables(container);
      if (candidates.length === 0) return;
      const first = candidates[0];
      const last = candidates[candidates.length - 1];
      if (event.shiftKey && (document.activeElement === first || !container?.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [active, onRequestClose]);

  return (
    <div ref={containerRef} className="shell-focus-trap">
      {children}
    </div>
  );
}
