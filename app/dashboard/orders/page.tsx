import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ReceiptIcon } from "lucide-react";
import { format } from "date-fns";

import { getMyOrders, type MyOrder } from "@/lib/data/orders";
import { formatCents } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge, type badgeVariants } from "@/components/ui/badge";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Reveal } from "@/components/ui/motion";
import type { VariantProps } from "class-variance-authority";

export const metadata: Metadata = { title: "Orders" };

const STATUS_VARIANT: Record<MyOrder["status"], VariantProps<typeof badgeVariants>["variant"]> = {
  pending: "outline",
  paid: "default",
  fulfilled: "secondary",
  refunded: "destructive",
};

export default async function OrdersPage() {
  const orders = await getMyOrders();

  if (!orders) return null;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-heading-lg text-foreground">Orders</h1>

      {orders.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ReceiptIcon />
            </EmptyMedia>
            <EmptyTitle>No orders yet</EmptyTitle>
            <EmptyDescription>
              Your purchase history will show up here once you order a print.
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Design</TableHead>
                <TableHead className="hidden sm:table-cell">Details</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                        {order.designImageUrl && (
                          <Image
                            src={order.designImageUrl}
                            alt=""
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        )}
                      </div>
                      <span className="text-body-sm text-foreground sm:hidden">
                        {order.kind === "claim" ? "Design" : (order.size ?? "—")}
                      </span>
                    </div>
                  </TableCell>
                  {/* A claim bought the design itself, so it has no size or
                      shipping status — only a garment order does. */}
                  <TableCell className="hidden text-muted-foreground sm:table-cell">
                    {order.kind === "claim"
                      ? "Design ownership"
                      : [order.size, order.printifyStatus]
                          .filter(Boolean)
                          .join(" · ") || "Shirt"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[order.status]} className="capitalize">
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">
                    {format(new Date(order.createdAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-right font-medium text-foreground">
                    {formatCents(order.amountCents)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Reveal>
      )}
    </div>
  );
}
