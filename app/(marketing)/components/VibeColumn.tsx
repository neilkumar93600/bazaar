import type { FeedColumn } from "@/lib/data/feed";
import { hueFromString } from "@/lib/utils";
import { DesignCard } from "./DesignCard";

export function VibeColumn({ column }: { column: FeedColumn }) {
  const hue = hueFromString(column.slug);

  return (
    <div
      className="flex w-[78vw] shrink-0 snap-start flex-col gap-4 rounded-3xl p-3 sm:w-[300px] md:w-auto md:shrink md:snap-align-none md:p-0"
      style={{
        // Desaturated per docs/DESIGN_SYSTEM.md — a muted tag color, not a
        // saturated hue, so columns read as distinguishable without
        // competing with the amber accent.
        background: `linear-gradient(180deg, hsl(${hue} 22% 50% / 0.12), transparent 55%)`,
      }}
    >
      <header className="flex items-center gap-2.5 px-1">
        <span
          className="size-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: `hsl(${hue} 35% 55%)` }}
          aria-hidden
        />
        <h2 className="font-display text-2xl tracking-wide text-foreground">
          {column.name}
        </h2>
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
