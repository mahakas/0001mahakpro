/**
 * DestinationIcon — a small, dependency-free glyph per reserved module, so the
 * compact rail keeps every destination reachable when labels are hidden
 * (FR-009). Glyphs are decorative: the accessible name always comes from the
 * externalized label (FR-036).
 */

import type { ReactElement } from "react";
import type { ModuleId } from "@mahak/contracts";

const GLYPHS: Record<ModuleId, ReactElement> = {
  GENERAL_CHAT: (
    <path d="M3 5h14v9H8l-5 4V5z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
  ),
  CONVERSATIONS: (
    <>
      <path d="M3 4.5h9v8H3z" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 16.5h9v-8h-3" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </>
  ),
  PROJECTS: (
    <>
      <rect x="3" y="3.5" width="6" height="6" rx="1" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <rect x="11" y="3.5" width="6" height="6" rx="1" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <rect x="3" y="10.5" width="6" height="6" rx="1" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <rect x="11" y="10.5" width="6" height="6" rx="1" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </>
  ),
  PRIVATE_TEACHER: (
    <>
      <circle cx="10" cy="7" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3.5 16.5c.8-3 3.4-4.5 6.5-4.5s5.7 1.5 6.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M15.5 4.5l3 1.5-3 1.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </>
  ),
  FILES: (
    <>
      <path d="M4 3.5h7l5 4.5v8.5H4z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M11 3.5V8h5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </>
  ),
  SEARCH: (
    <>
      <circle cx="9" cy="9" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12.5 12.5L17 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </>
  ),
  SETTINGS: (
    <>
      <circle cx="10" cy="10" r="2.6" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M10 2.5v2.2M10 15.3v2.2M2.5 10h2.2M15.3 10h2.2M4.7 4.7l1.6 1.6M13.7 13.7l1.6 1.6M15.3 4.7l-1.6 1.6M6.3 13.7l-1.6 1.6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </>
  ),
  ADMIN_CONTROL_CENTER: (
    <>
      <path d="M10 2.5l6.5 2.5v5c0 4-3 6.4-6.5 7.5C6.5 16.4 3.5 14 3.5 10V5L10 2.5z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M7.2 10l2 2 3.6-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  KNOWLEDGE: (
    <>
      <path d="M3 4.5h6a2 2 0 0 1 1.5 1V16a2.4 2.4 0 0 0-1.5-1H3z" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M17 4.5h-6a2 2 0 0 0-1.5 1V16a2.4 2.4 0 0 1 1.5-1h6z" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </>
  ),
  MEMORY: (
    <>
      <rect x="3.5" y="5" width="13" height="9" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6.5 5V3.5M13.5 5V3.5M6.5 17.5V14M13.5 17.5V14M3.5 9.5h13" stroke="currentColor" strokeWidth="1.5" />
    </>
  ),
  VOICE: (
    <>
      <rect x="7.5" y="3" width="5" height="9" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4.5 9.5a5.5 5.5 0 0 0 11 0M10 15.5v2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </>
  ),
  AI_MODEL_GATEWAY: (
    <>
      <rect x="2.8" y="4" width="14.4" height="9" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 13.5v3M14 13.5v3M10 4v9" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="6" cy="8" r="1" fill="currentColor" />
      <circle cx="14" cy="8" r="1" fill="currentColor" />
    </>
  ),
};

export interface DestinationIconProps {
  readonly moduleId: ModuleId;
}

export function DestinationIcon({ moduleId }: DestinationIconProps) {
  return (
    <svg
      className="shell-nav-icon"
      viewBox="0 0 20 20"
      width="20"
      height="20"
      aria-hidden="true"
      focusable="false"
    >
      {GLYPHS[moduleId]}
    </svg>
  );
}
