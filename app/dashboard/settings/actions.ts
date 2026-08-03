"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type UpdateProfileState = { error?: string; success?: boolean };

export async function updateProfile(
  _prevState: UpdateProfileState,
  formData: FormData,
): Promise<UpdateProfileState> {
  const displayName = String(formData.get("displayName") ?? "").trim();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You must be signed in." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName || null })
    .eq("id", user.id);

  if (error) {
    return { error: "Could not save changes." };
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
}

export type UpdatePreferencesState = { error?: string; success?: boolean };

export async function updateNotificationPreferences(
  _prevState: UpdatePreferencesState,
  formData: FormData,
): Promise<UpdatePreferencesState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You must be signed in." };
  }

  const { error } = await supabase.from("notification_preferences").upsert({
    user_id: user.id,
    notify_claims: formData.get("notifyClaims") === "on",
    notify_royalties: formData.get("notifyRoyalties") === "on",
    notify_messages: formData.get("notifyMessages") === "on",
    notify_orders: formData.get("notifyOrders") === "on",
    updated_at: new Date().toISOString(),
  });

  if (error) {
    return { error: "Could not save preferences." };
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
}
