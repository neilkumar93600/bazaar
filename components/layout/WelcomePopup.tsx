"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Sparkles, ShieldCheck, Store, Check } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const SEEN_KEY = "sb-welcome-modal-seen";
const WELCOME_DELAY_MS = 1500;
const EXCLUDED_PATHS = ["/create", "/design", "/purchase", "/creator", "/login", "/signup"];

const STEPS = [
  {
    step: "01",
    icon: Sparkles,
    title: "Buy The Shirt",
    desc: "1-of-1 physical heavyweight streetwear garment. The claim is exclusive and permanent — no reprints, ever.",
  },
  {
    step: "02",
    icon: ShieldCheck,
    title: "Own The 100% IP",
    desc: "Every purchase legally assigns full commercial copyright & master reproduction rights to you.",
  },
  {
    step: "03",
    icon: Store,
    title: "We Launch Your Store",
    desc: "Instant live storefront at bazaar.app/creator with automated on-demand fulfillment & zero inventory risk.",
  },
];

export function WelcomePopup() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (EXCLUDED_PATHS.some((path) => pathname.startsWith(path))) return;
    if (typeof window === "undefined") return;
    if (localStorage.getItem(SEEN_KEY)) return;

    const timer = setTimeout(() => {
      setOpen(true);
    }, WELCOME_DELAY_MS);

    return () => clearTimeout(timer);
  }, [pathname]);

  const handleDismiss = () => {
    localStorage.setItem(SEEN_KEY, "1");
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) handleDismiss();
        setOpen(isOpen);
      }}
    >
      <DialogContent className="sm:max-w-3xl md:max-w-4xl overflow-hidden p-0 border border-border/80 bg-card shadow-2xl rounded-3xl grid grid-cols-1 md:grid-cols-2">
        {/* Left Column: Visual Brand Universe */}
        <div className="relative min-h-[260px] md:min-h-[480px] w-full overflow-hidden bg-pitch flex flex-col justify-between p-6 md:p-8">
          <Image
            src="/welcome-banner.png"
            alt="Shirt Bazaar — The Infinite 1-of-1 Vault"
            fill
            sizes="(max-width: 768px) 100vw, 480px"
            className="object-cover object-center opacity-90 scale-105 transition-transform duration-1000 hover:scale-100"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-pitch via-pitch/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-pitch/70 hidden md:block" />

          {/* Top Badge */}
          <div className="relative z-10 self-start inline-flex items-center gap-2 rounded-full bg-foreground/15 backdrop-blur-md px-3.5 py-1 text-[11px] font-mono font-medium tracking-wider text-foreground uppercase border border-foreground/15">
            <span className="inline-block size-2 rounded-full bg-ember animate-pulse" />
            Welcome To The Bazaar
          </div>

          {/* Bottom Floating Stats / Highlight */}
          <div className="relative z-10 flex flex-col gap-2 rounded-2xl bg-pitch/85 backdrop-blur-xl border border-white/10 p-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-widest text-muted-gray">
                Sovereign Commerce
              </span>
              <span className="font-mono text-[10px] text-ember uppercase font-semibold">
                Zero Inventory
              </span>
            </div>
            <p className="text-[12px] text-muted-ink leading-relaxed">
              Every design in the Bazaar exists exactly once in the universe. When you claim it, you acquire the physical piece and the brand rights.
            </p>
          </div>
        </div>

        {/* Right Column: 3-Step Mechanics & Action */}
        <div className="flex flex-col justify-between gap-6 p-6 md:p-8 lg:p-10 bg-card">
          <div className="flex flex-col gap-5">
            <DialogHeader className="text-left gap-2">
              <div className="inline-flex items-center gap-2">
                <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-gray">
                  The 3-Step Model
                </span>
              </div>
              <DialogTitle className="text-heading md:text-display-sm text-foreground tracking-tight leading-tight">
                Buy The Shirt.{" "}
                <span className="font-serif font-medium italic text-ember block md:inline">
                  Own The IP.
                </span>
              </DialogTitle>
              <DialogDescription className="text-body-sm text-muted-foreground leading-relaxed">
                We build your custom automated merch store with on-demand dropship fulfillment.
              </DialogDescription>
            </DialogHeader>

            {/* 3-Step Breakdown */}
            <div className="flex flex-col gap-3">
              {STEPS.map(({ step, icon: Icon, title, desc }) => (
                <div
                  key={step}
                  className="flex items-start gap-3 rounded-2xl bg-secondary/40 border border-border/50 p-3 transition-colors hover:bg-secondary/60"
                >
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-background border border-border text-foreground font-mono text-[11px] font-bold text-ember">
                    {step}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[13px] font-medium text-foreground leading-snug">
                      {title}
                    </span>
                    <span className="text-[11px] text-muted-ink leading-relaxed">
                      {desc}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2.5 pt-2">
            <Button
              onClick={handleDismiss}
              className="w-full h-12 btn-ember rounded-full text-[13px] font-bold tracking-[0.1em] cursor-pointer flex items-center justify-center gap-2"
            >
              EXPLORE THE BAZAAR
              <ArrowRight className="size-4" />
            </Button>
            <div className="flex items-center justify-between px-1 text-[11px] text-muted-gray">
              <Link
                href="/about"
                onClick={handleDismiss}
                className="underline underline-offset-4 hover:text-foreground transition-colors"
              >
                Read How It Works →
              </Link>
              <span>1-of-1 AI Apparel</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
