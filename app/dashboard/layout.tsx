import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { MessageSquare } from "lucide-react";

import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { NotificationBell } from "@/components/dashboard/NotificationBell";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { PageTransition } from "@/components/ui/motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getNotifications } from "@/lib/data/notifications";
import { countRecentGenerations, DAILY_CAP } from "@/lib/generation/quota";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [notifications, { data: profile }, generationsUsed, designsCountResult] = await Promise.all([
    getNotifications(),
    supabase.from("profiles").select("handle, display_name, avatar_url").eq("id", user.id).single(),
    countRecentGenerations(supabase, user.id),
    supabase.from("designs").select("id", { count: "exact", head: true }).eq("creator_id", user.id),
  ]);

  const designsCount = designsCountResult.count ?? 0;

  const displayName = profile?.display_name || `@${profile?.handle ?? user.email?.split("@")[0]}`;
  const userEmail = user.email ?? "";
  const initial = displayName.slice(0, 1).toUpperCase();

  return (
    <SidebarProvider>
      <DashboardSidebar
        userEmail={userEmail}
        handle={profile?.handle ?? ""}
        displayName={displayName}
        avatarUrl={profile?.avatar_url ?? null}
        creditsUsed={generationsUsed ?? 0}
        creditsTotal={DAILY_CAP}
        designsCount={designsCount}
      />
      <SidebarInset className="relative pb-24 lg:pb-0 bg-background min-h-screen">
        {/* Top Header Bar */}
        <header className="flex h-16 shrink-0 items-center justify-end gap-4 border-b border-border bg-card px-6 lg:px-8">

          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/messages"
              aria-label="Messages"
              className="btn-ember flex size-9 items-center justify-center text-ink"
            >
              <MessageSquare className="size-4.5" />
            </Link>

            <NotificationBell
              items={notifications?.items ?? []}
              unreadCount={notifications?.unreadCount ?? 0}
            />

            <div className="flex items-center gap-3 pl-2">
              <Avatar className="size-11 border-2 border-[#262626] shadow-[2px_2px_0px_0px_#262626]">
                <AvatarImage src={profile?.avatar_url ?? undefined} alt="" className="object-cover" />
                <AvatarFallback className="bg-[#262626] text-[#a3e635] font-mono font-bold">
                  {initial}
                </AvatarFallback>
              </Avatar>
              <div className="hidden flex-col sm:flex">
                <span className="text-body-sm font-bold text-[#262626] leading-tight">
                  {displayName}
                </span>
                <span className="text-caption font-mono text-[#525252]">
                  @{profile?.handle ?? "user"}
                </span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
          <PageTransition>{children}</PageTransition>
        </main>

        <MobileBottomNav isLoggedIn={true} unreadCount={notifications?.unreadCount ?? 0} />
      </SidebarInset>
    </SidebarProvider>
  );
}
