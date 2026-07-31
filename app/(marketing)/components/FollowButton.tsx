"use client";

import { useState, useTransition } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { toggleFollow } from "@/app/(marketing)/creator/[handle]/actions";

export function FollowButton({
  profileId,
  handle,
  initialIsFollowing,
  isOwnProfile,
  isLoggedIn,
}: {
  profileId: string;
  handle: string;
  initialIsFollowing: boolean;
  isOwnProfile: boolean;
  isLoggedIn: boolean;
}) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isPending, startTransition] = useTransition();

  if (isOwnProfile) return null;

  if (!isLoggedIn) {
    return (
      <Button variant="coral" render={<Link href="/login" />}>
        Follow
      </Button>
    );
  }

  return (
    <Button
      variant={isFollowing ? "outline" : "coral"}
      disabled={isPending}
      onClick={() => {
        const optimisticNext = !isFollowing;
        setIsFollowing(optimisticNext);
        startTransition(async () => {
          const result = await toggleFollow(profileId, handle);
          setIsFollowing(result.isFollowing);
        });
      }}
    >
      {isFollowing ? "Following" : "Follow"}
    </Button>
  );
}
