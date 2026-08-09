"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Search, ShoppingCart } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/ui/logo";
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
import { MenuToggle } from "@/components/layout/MenuToggle";
import { UserMenu } from "@/components/layout/UserMenu";
import type { NotificationItem } from "@/lib/data/notifications";

// Home is the feed now, so it needs no entry of its own beyond the logo — and
// the old "#vibe-feed" anchor would have pointed at the page you're already on.
const NAV_LINKS = [
  { href: "/", label: "Feed" },
  { href: "/shop", label: "Bazaar" },
  { href: "/auctions", label: "Auctions" },
];

const EASE = [0.16, 1, 0.3, 1] as const;

type NavbarUser = {
  displayName: string | null;
  handle: string;
  avatarUrl: string | null;
};

function SearchPopover() {
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
          <Button variant="ghost" size="icon">
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
  const [menuOpen, setMenuOpen] = useState(false);
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
                      // `text-muted-ink`, not `text-muted` — the shadcn layer
                      // owns `--muted` as a cream *surface*, so `text-muted`
                      // would paint these links cream on white.
                      : "text-muted-ink hover:text-foreground",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
            <SearchPopover />
          </div>

          {/* Right side: a text link plus the page's one lime button. */}
          <div className="hidden lg:flex items-center gap-4">
            {isLoggedIn ? (
              <>
                <NotificationBell
                  items={notifications?.items ?? []}
                  unreadCount={notifications?.unreadCount ?? 0}
                />
                <Button variant="ghost" size="icon" render={<Link href="/cart" />}>
                  <ShoppingCart className="w-5 h-5" />
                  <span className="sr-only">Cart</span>
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

          {/* Mobile Toggle */}
          <div className="flex lg:hidden items-center gap-2">
            <SearchPopover />
            {/* Controlled, so the trigger can animate to a close mark while
                the panel is open rather than sitting on a static icon. */}
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger
                render={
                  <button
                    aria-label={menuOpen ? "Close menu" : "Open menu"}
                    aria-expanded={menuOpen}
                    className="flex items-center justify-center rounded-md border border-border p-2.5 text-foreground transition-colors hover:bg-accent lg:hidden"
                  >
                    <MenuToggle open={menuOpen} />
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
                      onClick={() => setMenuOpen(false)}
                      className="rounded-md px-3 py-2.5 text-muted-foreground hover:text-foreground hover:bg-accent"
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
                <div className="mt-auto flex flex-col gap-2 border-t border-border p-4">
                  {isLoggedIn ? (
                    <>
                      <Link
                        href="/dashboard"
                        onClick={() => setMenuOpen(false)}
                        className="rounded-md px-3 py-2.5 text-muted-foreground hover:text-foreground"
                      >
                        Dashboard
                      </Link>
                      {/* A signed-in visitor on a phone had no create action in
                          here at all — the desktop bar's CTA is hidden at this
                          width. */}
                      <Button
                        render={<Link href="/create" />}
                        onClick={() => setMenuOpen(false)}
                        className="btn-ember"
                      >
                        Start creating
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        render={<Link href="/login" />}
                        onClick={() => setMenuOpen(false)}
                        className="text-foreground hover:bg-accent"
                      >
                        Sign in
                      </Button>
                      <Button
                        render={<Link href="/signup" />}
                        onClick={() => setMenuOpen(false)}
                        className="btn-ember"
                      >
                        Get started
                      </Button>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </div>
    </motion.header>
  );
}
