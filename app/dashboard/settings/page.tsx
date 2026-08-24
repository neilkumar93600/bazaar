import type { Metadata } from "next";
import { format } from "date-fns";
import { User, Store, Wallet, Bell, ShieldCheck, ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { getSettingsData } from "@/lib/data/settings";
import { getNotificationPreferences } from "@/lib/data/notifications";
import { formatCents } from "@/lib/utils";
import { AccountForm } from "@/components/dashboard/AccountForm";
import { StorefrontPreferencesForm } from "@/components/dashboard/StorefrontPreferencesForm";
import { StorefrontThemePrompt } from "@/components/dashboard/StorefrontThemePrompt";
import { NotificationPreferencesForm } from "@/components/dashboard/NotificationPreferencesForm";
import { SecuritySettingsForm } from "@/components/dashboard/SecuritySettingsForm";
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

/** Storefront theming and the cover-banner drawing are both server actions
 *  invoked from this page, so they run inside this segment's budget. The text
 *  call takes up to a minute; the image call is a full gpt-image-2 render and
 *  runs to muapi.ts's own 180s ceiling. Matches app/api/generate's budget. */
export const maxDuration = 300;

export default async function SettingsPage() {
  const [settings, preferences] = await Promise.all([
    getSettingsData(),
    getNotificationPreferences(),
  ]);

  if (!settings || !preferences) return null;

  return (
    <div className="mx-auto flex max-w-page flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      {/* Settings Page Header (Brainfish Broadsheet Style) */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-[#262626] pb-6">
        <div>
          <span className="text-caption font-mono uppercase tracking-widest text-[#525252]">
            Creator Control Center
          </span>
          <h1 className="text-heading-lg font-bold text-[#262626] tracking-tight">
            Settings & <span className="font-serif italic font-normal text-[#262626]">Preferences</span>
          </h1>
          <p className="mt-1 text-body-sm text-[#525252]">
            Manage your creator profile, storefront rules, payout history, and security settings.
          </p>
        </div>

        <Link
          href={`/creator/${settings.handle}`}
          className="inline-flex items-center gap-1.5 rounded-md bg-[#a3e635] px-4 py-2.5 text-caption font-semibold text-[#262626] border border-[#262626] shadow-[2px_2px_0px_0px_#262626] hover:bg-[#b2f042] transition-all w-fit"
        >
          View Storefront <ArrowUpRight className="size-3.5" />
        </Link>
      </div>

      {/* Settings Navigation Tabs Container */}
      <Tabs defaultValue="account" className="w-full flex flex-col gap-6">
        <TabsList variant="broadsheet" className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 h-auto">
          <TabsTrigger
            value="account"
            className="flex items-center justify-center gap-2 px-3 py-2.5 text-body-sm font-semibold rounded-md text-[#525252] data-[state=active]:bg-[#a3e635] data-[state=active]:text-[#262626] data-[state=active]:border data-[state=active]:border-[#262626] data-[state=active]:shadow-[2px_2px_0px_0px_#262626] transition-all"
          >
            <User className="size-4" />
            <span className="truncate">Profile</span>
          </TabsTrigger>

          <TabsTrigger
            value="storefront"
            className="flex items-center justify-center gap-2 px-3 py-2.5 text-body-sm font-semibold rounded-md text-[#525252] data-[state=active]:bg-[#a3e635] data-[state=active]:text-[#262626] data-[state=active]:border data-[state=active]:border-[#262626] data-[state=active]:shadow-[2px_2px_0px_0px_#262626] transition-all"
          >
            <Store className="size-4" />
            <span className="truncate">Storefront</span>
          </TabsTrigger>

          <TabsTrigger
            value="payouts"
            className="flex items-center justify-center gap-2 px-3 py-2.5 text-body-sm font-semibold rounded-md text-[#525252] data-[state=active]:bg-[#a3e635] data-[state=active]:text-[#262626] data-[state=active]:border data-[state=active]:border-[#262626] data-[state=active]:shadow-[2px_2px_0px_0px_#262626] transition-all"
          >
            <Wallet className="size-4" />
            <span className="truncate">Earnings</span>
          </TabsTrigger>

          <TabsTrigger
            value="notifications"
            className="flex items-center justify-center gap-2 px-3 py-2.5 text-body-sm font-semibold rounded-md text-[#525252] data-[state=active]:bg-[#a3e635] data-[state=active]:text-[#262626] data-[state=active]:border data-[state=active]:border-[#262626] data-[state=active]:shadow-[2px_2px_0px_0px_#262626] transition-all"
          >
            <Bell className="size-4" />
            <span className="truncate">Notifications</span>
          </TabsTrigger>

          <TabsTrigger
            value="security"
            className="flex items-center justify-center gap-2 px-3 py-2.5 text-body-sm font-semibold rounded-md text-[#525252] data-[state=active]:bg-[#a3e635] data-[state=active]:text-[#262626] data-[state=active]:border data-[state=active]:border-[#262626] data-[state=active]:shadow-[2px_2px_0px_0px_#262626] transition-all"
          >
            <ShieldCheck className="size-4" />
            <span className="truncate">Security</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Content Panel */}
        <TabsContent value="account" className="outline-none m-0">
          <AccountForm
            handle={settings.handle}
            email={settings.email}
            displayName={settings.displayName}
            avatarUrl={settings.avatarUrl}
            bannerUrl={settings.bannerUrl}
            bio={settings.bio}
          />
        </TabsContent>

        {/* Storefront & AI Content Panel */}
        <TabsContent value="storefront" className="flex flex-col gap-6 outline-none m-0">
          <StorefrontThemePrompt
            initialTheme={settings.storefrontTheme}
            handle={settings.handle}
          />
          <StorefrontPreferencesForm />
        </TabsContent>

        {/* Payouts Content Panel */}
        <TabsContent value="payouts" className="flex flex-col gap-6 outline-none m-0">
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-[#262626] bg-[#fcfff7] p-5 shadow-[2px_2px_0px_0px_#262626] flex flex-col gap-1">
              <span className="text-caption font-mono uppercase tracking-wider text-[#525252]">
                Total Earned
              </span>
              <span className="text-heading-md font-mono font-bold text-[#262626]">
                {formatCents(settings.totalEarnedCents)}
              </span>
              <span className="text-caption text-[#525252]">
                Lifetime resale royalties
              </span>
            </div>

            <div className="rounded-xl border border-[#262626] bg-[#fcfff7] p-5 shadow-[2px_2px_0px_0px_#262626] flex flex-col gap-1">
              <span className="text-caption font-mono uppercase tracking-wider text-[#525252]">
                Pending Payouts
              </span>
              <span className="text-heading-md font-mono font-bold text-[#262626]">
                {formatCents(settings.pendingCents)}
              </span>
              <span className="text-caption text-[#525252]">
                Scheduled for next cycle
              </span>
            </div>

            <div className="rounded-xl border border-[#262626] bg-[#fcfff7] p-5 shadow-[2px_2px_0px_0px_#262626] flex flex-col gap-1">
              <span className="text-caption font-mono uppercase tracking-wider text-[#525252]">
                Paid Out
              </span>
              <span className="text-heading-md font-mono font-bold text-emerald-700">
                {formatCents(settings.paidOutCents)}
              </span>
              <span className="text-caption text-[#525252]">
                Disbursed to bank account
              </span>
            </div>
          </div>

          {/* Account Payout Method Status */}
          <div className="rounded-xl border border-[#262626] bg-[#fcfff7] p-5 shadow-[2px_2px_0px_0px_#262626] flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-[#262626] bg-[#a3e635] text-[#262626] shadow-[2px_2px_0px_0px_#262626]">
                <Wallet className="size-5" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-body-sm font-semibold text-[#262626]">
                  Direct Payout Account
                </span>
                <span className="text-caption text-[#525252]">
                  Resale royalties are automatically transferred to your connected payout account.
                </span>
              </div>
            </div>
            <span className="rounded-full border border-[#7ee2b8] bg-[#dcfff1] px-3 py-1 text-caption font-mono font-medium text-[#262626]">
              Connected
            </span>
          </div>

          {/* Payout History Table */}
          <div className="rounded-xl border border-[#262626] bg-[#fcfff7] shadow-[2px_2px_0px_0px_#262626] overflow-hidden">
            <div className="p-4 border-b border-[#262626] bg-white">
              <h3 className="text-body font-semibold text-[#262626]">
                Royalty Payout History
              </h3>
            </div>
            {settings.payouts.length === 0 ? (
              <Empty className="p-8">
                <EmptyHeader>
                  <EmptyTitle>No royalties earned yet</EmptyTitle>
                  <EmptyDescription>
                    Royalties from secondary claims and resales of your 1-of-1 designs will appear here.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-[#e5e5e5]">
                    <TableHead className="text-[#262626] font-mono text-caption uppercase">Date</TableHead>
                    <TableHead className="text-[#262626] font-mono text-caption uppercase">Status</TableHead>
                    <TableHead className="text-right text-[#262626] font-mono text-caption uppercase">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {settings.payouts.map((payout) => (
                    <TableRow key={payout.id} className="border-b border-[#e5e5e5]">
                      <TableCell className="text-[#525252] font-mono">
                        {format(new Date(payout.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <span className="rounded-full border border-[#262626] bg-[#fcfff7] px-2.5 py-0.5 text-caption font-mono font-medium text-[#262626]">
                          {payout.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-[#262626]">
                        {formatCents(payout.amountCents)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        {/* Notifications Content Panel */}
        <TabsContent value="notifications" className="outline-none m-0">
          <NotificationPreferencesForm preferences={preferences} />
        </TabsContent>

        {/* Security Content Panel */}
        <TabsContent value="security" className="outline-none m-0">
          <SecuritySettingsForm userEmail={settings.email} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
