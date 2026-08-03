import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNowStrict } from "date-fns";
import { Shirt, Receipt, Coins, Clock } from "lucide-react";

import { getDashboardOverview } from "@/lib/data/dashboard";
import { formatCents } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Button } from "@/components/ui/button";
import { Stagger, StaggerItem, Reveal } from "@/components/ui/motion";

export const metadata: Metadata = { title: "Dashboard" };

const STAT_CARDS = [
  {
    key: "claimedCount" as const,
    label: "Designs claimed",
    icon: Shirt,
    format: (v: number) => String(v),
  },
  {
    key: "totalRoyaltiesCents" as const,
    label: "Total royalties earned",
    icon: Coins,
    format: formatCents,
  },
  {
    key: "pendingRoyaltiesCents" as const,
    label: "Pending payout",
    icon: Clock,
    format: formatCents,
  },
  {
    key: "orderCount" as const,
    label: "Orders placed",
    icon: Receipt,
    format: (v: number) => String(v),
  },
];

export default async function DashboardOverviewPage() {
  const overview = await getDashboardOverview();

  if (!overview) return null;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-heading-lg text-foreground">Overview</h1>

      <Stagger className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STAT_CARDS.map(({ key, label, icon: Icon, format }) => (
          <StaggerItem key={key}>
            <Card>
              <CardContent className="flex flex-col gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-muted text-foreground">
                  <Icon className="size-4.5" aria-hidden />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-heading-sm text-foreground">
                    {format(overview[key])}
                  </span>
                  <span className="text-body-sm text-muted-foreground">{label}</span>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>
        ))}
      </Stagger>

      <div className="flex flex-col gap-4">
        <h2 className="text-subheading text-foreground">Recent activity</h2>

        {overview.recentActivity.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Clock />
              </EmptyMedia>
              <EmptyTitle>No activity yet</EmptyTitle>
              <EmptyDescription>
                Claim a design or place an order to see it show up here.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button variant="outline" render={<Link href="/" />}>
                Browse designs
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <Reveal>
            <ItemGroup>
              {overview.recentActivity.map((activity) => (
                <Item key={activity.id} variant="outline">
                  <ItemMedia variant="image">
                    {activity.designImageUrl ? (
                      <Image
                        src={activity.designImageUrl}
                        alt=""
                        width={40}
                        height={40}
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center bg-muted">
                        <Receipt className="size-4 text-muted-foreground" aria-hidden />
                      </div>
                    )}
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>{activity.label}</ItemTitle>
                    <ItemDescription>
                      {formatDistanceToNowStrict(new Date(activity.occurredAt), {
                        addSuffix: true,
                      })}
                    </ItemDescription>
                  </ItemContent>
                  {activity.amountCents !== null && (
                    <span className="text-body-sm font-medium text-foreground">
                      {formatCents(activity.amountCents)}
                    </span>
                  )}
                </Item>
              ))}
            </ItemGroup>
          </Reveal>
        )}
      </div>
    </div>
  );
}
