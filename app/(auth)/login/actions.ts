"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/auth/next-url";

export type LoginState = { error?: string };

export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Deliberately generic — never confirm whether the email is registered.
    return { error: "Incorrect email or password." };
  }

  // The feed, not the dashboard: the product's front door is the bazaar —
  // unless the gate sent them here mid-trip, in which case finish that trip.
  redirect(safeNext(String(formData.get("next") ?? ""), "/"));
}
