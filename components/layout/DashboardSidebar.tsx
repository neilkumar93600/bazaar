"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Plus,
  Receipt,
  Settings,
  Shirt,
  Sparkles,
  User,
  Crown,
} from "lucide-react";

import { signOut } from "@/app/dashboard/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Logo } from "@/components/ui/logo";
import { Progress } from "@/components/ui/progress";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";

const MENU_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/create", label: "Create", icon: Sparkles },
  { href: "/dashboard/designs", label: "My designs", icon: Shirt },
  { href: "/dashboard/orders", label: "Orders", icon: Receipt },
];

const ACCOUNT_ITEMS = [
  { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

function NavGroup({ label, items, pathname }: { label: string; items: typeof MENU_ITEMS; pathname: string }) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu className="gap-1 group-data-[collapsible=icon]:items-center">
          {items.map((item) => {
            const isActive = pathname === item.href;
            return (
              <SidebarMenuItem key={item.href}>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-pill"
                    className="absolute inset-0 rounded-md bg-sidebar-accent"
                    transition={{ type: "spring", stiffness: 400, damping: 35 }}
                  />
                )}
                <SidebarMenuButton
                  isActive={isActive}
                  tooltip={item.label}
                  render={<Link href={item.href} />}
                  className="relative h-11 [&_svg]:size-5 data-active:bg-transparent data-active:hover:bg-transparent"
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function DashboardSidebar({
  userEmail,
  handle,
  displayName,
  avatarUrl,
  creditsUsed,
  creditsTotal,
}: {
  userEmail: string;
  handle: string;
  displayName: string | null;
  avatarUrl: string | null;
  // ponytail: static allowance — wire to real usage once AI generation ships
  creditsUsed: number;
  creditsTotal: number;
}) {
  const pathname = usePathname();
  const { state } = useSidebar();
  const initial = (displayName || handle || userEmail).slice(0, 1).toUpperCase();
  const creditsLeft = Math.max(creditsTotal - creditsUsed, 0);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="items-center px-3 py-4 group-data-[collapsible=icon]:px-0">
        <Logo showText={state === "expanded"} />
      </SidebarHeader>
      <SidebarContent className="gap-4">
        <NavGroup label="Menu" items={MENU_ITEMS} pathname={pathname} />
        <SidebarSeparator />
        <NavGroup label="Account" items={ACCOUNT_ITEMS} pathname={pathname} />
      </SidebarContent>
      <SidebarFooter className="gap-3 px-3 py-3">
        <div className="flex flex-col gap-1.5 rounded-xl bg-sidebar-accent/60 px-3 py-2.5 group-data-[collapsible=icon]:hidden">
          <div className="flex items-center justify-between text-xs font-medium text-sidebar-foreground">
            <span>AI design credits</span>
            <span className="text-sidebar-foreground/70">{creditsLeft} left</span>
          </div>
          <Progress
            value={(creditsUsed / creditsTotal) * 100}
            className="[&_[data-slot=progress-track]]:h-1.5"
          />
        </div>

        <SidebarSeparator className="group-data-[collapsible=icon]:hidden" />

        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex w-full items-center gap-2 rounded-xl px-1 py-1 text-left hover:bg-sidebar-accent group-data-[collapsible=icon]:justify-center"
          >
            <Avatar size="sm">
              <AvatarImage src={avatarUrl ?? undefined} alt="" />
              <AvatarFallback>{initial}</AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-1 flex-col group-data-[collapsible=icon]:hidden">
              <span className="truncate text-xs font-medium text-sidebar-foreground">
                {displayName || `@${handle}`}
              </span>
              <span className="truncate text-xs text-sidebar-foreground/60">{userEmail}</span>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="right"
            align="end"
            sideOffset={8}
            className="flex w-56 flex-col gap-1 p-3 [&_svg]:size-5"
          >
            <DropdownMenuItem className="h-11" render={<Link href="/dashboard/settings" />}>
              <User />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="h-11" disabled>
              <Crown />
              Upgrade to pro
            </DropdownMenuItem>
            <DropdownMenuItem className="h-11" render={<Link href="/dashboard/settings" />}>
              <Settings />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-4" />
            <DropdownMenuItem className="h-11" disabled>
              <Plus />
              Add account
            </DropdownMenuItem>
            <form action={signOut} className="contents">
              <DropdownMenuItem
                className="h-11"
                variant="destructive"
                nativeButton
                render={<button type="submit" className="w-full" />}
              >
                <LogOut />
                Log out
              </DropdownMenuItem>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
