"use client";

import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";
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
  enter: (direction: number) => ({
    opacity: 0,
    x: direction * 40,
    scale: 0.96,
    filter: "blur(8px)",
  }),
  center: { opacity: 1, x: 0, scale: 1, filter: "blur(0px)" },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction * -40,
    scale: 0.96,
    filter: "blur(8px)",
  }),
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
