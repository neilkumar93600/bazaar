"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { login, type LoginState } from "@/app/(auth)/login/actions";
import { signInWithOAuth } from "@/lib/supabase/oauth";
import { Stagger, StaggerItem } from "@/components/ui/motion";

const initialState: LoginState = {};
const INPUT_TRANSITION = { type: "spring", stiffness: 400, damping: 25 } as const;

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(login, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Stagger className="flex flex-col gap-6">
      {/* Social Login Buttons (Google & Apple) — DESIGN.md Outlined Secondary Button */}
      <StaggerItem className="flex items-center gap-3">
        <motion.button
          type="button"
          onClick={() => signInWithOAuth("google")}
          whileHover={{ y: -1 }}
          whileTap={{ x: 2, y: 2 }}
          className="flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-md border border-ink bg-paper-white hover:bg-cream text-ink text-body-sm font-medium transition-all shadow-glow active:shadow-none cursor-pointer"
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
              id="SVGlCFn0bxH_login"
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
              fill="url(#SVGlCFn0bxH_login)"
              d="M117.8 304.9h-.3l.3-.2c-5.1-15.4-8.1-31.7-8.1-48.6c0-17 3-33.3 8.1-48.6c12.8-38.3 40.2-70.2 75.3-88.6C169 86.9 138.3 64 104 54.2c-29.7 23.3-54.3 52.9-71.5 87C15.1 175.7 5.1 214.6 5.1 256s10 80.3 27.5 114.7v.2c28.3 56 76.5 100.3 135.3 123.4c24.6-22.5 44.7-53 58.6-88.7c-50.9-12.4-92.1-51.1-108.7-100.7"
            />
            <radialGradient
              id="SVGPEcGceFK_login"
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
              fill="url(#SVGPEcGceFK_login)"
              d="M34.5 374.4C77.2 456.1 162.4 512 261.1 512c69.1 0 127.1-22.8 169.4-61.9c48.4-44.7 76.3-110.3 76.3-188.3c0-4.5-.4-8.7-.6-13.1c-59-19.4-126.6-26.7-197.2-17.9c-16.4 2-32.2 5.1-47.8 8.7v69.1H399c-6.1 31.9-24.2 58.9-51.4 77c-22.8 15.4-51.9 24.7-86.3 24.7c-66.6 0-123.1-44.9-143.4-105.4h-.3l.3-.2c-.5-1.5-.7-3.1-1.2-4.6c-32.5 21.3-60.2 46.5-82.2 74.3"
            />
            <linearGradient
              id="SVGz1WGLcWS_login"
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
              fill="url(#SVGz1WGLcWS_login)"
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
          className="flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-md border border-ink bg-paper-white hover:bg-cream text-ink text-body-sm font-medium transition-all shadow-glow active:shadow-none cursor-pointer"
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

      {/* Or Continue With Divider */}
      <StaggerItem className="relative flex items-center justify-center my-1">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-rule" />
        </div>
        <span className="relative bg-paper-white px-3 text-caption text-muted-ink font-medium">
          Or continue with
        </span>
      </StaggerItem>

      {/* Main Login Form */}
      <form action={formAction} className="flex flex-col gap-4">
        {/* Email Field */}
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
            className="w-full bg-paper-white border border-ink focus:border-ink focus:ring-1 focus:ring-ink text-ink placeholder:text-muted-gray rounded-md px-3.5 py-2.5 text-body-sm transition-all outline-none"
          />
        </StaggerItem>

        {/* Password Field */}
        <StaggerItem className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-caption font-medium text-ink">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-caption font-medium text-ink hover:underline transition-all"
            >
              Forgot password?
            </Link>
          </div>

          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
              required
              className="w-full bg-paper-white border border-ink focus:border-ink focus:ring-1 focus:ring-ink text-ink placeholder:text-muted-gray rounded-md px-3.5 py-2.5 pr-11 text-body-sm transition-all outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-ink hover:text-ink transition-colors p-1 cursor-pointer"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={showPassword ? "hide" : "show"}
                  initial={{ opacity: 0, rotate: -45 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 45 }}
                  transition={{ duration: 0.15 }}
                  className="block"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </motion.span>
              </AnimatePresence>
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
            className="w-full mt-2 btn-ember font-medium py-3 px-6 disabled:opacity-50 text-body-sm cursor-pointer"
          >
            {isPending ? "SIGNING IN…" : "SIGN IN"}
          </motion.button>
        </StaggerItem>
      </form>

      {/* Footer link */}
      <StaggerItem>
        <p className="text-center text-body-sm text-muted-ink font-medium">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-ink font-semibold underline underline-offset-4 hover:opacity-75">
            Sign up for free
          </Link>
        </p>
      </StaggerItem>
    </Stagger>
  );
}

