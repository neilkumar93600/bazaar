"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { requestPasswordReset, type ForgotPasswordState } from "@/app/(auth)/forgot-password/actions";
import { Stagger, StaggerItem } from "@/components/ui/motion";

const initialState: ForgotPasswordState = {};
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
          className="p-4 rounded-[4px] bg-mint-wash border border-mint-edge text-ink text-body-sm font-medium"
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
              <label htmlFor="email" className="text-caption font-medium text-ink">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="your.email@example.com"
                required
                className="w-full bg-paper-white border border-ink focus:border-ink focus:ring-1 focus:ring-ink text-ink placeholder:text-muted-gray rounded-[4px] px-3.5 py-2.5 text-body-sm transition-all outline-none"
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
                  <div className="p-3 rounded-[4px] bg-destructive/10 text-destructive text-caption font-medium border border-destructive/30">
                    {state.error}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>


            <StaggerItem>
              <motion.button
                type="submit"
                disabled={isPending}
                whileHover={{ y: -1 }}
                whileTap={{ x: 2, y: 2 }}
                transition={INPUT_TRANSITION}
                className="w-full mt-2 btn-ember font-medium py-3 px-6 disabled:opacity-50 text-body-sm cursor-pointer"
              >
                {isPending ? "SENDING…" : "SEND RESET LINK"}
              </motion.button>
            </StaggerItem>

            <StaggerItem>
              <p className="text-center text-body-sm text-muted-ink font-medium mt-2">
                Remembered your password?{" "}
                <Link href="/login" className="text-ink font-semibold underline underline-offset-4 hover:opacity-75">
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

