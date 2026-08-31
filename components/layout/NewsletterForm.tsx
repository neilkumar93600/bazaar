"use client";

import { useActionState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";

import { subscribeToNewsletter, type SubscribeState } from "@/app/actions/newsletter";

const initialState: SubscribeState = {};

export function NewsletterForm() {
  const [state, formAction, isPending] = useActionState(
    subscribeToNewsletter,
    initialState,
  );

  return (
    <div className="flex w-full flex-col gap-2 font-sans">
      <AnimatePresence mode="wait" initial={false}>
        {state.success ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="flex h-11 w-full items-center gap-2 rounded-[4px] border border-ink bg-mint-wash px-4 text-xs font-medium text-ink shadow-[2px_2px_0_0_#262626]"
          >
            <Check className="h-4 w-4 shrink-0 text-ink" />
            <span>You&apos;re on the list. VIP drops will reach your inbox.</span>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            action={formAction}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="flex h-11 w-full items-center gap-2"
          >
            <input
              type="email"
              name="email"
              placeholder="Enter your email for VIP drops..."
              required
              disabled={isPending}
              className="h-full min-w-0 flex-1 rounded-[4px] border border-rule bg-paper-white px-3.5 text-xs text-ink placeholder:text-muted-gray outline-none transition-colors focus:border-ink disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex h-full shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-[4px] border border-ink bg-lime-sprint px-5 text-xs font-medium font-sans text-ink shadow-[2px_2px_0_0_#262626] transition-all hover:brightness-105 active:translate-y-px active:shadow-none disabled:cursor-not-allowed disabled:opacity-70"
            >
              <span>{isPending ? "Joining..." : "Join VIP"}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </motion.form>
        )}
      </AnimatePresence>
      {state.error && (
        <span className="font-mono text-[11px] text-red-600">{state.error}</span>
      )}
    </div>
  );
}
