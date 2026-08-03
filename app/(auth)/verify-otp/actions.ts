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
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "signup",
  });

  if (error) {
    return { error: "That code is invalid or has expired." };
  }

  const username = data.user?.user_metadata?.username;
  const fullName = data.user?.user_metadata?.full_name;
  if (username && data.user) {
    await supabase
      .from("profiles")
      .update({ handle: username, display_name: fullName ?? null })
      .eq("id", data.user.id);
  }

  redirect("/onboarding");
}

export async function resendOtp(email: string) {
  if (!email) return;
  const supabase = await createClient();
  await supabase.auth.resend({ type: "signup", email });
}
