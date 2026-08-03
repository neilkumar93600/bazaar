import type { Metadata } from "next";
import { format } from "date-fns";

import { getSettingsData } from "@/lib/data/settings";
import { getNotificationPreferences } from "@/lib/data/notifications";
import { formatCents } from "@/lib/utils";
import { AccountForm } from "@/components/dashboard/AccountForm";
import { NotificationPreferencesForm } from "@/components/dashboard/NotificationPreferencesForm";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const [settings, preferences] = await Promise.all([
    getSettingsData(),
    getNotificationPreferences(),
  ]);

  if (!settings || !preferences) return null;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-heading-lg text-foreground">Settings</h1>

      <Tabs defaultValue="account">
        <TabsList>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="pt-6">
          <AccountForm
            handle={settings.handle}
            email={settings.email}
            displayName={settings.displayName}
            avatarUrl={settings.avatarUrl}
          />
        </TabsContent>

        <TabsContent value="payouts" className="flex flex-col gap-6 pt-6">
          <div className="grid grid-cols-3 gap-3">
            <Card size="sm">
              <CardContent className="flex flex-col gap-1">
                <span className="text-heading-sm text-foreground">
                  {formatCents(settings.totalEarnedCents)}
                </span>
                <span className="text-caption text-muted-foreground">Total earned</span>
              </CardContent>
            </Card>
            <Card size="sm">
              <CardContent className="flex flex-col gap-1">
                <span className="text-heading-sm text-foreground">
                  {formatCents(settings.pendingCents)}
                </span>
                <span className="text-caption text-muted-foreground">Pending</span>
              </CardContent>
            </Card>
            <Card size="sm">
              <CardContent className="flex flex-col gap-1">
                <span className="text-heading-sm text-foreground">
                  {formatCents(settings.paidOutCents)}
                </span>
                <span className="text-caption text-muted-foreground">Paid out</span>
              </CardContent>
            </Card>
          </div>

          {settings.payouts.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>No royalties yet</EmptyTitle>
                <EmptyDescription>
                  Royalties from resales of your claimed designs will appear here.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {settings.payouts.map((payout) => (
                  <TableRow key={payout.id}>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(payout.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={payout.status === "paid" ? "secondary" : "outline"}>
                        {payout.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium text-foreground">
                      {formatCents(payout.amountCents)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        <TabsContent value="notifications" className="pt-6">
          <NotificationPreferencesForm preferences={preferences} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
