import Image from "next/image";
import Link from "next/link";

import type { FeedDesign } from "@/lib/data/feed";
import { cn } from "@/lib/utils";

const STAGGER_CLASSES = Array.from({ length: 14 }, (_, i) => `stagger-${i}`);

export function DesignCard({
  design,
  index,
}: {
  design: FeedDesign;
  index: number;
}) {
  return (
    <Link
      href={`/design/${design.id}`}
      className={cn(
        "animate-card-rise group relative block aspect-[4/5] shrink-0 overflow-hidden rounded-2xl bg-card outline-none focus-visible:ring-2 focus-visible:ring-ring",
        STAGGER_CLASSES[Math.min(index, STAGGER_CLASSES.length - 1)],
      )}
    >
      <Image
        src={design.imageUrl}
        alt=""
        fill
        sizes="(min-width: 768px) 300px, 85vw"
        className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
      />
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100",
        )}
      />
      {design.isClaimed && (
        <span className="absolute top-3 left-3 rounded-full bg-ember px-3 py-1 text-xs font-medium text-primary-foreground shadow-sm">
          Claimed
        </span>
      )}
    </Link>
  );
}
