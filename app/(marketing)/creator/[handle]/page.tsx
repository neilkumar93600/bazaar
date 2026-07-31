import { notFound } from "next/navigation";

import { getStorefrontData } from "@/lib/data/storefront";
import { StorefrontGrid } from "@/app/(marketing)/components/StorefrontGrid";
import { StorefrontHeader } from "@/app/(marketing)/components/StorefrontHeader";

export default async function CreatorStorefrontPage(
  props: PageProps<"/creator/[handle]">,
) {
  const { handle } = await props.params;
  const data = await getStorefrontData(handle);

  if (!data) notFound();

  return (
    <div className="bg-white">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-8 px-4 py-8 sm:px-6 lg:flex-row lg:items-start lg:px-8 lg:py-12">
        <StorefrontHeader data={data} />
        <StorefrontGrid data={data} />
      </div>
    </div>
  );
}
