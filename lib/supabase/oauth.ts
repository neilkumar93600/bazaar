"use client";

import { createClient } from "@/lib/supabase/client";

/** `next` is the destination the auth gate interrupted. Without it the callback
 *  falls back to /dashboard, which is the wrong landing for someone who came
 *  from the home hero with a prompt half-written — they'd get a stats page of
 *  zeros and their draft stranded in sessionStorage. */
export async function signInWithOAuth(
  provider: "google" | "apple",
  next?: string,
) {
  const supabase = createClient();
  const callback = new URL("/api/auth/callback", window.location.origin);
  if (next) callback.searchParams.set("next", next);

  await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: callback.toString() },
  });
}
