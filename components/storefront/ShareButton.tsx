"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export function ShareButton({ handle }: { handle: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(
          `${window.location.origin}/creator/${handle}`,
        );
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="inline-flex items-center justify-center gap-1.5 rounded-md bg-white px-4 py-2 text-caption font-semibold text-[#262626] border border-[#262626] shadow-[2px_2px_0px_0px_#262626] hover:bg-[#fcfff7] transition-all cursor-pointer"
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
              <Check className="size-3.5" /> Copied
            </>
          ) : (
            <>
              <Share2 className="size-3.5" /> Share
            </>
          )}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
