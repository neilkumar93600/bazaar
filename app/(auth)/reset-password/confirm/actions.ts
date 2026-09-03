"use server";

import { redirect } from "next/navigation";
import { type EmailOtpType } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/auth/next-url";

/** The click `app/api/auth/confirm/route.ts` now waits for before it will
 *  verify a recovery token — see that file's comment for why. Runs the exact
 *  verifyOtp call the route used to run on the bare GET, just gated behind a
 *  real user gesture instead of a mail client's link preview.
 *
 *  Plain form action, no returned state: every path here ends in `redirect`,
 *  same shape as `app/dashboard/actions.ts`'s `signOut`. */
export async function confirmRecovery(formData: FormData) {
  const token_hash = String(formData.get("token_hash") ?? "");
  const type = String(formData.get("type") ?? "") as EmailOtpType;
  const next = safeNext(String(formData.get("next") ?? ""), "/dashboard");

  if (!token_hash || !type) {
    redirect("/login?error=confirmation_failed");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash });

  if (error) {
    redirect("/login?error=confirmation_failed");
  }

  redirect(next);
}
