"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Search, ShoppingCart } from "lucide-react";
import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/utils";

import { NotificationBell } from "@/components/dashboard/NotificationBell";
import { UserMenu } from "@/components/layout/UserMenu";
import type { NotificationItem } from "@/lib/data/notifications";

// Home is the feed now, so it needs no entry of its own beyond the logo — and
// the old "#vibe-feed" anchor would have pointed at the page you're already on.
const NAV_LINKS = [
  { href: "/", label: "Feed" },
  { href: "/shop", label: "Bazaar" },
];

const EASE = [0.16, 1, 0.3, 1] as const;

type NavbarUser = {
  displayName: string | null;
  handle: string;
  avatarUrl: string | null;
};

/** The search field, open in the bar rather than hidden behind an icon.
 *
 *  Below `md` the bar has no room for a field next to the links, so the icon
 *  survives there as a link straight to /search — the same destination the
 *  field submits to, one tap instead of a popover that would cover the page. */
function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <>
      <form onSubmit={submit} className="relative hidden md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--sf-muted,var(--color-muted-ink))]" />
        <Input
          type="search"
          name="q"
          aria-label="Search designs and creators"
          placeholder="Search designs, creators..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-9 w-48 rounded-[var(--sf-radius,8px)] border-border bg-secondary pl-9 text-body-sm text-foreground placeholder:text-muted-foreground lg:w-64"
        />
      </form>

      <Button variant="ghost" size="icon" className="md:hidden" render={<Link href="/search" />}>
        <Search className="w-5 h-5" />
        <span className="sr-only">Search</span>
      </Button>
    </>
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

  return (
    <motion.header
      // Brainfish's top bar: 67px of paper, no border and no shadow — "reads as
      // a single line on paper" — over the shared `max-w-page` container so the
      // nav lines up with page content instead of floating at its own width.
      // Opaque, since there's no rule to separate it from what scrolls under.
      // Sticky on every route, home included: the feed sizes itself against
      // this bar's 67px row, so a fixed bar would overlap the first cards.
      className="sticky top-0 z-50 w-full bg-background"
      initial={shouldReduceMotion ? false : { opacity: 0, y: -12 }}
      animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
    >
      <div className="mx-auto w-full max-w-page px-6 md:px-16">
        <nav className="relative z-10 flex h-[67px] w-full items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center">
            <Logo />
          </div>

          {/* Centre nav — Ghost Text Links, weight 500, ink. */}
          <div className="hidden items-center gap-6 lg:flex">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "cursor-pointer text-body-sm font-medium transition-colors",
                    isActive
                      ? "text-foreground"
                      // `text-[var(--sf-muted,var(--color-muted-ink))]`, not `text-muted` — the shadcn layer
                      // owns `--muted` as a cream *surface*, so `text-muted`
                      // would paint these links cream on white.
                      : "text-[var(--sf-muted,var(--color-muted-ink))] hover:text-foreground",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
            <SearchBar />
          </div>

          {/* Right side: a text link plus the page's one lime button. */}
          <div className="hidden lg:flex items-center gap-4">
            {isLoggedIn ? (
              <>
                <NotificationBell
                  items={notifications?.items ?? []}
                  unreadCount={notifications?.unreadCount ?? 0}
                />
                {/* Orders, not a cart: designs are 1-of-1 and bought one at a
                    time, so there is nothing to accumulate. */}
                <Button
                  variant="ghost"
                  size="icon"
                  render={<Link href="/dashboard/orders" />}
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span className="sr-only">Orders</span>
                </Button>
                {/* The hero's prompt form used to be the create entry point on
                    home. With the feed filling the page this bar is the only
                    one left, so a signed-in visitor gets the CTA too. */}
                <Link
                  href="/create"
                  className="btn-ember px-3.5 py-1.5 text-body-sm font-medium whitespace-nowrap"
                >
                  Start creating
                </Link>
                <UserMenu
                  displayName={user!.displayName}
                  handle={user!.handle}
                  avatarUrl={user!.avatarUrl}
                />
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-body-sm font-medium text-foreground transition-opacity hover:opacity-60"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="btn-ember px-3.5 py-1.5 text-body-sm font-medium"
                >
                  Get started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Right Actions */}
          <div className="flex lg:hidden items-center gap-2">
            {isLoggedIn ? (
              <NotificationBell
                items={notifications?.items ?? []}
                unreadCount={notifications?.unreadCount ?? 0}
              />
            ) : (
              <Link
                href="/login"
                className="text-body-sm font-medium text-foreground transition-opacity hover:opacity-60"
              >
                Sign in
              </Link>
            )}
          </div>
        </nav>
      </div>
    </motion.header>
  );
}
