"use server";

import { revalidatePath } from "next/cache";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { DEFAULT_THEME, type StorefrontTheme } from "@/lib/storefront/theme";
import { generateThemeFromPrompt } from "@/lib/storefront/theme-prompt";
import { generateBannerFromPrompt } from "@/lib/storefront/banner-prompt";

export type UpdateProfileState = { error?: string; success?: boolean };

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

/** Rejects anything that isn't a small, actually-an-image upload before it
 *  ever reaches Storage — nothing downstream (avatar/banner) needs anything
 *  else. Returns an error string, or null when the file is fine. */
function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return "Please upload a PNG, JPEG, WebP, or GIF image.";
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return "Image must be smaller than 5MB.";
  }
  return null;
}

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
    const validationError = validateImageFile(avatarFile);
    if (validationError) return { error: validationError };

    const fileExt = avatarFile.name.split(".").pop() || "png";
    const filePath = `avatar-${user.id}-${Date.now()}.${fileExt}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, avatarFile, { upsert: true, contentType: avatarFile.type });

    if (uploadError || !uploadData) {
      return { error: "Avatar upload failed. Please try again." };
    }

    const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
    avatarUrl = publicUrlData.publicUrl;
  }

  // 4. Process bannerFile upload
  if (bannerFile && bannerFile.size > 0 && bannerFile.name) {
    const validationError = validateImageFile(bannerFile);
    if (validationError) return { error: validationError };

    const fileExt = bannerFile.name.split(".").pop() || "png";
    const filePath = `banner-${user.id}-${Date.now()}.${fileExt}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, bannerFile, { upsert: true, contentType: bannerFile.type });

    if (uploadError || !uploadData) {
      return { error: "Banner upload failed. Please try again." };
    }

    const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
    bannerUrl = publicUrlData.publicUrl;
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

export type ThemePromptState = {
  error?: string;
  success?: boolean;
  theme?: StorefrontTheme;
  bannerUrl?: string;
};

/** Rewrites a creator's storefront look from a sentence they typed.
 *
 *  The model's answer is never written as given — `generateThemeFromPrompt`
 *  hands back an already-parsed theme, so the row can only ever hold hex
 *  literals and known enum values. "reset" clears the column back to NULL,
 *  which renders as house style.
 */
export async function applyStorefrontThemePrompt(
  _prevState: ThemePromptState,
  formData: FormData,
): Promise<ThemePromptState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You must be signed in." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("handle")
    .eq("id", user.id)
    .single();

  const save = async (theme: StorefrontTheme | null) => {
    const { error } = await supabase
      .from("profiles")
      .update({ storefront_theme: theme })
      .eq("id", user.id);
    if (error) return false;
    revalidatePath("/dashboard/settings");
    if (profile?.handle) revalidatePath(`/creator/${profile.handle}`);
    return true;
  };

  const intent = formData.get("intent");

  if (intent === "reset") {
    return (await save(null))
      ? { success: true, theme: DEFAULT_THEME }
      : { error: "Could not reset your storefront look." };
  }

  const prompt = String(formData.get("themePrompt") ?? "").trim();
  if (!prompt) {
    return { error: "Describe how you want your storefront to look." };
  }

  // The cover image is its own button: it is a paid image generation (~$0.09 a
  // press against the theming call's fraction of a cent) and it takes minutes,
  // so it does not ride along with every colour tweak.
  if (intent === "banner") {
    let banner;
    try {
      banner = await generateBannerFromPrompt(prompt);
    } catch (error) {
      console.error("[settings] storefront banner generation failed", error);
      return { error: "Could not draw a banner from that. Try describing the scene or texture." };
    }

    // Service role for the write: the "designs" bucket is not writable by a
    // signed-in user's own key, same as every other generated image in the app.
    const admin = createServiceClient();
    const path = `storefront-banners/${user.id}/${Date.now()}.png`;
    const { error: uploadError } = await admin.storage
      .from("designs")
      .upload(path, banner.bytes, { contentType: banner.contentType, upsert: true });

    if (uploadError) {
      console.error("[settings] storefront banner upload failed", uploadError);
      return { error: "The banner drew fine but could not be saved. Try again." };
    }

    const {
      data: { publicUrl },
    } = admin.storage.from("designs").getPublicUrl(path);

    const { error: bannerError } = await supabase
      .from("profiles")
      .update({ banner_url: publicUrl })
      .eq("id", user.id);

    if (bannerError) {
      return { error: "The banner drew fine but could not be saved. Try again." };
    }

    revalidatePath("/dashboard/settings");
    if (profile?.handle) revalidatePath(`/creator/${profile.handle}`);
    return { success: true, bannerUrl: publicUrl };
  }

  let theme: StorefrontTheme;
  try {
    theme = await generateThemeFromPrompt(prompt);
  } catch (error) {
    console.error("[settings] storefront theme prompt failed", error);
    return { error: "Could not read a storefront look out of that. Try describing the colours and mood." };
  }

  return (await save(theme))
    ? { success: true, theme }
    : { error: "Could not save your storefront look." };
}
