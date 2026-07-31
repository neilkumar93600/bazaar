import type { FeedColumn } from "@/lib/data/feed";
import { VibeColumn } from "./VibeColumn";

export function Feed({ columns }: { columns: FeedColumn[] }) {
  if (columns.length === 0) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 text-center">
        <p className="text-heading-lg text-white">No columns yet</p>
        <p className="text-body-sm text-muted-foreground">
          Check back soon — new vibes are dropping.
        </p>
      </div>
    );
  }

  return (
    <div className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4 md:grid md:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] md:gap-10 md:overflow-visible md:pb-0">
      {columns.map((column) => (
        <VibeColumn key={column.id} column={column} />
      ))}
    </div>
  );
}
