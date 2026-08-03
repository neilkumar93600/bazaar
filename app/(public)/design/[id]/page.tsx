import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getDesignDetail } from "@/lib/data/design";
import { createClient } from "@/lib/supabase/server";
import { formatCents } from "@/lib/utils";
import { DesignDialog } from "@/components/design/DesignDialog";

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

  return <DesignDialog design={design} viewerIsLoggedIn={Boolean(user)} />;
}
