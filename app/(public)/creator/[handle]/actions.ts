"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export async function toggleFollow(profileId: string, handle: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Must be signed in to follow.");
  }

  const { data: existing } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("follower_id", user.id)
    .eq("followed_id", profileId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("follows")
      .delete()
      .eq("follower_id", user.id)
      .eq("followed_id", profileId);
  } else {
    await supabase
      .from("follows")
      .insert({ follower_id: user.id, followed_id: profileId });
  }

  revalidatePath(`/creator/${handle}`);

  return { isFollowing: !existing };
}
