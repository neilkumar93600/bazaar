import type { FeedColumn } from "@/lib/data/feed";
import { cn, hueFromString } from "@/lib/utils";
import { DesignCard } from "./DesignCard";

const TINT_CLASSES = [
  "column-tint-0",
  "column-tint-1",
  "column-tint-2",
  "column-tint-3",
  "column-tint-4",
  "column-tint-5",
  "column-tint-6",
  "column-tint-7",
];

function tintClassFor(slug: string) {
  return TINT_CLASSES[hueFromString(slug) % TINT_CLASSES.length];
}

export function VibeColumn({ column }: { column: FeedColumn }) {
  return (
    <div
      className={cn(
        "flex w-[78vw] shrink-0 snap-start flex-col gap-4 rounded-3xl p-3 sm:w-[300px] md:w-auto md:shrink md:snap-align-none md:p-0",
        tintClassFor(column.slug),
      )}
    >
      <header className="flex items-center gap-2.5 px-1">
        <span className="column-tint-dot size-2.5 shrink-0 rounded-full" aria-hidden />
        <h2 className="text-heading text-white">{column.name}</h2>
        {column.isRentedTakeover && (
          <span className="ml-auto rounded-full border border-primary/40 bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium tracking-wide text-primary uppercase">
            Rented
          </span>
        )}
      </header>

      <div className="flex flex-col gap-4">
        {column.designs.length > 0 ? (
          column.designs.map((design, index) => (
            <DesignCard key={design.id} design={design} index={index} />
          ))
        ) : (
          <div className="flex aspect-[4/5] items-center justify-center rounded-2xl border border-dashed border-border text-sm text-muted-foreground">
            No designs yet
          </div>
        )}
      </div>
    </div>
  );
}
