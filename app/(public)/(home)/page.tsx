import { getFeedColumns } from "@/lib/data/feed";
import { getHomeStats, getVibeTiles } from "@/lib/data/home";
import { Hero } from "@/components/home/Hero";
import { Gallery } from "@/components/home/Gallery";
import { ClaimSpread } from "@/components/home/ClaimSpread";
import { Feed } from "@/components/home/Feed";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [columns, vibes, stats] = await Promise.all([
    getFeedColumns(),
    getVibeTiles(),
    getHomeStats(),
  ]);

  return (
    <div className="flex flex-col gap-20 pb-20">
      <Hero vibes={vibes} unclaimedCount={stats.designsUnclaimed} />

      <main className="mx-auto flex w-full max-w-page flex-col gap-20 px-6 md:px-16">
        <Gallery
          columns={columns}
          vibes={vibes}
          designsLive={stats.designsLive}
        />
        <ClaimSpread />
        <Feed columns={columns} />
      </main>
    </div>
  );
}
