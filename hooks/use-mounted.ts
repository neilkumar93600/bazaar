import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * Universal SSR hydration barrier hook.
 * Returns `false` on the server and initial SSR render, then `true` once mounted on client.
 * Eliminates React 19 hydration mismatches for browser-only components.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}
