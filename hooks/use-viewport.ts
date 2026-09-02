import { useEffect, useState } from "react";

export interface ViewportDimensions {
  width: number;
  height: number;
  visualHeight: number;
  isKeyboardOpen: boolean;
}

const defaultDimensions: ViewportDimensions = {
  width: 0,
  height: 0,
  visualHeight: 0,
  isKeyboardOpen: false,
};

/**
 * Universal dynamic viewport hook.
 * Handles iOS Safari / Android Chrome address bar expansion/collapse
 * and on-screen virtual keyboards using standard window.visualViewport.
 * Automatically synchronizes the `--app-height` CSS custom property.
 */
export function useViewport(): ViewportDimensions {
  const [dimensions, setDimensions] = useState<ViewportDimensions>(() => {
    if (typeof window === "undefined") return defaultDimensions;
    const width = window.innerWidth;
    const height = window.innerHeight;
    const visualHeight = window.visualViewport?.height ?? height;
    return {
      width,
      height,
      visualHeight,
      isKeyboardOpen: height - visualHeight > 150,
    };
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    let rafId: number | null = null;

    const updateDimensions = () => {
      if (rafId !== null) cancelAnimationFrame(rafId);

      rafId = window.requestAnimationFrame(() => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const visualHeight = window.visualViewport?.height ?? height;
        const isKeyboardOpen = height - visualHeight > 150;

        // Set CSS custom property for seamless CSS layouts: height: var(--app-height, 100vh)
        document.documentElement.style.setProperty(
          "--app-height",
          `${visualHeight}px`,
        );

        setDimensions((prev) => {
          if (
            prev.width === width &&
            prev.height === height &&
            prev.visualHeight === visualHeight &&
            prev.isKeyboardOpen === isKeyboardOpen
          ) {
            return prev;
          }
          return { width, height, visualHeight, isKeyboardOpen };
        });
      });
    };

    updateDimensions();

    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener("resize", updateDimensions, { passive: true });
      vv.addEventListener("scroll", updateDimensions, { passive: true });
    }

    window.addEventListener("resize", updateDimensions, { passive: true });
    window.addEventListener("orientationchange", updateDimensions, { passive: true });

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      if (vv) {
        vv.removeEventListener("resize", updateDimensions);
        vv.removeEventListener("scroll", updateDimensions);
      }
      window.removeEventListener("resize", updateDimensions);
      window.removeEventListener("orientationchange", updateDimensions);
    };
  }, []);

  return dimensions;
}
