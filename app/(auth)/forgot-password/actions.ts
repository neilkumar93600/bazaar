"use server";

import { headers } from "next/headers";

import { createClient } from "@/lib/supabase/server";

export type ForgotPasswordState = { submitted?: boolean; error?: string };

export async function requestPasswordReset(
  _prevState: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    return { error: "Email is required." };
  }

  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/api/auth/confirm?next=/reset-password`,
  });

  // Always report success — never reveal whether the email is registered.
  return { submitted: true };
}
