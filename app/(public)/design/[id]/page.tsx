import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getDesignDetail } from "@/lib/data/design";
import { getOrderOptions } from "@/app/(public)/design/[id]/order-actions";
import { createClient } from "@/lib/supabase/server";
import { formatListingPrice } from "@/lib/utils";
import { DesignDialog } from "@/components/design/DesignDialog";

export async function generateMetadata(
  props: PageProps<"/design/[id]">,
): Promise<Metadata> {
  const { id } = await props.params;
  const design = await getDesignDetail(id);

  if (!design) return { title: "Design not found", robots: { index: false } };

  return {
    title: `${design.vibeName ?? "1-of-1"} design — ${formatListingPrice(design.priceCents)}`,
    robots: design.isClaimed ? undefined : { index: false, follow: true },
  };
}

export default async function DesignDetailPage(props: PageProps<"/design/[id]">) {
  const { id } = await props.params;
  const design = await getDesignDetail(id);

  if (!design) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Only a claimed design with a product can be ordered, so the Printify
  // catalogue call is skipped entirely for everything else.
  const orderOptions =
    design.claimedBy && design.printifyProductId
      ? await getOrderOptions(design.garmentSlug)
      : null;

  return (
    <DesignDialog
      design={design}
      viewerIsLoggedIn={Boolean(user)}
      viewerEmail={user?.email ?? ""}
      orderOptions={orderOptions}
    />
  );
}
