"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell } from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";

import { markAllNotificationsRead } from "@/app/dashboard/notifications/actions";
import type { NotificationItem } from "@/lib/data/notifications";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item";

export function NotificationBell({
  items,
  unreadCount,
}: {
  items: NotificationItem[];
  unreadCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next && unreadCount > 0 && !isPending) {
          startTransition(async () => {
            await markAllNotificationsRead();
            router.refresh();
          });
        }
      }}
    >
      <PopoverTrigger
        render={
          <button className="btn-ember relative flex size-9 items-center justify-center text-ink">
            <Bell className="size-4.5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 size-2 rounded-full bg-ink ring-2 ring-lime-sprint" />
            )}
            <span className="sr-only">Notifications</span>
          </button>
        }
      />
      <PopoverContent align="end" className="w-80 gap-3">
        <PopoverHeader>
          <PopoverTitle>Notifications</PopoverTitle>
        </PopoverHeader>
        {items.length === 0 ? (
          <p className="py-4 text-center text-body-sm text-muted-foreground">
            Nothing yet.
          </p>
        ) : (
          <ItemGroup className="max-h-96 overflow-y-auto">
            {items.map((notification) => (
              <Item
                key={notification.id}
                variant={notification.isRead ? "default" : "muted"}
                size="sm"
                render={notification.link ? <Link href={notification.link} /> : undefined}
              >
                <ItemContent>
                  <ItemTitle>{notification.title}</ItemTitle>
                  {notification.body && (
                    <ItemDescription>{notification.body}</ItemDescription>
                  )}
                  <span className="text-caption text-muted-foreground">
                    {formatDistanceToNowStrict(new Date(notification.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </ItemContent>
              </Item>
            ))}
          </ItemGroup>
        )}
      </PopoverContent>
    </Popover>
  );
}
