import { createClient } from "@/lib/supabase/server";

export type StorefrontProfile = {
  id: string;
  handle: string;
  displayName: string | null;
  avatarUrl: string | null;
};

export type StorefrontDesign = {
  id: string;
  imageUrl: string;
  claimedAt: string;
  vibe: { name: string; slug: string } | null;
};

export type StorefrontData = {
  profile: StorefrontProfile;
  followerCount: number;
  designs: StorefrontDesign[];
  claimedSince: string | null;
  isFollowing: boolean;
  isOwnProfile: boolean;
  viewerIsLoggedIn: boolean;
};

export async function getStorefrontData(
  handle: string,
): Promise<StorefrontData | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, handle, display_name, avatar_url")
    .eq("handle", handle)
    .maybeSingle();

  if (!profile) return null;

  const followRowPromise =
    user && user.id !== profile.id
      ? supabase
          .from("follows")
          .select("follower_id")
          .eq("follower_id", user.id)
          .eq("followed_id", profile.id)
          .maybeSingle()
      : Promise.resolve({ data: null as { follower_id: string } | null });

  const [{ count: followerCount }, { data: claims }, { data: followRow }] =
    await Promise.all([
      supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("followed_id", profile.id),
      supabase
        .from("claims")
        .select("design_id, claimed_at")
        .eq("claimant_id", profile.id)
        .order("claimed_at", { ascending: true }),
      followRowPromise,
    ]);

  const claimList = claims ?? [];
  const designIds = claimList.map((c) => c.design_id);

  const { data: designRows } = designIds.length
    ? await supabase
        .from("designs")
        .select("id, image_url, vibe_id")
        .in("id", designIds)
        .eq("moderation_status", "approved")
    : { data: [] };

  const vibeIds = [
    ...new Set(
      (designRows ?? [])
        .map((d) => d.vibe_id)
        .filter((id): id is string => id !== null),
    ),
  ];

  const { data: vibeRows } = vibeIds.length
    ? await supabase.from("vibes").select("id, name, slug").in("id", vibeIds)
    : { data: [] };

  const vibeById = new Map((vibeRows ?? []).map((v) => [v.id, v]));
  const claimedAtByDesignId = new Map(
    claimList.map((c) => [c.design_id, c.claimed_at]),
  );

  const designs: StorefrontDesign[] = (designRows ?? [])
    .map((d) => ({
      id: d.id,
      imageUrl: d.image_url,
      claimedAt: claimedAtByDesignId.get(d.id)!,
      vibe: d.vibe_id ? (vibeById.get(d.vibe_id) ?? null) : null,
    }))
    .sort((a, b) => (a.claimedAt < b.claimedAt ? 1 : -1));

  return {
    profile: {
      id: profile.id,
      handle: profile.handle,
      displayName: profile.display_name,
      avatarUrl: profile.avatar_url,
    },
    followerCount: followerCount ?? 0,
    designs,
    claimedSince: claimList.length > 0 ? claimList[0].claimed_at : null,
    isFollowing: Boolean(followRow),
    isOwnProfile: user?.id === profile.id,
    viewerIsLoggedIn: Boolean(user),
  };
}
