import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ShirtIcon } from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";

import { getMyDesigns } from "@/lib/data/my-designs";
import { formatCents } from "@/lib/utils";
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
import { Stagger, StaggerItem, TiltCard } from "@/components/ui/motion";

export const metadata: Metadata = { title: "My designs" };

export default async function DesignsPage() {
  const designs = await getMyDesigns();

  if (!designs) return null;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-heading-lg text-foreground">My designs</h1>
        <Button render={<Link href="/dashboard/create" />}>Create a design</Button>
      </div>

      {designs.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ShirtIcon />
            </EmptyMedia>
            <EmptyTitle>No designs claimed yet</EmptyTitle>
            <EmptyDescription>
              Claim a design from the feed to build your storefront and start
              earning royalties.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" render={<Link href="/" />}>
              Browse designs
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <Stagger className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {designs.map((design) => (
            <StaggerItem key={design.id} className="flex flex-col gap-2">
              <Link
                href={`/design/${design.id}`}
                className="group relative block outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <TiltCard className="glass-surface relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-card">
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
                </TiltCard>
              </Link>
              <div className="flex items-center justify-between gap-2 px-0.5">
                <span className="text-caption text-muted-foreground">
                  Claimed{" "}
                  {formatDistanceToNowStrict(new Date(design.claimedAt), {
                    addSuffix: true,
                  })}
                </span>
                <span className="text-body-sm font-medium text-foreground">
                  {formatCents(design.royaltyTotalCents)}
                </span>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </div>
  );
}
