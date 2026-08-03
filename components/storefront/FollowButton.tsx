"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { toggleFollow } from "@/app/(public)/creator/[handle]/actions";

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
      <Button variant="ember" render={<Link href="/login" />}>
        Follow
      </Button>
    );
  }

  return (
    <Button
      variant={isFollowing ? "outline" : "ember"}
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
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={isFollowing ? "following" : "follow"}
          layout
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="inline-block"
        >
          {isFollowing ? "Following" : "Follow"}
        </motion.span>
      </AnimatePresence>
    </Button>
  );
}
