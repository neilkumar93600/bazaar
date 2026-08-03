import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";

import { getThread } from "@/lib/data/messages";
import { MessageComposer } from "@/components/dashboard/MessageComposer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageGroup,
} from "@/components/ui/message";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import {
  MessageScroller,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  return { title: `@${handle}` };
}

export default async function MessageThreadPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const thread = await getThread(handle);

  if (!thread) notFound();

  return (
    <div className="mx-auto flex h-[calc(100svh-56px)] max-w-3xl flex-col px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 border-b border-border py-4">
        <Button variant="ghost" size="icon" render={<Link href="/dashboard/messages" />}>
          <ArrowLeft />
          <span className="sr-only">Back to messages</span>
        </Button>
        <Avatar>
          <AvatarImage src={thread.otherAvatarUrl ?? undefined} alt="" />
          <AvatarFallback>{thread.otherHandle.slice(0, 1).toUpperCase()}</AvatarFallback>
        </Avatar>
        <span className="text-body font-medium text-foreground">
          @{thread.otherHandle}
        </span>
      </div>

      <MessageScrollerProvider>
        <MessageScroller className="flex-1">
          <MessageScrollerViewport>
            <MessageScrollerContent className="px-1 py-4">
              {thread.messages.length === 0 ? (
                <p className="py-8 text-center text-body-sm text-muted-foreground">
                  No messages yet — say hello to @{thread.otherHandle}.
                </p>
              ) : (
                thread.messages.map((message) => (
                  <MessageScrollerItem key={message.id}>
                    <MessageGroup>
                      <Message align={message.isMine ? "end" : "start"}>
                        {!message.isMine && (
                          <MessageAvatar>
                            <Avatar size="sm">
                              <AvatarImage src={thread.otherAvatarUrl ?? undefined} alt="" />
                              <AvatarFallback>
                                {thread.otherHandle.slice(0, 1).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          </MessageAvatar>
                        )}
                        <MessageContent>
                          <Bubble
                            align={message.isMine ? "end" : "start"}
                            variant={message.isMine ? "default" : "secondary"}
                          >
                            <BubbleContent>{message.body}</BubbleContent>
                          </Bubble>
                          <MessageFooter>
                            {format(new Date(message.createdAt), "MMM d, h:mm a")}
                          </MessageFooter>
                        </MessageContent>
                      </Message>
                    </MessageGroup>
                  </MessageScrollerItem>
                ))
              )}
            </MessageScrollerContent>
          </MessageScrollerViewport>
        </MessageScroller>
      </MessageScrollerProvider>

      <MessageComposer recipientId={thread.otherUserId} handle={thread.otherHandle} />
    </div>
  );
}
