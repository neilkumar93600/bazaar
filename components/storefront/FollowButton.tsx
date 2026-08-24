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
        className="inline-flex items-center justify-center rounded-[var(--sf-radius-sm,4px)] bg-[var(--sf-btn-bg)] px-4 py-2 text-caption font-semibold text-[var(--sf-btn-ink)] border-[length:var(--sf-border,1px)] border-[var(--sf-ink)] shadow-[var(--sf-shadow-sm)] hover:brightness-95 transition-all flex-1 text-center"
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
      className={`inline-flex items-center justify-center rounded-[var(--sf-radius-sm,4px)] px-4 py-2 text-caption font-semibold border-[length:var(--sf-border,1px)] border-[var(--sf-ink)] shadow-[var(--sf-shadow-sm)] transition-all flex-1 cursor-pointer disabled:opacity-50 ${
        isFollowing
          ? "bg-[var(--sf-surface)] text-[var(--sf-ink)] hover:bg-[var(--sf-surface)]"
          : "bg-[var(--sf-btn-bg)] text-[var(--sf-btn-ink)] hover:brightness-95"
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
