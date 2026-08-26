import type { ReactNode } from "react";

import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { NewsletterPopup } from "@/components/layout/NewsletterPopup";
import { PageTransition } from "@/components/ui/motion";
import { getNotifications } from "@/lib/data/notifications";
import { createClient } from "@/lib/supabase/server";

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let navbarUser = null;
  let notifications = null;

  if (user) {
    const [{ data: profile }, notificationsResult] = await Promise.all([
      supabase.from("profiles").select("handle, display_name, avatar_url").eq("id", user.id).single(),
      getNotifications(),
    ]);
    navbarUser = {
      displayName: profile?.display_name ?? null,
      handle: profile?.handle ?? "",
      avatarUrl: profile?.avatar_url ?? null,
    };
    notifications = notificationsResult;
  }

  return (
    <div className="relative flex min-h-svh flex-col pb-20 lg:pb-0">
      <Navbar user={navbarUser} notifications={notifications} />
      <main className="flex-1">
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer />
      <MobileBottomNav isLoggedIn={Boolean(user)} />
      {!user && <NewsletterPopup />}
    </div>
  );
}

