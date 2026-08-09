import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ShirtIcon } from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";

import { getMyDesigns, type MakerDesign } from "@/lib/data/my-designs";
import { getGarmentOptions } from "@/app/dashboard/designs/garment-options";
import { formatCents, formatListingPrice } from "@/lib/utils";
import { ListingForm } from "@/components/dashboard/ListingForm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export const metadata: Metadata = { title: "My designs" };

function DesignFrame({ design }: { design: MakerDesign }) {
  return (
    <Link
      href={`/design/${design.id}`}
      className="group relative block outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="glass-surface relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-card">
        <Image
          src={design.imageUrl}
          alt=""
          fill
          sizes="(min-width: 1024px) 240px, 45vw"
          className="object-cover"
        />
        {design.vibeName && (
          <Badge className="absolute top-2 left-2" variant="secondary">
            {design.vibeName}
          </Badge>
        )}
      </div>
    </Link>
  );
}

export default async function DesignsPage() {
  // Fetched once for the whole page: Printify's catalogue is per garment, not
  // per design, and it is cached for the process lifetime anyway.
  const [groups, garmentOptions] = await Promise.all([
    getMyDesigns(),
    getGarmentOptions(),
  ]);

  if (!groups) return null;

  const total =
    groups.unlisted.length + groups.listed.length + groups.adopted.length;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-heading-lg text-foreground">My designs</h1>
        <Button render={<Link href="/create" />}>
          Create a design
        </Button>
      </div>

      {total === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ShirtIcon />
            </EmptyMedia>
            <EmptyTitle>Nothing made yet</EmptyTitle>
            <EmptyDescription>
              Designs you generate stay private to you until you list them.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" render={<Link href="/create" />}>
              Create a design
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <>
          {groups.unlisted.length > 0 && (
            <section className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <h2 className="text-heading-sm text-foreground">Unlisted</h2>
                <p className="text-caption text-muted-foreground">
                  Only you can see these. List one to put it in the bazaar.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {groups.unlisted.map((design) => (
                  <div key={design.id} className="flex flex-col gap-2">
                    <DesignFrame design={design} />
                    <ListingForm
                      designId={design.id}
                      imageUrl={design.imageUrl}
                      isListed={false}
                      priceCents={design.priceCents}
                      garmentOptions={garmentOptions}
                      frozen={design.hasProduct}
                      initialConfig={{
                        garmentSlug: design.garmentSlug,
                        variantId: design.featuredVariantId,
                        placement: design.placement,
                      }}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {groups.listed.length > 0 && (
            <section className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <h2 className="text-heading-sm text-foreground">Listed</h2>
                <p className="text-caption text-muted-foreground">
                  Live in the bazaar. Anyone can claim these.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {groups.listed.map((design) => (
                  <div key={design.id} className="flex flex-col gap-2">
                    <DesignFrame design={design} />
                    <span className="px-0.5 font-mono text-body-sm text-gold-leaf">
                      {formatListingPrice(design.priceCents)}
                    </span>
                    <ListingForm
                      designId={design.id}
                      imageUrl={design.imageUrl}
                      isListed
                      priceCents={design.priceCents}
                      garmentOptions={garmentOptions}
                      frozen={design.hasProduct}
                      initialConfig={{
                        garmentSlug: design.garmentSlug,
                        variantId: design.featuredVariantId,
                        placement: design.placement,
                      }}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {groups.adopted.length > 0 && (
            <section className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <h2 className="text-heading-sm text-foreground">Adopted</h2>
                <p className="text-caption text-muted-foreground">
                  Claimed by someone else. These are theirs now — you keep the
                  record, not the design.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {groups.adopted.map((design) => (
                  <div key={design.id} className="flex flex-col gap-2">
                    <DesignFrame design={design} />
                    <div className="flex items-center justify-between gap-2 px-0.5">
                      <span className="truncate text-caption text-muted-foreground">
                        {design.claimantHandle
                          ? `@${design.claimantHandle}`
                          : "Claimed"}
                        {" · "}
                        {formatDistanceToNowStrict(new Date(design.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                      <span className="shrink-0 text-body-sm font-medium text-foreground">
                        {formatCents(design.soldForCents)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
