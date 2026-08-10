"use client";

import Link from "next/link";
import { LayoutDashboard, LogOut, Receipt, Settings, Shirt } from "lucide-react";

import { signOut } from "@/app/dashboard/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const MENU_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/designs", label: "My designs", icon: Shirt },
  { href: "/dashboard/orders", label: "Orders", icon: Receipt },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function UserMenu({
  displayName,
  handle,
  avatarUrl,
}: {
  displayName: string | null;
  handle: string;
  avatarUrl: string | null;
}) {
  const initial = (displayName || handle || "?").slice(0, 1).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/30">
        <Avatar className="size-11 border-2 border-[#262626] shadow-[2px_2px_0px_0px_#262626]">
          <AvatarImage src={avatarUrl ?? undefined} alt="" className="object-cover" />
          <AvatarFallback className="bg-[#262626] text-[#a3e635] font-mono font-bold">{initial}</AvatarFallback>
        </Avatar>
        <span className="sr-only">Account menu</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-56 p-2 [&_svg]:size-4.5">
        <div className="flex flex-col px-2 py-1.5 border-b border-[#e5e5e5] mb-1">
          <span className="text-body-sm font-bold text-[#262626] truncate">
            {displayName || `@${handle}`}
          </span>
          <span className="text-caption font-mono text-[#525252] truncate">
            @{handle || "user"}
          </span>
        </div>
        {MENU_ITEMS.map((item) => (
          <DropdownMenuItem key={item.href} render={<Link href={item.href} />}>
            <item.icon />
            {item.label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <form action={signOut} className="contents">
          <DropdownMenuItem
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
  );
}
