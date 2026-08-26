"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { NewsletterForm } from "@/components/layout/NewsletterForm";

const SEEN_KEY = "sb-newsletter-popup-seen";
const DELAY_MS = 45_000;
// Pages that already have one job. A newsletter modal on top of a design a
// visitor is deciding whether to claim trades revenue for an email address —
// the popup only earns its place where nothing better is being asked.
const EXCLUDED_PATHS = ["/create", "/design", "/purchase", "/creator"];

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
    // ponytail: once-per-browser via localStorage, no cooldown/re-show window.
    // Add a timed re-arm (e.g. clear the flag after 30 days) if repeat-visitor
    // capture rate matters later.
  }, [pathname]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-sm text-center">
        <DialogHeader>
          <DialogTitle className="text-heading-sm">Don&apos;t miss the drop.</DialogTitle>
          <DialogDescription>
            New 1-of-1 designs go live daily — once someone claims one, it&apos;s
            gone for good. Get notified first.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center">
          <NewsletterForm />
        </div>
      </DialogContent>
    </Dialog>
  );
}
