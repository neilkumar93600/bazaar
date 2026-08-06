import { getFeedColumns } from "@/lib/data/feed";
import { Feed } from "@/components/home/Feed";

export const dynamic = "force-dynamic";

/** The feed is the homepage, and the entire homepage — no hero band, no
 *  catalogue carousel, no explainer spread. Those components still live in
 *  `components/home/` if the marketing page ever comes back. */
export default async function HomePage() {
  const columns = await getFeedColumns();

  return (
    <>
      {/* The wall carries no visible heading, so the document's one h1 lives
          here for crawlers and screen readers. */}
      <h1 className="sr-only">
        Shirt Bazaar — 1-of-1 AI shirt designs, one owner each
      </h1>
      <Feed columns={columns} />
    </>
  );
}
