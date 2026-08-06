import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getStorefrontData } from "@/lib/data/storefront";
import { StorefrontGrid } from "@/components/storefront/StorefrontGrid";
import { StorefrontHeader } from "@/components/storefront/StorefrontHeader";

export async function generateMetadata(
  props: PageProps<"/creator/[handle]">,
): Promise<Metadata> {
  const { handle } = await props.params;
  const data = await getStorefrontData(handle);

  if (!data) return { title: "Creator not found", robots: { index: false } };

  const name = data.profile.displayName ?? `@${data.profile.handle}`;
  const count = data.designs.length;
  const title = `${name} — 1-of-1 AI Designs`;
  const description =
    count > 0
      ? `${name} owns ${count} one-of-one AI apparel ${count === 1 ? "design" : "designs"} on Shirt Bazaar. Browse the storefront and claim your own 1-of-1.`
      : `${name} on Shirt Bazaar. Follow this storefront to see their 1-of-1 AI apparel the moment they claim it.`;

  return {
    title,
    description,
    // Quality gate: an empty storefront is a thin page. Keep it reachable for
    // people, keep it out of the index until it has something to show.
    robots: count > 0 ? undefined : { index: false, follow: true },
    alternates: { canonical: `/creator/${data.profile.handle}` },
    openGraph: {
      title,
      description,
      type: "profile",
      images: data.designs[0]?.imageUrl ?? data.profile.avatarUrl ?? undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: data.designs[0]?.imageUrl ?? data.profile.avatarUrl ?? undefined,
    },
  };
}

export default async function CreatorStorefrontPage(
  props: PageProps<"/creator/[handle]">,
) {
  const { handle } = await props.params;
  const data = await getStorefrontData(handle);

  if (!data) notFound();

  return (
    <div className="bg-background">
      <div className="mx-auto flex max-w-page flex-col gap-8 px-4 py-8 sm:px-6 lg:flex-row lg:items-start lg:px-8 lg:py-12">
        <StorefrontHeader data={data} />
        <StorefrontGrid data={data} />
      </div>
    </div>
  );
}
