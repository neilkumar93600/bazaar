import { getFeedColumns } from "@/lib/data/feed";
import {
  getHomeStats,
  getTopCreators,
  getTrendingDesigns,
  getVibeTiles,
} from "@/lib/data/home";
import { Feed } from "@/components/home/Feed";
import { VibeTiles } from "@/components/home/VibeTiles";
import { TrendingRow } from "@/components/home/TrendingRow";
import { TopCreatorsRow } from "@/components/home/TopCreatorsRow";
import { Hero } from "@/components/home/Hero";
import { TrustStrip } from "@/components/home/TrustStrip";
import { HowItWorks } from "@/components/home/HowItWorks";
import { ProofSocialStrip } from "@/components/home/ProofSocialStrip";
import { StatsBar } from "@/components/home/StatsBar";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [columns, vibes, trending, creators, stats] = await Promise.all([
    getFeedColumns(),
    getVibeTiles(),
    getTrendingDesigns(),
    getTopCreators(),
    getHomeStats(),
  ]);

  return (
    <div className="flex flex-col gap-12 pb-10 sm:pb-14">
      {/* 3D Scroll Hero Section (400vh sticky canvas) */}
      <Hero />

      {/* Social Proof Brand Band */}
      <TrustStrip />

      {/* Main Home Content Container */}
      <main className="mx-auto flex w-full max-w-[1400px] flex-col gap-12 px-4 sm:px-6 lg:px-8">
        <VibeTiles vibes={vibes} />
        <TrendingRow designs={trending} />

        {/* 3-Step Core Loop Strip */}
        <HowItWorks />

        {/* Infinite Live Vibe Marquee Catalog Feed */}
        <Feed columns={columns} />

        {/* Proof of Claim & Auto Storefront Showcase */}
        <ProofSocialStrip />
      </main>

      {/* Stats Section */}
      <StatsBar stats={stats} />

      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-12 px-4 sm:px-6 lg:px-8">
        <TopCreatorsRow creators={creators} />
      </div>

    </div>
  );
}
