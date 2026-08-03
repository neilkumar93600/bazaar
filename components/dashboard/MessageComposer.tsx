"use client";

import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SendHorizontal } from "lucide-react";

import { sendMessage } from "@/app/dashboard/messages/actions";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function MessageComposer({
  recipientId,
  handle,
}: {
  recipientId: string;
  handle: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <form
      ref={formRef}
      action={(formData: FormData) => {
        const body = String(formData.get("body") ?? "");
        if (!body.trim()) return;
        startTransition(async () => {
          await sendMessage(recipientId, handle, body);
          formRef.current?.reset();
          router.refresh();
        });
      }}
      className="flex items-end gap-2 border-t border-border p-4"
    >
      <Textarea
        name="body"
        placeholder="Write a message…"
        required
        disabled={isPending}
        className="max-h-32 min-h-9 py-2"
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            formRef.current?.requestSubmit();
          }
        }}
      />
      <Button type="submit" size="icon" disabled={isPending} aria-label="Send message">
        <SendHorizontal />
      </Button>
    </form>
  );
}
