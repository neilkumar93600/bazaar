"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { LogOut, Menu, Search, ShoppingCart } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/ui/logo";
import { ScrollProgress } from "@/components/ui/motion";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { NotificationBell } from "@/components/dashboard/NotificationBell";
import { UserMenu } from "@/components/layout/UserMenu";
import type { NotificationItem } from "@/lib/data/notifications";
import { signOut } from "@/app/dashboard/actions";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Bazaar" },
  { href: "/auctions", label: "Auctions" },
  { href: "#vibe-feed", label: "Feed" },
];

const EASE = [0.16, 1, 0.3, 1] as const;

/** id of the hero <section> in components/home/Hero.tsx */
const HERO_ID = "auro-header-section";

/**
 * True whenever the hero is no longer behind the navbar — i.e. on any page that
 * has no hero, and on the homepage once you've scrolled past it. Observing the
 * hero itself means the threshold tracks its real height (100dvh on desktop,
 * min-h-[700px] on short viewports) instead of a magic scroll offset.
 */
function usePastHero(isHome: boolean) {
  const [pastHero, setPastHero] = useState(!isHome);
  const [lastIsHome, setLastIsHome] = useState(isHome);

  // Client-side route change: reset during render rather than in an effect, so
  // the bar never paints a frame in the outgoing route's state.
  if (lastIsHome !== isHome) {
    setLastIsHome(isHome);
    setPastHero(!isHome);
  }

  useEffect(() => {
    if (!isHome) return;

    // The hero can't be observed directly on mount: the layout shell (this bar)
    // flushes before the streamed page body, so getElementById is still null
    // here and an effect that bailed on that would never re-run. Measure it
    // lazily instead, seeded with the viewport height the hero targets anyway
    // (lg:h-[100dvh]), and re-measure whenever the body resizes — which is
    // exactly when the streamed content lands.
    let threshold = window.innerHeight;

    const update = () => setPastHero(window.scrollY >= threshold - 80);

    const measure = () => {
      // Coupled to Hero's section id. Any route without one keeps the seeded
      // viewport-height threshold rather than sticking on the expanded bar.
      const hero = document.getElementById(HERO_ID);
      if (hero) threshold = hero.offsetTop + hero.offsetHeight;
      update();
    };

    measure();
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(document.body);
    window.addEventListener("scroll", update, { passive: true });

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("scroll", update);
    };
  }, [isHome]);

  return pastHero;
}

type NavbarUser = {
  displayName: string | null;
  handle: string;
  avatarUrl: string | null;
};

function LiquidGlassButton({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="btn-ember group relative overflow-hidden outline-none transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.03] active:scale-[0.98] flex p-[10px_22px] justify-center items-center cursor-pointer rounded-full"
    >
      {/* Filter node only — its paint lives in .liquid-glass-refract. */}
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          <filter id="liquid-glass-refraction" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves={3} result="noise" seed={5} />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale={7} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>
      <div className="liquid-glass-refract absolute inset-0 rounded-full transition-all duration-500 ease-out pointer-events-none" />
      <div className="liquid-glass-sheen absolute inset-0 rounded-full transition-opacity duration-300 pointer-events-none" />
      <div className="liquid-glass-caustic absolute inset-[-40%] rounded-full opacity-20 pointer-events-none mix-blend-overlay" />
      <div className="liquid-glass-rim absolute inset-0 rounded-full border pointer-events-none transition-all duration-500" />
      <div className="liquid-glass-breath absolute inset-0 rounded-full bg-gradient-to-b from-white/[0.06] via-transparent to-black/[0.04] pointer-events-none transition-all duration-500" />
      <div className="relative z-10 flex items-center justify-center w-full h-full">
        <span className="relative block overflow-hidden h-[25px] leading-[25px] text-center text-[18px] font-medium tracking-[-0.4px]">
          <span className="block transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-full">
            {label}
          </span>
          <span className="absolute top-full left-0 block transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-full whitespace-nowrap">
            {label}
          </span>
        </span>
      </div>
    </Link>
  );
}

