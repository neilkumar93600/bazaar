import { type RefObject, useEffect, useLayoutEffect, useRef } from "react";

type EventType = "pointerdown" | "mousedown" | "touchstart";

const useIsomorphicEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Universal click & touch outside detector.
 * Works seamlessly across mobile iOS/Android touch devices and desktop pointers.
 * Supports single RefObject or an array of RefObjects.
 */
export function useOnClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T | null> | RefObject<T | null>[],
  handler: (event: MouseEvent | TouchEvent | PointerEvent) => void,
  eventType: EventType = "pointerdown",
) {
  const handlerRef = useRef(handler);
  useIsomorphicEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const listener = (event: MouseEvent | TouchEvent | PointerEvent) => {
      const target = event.target as Node | null;
      if (!target || !target.isConnected) {
        return;
      }

      const refs = Array.isArray(ref) ? ref : [ref];
      const isInside = refs.some((r) => r.current && r.current.contains(target));

      if (!isInside) {
        handlerRef.current(event);
      }
    };

    document.addEventListener(eventType, listener, { passive: true });

    return () => {
      document.removeEventListener(eventType, listener);
    };
  }, [ref, eventType]);
}
