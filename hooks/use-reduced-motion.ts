import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

interface LegacyMediaQueryList extends MediaQueryList {
  addListener: (listener: (e: MediaQueryListEvent) => void) => void;
  removeListener: (listener: (e: MediaQueryListEvent) => void) => void;
}

function subscribe(callback: () => void) {
  if (typeof window === "undefined" || !window.matchMedia) {
    return () => {};
  }

  const mql = window.matchMedia(QUERY);

  if (mql.addEventListener) {
    mql.addEventListener("change", callback);
    return () => mql.removeEventListener("change", callback);
  } else if ("addListener" in mql) {
    // Safari / WebKit legacy fallback
    const legacyMql = mql as LegacyMediaQueryList;
    legacyMql.addListener(callback);
    return () => legacyMql.removeListener(callback);
  }

  return () => {};
}

function getSnapshot(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) {
    return false;
  }
  return window.matchMedia(QUERY).matches;
}

function getServerSnapshot(): boolean {
  return false;
}

/**
 * Universal hook to detect if the user or device prefers reduced motion
 * (e.g. system accessibility setting, low battery mode).
 * Enables graceful degradation for Framer Motion transitions.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
