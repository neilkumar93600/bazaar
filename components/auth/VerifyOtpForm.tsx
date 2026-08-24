"use client";

import { useActionState, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { resendOtp, verifyOtp, type VerifyOtpState } from "@/app/(auth)/verify-otp/actions";
import { Stagger, StaggerItem } from "@/components/ui/motion";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

const initialState: VerifyOtpState = {};
const INPUT_TRANSITION = { type: "spring", stiffness: 400, damping: 25 } as const;

export function VerifyOtpForm({ email: initialEmail }: { email: string }) {
  const [state, formAction, isPending] = useActionState(verifyOtp, initialState);
  const [token, setToken] = useState("");
  const [email, setEmail] = useState(initialEmail);
  const [isEditingEmail, setIsEditingEmail] = useState(!initialEmail);
  const [isResending, startResend] = useTransition();
  const [resent, setResent] = useState(false);

  return (
    <form action={formAction} className="w-full">
      {/* Hidden inputs to pass data to server action */}
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="token" value={token} />

      <Stagger className="flex flex-col gap-6 items-center">
        {/* If no email was in query params, show an email input or allow changing it */}
        {isEditingEmail ? (
          <StaggerItem className="w-full flex flex-col gap-1.5 text-left">
            <div className="flex items-center justify-between">
              <label htmlFor="email-input" className="text-caption font-medium text-ink">
                Email address
              </label>
              {initialEmail && (
                <button
                  type="button"
                  onClick={() => setIsEditingEmail(false)}
                  className="text-caption font-medium text-muted-ink hover:text-ink underline"
                >
                  Cancel
                </button>
              )}
            </div>
            <input
              id="email-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="hi@company.com"
              required
              className="w-full bg-paper-white border border-ink focus:border-ink focus:ring-1 focus:ring-ink text-ink placeholder:text-muted-gray rounded-[4px] px-3.5 py-2.5 text-body-sm transition-all outline-none"
            />
          </StaggerItem>
        ) : null}

        {/* 6-box Segmented OTP Digit Input matching reference image */}
        <StaggerItem className="w-full flex flex-col items-center justify-center">
          <InputOTP
            maxLength={6}
            value={token}
            onChange={(val) => setToken(val)}
            autoFocus
            inputMode="numeric"
          >
            <InputOTPGroup className="gap-2 sm:gap-3">
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </StaggerItem>

        {/* Error message banner */}
        <AnimatePresence>
          {state.error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full overflow-hidden"
            >
              <div className="p-3 rounded-[4px] bg-destructive/10 text-destructive text-caption font-medium border border-destructive/30 text-center">
                {state.error}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Primary Action Button — DESIGN.md Lime Sprint CTA */}
        <StaggerItem className="w-full">
          <motion.button
            type="submit"
            disabled={isPending || token.length < 6}
            whileHover={{ y: -1 }}
            whileTap={{ x: 2, y: 2 }}
            transition={INPUT_TRANSITION}
            className="w-full btn-ember font-medium py-3 px-6 disabled:opacity-50 text-body-sm cursor-pointer uppercase tracking-wide"
          >
            {isPending ? "Verifying…" : "Verify"}
          </motion.button>
        </StaggerItem>

        {/* Bottom Resend Code Footer matching reference layout */}
        <StaggerItem className="flex flex-col items-center gap-2">
          <div className="flex items-center justify-center gap-1.5 text-body-sm text-muted-ink">
            <span>Didn&apos;t receive an email?</span>
            <button
              type="button"
              disabled={isResending || !email}
              onClick={() => {
                if (!email) {
                  setIsEditingEmail(true);
                  return;
                }
                startResend(async () => {
                  await resendOtp(email);
                  setResent(true);
                  setTimeout(() => setResent(false), 5000);
                });
              }}
              className="text-ink font-semibold underline underline-offset-4 hover:opacity-75 cursor-pointer disabled:opacity-50"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={isResending ? "sending" : resent ? "resent" : "idle"}
                  initial={{ opacity: 0, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -3 }}
                  transition={{ duration: 0.15 }}
                  className="inline-block"
                >
                  {isResending ? "Sending…" : resent ? "Resent!" : "Resend"}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>

          {!isEditingEmail && (
            <button
              type="button"
              onClick={() => setIsEditingEmail(true)}
              className="text-caption font-medium text-muted-gray hover:text-ink transition-colors cursor-pointer underline"
            >
              Entered the wrong email?
            </button>
          )}
        </StaggerItem>
      </Stagger>
    </form>
  );
}


