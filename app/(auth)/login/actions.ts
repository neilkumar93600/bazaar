"use server";

import { redirect } from "next/navigation";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/auth/next-url";

export type LoginState = { error?: string };

export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const identifier = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!identifier || !password) {
    return { error: "Email and password are required." };
  }

  // Supabase auth only knows email/phone — a username sign-in resolves the
  // handle to its owner's email first, same field the form always posts.
  const email = identifier.includes("@")
    ? identifier
    : await emailForHandle(identifier);

  if (!email) {
    // Deliberately generic — same failure whether the handle doesn't exist
    // or the password is wrong.
    return { error: "Incorrect email or password." };
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

/** profiles.handle is public (profiles_select_public), so the id lookup runs
 *  under the caller's own anon session — only the id → email step needs the
 *  service client, since email lives in auth.users and is never public. */
async function emailForHandle(handle: string): Promise<string | null> {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("handle", handle.toLowerCase())
    .maybeSingle();

  if (!profile) return null;

  const admin = createServiceClient();
  const { data } = await admin.auth.admin.getUserById(profile.id);
  return data.user?.email ?? null;
}
