"use server";

import { createClient } from "@/lib/supabase/server";

export type SubscribeState = { error?: string; success?: boolean };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function subscribeToNewsletter(
  _prevState: SubscribeState,
  formData: FormData,
): Promise<SubscribeState> {
  const email = String(formData.get("email") ?? "").trim();

  if (!EMAIL_PATTERN.test(email)) {
    return { error: "Enter a valid email address." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("newsletter_subscribers").insert({ email });

  if (error && error.code !== "23505") {
    // 23505 = unique_violation — already subscribed, treat as success.
    return { error: "Could not subscribe. Try again." };
  }

  return { success: true };
}
