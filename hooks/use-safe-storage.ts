import { useCallback, useEffect, useState } from "react";

// In-memory fallback store when browser storage is blocked or in Private/Incognito mode
const memoryStore = new Map<string, string>();

const STORAGE_EVENT_NAME = "safe-storage-change";

function getStorage(type: "local" | "session"): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    const storage = type === "local" ? window.localStorage : window.sessionStorage;
    // Test if storage is actually writable (handles Safari Private Mode QuotaExceeded)
    const testKey = "__test_storage_access__";
    storage.setItem(testKey, "1");
    storage.removeItem(testKey);
    return storage;
  } catch {
    return null;
  }
}

export function readStorageItem<T>(
  key: string,
  initialValue: T,
  type: "local" | "session" = "local",
): T {
  const storage = getStorage(type);
  try {
    let raw: string | null = null;
    if (storage) {
      raw = storage.getItem(key);
    } else {
      raw = memoryStore.get(key) ?? null;
    }

    if (raw === null) {
      return initialValue;
    }
    return JSON.parse(raw) as T;
  } catch {
    return initialValue;
  }
}

export function writeStorageItem<T>(
  key: string,
  value: T,
  type: "local" | "session" = "local",
): void {
  const serialized = JSON.stringify(value);
  const storage = getStorage(type);

  try {
    if (storage) {
      storage.setItem(key, serialized);
    } else {
      memoryStore.set(key, serialized);
    }
  } catch {
    memoryStore.set(key, serialized);
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(STORAGE_EVENT_NAME, {
        detail: { key, value },
      }),
    );
  }
}

export function removeStorageItem(
  key: string,
  type: "local" | "session" = "local",
): void {
  const storage = getStorage(type);
  try {
    if (storage) {
      storage.removeItem(key);
    }
    memoryStore.delete(key);
  } catch {
    memoryStore.delete(key);
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(STORAGE_EVENT_NAME, {
        detail: { key, value: null },
      }),
    );
  }
}

/**
 * Universal, Private-Browsing-safe localStorage & sessionStorage hook.
 * Resilient against `QuotaExceededError` and blocked storage policies in Safari, Chrome Incognito, and Firefox.
 * Syncs seamlessly across components and browser tabs.
 */
export function useSafeStorage<T>(
  key: string,
  initialValue: T,
  storageType: "local" | "session" = "local",
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    return readStorageItem<T>(key, initialValue, storageType);
  });

  const setValue = useCallback(
    (valueOrFn: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const nextValue =
          typeof valueOrFn === "function"
            ? (valueOrFn as (prev: T) => T)(prev)
            : valueOrFn;
        writeStorageItem(key, nextValue, storageType);
        return nextValue;
      });
    },
    [key, storageType],
  );

  const removeValue = useCallback(() => {
    removeStorageItem(key, storageType);
    setStoredValue(initialValue);
  }, [key, initialValue, storageType]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Listen to local in-app updates
    const handleLocalChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ key: string; value: T }>;
      if (customEvent.detail && customEvent.detail.key === key) {
        setStoredValue(
          customEvent.detail.value !== null
            ? customEvent.detail.value
            : initialValue,
        );
      }
    };

    // Listen to cross-tab storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key) {
        try {
          const parsed = e.newValue ? (JSON.parse(e.newValue) as T) : initialValue;
          setStoredValue(parsed);
        } catch {
          setStoredValue(initialValue);
        }
      }
    };

    window.addEventListener(STORAGE_EVENT_NAME, handleLocalChange);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener(STORAGE_EVENT_NAME, handleLocalChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}
