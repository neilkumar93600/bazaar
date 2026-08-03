import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";

import { getDesignDetail } from "@/lib/data/design";
import { createClient } from "@/lib/supabase/server";
import { formatCents } from "@/lib/utils";
import { ClaimForm } from "@/components/design/ClaimForm";
import { Button } from "@/components/ui/button";

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
    <div className="mx-auto flex max-w-[1000px] flex-col gap-8 px-4 py-8 sm:px-6 lg:flex-row lg:items-start lg:px-8 lg:py-12">
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-border bg-card lg:max-w-md">
        <Image
          src={design.imageUrl}
          alt=""
          fill
          sizes="(min-width: 1024px) 448px, 100vw"
          priority
          className="object-cover"
        />
      </div>

      <div className="flex flex-1 flex-col gap-4">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-heading-lg text-foreground">
            {design.vibeName ?? "Unfiled"}
          </span>
          <span className="font-mono text-heading-sm text-gold-leaf">
            {formatCents(design.priceCents)}
          </span>
        </div>

        {design.isClaimed ? (
          <div className="glass-surface flex flex-col gap-4 rounded-xl border bg-card p-6 text-card-foreground">
            <p className="text-body-sm text-muted-foreground">
              {design.claimantHandle ? (
                <>
                  Claimed by{" "}
                  <Link
                    href={`/creator/${design.claimantHandle}`}
                    className="text-foreground underline underline-offset-4"
                  >
                    @{design.claimantHandle}
                  </Link>
                  {design.claimedAt &&
                    ` · ${format(new Date(design.claimedAt), "MMM d, yyyy")}`}
                </>
              ) : (
                "Claimed"
              )}
            </p>
            {design.claimantHandle && (
              <Button variant="outline" render={<Link href={`/creator/${design.claimantHandle}`} />}>
                View storefront
              </Button>
            )}
          </div>
        ) : user ? (
          <ClaimForm designId={design.id} basePriceCents={design.priceCents} />
        ) : (
          <div className="glass-surface flex flex-col gap-4 rounded-xl border bg-card p-6 text-card-foreground">
            <p className="text-body-sm text-muted-foreground">
              This 1-of-1 design is still unclaimed.
            </p>
            <Button variant="ember" render={<Link href="/login" />}>
              Log in to claim
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
