import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

const useIsomorphicEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Debounces a fast-changing state value by a specified delay (ms).
 * Ideal for search queries, filter inputs, and resizing calculations.
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Creates a debounced callback function that delays execution until after `delay` ms
 * have elapsed since the last time it was invoked. Includes cancel & flush methods.
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number,
) {
  const callbackRef = useRef(callback);
  useIsomorphicEffect(() => {
    callbackRef.current = callback;
  });

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const argsRef = useRef<Parameters<T> | null>(null);

  const cancel = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    argsRef.current = null;
  }, []);

  const flush = useCallback(() => {
    if (timerRef.current !== null && argsRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
      callbackRef.current(...argsRef.current);
      argsRef.current = null;
    }
  }, []);

  const debounced = useCallback(
    (...args: Parameters<T>) => {
      argsRef.current = args;
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        if (argsRef.current) {
          callbackRef.current(...argsRef.current);
          argsRef.current = null;
        }
      }, delay);
    },
    [delay],
  );

  useEffect(() => {
    return cancel;
  }, [cancel]);

  return {
    run: debounced,
    debounced,
    cancel,
    flush,
  };
}

/**
 * Creates a throttled callback that only invokes the function at most once per `limit` ms
 * (or once per animation frame if limit is 0/omitted).
 * Ensures smooth 60fps/120fps execution for scroll, resize, and mousemove listeners.
 */
export function useThrottle<T extends (...args: unknown[]) => unknown>(
  callback: T,
  limit = 0,
) {
  const callbackRef = useRef(callback);
  useIsomorphicEffect(() => {
    callbackRef.current = callback;
  });

  const inThrottleRef = useRef(false);
  const lastRanRef = useRef(0);
  const rafIdRef = useRef<number | null>(null);
  const timeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancel = useCallback(() => {
    inThrottleRef.current = false;
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    if (timeoutIdRef.current !== null) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
  }, []);

  const throttled = useCallback(
    (...args: Parameters<T>) => {
      if (limit <= 0 && typeof window !== "undefined" && window.requestAnimationFrame) {
        // Animation Frame Throttling (best for smooth rendering/scroll)
        if (inThrottleRef.current) return;
        inThrottleRef.current = true;
        rafIdRef.current = window.requestAnimationFrame(() => {
          callbackRef.current(...args);
          inThrottleRef.current = false;
        });
      } else {
        // Time-based throttling
        const now = Date.now();
        if (!inThrottleRef.current) {
          callbackRef.current(...args);
          lastRanRef.current = now;
          inThrottleRef.current = true;
        } else {
          if (timeoutIdRef.current !== null) {
            clearTimeout(timeoutIdRef.current);
          }
          const timeSinceLast = now - lastRanRef.current;
          const remaining = Math.max(0, limit - timeSinceLast);
          timeoutIdRef.current = setTimeout(() => {
            callbackRef.current(...args);
            lastRanRef.current = Date.now();
            inThrottleRef.current = false;
          }, remaining);
        }
      }
    },
    [limit],
  );

  useEffect(() => {
    return cancel;
  }, [cancel]);

  return {
    run: throttled,
    throttled,
    cancel,
  };
}
