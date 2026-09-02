import { useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);

  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getSnapshot(): boolean {
  if (typeof navigator === "undefined") {
    return true;
  }
  return navigator.onLine;
}

function getServerSnapshot(): boolean {
  return true;
}

/**
 * Universal online/offline network connectivity hook.
 * Reacts immediately to connection drops, airplane mode, and reconnections.
 */
export function useOnlineStatus(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
