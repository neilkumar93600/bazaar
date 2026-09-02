import { useCallback, useEffect, useRef, useState } from "react";

export interface UseInViewOptions {
  root?: Element | Document | null;
  rootMargin?: string;
  threshold?: number | number[];
  triggerOnce?: boolean;
  initialInView?: boolean;
}

export interface UseInViewReturn<T extends HTMLElement = HTMLElement> {
  ref: (node: T | null) => void;
  inView: boolean;
  entry: IntersectionObserverEntry | null;
}

/**
 * Universal IntersectionObserver hook for lazy-rendering offscreen UI,
 * infinite scroll triggers, and scroll-reveals.
 * Works across Chrome, Safari, Firefox, Edge, and iOS/Android WebViews.
 */
export function useInView<T extends HTMLElement = HTMLElement>(
  options: UseInViewOptions = {},
): UseInViewReturn<T> {
  const {
    root = null,
    rootMargin = "0px",
    threshold = 0,
    triggerOnce = false,
    initialInView = false,
  } = options;

  const [inView, setInView] = useState<boolean>(initialInView);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);

  const nodeRef = useRef<T | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const hasTriggeredRef = useRef(false);

  const setNode = useCallback(
    (node: T | null) => {
      nodeRef.current = node;

      // Disconnect previous observer
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      if (!node) return;
      if (triggerOnce && hasTriggeredRef.current) return;

      // Fallback if IntersectionObserver is not supported
      if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
        setInView(true);
        return;
      }

      const observer = new IntersectionObserver(
        (entries) => {
          const currentEntry = entries[0];
          if (!currentEntry) return;

          const isIntersecting = currentEntry.isIntersecting;
          setInView(isIntersecting);
          setEntry(currentEntry);

          if (isIntersecting && triggerOnce) {
            hasTriggeredRef.current = true;
            observer.disconnect();
          }
        },
        { root, rootMargin, threshold },
      );

      observer.observe(node);
      observerRef.current = observer;
    },
    [root, rootMargin, threshold, triggerOnce],
  );

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return { ref: setNode, inView, entry };
}
