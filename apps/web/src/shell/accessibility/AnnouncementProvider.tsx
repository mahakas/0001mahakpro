/**
 * AnnouncementProvider — communicates shell state changes to assistive
 * technology (FR-040).
 *
 * Sidebar collapsed/expanded, drawer opened/closed, and theme changes are
 * announced through a polite live region. The provider sits outermost so both
 * the presentation providers and the shell regions can announce.
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type Announce = (message: string) => void;

const AnnouncerContext = createContext<Announce>(() => {
  /* no-op outside a provider */
});

export interface AnnouncementProviderProps {
  readonly children?: ReactNode;
}

export function AnnouncementProvider({ children }: AnnouncementProviderProps) {
  const [message, setMessage] = useState<string>("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const announce = useCallback<Announce>((next) => {
    // Clear-then-set so repeated identical messages re-announce.
    setMessage("");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(next), 30);
  }, []);

  const value = useMemo(() => announce, [announce]);

  return (
    <AnnouncerContext.Provider value={value}>
      {children}
      <div className="shell-sr-only" role="status" aria-live="polite" data-testid="shell-announcer">
        {message}
      </div>
    </AnnouncerContext.Provider>
  );
}

export function useAnnouncer(): Announce {
  return useContext(AnnouncerContext);
}
