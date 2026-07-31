import Image from "next/image";
import { format } from "date-fns";

import type { StorefrontData } from "@/lib/data/storefront";
import { FollowButton } from "./FollowButton";
import { ShareButton } from "./ShareButton";

export function StorefrontHeader({ data }: { data: StorefrontData }) {
  const {
    profile,
    followerCount,
    designs,
    claimedSince,
    isFollowing,
    isOwnProfile,
    viewerIsLoggedIn,
  } = data;

  return (
    <div className="flex flex-col gap-4 rounded-xl bg-white p-6 text-black shadow-[var(--shadow-storefront-card)] lg:sticky lg:top-[90px] lg:h-fit lg:w-[320px] lg:shrink-0">
      <div className="flex items-center gap-4">
        {profile.avatarUrl ? (
          <Image
            src={profile.avatarUrl}
            alt=""
            width={96}
            height={96}
            className="size-24 rounded-full object-cover"
          />
        ) : (
          <div className="flex size-24 items-center justify-center rounded-full bg-cream-paper text-[24px] font-medium text-charcoal">
            {profile.handle.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="flex flex-col gap-1">
          <span className="text-[24px] font-medium tracking-[-0.24px]">
            @{profile.handle}
          </span>
          {profile.displayName && (
            <span className="text-[14px] text-mid-gray">
              {profile.displayName}
            </span>
          )}
        </div>
      </div>

      <div className="text-[14px] text-mid-gray">
        {followerCount} follower{followerCount === 1 ? "" : "s"} ·{" "}
        {designs.length} design{designs.length === 1 ? "" : "s"}
        {claimedSince && (
          <> · claiming since {format(new Date(claimedSince), "MMM yyyy")}</>
        )}
      </div>

      <div className="flex gap-2">
        <FollowButton
          profileId={profile.id}
          handle={profile.handle}
          initialIsFollowing={isFollowing}
          isOwnProfile={isOwnProfile}
          isLoggedIn={viewerIsLoggedIn}
        />
        <ShareButton handle={profile.handle} />
      </div>
    </div>
  );
}
