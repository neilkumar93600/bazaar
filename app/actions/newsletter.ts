"use server";

import { after } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { newsletterWelcomeEmail } from "@/lib/email/templates";
import { sendEmail } from "@/lib/email/send";

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

  // Only on a genuinely new row. Re-submitting the form with an address that
  // is already on the list is treated as success above, and welcoming the same
  // person every time they touch the footer is how a signup form becomes spam.
  if (!error) {
    after(async () => {
      const { subject, html } = newsletterWelcomeEmail();
      await sendEmail({ to: email, subject, html });
    });
  }

  return { success: true };
}
