"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
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
      <Link
        href="/login"
        className="inline-flex items-center justify-center rounded-md bg-[#a3e635] px-4 py-2 text-caption font-semibold text-[#262626] border border-[#262626] shadow-[2px_2px_0px_0px_#262626] hover:bg-[#b2f042] transition-all flex-1 text-center"
      >
        Follow
      </Link>
    );
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        const optimisticNext = !isFollowing;
        setIsFollowing(optimisticNext);
        startTransition(async () => {
          const result = await toggleFollow(profileId, handle);
          setIsFollowing(result.isFollowing);
        });
      }}
      className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-caption font-semibold border border-[#262626] shadow-[2px_2px_0px_0px_#262626] transition-all flex-1 cursor-pointer disabled:opacity-50 ${
        isFollowing
          ? "bg-white text-[#262626] hover:bg-[#fcfff7]"
          : "bg-[#a3e635] text-[#262626] hover:bg-[#b2f042]"
      }`}
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
    </button>
  );
}