function SearchPopover({ onHero }: { onHero?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  function submit() {
    const trimmed = query.trim();
    if (!trimmed) return;
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button variant="ghost" size="icon" className={onHero ? "text-foreground/80 hover:text-foreground hover:bg-foreground/10 rounded-full" : undefined}>
            <Search className="w-5 h-5" />
            <span className="sr-only">Search</span>
          </Button>
        }
      />
      <PopoverContent align="center" className="w-72 rounded-2xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="flex gap-2"
        >
          <Input
            autoFocus
            placeholder="Search designs, creators..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="bg-secondary border-border text-foreground placeholder:text-muted-foreground rounded-xl"
          />
          <Button type="submit" size="icon" variant="ghost" className="text-foreground hover:bg-foreground/10 rounded-xl">
            <Search className="w-4 h-4" />
            <span className="sr-only">Submit search</span>
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}

export function Navbar({
  user,
  notifications,
}: {
  user?: NavbarUser | null;
  notifications?: { items: NotificationItem[]; unreadCount: number } | null;
}) {
  const shouldReduceMotion = useReducedMotion();
  const pathname = usePathname();
  const isLoggedIn = Boolean(user);
  const isHome = pathname === "/";
  const pastHero = usePastHero(isHome);
  // Over the hero video the bar is chromeless with light text; everywhere else
  // it collapses into a solid floating pill with normal foreground text.
  const onHero = isHome && !pastHero;

  return (
    <motion.header
      className={cn(
        "z-50 w-full px-4 sm:px-6 lg:px-8",
        isHome ? "fixed inset-x-0 top-0" : "sticky top-0",
      )}
      initial={shouldReduceMotion ? false : { opacity: 0, y: -12 }}
      animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
    >
      <motion.div
        className="relative mx-auto w-full"
        animate={{
          maxWidth: onHero ? 1720 : 1040,
          marginTop: onHero ? 22 : 12,
          marginBottom: onHero ? 0 : 12,
          paddingLeft: onHero ? 8 : 20,
          paddingRight: onHero ? 8 : 20,
          paddingTop: onHero ? 0 : 8,
          paddingBottom: onHero ? 0 : 8,
        }}
        transition={
          shouldReduceMotion
            ? { duration: 0 }
            : { duration: 0.45, ease: EASE }
        }
      >
        {/* Pill chrome. Faded rather than class-toggled so the border, blur and
            shadow cross-dissolve instead of popping at the threshold. */}
        <motion.div
          aria-hidden
          className="glass-surface pointer-events-none absolute inset-0 rounded-full border bg-card"
          animate={{ opacity: onHero ? 0 : 1 }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { duration: 0.45, ease: EASE }
          }
        />

        <nav className="relative z-10 flex w-full items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center">
            <Logo textClassName={onHero ? "text-foreground font-semibold text-xl" : undefined} />
          </div>

          {/* Center Floating Navigation Pill */}
          <div
            className={cn(
              "hidden lg:flex p-[10px_16px] items-center gap-[24px] rounded-full transition-colors duration-500",
              // Inside the collapsed pill this second pill would read as a
              // double border, so it drops its own background.
              onHero ? "glass-panel" : "bg-transparent",
            )}
          >
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative cursor-pointer text-center text-[18px] tracking-[-0.2px] transition-all duration-300 font-sans",
                    isActive && "font-semibold",
                    onHero
                      ? isActive
                        ? "text-foreground"
                        : "text-foreground/80 font-normal hover:text-foreground"
                      : isActive
                        ? "text-foreground"
                        : "text-foreground/80 font-normal hover:text-foreground"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
            <SearchPopover onHero={onHero} />
          </div>

          {/* Action Controls & Liquid Glass Button */}
          <div className="hidden lg:flex items-center gap-3">
            {isLoggedIn ? (
              <>
                <NotificationBell
                  items={notifications?.items ?? []}
                  unreadCount={notifications?.unreadCount ?? 0}
                />
                <Button variant="ghost" size="icon" render={<Link href="/cart" />} className={onHero ? "text-foreground/80 hover:text-foreground hover:bg-foreground/10 rounded-full" : undefined}>
                  <ShoppingCart className="w-5 h-5" />
                  <span className="sr-only">Cart</span>
                </Button>
                <UserMenu
                  displayName={user!.displayName}
                  handle={user!.handle}
                  avatarUrl={user!.avatarUrl}
                />
              </>
            ) : (
              <LiquidGlassButton href="/signup" label="Get Started" />
            )}
          </div>

          {/* Mobile Toggle */}
          <div className="flex lg:hidden items-center gap-2">
            <SearchPopover onHero={onHero} />
            <Sheet>
              <SheetTrigger
                render={
                  <button
                    className={cn(
                      "flex lg:hidden p-2 rounded-full border backdrop-blur-md transition-colors duration-500",
                      onHero
                        ? "glass-panel text-foreground"
                        : "bg-transparent text-foreground border-border/60",
                    )}
                  >
                    <Menu className="w-5 h-5" />
                    <span className="sr-only">Open menu</span>
                  </button>
                }
              />
              <SheetContent side="right" className="flex flex-col gap-1 p-0 border-border text-foreground">
                <SheetHeader className="border-b border-border p-4">
                  <SheetTitle>
                    <Logo textClassName="text-foreground" />
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-1 p-4">
                  {NAV_LINKS.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="rounded-md px-3 py-2.5 text-muted-foreground hover:text-foreground hover:bg-accent"
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
                <div className="mt-auto flex flex-col gap-2 border-t border-border p-4">
                  {isLoggedIn ? (
                    <Link href="/dashboard" className="rounded-md px-3 py-2.5 text-muted-foreground hover:text-foreground">
                      Dashboard
                    </Link>
                  ) : (
                    <>
                      <Button variant="ghost" render={<Link href="/login" />} className="text-foreground hover:bg-accent">
                        Sign in
                      </Button>
                      <Button render={<Link href="/signup" />} className="btn-ember rounded-full">
                        Get Started
                      </Button>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </motion.div>
    </motion.header>
  );
}
