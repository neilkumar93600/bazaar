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
  const title = `${name} — 1-of-1 AI Apparel Storefront`;
  const description =
    count > 0
      ? `${name} owns ${count} one-of-one AI apparel ${count === 1 ? "design" : "designs"} on Shirt Bazaar. Browse their broadsheet storefront and claim your own 1-of-1.`
      : `${name} on Shirt Bazaar. Follow this storefront to see their 1-of-1 AI apparel the moment they claim it.`;

  return {
    title,
    description,
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
    <div className="bg-[#ffffff] min-h-screen py-8 sm:py-12">
      <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8 flex flex-col gap-6">
        <StorefrontHeader data={data} />
        <StorefrontGrid data={data} />
      </div>
    </div>
  );
}
