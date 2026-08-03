"use client";

import { useActionState, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { resendOtp, verifyOtp, type VerifyOtpState } from "@/app/(auth)/verify-otp/actions";
import { Stagger, StaggerItem } from "@/components/ui/motion";

const initialState: VerifyOtpState = {};
const INPUT_FOCUS = { scale: 1.01 };
const INPUT_TRANSITION = { type: "spring", stiffness: 400, damping: 25 } as const;

export function VerifyOtpForm({ email }: { email: string }) {
  const [state, formAction, isPending] = useActionState(verifyOtp, initialState);
  const [isResending, startResend] = useTransition();
  const [resent, setResent] = useState(false);

  return (
    <form action={formAction}>
      <Stagger className="flex flex-col gap-4">
      <StaggerItem className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-xs font-semibold text-foreground">
          Email address
        </label>
        <motion.input
          id="email"
          name="email"
          type="email"
          defaultValue={email}
          required
          whileFocus={INPUT_FOCUS}
          transition={INPUT_TRANSITION}
          className="w-full bg-secondary border border-border focus:border-input focus:bg-accent text-foreground placeholder:text-muted-foreground rounded-xl px-4 py-3 text-sm transition-colors outline-none focus:ring-2 focus:ring-ring/40"
        />
      </StaggerItem>

      <StaggerItem className="flex flex-col gap-1.5">
        <label htmlFor="token" className="text-xs font-semibold text-foreground">
          Verification code
        </label>
        <motion.input
          id="token"
          name="token"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="123456"
          required
          whileFocus={INPUT_FOCUS}
          transition={INPUT_TRANSITION}
          className="w-full bg-secondary border border-border focus:border-input focus:bg-accent text-foreground placeholder:text-muted-foreground rounded-xl px-4 py-3 text-sm transition-colors outline-none focus:ring-2 focus:ring-ring/40 font-mono tracking-widest text-center"
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
          {isPending ? "VERIFYING…" : "VERIFY CODE"}
        </motion.button>
      </StaggerItem>

      <StaggerItem>
        <motion.button
          type="button"
          disabled={isResending}
          whileTap={{ scale: 0.96 }}
          onClick={() => {
            const emailInput = document.getElementById("email") as HTMLInputElement | null;
            startResend(async () => {
              await resendOtp(emailInput?.value ?? email);
              setResent(true);
            });
          }}
          className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer mt-2 text-center"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={isResending ? "sending" : resent ? "resent" : "idle"}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="inline-block"
            >
              {isResending ? "Sending code…" : resent ? "Code resent!" : "Didn't receive a code? Resend code"}
            </motion.span>
          </AnimatePresence>
        </motion.button>
      </StaggerItem>
      </Stagger>
    </form>
  );
}
