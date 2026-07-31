"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type VerifyOtpState = { error?: string };

export async function verifyOtp(
  _prevState: VerifyOtpState,
  formData: FormData,
): Promise<VerifyOtpState> {
  const email = String(formData.get("email") ?? "").trim();
  const token = String(formData.get("token") ?? "").trim();

  if (!email || !token) {
    return { error: "Email and code are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "signup",
  });

  if (error) {
    return { error: "That code is invalid or has expired." };
  }

  redirect("/onboarding");
}

export async function resendOtp(email: string) {
  if (!email) return;
  const supabase = await createClient();
  await supabase.auth.resend({ type: "signup", email });
}
