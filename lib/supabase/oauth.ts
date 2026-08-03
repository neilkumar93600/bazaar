"use client";

import { createClient } from "@/lib/supabase/client";

export async function signInWithOAuth(provider: "google" | "apple") {
  const supabase = createClient();
  await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${window.location.origin}/api/auth/callback` },
  });
}
