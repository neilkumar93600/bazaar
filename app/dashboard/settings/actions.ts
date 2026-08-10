"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type UpdateProfileState = { error?: string; success?: boolean };

export async function updateProfile(
  _prevState: UpdateProfileState,
  formData: FormData,
): Promise<UpdateProfileState> {
  const displayName = String(formData.get("displayName") ?? "").trim();
  const handle = String(formData.get("handle") ?? "").trim().toLowerCase().replace(/^@/, "");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  let avatarUrl = String(formData.get("avatarUrl") ?? "").trim();
  let bannerUrl = String(formData.get("bannerUrl") ?? "").trim();

  const avatarFile = formData.get("avatarFile") as File | null;
  const bannerFile = formData.get("bannerFile") as File | null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You must be signed in." };
  }

  // 1. Username validation & uniqueness check
  if (handle) {
    const handleRegex = /^[a-z0-9_]{3,30}$/;
    if (!handleRegex.test(handle)) {
      return { error: "Username must be 3-30 characters long (letters, numbers, underscores only)." };
    }

    const { data: existingUser } = await supabase
      .from("profiles")
      .select("id")
      .eq("handle", handle)
      .neq("id", user.id)
      .maybeSingle();

    if (existingUser) {
      return { error: `Username @${handle} is already taken. Please pick another one.` };
    }
  }

  // 2. Email update check via Supabase Auth
  if (email && user.email && email !== user.email.toLowerCase()) {
    const { error: emailError } = await supabase.auth.updateUser({ email });
    if (emailError) {
      return { error: `Email update failed: ${emailError.message}` };
    }
  }

  // 3. Process avatarFile upload
  if (avatarFile && avatarFile.size > 0 && avatarFile.name) {
    try {
      const fileExt = avatarFile.name.split(".").pop() || "png";
      const filePath = `avatar-${user.id}-${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, avatarFile, { upsert: true });

      if (!uploadError && uploadData) {
        const { data: publicUrlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(filePath);
        avatarUrl = publicUrlData.publicUrl;
      } else {
        const buffer = Buffer.from(await avatarFile.arrayBuffer());
        avatarUrl = `data:${avatarFile.type || "image/png"};base64,${buffer.toString("base64")}`;
      }
    } catch {
      const buffer = Buffer.from(await avatarFile.arrayBuffer());
      avatarUrl = `data:${avatarFile.type || "image/png"};base64,${buffer.toString("base64")}`;
    }
  }

  // 4. Process bannerFile upload
  if (bannerFile && bannerFile.size > 0 && bannerFile.name) {
    try {
      const fileExt = bannerFile.name.split(".").pop() || "png";
      const filePath = `banner-${user.id}-${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, bannerFile, { upsert: true });

      if (!uploadError && uploadData) {
        const { data: publicUrlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(filePath);
        bannerUrl = publicUrlData.publicUrl;
      } else {
        const buffer = Buffer.from(await bannerFile.arrayBuffer());
        bannerUrl = `data:${bannerFile.type || "image/png"};base64,${buffer.toString("base64")}`;
      }
    } catch {
      const buffer = Buffer.from(await bannerFile.arrayBuffer());
      bannerUrl = `data:${bannerFile.type || "image/png"};base64,${buffer.toString("base64")}`;
    }
  }

  const update: Record<string, unknown> = {
    display_name: displayName || null,
  };
  if (handle) update.handle = handle;
  if (avatarUrl) update.avatar_url = avatarUrl;
  if (bannerUrl) update.banner_url = bannerUrl;

  const { error } = await supabase
    .from("profiles")
    .update(update)
    .eq("id", user.id);

  if (error) {
    return { error: "Could not save changes." };
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
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
