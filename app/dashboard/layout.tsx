import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { NotificationBell } from "@/components/dashboard/NotificationBell";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { PageTransition } from "@/components/ui/motion";
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

  const [notifications, { data: profile }, generationsUsed] = await Promise.all([
    getNotifications(),
    supabase.from("profiles").select("handle, display_name, avatar_url").eq("id", user.id).single(),
    countRecentGenerations(supabase, user.id),
  ]);

  return (
    <SidebarProvider>
      <DashboardSidebar
        userEmail={user.email ?? ""}
        handle={profile?.handle ?? ""}
        displayName={profile?.display_name ?? null}
        avatarUrl={profile?.avatar_url ?? null}
        creditsUsed={generationsUsed ?? 0}
        creditsTotal={DAILY_CAP}
      />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border px-4">
          <SidebarTrigger />
          <NotificationBell
            items={notifications?.items ?? []}
            unreadCount={notifications?.unreadCount ?? 0}
          />
        </header>
        <main className="flex-1">
          <PageTransition>{children}</PageTransition>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
