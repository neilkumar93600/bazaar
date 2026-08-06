"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { resetPassword, type ResetPasswordState } from "@/app/(auth)/reset-password/actions";
import { Stagger, StaggerItem } from "@/components/ui/motion";

const initialState: ResetPasswordState = {};
const INPUT_TRANSITION = { type: "spring", stiffness: 400, damping: 25 } as const;

function getPasswordStrength(password: string) {
  if (!password) return { score: 0, label: "", color: "bg-muted-gray" };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  switch (score) {
    case 1:
      return { score: 1, label: "Weak", color: "bg-destructive" };
    case 2:
      return { score: 2, label: "Fair", color: "bg-amber-500" };
    case 3:
      return { score: 3, label: "Good", color: "bg-mint-edge" };
    case 4:
      return { score: 4, label: "Strong", color: "bg-[#a3e635]" };
    default:
      return { score: 0, label: "", color: "bg-muted-gray" };
  }
}

export function ResetPasswordForm() {
  const [state, formAction, isPending] = useActionState(
    resetPassword,
    initialState,
  );
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const strength = getPasswordStrength(password);

  return (
    <form action={formAction}>
      <Stagger className="flex flex-col gap-4">
      <StaggerItem className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-caption font-medium text-ink">
          New password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            minLength={8}
            placeholder="Min. 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full bg-paper-white border border-ink focus:border-ink focus:ring-1 focus:ring-ink text-ink placeholder:text-muted-gray rounded-md px-3.5 py-2.5 pr-11 text-body-sm transition-all outline-none"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-ink hover:text-ink transition-colors p-1 cursor-pointer"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>

        {/* Password Strength Indicator */}
        <AnimatePresence>
          {password && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-1 flex flex-col gap-1">
                <div className="flex items-center justify-between text-caption text-muted-ink font-medium">
                  <span>Strength:</span>
                  <span className="font-semibold text-ink">{strength.label}</span>
                </div>
                <div className="flex gap-1 h-1 w-full">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className={`flex-1 h-full rounded-full transition-all duration-300 ${
                        step <= strength.score ? strength.color : "bg-rule"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </StaggerItem>

      <StaggerItem className="flex flex-col gap-1.5">
        <label htmlFor="confirmPassword" className="text-caption font-medium text-ink">
          Confirm new password
        </label>
        <div className="relative">
          <input
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            autoComplete="new-password"
            minLength={8}
            placeholder="Repeat new password"
            required
            className="w-full bg-paper-white border border-ink focus:border-ink focus:ring-1 focus:ring-ink text-ink placeholder:text-muted-gray rounded-md px-3.5 py-2.5 pr-11 text-body-sm transition-all outline-none"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-ink hover:text-ink transition-colors p-1 cursor-pointer"
            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
          >
            {showConfirmPassword ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        </div>
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
          {isPending ? "SAVING…" : "RESET PASSWORD"}
        </motion.button>
      </StaggerItem>
      </Stagger>
    </form>
  );
}

