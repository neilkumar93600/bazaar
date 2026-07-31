import { createClient } from "@/lib/supabase/server";

const DESIGNS_PER_COLUMN = 14;

export type FeedDesign = {
  id: string;
  imageUrl: string;
  isClaimed: boolean;
};

export type FeedColumn = {
  id: string;
  name: string;
  slug: string;
  isRentedTakeover: boolean;
  designs: FeedDesign[];
};

export async function getFeedColumns(): Promise<FeedColumn[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let vibesQuery = supabase
    .from("vibes")
    .select("id, name, slug, is_default_column, owner_id")
    .order("created_at", { ascending: true });

  if (user) {
    const { data: follows } = await supabase
      .from("follows")
      .select("followed_id")
      .eq("follower_id", user.id);

    const followedIds = follows?.map((f) => f.followed_id) ?? [];
    vibesQuery = vibesQuery.or(
      followedIds.length > 0
        ? `is_default_column.eq.true,owner_id.in.(${followedIds.join(",")})`
        : "is_default_column.eq.true",
    );
  } else {
    vibesQuery = vibesQuery.eq("is_default_column", true);
  }

  const { data: vibes } = await vibesQuery;
  if (!vibes || vibes.length === 0) return [];

  const now = new Date().toISOString();
  const [{ data: designs }, { data: rentals }] = await Promise.all([
    supabase
      .from("designs")
      .select("id, vibe_id, image_url, is_claimed")
      .eq("moderation_status", "approved")
      .in(
        "vibe_id",
        vibes.map((v) => v.id),
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("column_rentals")
      .select("vibe_id")
      .lte("starts_at", now)
      .gte("ends_at", now)
      .in(
        "vibe_id",
        vibes.map((v) => v.id),
      ),
  ]);

  const rentedVibeIds = new Set(rentals?.map((r) => r.vibe_id));

  return vibes.map((vibe) => ({
    id: vibe.id,
    name: vibe.name,
    slug: vibe.slug,
    isRentedTakeover: rentedVibeIds.has(vibe.id),
    designs: (designs ?? [])
      .filter((d) => d.vibe_id === vibe.id)
      .slice(0, DESIGNS_PER_COLUMN)
      .map((d) => ({
        id: d.id,
        imageUrl: d.image_url,
        isClaimed: d.is_claimed,
      })),
  }));
}
