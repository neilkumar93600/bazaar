"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { Button } from "@/components/ui/button";

export function ShareButton({ handle }: { handle: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      variant="outline"
      onClick={() => {
        navigator.clipboard.writeText(
          `${window.location.origin}/creator/${handle}`,
        );
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={copied ? "copied" : "share"}
          layout
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="inline-flex items-center gap-1.5"
        >
          {copied ? (
            <>
              <Check /> Copied
            </>
          ) : (
            <>
              <Share2 /> Share
            </>
          )}
        </motion.span>
      </AnimatePresence>
    </Button>
  );
}
