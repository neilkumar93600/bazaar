import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getDesignDetail } from "@/lib/data/design";
import { createClient } from "@/lib/supabase/server";
import { formatCents } from "@/lib/utils";
import { DesignDetailContent } from "@/components/design/DesignDetailContent";

export async function generateMetadata(
  props: PageProps<"/design/[id]">,
): Promise<Metadata> {
  const { id } = await props.params;
  const design = await getDesignDetail(id);

  if (!design) return { title: "Design not found", robots: { index: false } };

  return {
    title: `${design.vibeName ?? "1-of-1"} design — ${formatCents(design.priceCents)}`,
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

  return (
    <div className="mx-auto max-w-md px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <DesignDetailContent design={design} viewerIsLoggedIn={Boolean(user)} />
    </div>
  );
}
