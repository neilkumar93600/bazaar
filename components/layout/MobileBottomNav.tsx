"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import {
  Home,
  ShoppingBag,
  Sparkles,
  Search,
  User,
  LayoutDashboard,
  Shirt,
  Receipt,
  MessageSquare,
  Settings,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { signOut } from "@/app/dashboard/actions";

type MobileBottomNavProps = {
  isLoggedIn?: boolean;
};

const SPRING_TRANSITION = {
  type: "spring",
  stiffness: 450,
  damping: 32,
  mass: 0.8,
} as const;

const DASHBOARD_LINKS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/designs", label: "My designs", icon: Shirt },
  { href: "/dashboard/orders", label: "Orders", icon: Receipt },
  { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function MobileBottomNav({ isLoggedIn = false }: MobileBottomNavProps) {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();
  const [sheetOpen, setSheetOpen] = useState(false);

  const navItems = [
    {
      href: "/",
      label: "Feed",
      icon: Home,
      exact: true,
    },
    {
      href: "/shop",
      label: "Bazaar",
      icon: ShoppingBag,
      exact: false,
    },
    {
      href: "/create",
      label: "Create",
      icon: Sparkles,
      isFab: true,
    },
    {
      href: "/search",
      label: "Search",
      icon: Search,
      exact: false,
    },
    {
      href: isLoggedIn ? "/dashboard" : "/login",
      label: isLoggedIn ? "Dashboard" : "Account",
      icon: isLoggedIn ? LayoutDashboard : User,
      exact: false,
      isDashboardSheet: isLoggedIn,
    },
  ];

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { y: 80, opacity: 0 }}
      animate={shouldReduceMotion ? undefined : { y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md lg:hidden"
    >
      <nav className="relative flex h-16 items-center justify-around rounded-full border-2 border-foreground/80 bg-card/95 px-2 shadow-[var(--sf-shadow,2px_2px_0px_0px_var(--sf-ink,#262626))] backdrop-blur-md">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href) && item.href !== "/";

          if (item.isFab) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group relative -top-5 flex flex-col items-center justify-center focus:outline-none"
              >
                {!shouldReduceMotion && (
                  <motion.div
                    className="absolute -inset-1 rounded-full bg-accent/40 blur-sm"
                    animate={{
                      scale: [1, 1.15, 1],
                      opacity: [0.4, 0.8, 0.4],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                )}

                <motion.div
                  whileTap={{ scale: 0.88, rotate: -12 }}
                  whileHover={{ scale: 1.08, rotate: 6 }}
                  transition={SPRING_TRANSITION}
                  className="btn-ember relative flex h-14 w-14 items-center justify-center !rounded-full border-2 border-foreground shadow-[var(--sf-shadow,2px_2px_0px_0px_var(--sf-ink,#262626))] transition-shadow group-hover:shadow-[var(--sf-shadow,3px_3px_0px_0px_var(--sf-ink,#262626))]"
                >
                  <Sparkles className="h-6 w-6 text-foreground transition-transform duration-300 group-hover:scale-110" />
                </motion.div>
                <span className="mt-1 text-[10px] font-semibold tracking-tight text-foreground">
                  {item.label}
                </span>
              </Link>
            );
          }

          if (item.isDashboardSheet) {
            return (
              <Sheet key={item.href} open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetTrigger
                  render={
                    <button
                      type="button"
                      className={cn(
                        "relative flex flex-1 flex-col items-center justify-center py-2 text-xs transition-colors focus:outline-none",
                        isActive
                          ? "font-semibold text-foreground"
                          : "text-muted-ink hover:text-foreground"
                      )}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="mobile-nav-pill"
                          className="absolute inset-x-2 inset-y-1 rounded-full bg-accent border border-foreground/10 shadow-[var(--sf-shadow-sm,1px_1px_0px_0px_var(--sf-ink,#262626))]"
                          transition={SPRING_TRANSITION}
                        />
                      )}
                      <motion.div
                        animate={isActive ? { y: -1, scale: 1.12 } : { y: 0, scale: 1 }}
                        transition={SPRING_TRANSITION}
                        className="relative z-10"
                      >
                        <item.icon className="h-5 w-5" />
                      </motion.div>
                      <span className="relative z-10 mt-1 text-[10px] leading-none tracking-tight">
                        {item.label}
                      </span>
                      {isActive && (
                        <motion.div
                          layoutId="mobile-nav-dot"
                          className="absolute bottom-1 h-1 w-1 rounded-full bg-foreground"
                          transition={SPRING_TRANSITION}
                        />
                      )}
                    </button>
                  }
                />
                <SheetContent
                  side="bottom"
                  className="rounded-t-3xl border-t-2 border-foreground bg-card p-6 shadow-[0_-8px_30px_rgba(0,0,0,0.15)] text-foreground max-h-[85vh] overflow-y-auto"
                >
                  <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-border" />
                  <SheetHeader className="mb-4 text-left">
                    <SheetTitle className="text-body font-semibold text-foreground flex items-center gap-2">
                      <LayoutDashboard className="h-5 w-5 text-primary" />
                      Dashboard Navigation
                    </SheetTitle>
                  </SheetHeader>
                  <nav className="flex flex-col gap-1.5">
                    {DASHBOARD_LINKS.map((link) => {
                      const isLinkActive = pathname === link.href;
                      const Icon = link.icon;
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setSheetOpen(false)}
                          className={cn(
                            "flex items-center justify-between rounded-[var(--sf-radius,8px)] px-4 py-3 text-body-sm font-medium transition-all border",
                            isLinkActive
                              ? "bg-accent border-foreground text-foreground shadow-[var(--sf-shadow,2px_2px_0px_0px_var(--sf-ink,#262626))]"
                              : "border-transparent text-muted-ink hover:bg-accent/60 hover:text-foreground"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="h-5 w-5" />
                            <span>{link.label}</span>
                          </div>
                          <ChevronRight className="h-4 w-4 opacity-50" />
                        </Link>
                      );
                    })}
                  </nav>

                  <div className="mt-6 border-t border-border pt-4">
                    <form action={signOut}>
                      <button
                        type="submit"
                        className="flex w-full items-center justify-between rounded-[var(--sf-radius,8px)] border border-destructive/30 px-4 py-3 text-body-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                      >
                        <div className="flex items-center gap-3">
                          <LogOut className="h-5 w-5" />
                          <span>Sign out</span>
                        </div>
                      </button>
                    </form>
                  </div>
                </SheetContent>
              </Sheet>
            );
          }

          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-1 flex-col items-center justify-center py-2 text-xs transition-colors",
                isActive
                  ? "font-semibold text-foreground"
                  : "text-muted-ink hover:text-foreground"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="mobile-nav-pill"
                  className="absolute inset-x-2 inset-y-1 rounded-full bg-accent border border-foreground/10 shadow-[var(--sf-shadow-sm,1px_1px_0px_0px_var(--sf-ink,#262626))]"
                  transition={SPRING_TRANSITION}
                />
              )}
              <motion.div
                animate={isActive ? { y: -1, scale: 1.12 } : { y: 0, scale: 1 }}
                transition={SPRING_TRANSITION}
                className="relative z-10"
              >
                <Icon className="h-5 w-5" />
              </motion.div>
              <span className="relative z-10 mt-1 text-[10px] leading-none tracking-tight">
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="mobile-nav-dot"
                  className="absolute bottom-1 h-1 w-1 rounded-full bg-foreground"
                  transition={SPRING_TRANSITION}
                />
              )}
            </Link>
          );
        })}
      </nav>
    </motion.div>
  );
}


