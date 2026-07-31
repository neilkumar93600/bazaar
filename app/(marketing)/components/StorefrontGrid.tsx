import Link from "next/link";
import { ShirtIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import type { StorefrontData } from "@/lib/data/storefront";
import { StorefrontDesignCard } from "./StorefrontDesignCard";

export function StorefrontGrid({ data }: { data: StorefrontData }) {
  if (data.designs.length === 0) {
    return (
      <Empty className="flex-1 bg-white text-black">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ShirtIcon />
          </EmptyMedia>
          <EmptyTitle>No designs claimed yet</EmptyTitle>
          <EmptyDescription>
            Designs @{data.profile.handle} claims will show up here.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline" render={<Link href="/" />}>
            Browse designs
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <div className="grid flex-1 grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {data.designs.map((design, index) => (
        <StorefrontDesignCard key={design.id} design={design} index={index} />
      ))}
    </div>
  );
}
