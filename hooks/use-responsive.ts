import { useSyncExternalStore } from "react";

export type Breakpoint = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

interface LegacyMediaQueryList extends MediaQueryList {
  addListener: (listener: (e: MediaQueryListEvent) => void) => void;
  removeListener: (listener: (e: MediaQueryListEvent) => void) => void;
}

/**
 * Universal media query subscriber with passive event listeners and legacy WebKit fallbacks.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = (callback: () => void) => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return () => {};
    }

    const mql = window.matchMedia(query);

    if (mql.addEventListener) {
      mql.addEventListener("change", callback);
      return () => mql.removeEventListener("change", callback);
    } else if ("addListener" in mql) {
      // Legacy WebKit / Safari fallback
      const legacyMql = mql as LegacyMediaQueryList;
      legacyMql.addListener(callback);
      return () => legacyMql.removeListener(callback);
    }

    return () => {};
  };

  const getSnapshot = () => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return false;
    }
    return window.matchMedia(query).matches;
  };

  const getServerSnapshot = () => false;

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export interface UseResponsiveReturn {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isWide: boolean;
  breakpoint: Breakpoint;
}

/**
 * Universal responsive state hook mapped strictly to Tailwind CSS v4 breakpoints.
 * Reactive across window resize and orientation changes with zero lag.
 */
export function useResponsive(): UseResponsiveReturn {
  const isSm = useMediaQuery(`(min-width: ${BREAKPOINTS.sm}px)`);
  const isMd = useMediaQuery(`(min-width: ${BREAKPOINTS.md}px)`);
  const isLg = useMediaQuery(`(min-width: ${BREAKPOINTS.lg}px)`);
  const isXl = useMediaQuery(`(min-width: ${BREAKPOINTS.xl}px)`);
  const is2Xl = useMediaQuery(`(min-width: ${BREAKPOINTS["2xl"]}px)`);

  let breakpoint: Breakpoint = "xs";
  if (is2Xl) breakpoint = "2xl";
  else if (isXl) breakpoint = "xl";
  else if (isLg) breakpoint = "lg";
  else if (isMd) breakpoint = "md";
  else if (isSm) breakpoint = "sm";

  return {
    isMobile: !isMd,
    isTablet: isMd && !isLg,
    isDesktop: isLg,
    isWide: isXl,
    breakpoint,
  };
}
