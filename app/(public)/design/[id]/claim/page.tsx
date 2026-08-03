import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getDesignDetail } from "@/lib/data/design";
import { createClient } from "@/lib/supabase/server";
import { ClaimForm } from "@/components/design/ClaimForm";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Claim this design" };

export default async function ClaimDesignPage(props: PageProps<"/design/[id]/claim">) {
  const { id } = await props.params;
  const design = await getDesignDetail(id);

  if (!design) notFound();
  if (design.isClaimed) redirect(`/design/${id}`);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <h1 className="text-heading-lg text-foreground">Claim this design</h1>

      {user ? (
        <ClaimForm designId={design.id} priceCents={design.priceCents} />
      ) : (
        <div className="glass-surface flex flex-col gap-4 rounded-xl border bg-card p-6 text-card-foreground">
          <p className="text-body-sm text-muted-foreground">
            Sign in to claim this design.
          </p>
          <Button variant="ember" render={<Link href="/login" />}>
            Log in to claim
          </Button>
        </div>
      )}
    </div>
  );
}
