import { useEffect, useState } from "react";

const imageCache = new Set<string>();

export interface UseImagePreloadReturn {
  isLoaded: boolean;
  hasError: boolean;
  progress: number;
}

/**
 * Preloads single or multiple image URLs in the background.
 * Eliminates layout shifts, blank flickers, and stutter during hero transitions or storefront view changes.
 */
export function useImagePreload(
  srcOrSrcs: string | string[],
): UseImagePreloadReturn {
  const sourcesKey = Array.isArray(srcOrSrcs) ? srcOrSrcs.filter(Boolean).join(",") : srcOrSrcs || "";
  const sources = sourcesKey ? sourcesKey.split(",") : [];
  const total = sources.length;

  const [loadedCount, setLoadedCount] = useState<number>(() => {
    if (typeof window === "undefined" || total === 0) return 0;
    return sources.filter((s) => imageCache.has(s)).length;
  });
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !sourcesKey) return;

    let isMounted = true;
    const currentSources = sourcesKey.split(",");
    const uncompleted = currentSources.filter((s) => !imageCache.has(s));

    if (uncompleted.length === 0) {
      return;
    }

    uncompleted.forEach((src) => {
      const img = new Image();
      img.src = src;

      img.onload = () => {
        imageCache.add(src);
        if (isMounted) {
          setLoadedCount((c) => c + 1);
        }
      };

      img.onerror = () => {
        if (isMounted) {
          setHasError(true);
        }
      };
    });

    return () => {
      isMounted = false;
    };
  }, [sourcesKey]);

  const isLoaded = total === 0 || loadedCount >= total;
  const progress = total > 0 ? Math.min(100, Math.round((loadedCount / total) * 100)) : 100;

  return { isLoaded, hasError, progress };
}
