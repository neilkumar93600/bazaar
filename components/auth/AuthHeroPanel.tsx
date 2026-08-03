"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { LogoIcon } from "@/components/ui/logo";

const CAROUSEL_ITEMS = [
  {
    quote:
      "EVERY DESIGN IS ONE-OF-ONE. CLAIM IT AND IT'S EXCLUSIVELY YOURS, WITH A ROYALTY ON EVERY RESALE.",
    author: "SHIRT BAZAAR ATELIER",
  },
  {
    quote:
      "DISCOVER & COLLECT LIMITED EDITION STREETWEAR CREATED BY INDEPENDENT ARTISTS WORLDWIDE.",
    author: "CREATOR COLLECTIVE",
  },
  {
    quote:
      "REAL-TIME MARKET UPDATES, RESALE ALERTS AND PORTFOLIO TRACKING FOR FASHION CREATORS.",
    author: "INSIGHTS & ANALYTICS",
  },
  {
    quote:
      "THE FUTURE OF DIGITAL APPAREL OWNERSHIP. CLAIM YOUR VIBE AND OWN YOUR UNIQUE CREATIONS.",
    author: "DIGITAL BAZAAR",
  },
];

export function AuthHeroPanel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % CAROUSEL_ITEMS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative hidden h-full w-full overflow-hidden bg-pitch lg:block">
      {/* Background Image with Warm/Sage Editorial Overlay */}
      <Image
        src="https://picsum.photos/seed/dusk-atelier-3/1200/1500"
        alt="Shirt Bazaar Fashion Atelier"
        fill
        sizes="50vw"
        priority
        className="object-cover object-center filter contrast-[1.05] brightness-[0.85] saturate-[0.85]"
      />

      {/* Dark Ambient Gradient Overlay matching Image 1 */}
      <div className="absolute inset-0 bg-gradient-to-t from-pitch/90 via-pitch/40 to-pitch/50" />
      <div className="absolute inset-0 bg-hero-atmosphere" />

      {/* Center Floating Glassmorphic Emblem Badge */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          animate={shouldReduceMotion ? undefined : { y: [0, -12, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
          className="pointer-events-auto"
        >
          <motion.div
            whileHover={{ scale: 1.06 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="size-44 sm:size-48 rounded-full glass-panel border shadow-[var(--shadow-card)] flex flex-col items-center justify-center p-6 text-center hover:border-foreground/30"
          >
            {/* User Provided Brand SVG Mark */}
            <LogoIcon className="w-14 h-8 text-foreground drop-shadow-md" />
            <span className="mt-2 text-xs sm:text-sm font-black tracking-widest text-foreground uppercase font-sans">
              SHIRT BAZAAR.
            </span>
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom Quote & Carousel Pagination */}
      <div className="absolute bottom-10 left-8 right-8 flex flex-col items-center gap-6 text-center z-10">
        <div className="max-w-xl min-h-[72px] flex items-center justify-center px-4">
          <AnimatePresence mode="wait">
            <motion.p
              key={activeIndex}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="text-xs sm:text-sm font-medium tracking-wide text-foreground/80 uppercase leading-relaxed font-sans"
            >
              &quot;{CAROUSEL_ITEMS[activeIndex].quote}&quot;
            </motion.p>
          </AnimatePresence>
        </div>

        {/* 4-Bar Carousel Indicators */}
        <div className="flex items-center gap-2">
          {CAROUSEL_ITEMS.map((_, idx) => (
            <motion.button
              key={idx}
              type="button"
              onClick={() => setActiveIndex(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              animate={{ width: idx === activeIndex ? 40 : 24 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={`h-1 rounded-full ${
                idx === activeIndex ? "bg-card shadow-xs" : "bg-card/30 hover:bg-card/60"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
