"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/auth/next-url";

export type SignupState = { error?: string };

export async function signup(
  _prevState: SignupState,
  formData: FormData,
): Promise<SignupState> {
  // Full name is optional: every surface that shows it already falls back to
  // `@handle` (see app/dashboard/layout.tsx), so requiring it only added a
  // field between a visitor and the thing they came to do.
  const fullName = String(formData.get("fullName") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!username || !email || !password) {
    return { error: "Username, email and password are required." };
  }

  // No confirm-password field to compare against — the form unmasks the
  // password on demand, which catches the typo that a second field existed to
  // catch, and a forgotten password has its own reset flow.
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName || null,
        username: username,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Supabase answers a signup for an address that already has a confirmed
  // account with 200 and a decoy user carrying no identities — that is its
  // user-enumeration protection, and it sends no email at all. Without this
  // check the browser lands on /verify-otp waiting for a code that is never
  // coming, which is exactly how it read from the outside: "OTP not arriving".
  // An unconfirmed account is a different case: it keeps its identity and does
  // get a fresh code, so it still falls through to the verify page.
  if (data.user && data.user.identities?.length === 0) {
    return {
      error: "That email already has an account. Sign in instead, or reset the password if you've forgotten it.",
    };
  }

  // `next` rides along so the OTP screen can finish the trip the gate stopped.
  const next = safeNext(String(formData.get("next") ?? ""), "/create");
  redirect(
    `/verify-otp?email=${encodeURIComponent(email)}&next=${encodeURIComponent(next)}`,
  );
}
