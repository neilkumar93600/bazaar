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
    <div className="w-full rounded-[var(--sf-radius)] border-[length:var(--sf-border,1px)] border-[var(--sf-ink)] bg-[var(--sf-surface)] shadow-[var(--sf-shadow)] overflow-hidden flex flex-col mb-8">
      {/* Full-Width Storefront Cover Banner */}
      <div className="relative aspect-[4/1] sm:aspect-[5/1] w-full bg-[var(--sf-band)] border-b-[length:var(--sf-border,1px)] border-[var(--sf-ink)] overflow-hidden">
        {profile.bannerUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.bannerUrl}
            alt=""
            className="size-full object-cover"
          />
        ) : (
          <div className="size-full bg-[var(--sf-band)] bg-[image:var(--sf-banner)] [background-size:var(--sf-banner-size)] flex items-center justify-center p-4">
            <span className="text-caption font-mono uppercase tracking-widest text-[var(--sf-on-band)] bg-[var(--sf-band)]/90 border-[length:var(--sf-border,1px)] border-[var(--sf-accent)]/40 px-4 py-1 rounded-[var(--sf-radius-sm,4px)]">
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
                className="size-24 sm:size-28 rounded-full border-4 border-[var(--sf-surface)] object-cover shadow-[var(--sf-shadow)]"
              />
            ) : (
              <div className={`flex size-24 sm:size-28 items-center justify-center rounded-full border-4 border-[var(--sf-surface)] ${avatarColorClass} text-3xl font-mono font-semibold shadow-[var(--sf-shadow)]`}>
                {initial}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1.5 pt-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-heading-md font-semibold text-[var(--sf-ink)] tracking-tight">
                {displayName}
              </h1>
              <div className="flex items-center gap-1.5 rounded-full border-[length:var(--sf-border,1px)] border-[var(--sf-accent,var(--color-mint-edge))]/60 bg-[var(--sf-wash,var(--color-mint-wash))] px-3 py-0.5 text-caption font-mono font-medium text-foreground">
                <CheckCircle2 className="size-3.5 text-[var(--sf-accent)]" />
                Verified Creator
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-caption font-mono text-[var(--sf-muted)]">
              <span className="text-[var(--sf-ink)] font-semibold">@{profile.handle}</span>
              {claimedSince && (
                <span className="flex items-center gap-1">
                  <Calendar className="size-3.5 text-[var(--sf-muted)]" />
                  Member since {format(new Date(claimedSince), "MMM yyyy")}
                </span>
              )}
            </div>

            {profile.bio && (
              <p className="mt-1 text-body-sm text-[var(--sf-ink)] leading-relaxed max-w-2xl">
                {profile.bio}
              </p>
            )}
          </div>
        </div>

        {/* Right Column Actions & Stats */}
        <div className="flex flex-col gap-3 shrink-0 sm:items-end">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-[var(--sf-radius-sm,4px)] border-[length:var(--sf-border,1px)] border-[var(--sf-ink)] bg-[var(--sf-surface)] px-3 py-1.5 shadow-[var(--sf-shadow)]">
              <Shirt className="size-4 text-[var(--sf-ink)]" />
              <span className="text-body-sm font-mono font-bold text-[var(--sf-ink)]">
                {designs.length}
              </span>
              <span className="text-caption font-mono text-[var(--sf-muted)]">Claimed</span>
            </div>

            <div className="flex items-center gap-1.5 rounded-[var(--sf-radius-sm,4px)] border-[length:var(--sf-border,1px)] border-[var(--sf-ink)] bg-[var(--sf-surface)] px-3 py-1.5 shadow-[var(--sf-shadow)]">
              <Users className="size-4 text-[var(--sf-ink)]" />
              <span className="text-body-sm font-mono font-bold text-[var(--sf-ink)]">
                {followerCount}
              </span>
              <span className="text-caption font-mono text-[var(--sf-muted)]">Followers</span>
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
