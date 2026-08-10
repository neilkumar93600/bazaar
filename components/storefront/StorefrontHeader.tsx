import Image from "next/image";
import { format } from "date-fns";
import { CheckCircle2, Calendar, Users, Shirt } from "lucide-react";

import type { StorefrontData } from "@/lib/data/storefront";
import { FollowButton } from "./FollowButton";
import { ShareButton } from "./ShareButton";

const AVATAR_COLOR_CLASSES = [
  "bg-[#262626] text-[#a3e635]",
  "bg-[#303030] text-white",
  "bg-[#047857] text-[#a3e635]",
  "bg-[#4338ca] text-[#e0e7ff]",
  "bg-[#be185d] text-[#fce7f3]",
  "bg-[#b45309] text-[#fef3c7]",
];

function getAvatarColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash += str.charCodeAt(i);
  return AVATAR_COLOR_CLASSES[hash % AVATAR_COLOR_CLASSES.length];
}

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

  const displayName = profile.displayName || `@${profile.handle}`;
  const initial = profile.handle.slice(0, 1).toUpperCase();
  const avatarColorClass = getAvatarColor(profile.handle || "user");

  return (
    <div className="w-full rounded-2xl border border-[#262626] bg-[#fcfff7] shadow-[var(--shadow-xl-2)] overflow-hidden flex flex-col mb-8">
      {/* Full-Width Storefront Cover Banner */}
      <div className="relative aspect-[4/1] sm:aspect-[5/1] w-full bg-[#262626] border-b border-[#262626] overflow-hidden">
        {profile.bannerUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.bannerUrl}
            alt=""
            className="size-full object-cover"
          />
        ) : (
          <div className="size-full bg-[#262626] bg-[radial-gradient(#a3e635_1.5px,transparent_1.5px)] [background-size:18px_18px] flex items-center justify-center p-4">
            <span className="text-caption font-mono uppercase tracking-widest text-[#a3e635] bg-[#262626]/90 border border-[#a3e635]/40 px-4 py-1 rounded-md">
              SHIRT BAZAAR · 1-OF-1 CREATOR STOREFRONT
            </span>
          </div>
        )}
      </div>

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6 p-6 -mt-12 sm:-mt-14">
        {/* Avatar Ring & Creator Info */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-5">
          <div className="relative shrink-0">
            {profile.avatarUrl ? (
              <Image
                src={profile.avatarUrl}
                alt=""
                width={96}
                height={96}
                className="size-24 sm:size-28 rounded-full border-4 border-[#fcfff7] object-cover shadow-[2px_2px_0px_0px_#262626]"
              />
            ) : (
              <div className={`flex size-24 sm:size-28 items-center justify-center rounded-full border-4 border-[#fcfff7] ${avatarColorClass} text-3xl font-mono font-semibold shadow-[2px_2px_0px_0px_#262626]`}>
                {initial}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1.5 pt-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-heading-md font-semibold text-[#262626] tracking-tight">
                {displayName}
              </h1>
              <div className="flex items-center gap-1.5 rounded-full border border-[#7ee2b8] bg-[#dcfff1] px-3 py-0.5 text-caption font-mono font-medium text-[#262626]">
                <CheckCircle2 className="size-3.5 text-emerald-700" />
                Verified Creator
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-caption font-mono text-[#525252]">
              <span className="text-[#262626] font-semibold">@{profile.handle}</span>
              {claimedSince && (
                <span className="flex items-center gap-1">
                  <Calendar className="size-3.5 text-[#737373]" />
                  Member since {format(new Date(claimedSince), "MMM yyyy")}
                </span>
              )}
            </div>

            {profile.bio && (
              <p className="mt-1 text-body-sm text-[#262626] leading-relaxed max-w-2xl">
                {profile.bio}
              </p>
            )}
          </div>
        </div>

        {/* Right Column Actions & Stats */}
        <div className="flex flex-col gap-3 shrink-0 sm:items-end">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-lg border border-[#262626] bg-white px-3 py-1.5 shadow-[2px_2px_0px_0px_#262626]">
              <Shirt className="size-4 text-[#262626]" />
              <span className="text-body-sm font-mono font-bold text-[#262626]">
                {designs.length}
              </span>
              <span className="text-caption font-mono text-[#525252]">Claimed</span>
            </div>

            <div className="flex items-center gap-1.5 rounded-lg border border-[#262626] bg-white px-3 py-1.5 shadow-[2px_2px_0px_0px_#262626]">
              <Users className="size-4 text-[#262626]" />
              <span className="text-body-sm font-mono font-bold text-[#262626]">
                {followerCount}
              </span>
              <span className="text-caption font-mono text-[#525252]">Followers</span>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
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
      </div>
    </div>
  );
}
