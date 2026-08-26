"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Sparkles, ShieldCheck, Zap } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { NewsletterForm } from "@/components/layout/NewsletterForm";

const SEEN_KEY = "sb-newsletter-popup-seen";
const DELAY_MS = 25_000;
// Pages that already have one job. A newsletter modal on top of a design a
// visitor is deciding whether to claim trades revenue for an email address —
// the popup only earns its place where nothing better is being asked.
const EXCLUDED_PATHS = ["/create", "/design", "/purchase", "/creator"];

const PERKS = [
  {
    icon: Zap,
    title: "10-Minute Early Access",
    desc: "Get drop notifications before designs hit the public wall.",
  },
  {
    icon: Sparkles,
    title: "1-of-1 Genesis Drops",
    desc: "Claim master designs with 100% commercial IP rights.",
  },
  {
    icon: ShieldCheck,
    title: "Turnkey Store Perks",
    desc: "Tips, royalty updates & seller bonuses for your custom shop.",
  },
];

export function NewsletterPopup() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (EXCLUDED_PATHS.some((path) => pathname.startsWith(path))) return;
    if (localStorage.getItem(SEEN_KEY)) return;

    const show = () => {
      localStorage.setItem(SEEN_KEY, "1");
      setOpen(true);
      cleanup();
    };

    const onMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) show();
    };

    const timer = setTimeout(show, DELAY_MS);
    document.addEventListener("mouseleave", onMouseLeave);

    function cleanup() {
      clearTimeout(timer);
      document.removeEventListener("mouseleave", onMouseLeave);
    }

    return cleanup;
  }, [pathname]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-3xl md:max-w-4xl overflow-hidden p-0 border border-border/80 bg-card shadow-2xl rounded-3xl grid grid-cols-1 md:grid-cols-2">
        {/* Left Column: Visual Showcase & Brand Media */}
        <div className="relative min-h-[260px] md:min-h-[460px] w-full overflow-hidden bg-pitch flex flex-col justify-between p-6">
          <Image
            src="/welcome-banner2.png"
            alt="Bazaar 1-of-1 Streetwear Drops"
            fill
            sizes="(max-width: 768px) 100vw, 480px"
            className="object-cover object-center opacity-90 scale-105 transition-transform duration-1000 hover:scale-100"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-pitch via-pitch/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-pitch/60 hidden md:block" />

          {/* Top Pill */}
          <div className="relative z-10 self-start inline-flex items-center gap-2 rounded-full bg-foreground/15 backdrop-blur-md px-3.5 py-1 text-[11px] font-mono font-medium tracking-wider text-foreground uppercase border border-foreground/15">
            <span className="inline-block size-2 rounded-full bg-ember animate-pulse" />
            1-of-1 Genesis Drops
          </div>

          {/* Bottom Floating Feature Card */}
          <div className="relative z-10 flex flex-col gap-2 rounded-2xl bg-pitch/80 backdrop-blur-xl border border-white/10 p-4 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-widest text-muted-gray">
                Ownership Model
              </span>
              <span className="font-mono text-[10px] text-ember uppercase font-semibold">
                Turnkey
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[13px] font-medium text-foreground">
                Buy The Shirt. Own The IP.
              </span>
              <span className="text-[11px] text-muted-ink leading-relaxed">
                Every claim automatically provisions your live storefront at{" "}
                <span className="text-foreground/90 font-mono">bazaar.app/creator</span> with 100% commercial rights.
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Editorial Copy, Perks & Form */}
        <div className="flex flex-col justify-between gap-6 p-6 md:p-8 lg:p-10 bg-card">
          <div className="flex flex-col gap-4">
            <DialogHeader className="text-left gap-2.5">
              <div className="inline-flex items-center gap-2">
                <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-gray">
                  Insider Ledger
                </span>
              </div>
              <DialogTitle className="text-heading md:text-display-sm text-foreground tracking-tight leading-tight">
                Claim it first.{" "}
                <span className="font-serif font-medium italic text-ember block md:inline">
                  Own it forever.
                </span>
              </DialogTitle>
              <DialogDescription className="text-body-sm text-muted-foreground leading-relaxed">
                Daily 1-of-1 AI garments disappear forever once claimed. Get early drop alerts before pieces hit the public wall.
              </DialogDescription>
            </DialogHeader>

            {/* Perks List */}
            <div className="flex flex-col gap-2.5 pt-1">
              {PERKS.map(({ icon: Icon, title, desc }, idx) => (
                <div key={title} className="flex items-start gap-3 rounded-xl bg-secondary/40 border border-border/50 p-2.5 px-3">
                  <span className="font-mono text-[11px] font-semibold text-muted-gray pt-0.5">
                    0{idx + 1}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-[12px] font-medium text-foreground leading-snug">
                      {title}
                    </span>
                    <span className="text-[11px] text-muted-ink leading-tight">
                      {desc}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form & Actions */}
          <div className="flex flex-col gap-2.5 pt-2">
            <NewsletterForm />
            <p className="text-center md:text-left text-[11px] text-muted-gray">
              🔒 Zero spam. Drop alerts only. Unsubscribe in 1-click anytime.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

