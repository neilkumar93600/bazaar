"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { signup, type SignupState } from "@/app/(auth)/signup/actions";
import { signInWithOAuth } from "@/lib/supabase/oauth";
import { Stagger, StaggerItem } from "@/components/ui/motion";

const initialState: SignupState = {};
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

export function SignupForm() {
  const [state, formAction, isPending] = useActionState(signup, initialState);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const strength = getPasswordStrength(password);

  return (
    <Stagger className="flex flex-col gap-5">
      {/* Social Auth Options — DESIGN.md Outlined Secondary Buttons */}
      <StaggerItem className="flex items-center gap-3">
        <motion.button
          type="button"
          onClick={() => signInWithOAuth("google")}
          whileHover={{ y: -1 }}
          whileTap={{ x: 2, y: 2 }}
          className="flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-md border border-ink bg-paper-white hover:bg-cream text-ink text-body-sm font-medium transition-all shadow-[2px_2px_0_0_#262626] active:shadow-none cursor-pointer"
        >
          {/* User provided Google SVG */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="size-5 shrink-0"
            viewBox="0 0 512 512"
          >
            <path d="M0 0h512v512H0z" fill="none" />
            <path
              fill="#fc4c53"
              d="M502.2 209.5H261.1v99.1h137.8c-6.1 31.9-24.2 58.9-51.4 77c-22.8 15.4-51.9 24.7-86.3 24.7c-66.6 0-123.1-44.9-143.4-105.4h-.3l.3-.2c-5.1-15.4-8.1-31.7-8.1-48.6s3-33.3 8.1-48.6C138 147 194.6 102.1 261.2 102.1c37.7 0 71.2 13 98 38.2L432.5 67C388 25.4 330.2 0 261.1 0C161 0 74.7 57.5 32.6 141.3C15.1 175.7 5.1 214.6 5.1 256s10 80.3 27.5 114.7v.2C74.7 454.5 161 512 261.1 512c69.1 0 127.1-22.8 169.4-61.9c48.4-44.7 76.3-110.3 76.3-188.3c.1-18.1-1.5-35.6-4.6-52.3"
            />
            <radialGradient
              id="SVGlCFn0bxH_signup"
              cx="91.998"
              cy="254.653"
              r="224.709"
              gradientTransform="matrix(.8032 0 0 -1.0842 -7.184 568.69)"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset=".368" stopColor="#ffcf09" />
              <stop offset=".718" stopColor="#ffcf09" stopOpacity=".7" />
              <stop offset="1" stopColor="#ffcf09" stopOpacity="0" />
            </radialGradient>
            <path
              fill="url(#SVGlCFn0bxH_signup)"
              d="M117.8 304.9h-.3l.3-.2c-5.1-15.4-8.1-31.7-8.1-48.6c0-17 3-33.3 8.1-48.6c12.8-38.3 40.2-70.2 75.3-88.6C169 86.9 138.3 64 104 54.2c-29.7 23.3-54.3 52.9-71.5 87C15.1 175.7 5.1 214.6 5.1 256s10 80.3 27.5 114.7v.2c28.3 56 76.5 100.3 135.3 123.4c24.6-22.5 44.7-53 58.6-88.7c-50.9-12.4-92.1-51.1-108.7-100.7"
            />
            <radialGradient
              id="SVGPEcGceFK_signup"
              cx="188.9"
              cy="-30.673"
              r="276.436"
              gradientTransform="matrix(1.317 -.1645 -.1248 -.9995 90.861 507.496)"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset=".383" stopColor="#34a853" />
              <stop offset=".706" stopColor="#34a853" stopOpacity=".7" />
              <stop offset="1" stopColor="#34a853" stopOpacity="0" />
            </radialGradient>
            <path
              fill="url(#SVGPEcGceFK_signup)"
              d="M34.5 374.4C77.2 456.1 162.4 512 261.1 512c69.1 0 127.1-22.8 169.4-61.9c48.4-44.7 76.3-110.3 76.3-188.3c0-4.5-.4-8.7-.6-13.1c-59-19.4-126.6-26.7-197.2-17.9c-16.4 2-32.2 5.1-47.8 8.7v69.1H399c-6.1 31.9-24.2 58.9-51.4 77c-22.8 15.4-51.9 24.7-86.3 24.7c-66.6 0-123.1-44.9-143.4-105.4h-.3l.3-.2c-.5-1.5-.7-3.1-1.2-4.6c-32.5 21.3-60.2 46.5-82.2 74.3"
            />
            <linearGradient
              id="SVGz1WGLcWS_signup"
              x1="521.402"
              x2="255.847"
              y1="398.065"
              y2="71.945"
              gradientTransform="matrix(1 0 0 -1 0 514)"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset=".671" stopColor="#4285f4" />
              <stop offset=".885" stopColor="#4285f4" stopOpacity="0" />
            </linearGradient>
            <path
              fill="url(#SVGz1WGLcWS_signup)"
              d="M430.5 450.1c48.4-44.7 76.3-110.3 76.3-188.3c0-18.2-1.6-35.6-4.7-52.4h-241v99.1h137.8c-6.1 31.9-24.2 58.9-51.4 77c-16.4 11-36.1 18.8-58.6 22.3l85.7 79.7c20.8-9.7 39.6-22.3 55.9-37.4"
            />
          </svg>
          <span>Google</span>
        </motion.button>

        <motion.button
          type="button"
          onClick={() => signInWithOAuth("apple")}
          whileHover={{ y: -1 }}
          whileTap={{ x: 2, y: 2 }}
          className="flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-md border border-ink bg-paper-white hover:bg-cream text-ink text-body-sm font-medium transition-all shadow-[2px_2px_0_0_#262626] active:shadow-none cursor-pointer"
        >
          {/* User provided Apple SVG */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="size-5 shrink-0 fill-current text-ink"
            viewBox="0 0 256 315"
          >
            <path d="M0 0h256v315H0z" fill="none" />
            <path d="M213.803 167.03c.442 47.58 41.74 63.413 42.197 63.615c-.35 1.116-6.599 22.563-21.757 44.716c-13.104 19.153-26.705 38.235-48.13 38.63c-21.05.388-27.82-12.483-51.888-12.483c-24.061 0-31.582 12.088-51.51 12.871c-20.68.783-36.428-20.71-49.64-39.793c-27-39.033-47.633-110.3-19.928-158.406c13.763-23.89 38.36-39.017 65.056-39.405c20.307-.387 39.475 13.662 51.889 13.662c12.406 0 35.699-16.895 60.186-14.414c10.25.427 39.026 4.14 57.503 31.186c-1.49.923-34.335 20.044-33.978 59.822M174.24 50.199c10.98-13.29 18.369-31.79 16.353-50.199c-15.826.636-34.962 10.546-46.314 23.828c-10.173 11.763-19.082 30.589-16.678 48.633c17.64 1.365 35.66-8.964 46.64-22.262" />
          </svg>
          <span>Apple</span>
        </motion.button>
      </StaggerItem>

      {/* Divider */}
      <StaggerItem className="relative flex items-center justify-center my-0.5">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-rule" />
        </div>
        <span className="relative bg-paper-white px-3 text-caption text-muted-ink font-medium">
          Or continue with
        </span>
      </StaggerItem>

      <form action={formAction} className="flex flex-col gap-3.5">
        {/* Full Name & Username in 2 Columns */}
        <StaggerItem className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="fullName" className="text-caption font-medium text-ink">
              Full name
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              placeholder="John Doe"
              required
              className="w-full bg-paper-white border border-ink focus:border-ink focus:ring-1 focus:ring-ink text-ink placeholder:text-muted-gray rounded-md px-3.5 py-2.5 text-body-sm transition-all outline-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="username" className="text-caption font-medium text-ink">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              placeholder="johndoe"
              required
              className="w-full bg-paper-white border border-ink focus:border-ink focus:ring-1 focus:ring-ink text-ink placeholder:text-muted-gray rounded-md px-3.5 py-2.5 text-body-sm transition-all outline-none"
            />
          </div>
        </StaggerItem>

        {/* Email Field */}
        <StaggerItem className="flex flex-col gap-1">
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
            className="w-full bg-paper-white border border-ink focus:border-ink focus:ring-1 focus:ring-ink text-ink placeholder:text-muted-gray rounded-md px-3.5 py-2.5 text-body-sm transition-all outline-none"
          />
        </StaggerItem>

        {/* Password Field */}
        <StaggerItem className="flex flex-col gap-1">
          <label htmlFor="password" className="text-caption font-medium text-ink">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Min. 8 characters"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-paper-white border border-ink focus:border-ink focus:ring-1 focus:ring-ink text-ink placeholder:text-muted-gray rounded-md px-3.5 py-2.5 pr-10 text-body-sm transition-all outline-none"
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

        {/* Confirm Password Field */}
        <StaggerItem className="flex flex-col gap-1">
          <label htmlFor="confirmPassword" className="text-caption font-medium text-ink">
            Confirm password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Repeat password"
              minLength={8}
              required
              className="w-full bg-paper-white border border-ink focus:border-ink focus:ring-1 focus:ring-ink text-ink placeholder:text-muted-gray rounded-md px-3.5 py-2.5 pr-10 text-body-sm transition-all outline-none"
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

        {/* Lime Primary Action Button — DESIGN.md Lime Sprint CTA */}
        <StaggerItem>
          <motion.button
            type="submit"
            disabled={isPending}
            whileHover={{ y: -1 }}
            whileTap={{ x: 2, y: 2 }}
            transition={INPUT_TRANSITION}
            className="w-full mt-1 btn-ember bg-[#a3e635] text-ink border border-ink font-medium py-3 px-6 rounded-md transition-all shadow-[2px_2px_0_0_#262626] active:shadow-none disabled:opacity-50 text-body-sm cursor-pointer"
          >
            {isPending ? "CREATING ACCOUNT…" : "SIGN UP"}
          </motion.button>
        </StaggerItem>
      </form>

      {/* Terms & Privacy Agreement Notice */}
      <StaggerItem>
        <p className="text-center text-caption text-muted-ink leading-normal px-2">
          By continuing, you agree to our{" "}
          <Link href="/terms" className="underline hover:text-ink">
            Terms of Service
          </Link>{" "}
          &amp;{" "}
          <Link href="/privacy" className="underline hover:text-ink">
            Privacy Policy
          </Link>
          .
        </p>
      </StaggerItem>

      <StaggerItem>
        <p className="text-center text-body-sm text-muted-ink font-medium">
          Already have an account?{" "}
          <Link href="/login" className="text-ink font-semibold underline underline-offset-4 hover:opacity-75">
            Sign in
          </Link>
        </p>
      </StaggerItem>
    </Stagger>
  );
}

