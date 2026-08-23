"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Sparkles,
  Shirt,
  Receipt,
  MessageSquare,
  Settings,
  LogOut,
  User,
  Crown,
  PanelLeftClose,
  PanelLeftOpen,
  Palette,
} from "lucide-react";

import { signOut } from "@/app/dashboard/actions";
import { Logo } from "@/components/ui/logo";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  { href: "/create", label: "Create", icon: Sparkles },
  { href: "/dashboard/designs", label: "My Designs", icon: Shirt, showBadge: true },
  { href: "/dashboard/personas", label: "Personas", icon: Palette },
  { href: "/dashboard/orders", label: "Orders", icon: Receipt },
];

const ACCOUNT_ITEMS = [
  { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function DashboardSidebar({
  userEmail,
  handle,
  displayName,
  avatarUrl,
  creditsUsed,
  creditsTotal,
  designsCount,
}: {
  userEmail: string;
  handle: string;
  displayName: string | null;
  avatarUrl: string | null;
  creditsUsed: number;
  creditsTotal: number;
  designsCount: number;
}) {
  const pathname = usePathname();
  const { state, toggleSidebar } = useSidebar();
  const initial = (displayName || handle || userEmail).slice(0, 1).toUpperCase();
  const creditsLeft = Math.max(creditsTotal - creditsUsed, 0);
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r border-border bg-sidebar">
      <SidebarHeader className="flex-row items-center justify-between px-4 py-4 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2">
        {isCollapsed ? (
          /* COLLAPSED: hover over logo icon → expand button fades in at same position */
          <div
            className="group/logo-swap relative flex items-center cursor-pointer"
            onClick={toggleSidebar}
          >
            <div className="transition-opacity duration-200 group-hover/logo-swap:opacity-0 select-none pointer-events-none">
              <Logo showText={false} />
            </div>
            <div className="btn-ember absolute inset-0 flex items-center justify-center text-ink opacity-0 transition-opacity duration-200 group-hover/logo-swap:opacity-100">
              <PanelLeftOpen className="size-4" />
            </div>
          </div>
        ) : (
          /* EXPANDED: plain logo — no hover effect, separate button handles toggling */
          <Logo showText />
        )}

        {/* Separate toggle button — visible only when expanded, parallel to logo */}
        <button
          onClick={toggleSidebar}
          aria-label="Collapse sidebar"
          className="btn-ember flex size-8 items-center justify-center text-ink shrink-0 group-data-[collapsible=icon]:hidden"
        >
          <PanelLeftClose className="size-4" />
        </button>
      </SidebarHeader>

      <SidebarContent className="gap-6 px-2">
        {/* MENU Group */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-semibold tracking-wider text-muted-gray uppercase mb-1 group-data-[collapsible=icon]:hidden">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1 group-data-[collapsible=icon]:items-center">
              {MENU_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.href} className="relative">
                    {isActive && (
                      <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-lime-sprint z-10" />
                    )}
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.label}
                      render={<Link href={item.href} />}
                      className={`relative h-11 px-3 text-body-sm font-medium transition-colors hover:text-ink [&_svg]:size-5 ${isActive
                        ? "bg-accent/80 font-semibold text-ink"
                        : "text-muted-ink"
                        }`}
                    >
                      <item.icon className={isActive ? "text-ink" : "text-muted-gray"} />
                      <span className="flex-1 group-data-[collapsible=icon]:hidden">{item.label}</span>
                      {item.showBadge && designsCount > 0 && (
                        <span className="ml-auto rounded-full bg-ink px-2 py-0.5 text-[10px] font-semibold text-paper-white group-data-[collapsible=icon]:hidden">
                          {designsCount}
                        </span>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="mx-2 bg-rule" />

        {/* ACCOUNT Group */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-semibold tracking-wider text-muted-gray uppercase mb-1 group-data-[collapsible=icon]:hidden">
            Account
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1 group-data-[collapsible=icon]:items-center">
              {ACCOUNT_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.label}
                      render={<Link href={item.href} />}
                      className={`h-11 px-3 text-body-sm font-medium transition-colors hover:text-ink [&_svg]:size-5 ${isActive ? "bg-accent/80 font-semibold text-ink" : "text-muted-ink"
                        }`}
                    >
                      <item.icon className="text-muted-gray" />
                      <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="gap-4 ">
        {/* Bottom Feature Card: Dark Depth Block with Lime CTA */}
        <div className="relative overflow-hidden flex flex-col gap-3 rounded-xl bg-depth p-4 text-paper-white border border-ink shadow-[2px_2px_0px_0px_#262626] group-data-[collapsible=icon]:hidden">
          <svg className="absolute -right-4 -bottom-4 size-24 opacity-20 pointer-events-none" viewBox="0 0 100 100">
            <path d="M0 50 Q 25 20, 50 50 T 100 50" fill="none" stroke="#a3e635" strokeWidth="6" />
          </svg>

          <div className="flex items-center justify-between">
            <span className="text-caption font-semibold text-paper-white">
              AI Design Credits
            </span>
            <span className="rounded-full bg-lime-sprint/20 px-2 py-0.5 text-[11px] font-semibold text-lime-sprint">
              {creditsLeft} left
            </span>
          </div>

          <p className="text-[12px] text-paper-white/70 leading-snug">
            Generate custom artwork with your daily creator quota.
          </p>

          <Progress
            value={(creditsUsed / creditsTotal) * 100}
            className="h-1.5 bg-paper-white/20 [&_[data-slot=progress-track]]:bg-lime-sprint"
          />

          <Link
            href="/create"
            className="btn-ember mt-1 flex items-center justify-center gap-1.5 px-3 py-2 text-caption font-semibold text-ink"
          >
            <Sparkles className="size-4" />
            <span>Create Design</span>
          </Link>
        </div>

        <SidebarSeparator className="group-data-[collapsible=icon]:hidden bg-rule" />

        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex w-full items-center gap-3 rounded-xl text-left hover:bg-accent group-data-[collapsible=icon]:justify-center border border-transparent hover:border-border transition-colors"
          >
            <Avatar className="size-11 shrink-0 border-2 border-[#262626] shadow-[2px_2px_0px_0px_#262626]">
              <AvatarImage src={avatarUrl ?? undefined} alt="" className="object-cover" />
              <AvatarFallback className="bg-[#262626] text-[#a3e635] font-mono font-bold">{initial}</AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-1 flex-col group-data-[collapsible=icon]:hidden">
              <span className="truncate text-body-sm font-bold text-[#262626]">
                {displayName || `@${handle}`}
              </span>
              <span className="truncate text-caption font-mono text-[#525252]">
                @{handle || "user"}
              </span>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="right"
            align="end"
            sideOffset={8}
            className="flex w-56 flex-col gap-1 p-3 [&_svg]:size-5"
          >
            <DropdownMenuItem className="h-11" nativeButton={false} render={<Link href="/dashboard/settings" />}>
              <User />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="h-11" nativeButton={false} render={<Link href={handle ? `/creator/${handle}` : "/creator"} />}>
              <Shirt />
              View Storefront
            </DropdownMenuItem>
            <DropdownMenuItem className="h-11" disabled>
              <Crown />
              Upgrade to pro
            </DropdownMenuItem>
            <DropdownMenuItem className="h-11" nativeButton={false} render={<Link href="/dashboard/settings" />}>
              <Settings />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-2 bg-rule" />
            <form action={signOut} className="contents">
              <DropdownMenuItem
                className="h-11"
                variant="destructive"
                nativeButton
                render={<button type="submit" className="w-full text-left" />}
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
