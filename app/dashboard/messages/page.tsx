import type { Metadata } from "next";
import Link from "next/link";
import { formatDistanceToNowStrict } from "date-fns";

import { getInboxThreads } from "@/lib/data/messages";
import { ChibiGhost } from "@/components/shared/ChibiGhost";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/ui/motion";

export const metadata: Metadata = { title: "Messages" };

export default async function MessagesPage() {
  const threads = await getInboxThreads();

  if (!threads) return null;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-heading-lg text-foreground">Messages</h1>

      {threads.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="default">
              <ChibiGhost variant="headphones" size={96} interactive={false} />
            </EmptyMedia>
            <EmptyTitle>No messages yet</EmptyTitle>
            <EmptyDescription>
              Conversations with other creators will show up here.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <Reveal>
          <ItemGroup>
            {threads.map((thread) => (
              <Item
                key={thread.otherUserId}
                variant="outline"
                render={<Link href={`/dashboard/messages/${thread.otherHandle}`} />}
              >
                <ItemMedia>
                  <Avatar>
                    <AvatarImage src={thread.otherAvatarUrl ?? undefined} alt="" />
                    <AvatarFallback>
                      {thread.otherHandle.slice(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>
                    @{thread.otherHandle}
                    {thread.unreadCount > 0 && (
                      <Badge className="ml-1">{thread.unreadCount}</Badge>
                    )}
                  </ItemTitle>
                  <ItemDescription>
                    {thread.lastMessageIsMine ? "You: " : ""}
                    {thread.lastMessageBody}
                  </ItemDescription>
                </ItemContent>
                <span className="shrink-0 text-caption text-muted-foreground">
                  {formatDistanceToNowStrict(new Date(thread.lastMessageAt), {
                    addSuffix: true,
                  })}
                </span>
              </Item>
            ))}
          </ItemGroup>
        </Reveal>
      )}
    </div>
  );
}
