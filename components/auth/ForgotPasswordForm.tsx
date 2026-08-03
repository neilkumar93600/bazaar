"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { requestPasswordReset, type ForgotPasswordState } from "@/app/(auth)/forgot-password/actions";
import { Stagger, StaggerItem } from "@/components/ui/motion";

const initialState: ForgotPasswordState = {};
const INPUT_FOCUS = { scale: 1.01 };
const INPUT_TRANSITION = { type: "spring", stiffness: 400, damping: 25 } as const;

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(
    requestPasswordReset,
    initialState,
  );

  return (
    <AnimatePresence mode="wait">
      {state.submitted ? (
        <motion.div
          key="success"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="p-4 rounded-xl bg-success/10 border border-success/30 text-success text-sm font-medium"
        >
          If an account exists for that email, a password reset link has been sent to your inbox.
        </motion.div>
      ) : (
        <motion.form
          key="form"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          action={formAction}
        >
          <Stagger className="flex flex-col gap-4">
            <StaggerItem className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs font-semibold text-foreground">
                Email address
              </label>
              <motion.input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="your.email@example.com"
                required
                whileFocus={INPUT_FOCUS}
                transition={INPUT_TRANSITION}
                className="w-full bg-secondary border border-border focus:border-input focus:bg-accent text-foreground placeholder:text-muted-foreground rounded-xl px-4 py-3 text-sm transition-colors outline-none focus:ring-2 focus:ring-ring/40"
              />
            </StaggerItem>

            <AnimatePresence>
              {state.error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs font-medium border border-destructive/30">
                    {state.error}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <StaggerItem>
              <motion.button
                type="submit"
                disabled={isPending}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                transition={INPUT_TRANSITION}
                className="w-full mt-2 btn-ember font-bold py-3.5 px-6 rounded-xl transition-colors shadow-sm hover:shadow-md disabled:opacity-50 text-sm tracking-wider uppercase cursor-pointer"
              >
                {isPending ? "SENDING…" : "SEND RESET LINK"}
              </motion.button>
            </StaggerItem>

            <StaggerItem>
              <p className="text-center text-xs text-muted-foreground font-medium mt-2">
                Remembered your password?{" "}
                <Link href="/login" className="text-foreground font-bold hover:underline">
                  Sign in
                </Link>
              </p>
            </StaggerItem>
          </Stagger>
        </motion.form>
      )}
    </AnimatePresence>
  );
}
