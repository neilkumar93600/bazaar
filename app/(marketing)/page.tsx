import { getFeedColumns } from "@/lib/data/feed";
import { Feed } from "./components/Feed";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const columns = await getFeedColumns();

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-10 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <section className="flex max-w-2xl flex-col gap-4">
        <h1 className="font-display text-5xl leading-[0.95] tracking-wide text-foreground sm:text-7xl">
          FIND YOUR VIBE. CLAIM IT. OWN IT.
        </h1>
        <p className="max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
          Every design here is one-of-one. Claim it and you get exclusive
          ownership, your own storefront, and a royalty on every resale.
        </p>
      </section>

      <Feed columns={columns} />
    </div>
  );
}
