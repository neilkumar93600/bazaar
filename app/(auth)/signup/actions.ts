"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type SignupState = { error?: string };

export async function signup(
  _prevState: SignupState,
  formData: FormData,
): Promise<SignupState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!fullName || !username || !email || !password) {
    return { error: "All fields are required." };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
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

  redirect(`/verify-otp?email=${encodeURIComponent(email)}`);
}
