"use client";

import { AnimatePresence, motion, type Variants } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

const ROUTE_ORDER = [
  "/login",
  "/signup",
  "/verify-otp",
  "/forgot-password",
  "/reset-password",
];

const variants: Variants = {
  // No blur filter. It was the only blur left on an otherwise printed surface,
  // and it rasterises the whole subtree per frame for an effect that reads as
  // a rendering fault at this size. Slide and fade carry the direction alone.
  enter: (direction: number) => ({ opacity: 0, x: direction * 24 }),
  center: { opacity: 1, x: 0 },
  exit: (direction: number) => ({ opacity: 0, x: direction * -24 }),
};

/** Directional, spring-driven crossfade between auth steps (login/signup/otp/reset). */
export function AuthTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();
  const [prevPathname, setPrevPathname] = useState(pathname);
  const [direction, setDirection] = useState(1);

  if (pathname !== prevPathname) {
    setDirection(
      ROUTE_ORDER.indexOf(pathname) >= ROUTE_ORDER.indexOf(prevPathname) ? 1 : -1,
    );
    setPrevPathname(pathname);
  }

  if (shouldReduceMotion) return <>{children}</>;

  return (
    <AnimatePresence mode="popLayout" initial={false} custom={direction}>
      <motion.div
        key={pathname}
        custom={direction}
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.8 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
