"use client";

import { useActionState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";

import { subscribeToNewsletter, type SubscribeState } from "@/app/actions/newsletter";

const initialState: SubscribeState = {};

export function NewsletterForm() {
  const [state, formAction, isPending] = useActionState(
    subscribeToNewsletter,
    initialState,
  );

  return (
    <div className="flex w-full max-w-[360px] flex-col gap-1.5">
      <AnimatePresence mode="wait" initial={false}>
        {state.success ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex h-12 w-full items-center gap-2 rounded-full glass-panel border px-4 text-[13px] text-foreground"
          >
            <Check className="size-4 shrink-0" />
            You&apos;re on the list.
          </motion.div>
        ) : (
          <motion.form
            key="form"
            action={formAction}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex h-12 w-full items-center overflow-hidden rounded-lg glass-panel border p-1 transition-all focus-within:border-foreground focus-within:ring-2 focus-within:ring-ring/30"
          >
            <input
              type="email"
              name="email"
              placeholder="Enter Your E-mail"
              required
              disabled={isPending}
              className="min-w-0 flex-1 border-none bg-transparent px-4 font-sans text-[13px] text-foreground placeholder:text-muted-foreground outline-none disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={isPending}
              className="h-full shrink-0 cursor-pointer btn-ember rounded-full px-5 text-[12px] font-bold tracking-[0.1em] whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isPending ? "…" : "SUBSCRIBE"}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
      {state.error && (
        <span className="px-1 text-[12px] text-destructive">{state.error}</span>
      )}
    </div>
  );
}
