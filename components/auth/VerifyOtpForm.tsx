"use client";

import { useActionState, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { resendOtp, verifyOtp, type VerifyOtpState } from "@/app/(auth)/verify-otp/actions";
import { Stagger, StaggerItem } from "@/components/ui/motion";

const initialState: VerifyOtpState = {};
const INPUT_TRANSITION = { type: "spring", stiffness: 400, damping: 25 } as const;

export function VerifyOtpForm({ email }: { email: string }) {
  const [state, formAction, isPending] = useActionState(verifyOtp, initialState);
  const [isResending, startResend] = useTransition();
  const [resent, setResent] = useState(false);

  return (
    <form action={formAction}>
      <Stagger className="flex flex-col gap-4">
      <StaggerItem className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-caption font-medium text-ink">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          defaultValue={email}
          required
          className="w-full bg-paper-white border border-ink focus:border-ink focus:ring-1 focus:ring-ink text-ink placeholder:text-muted-gray rounded-md px-3.5 py-2.5 text-body-sm transition-all outline-none"
        />
      </StaggerItem>

      <StaggerItem className="flex flex-col gap-1.5">
        <label htmlFor="token" className="text-caption font-medium text-ink">
          Verification code
        </label>
        <input
          id="token"
          name="token"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="123456"
          required
          className="w-full bg-paper-white border border-ink focus:border-ink focus:ring-1 focus:ring-ink text-ink placeholder:text-muted-gray rounded-md px-3.5 py-2.5 text-body-sm transition-all outline-none font-mono tracking-widest text-center"
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
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-caption font-medium border border-destructive/30">
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
          className="w-full mt-2 btn-ember bg-[#a3e635] text-ink border border-ink font-medium py-3 px-6 rounded-md transition-all shadow-[2px_2px_0_0_#262626] active:shadow-none disabled:opacity-50 text-body-sm cursor-pointer"
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
          className="text-caption font-medium text-muted-ink hover:text-ink transition-colors cursor-pointer mt-2 text-center"
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

