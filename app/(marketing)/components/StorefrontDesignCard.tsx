import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNowStrict } from "date-fns";

import type { StorefrontDesign } from "@/lib/data/storefront";
import { cn, hueFromString } from "@/lib/utils";

const CATEGORY_GRADIENT_CLASSES = [
  "bg-category-royal",
  "bg-category-sky",
  "bg-category-verdant",
  "bg-category-magenta",
  "bg-category-sunrise",
];

const STAGGER_CLASSES = Array.from({ length: 12 }, (_, i) => `stagger-${i}`);

export function StorefrontDesignCard({
  design,
  index,
}: {
  design: StorefrontDesign;
  index: number;
}) {
  const gradientClass = design.vibe
    ? CATEGORY_GRADIENT_CLASSES[
        hueFromString(design.vibe.slug) % CATEGORY_GRADIENT_CLASSES.length
      ]
    : null;

  return (
    <Link
      href={`/design/${design.id}`}
      className={cn(
        "animate-card-rise group flex flex-col gap-2 rounded-xl bg-white p-3 text-black shadow-[var(--shadow-storefront-card)] transition-shadow duration-150 hover:shadow-[var(--shadow-storefront-card-hover)]",
        index < STAGGER_CLASSES.length && STAGGER_CLASSES[index],
      )}
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl">
        <Image
          src={design.imageUrl}
          alt=""
          fill
          sizes="(min-width: 1024px) 300px, 45vw"
          className="object-cover"
        />
        {design.vibe && gradientClass && (
          <span
            className={cn(
              "absolute top-3 left-3 rounded-full px-2.5 py-1 text-[12px] font-medium text-white",
              gradientClass,
            )}
          >
            {design.vibe.name}
          </span>
        )}
      </div>
      <span className="text-[12px] text-mid-gray">
        Claimed{" "}
        {formatDistanceToNowStrict(new Date(design.claimedAt), {
          addSuffix: true,
        })}
      </span>
    </Link>
  );
}
