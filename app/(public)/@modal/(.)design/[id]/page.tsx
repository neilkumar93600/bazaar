import { notFound } from "next/navigation";

import { getDesignDetail } from "@/lib/data/design";
import { createClient } from "@/lib/supabase/server";
import { DesignDialog } from "@/components/design/DesignDialog";

export default async function DesignModal(props: PageProps<"/design/[id]">) {
  const { id } = await props.params;
  const design = await getDesignDetail(id);

  if (!design) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <DesignDialog design={design} viewerIsLoggedIn={Boolean(user)} />;
}
