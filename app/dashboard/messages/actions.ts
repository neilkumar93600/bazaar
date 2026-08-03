"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export async function sendMessage(recipientId: string, handle: string, body: string) {
  const trimmed = body.trim();
  if (!trimmed) {
    throw new Error("Message cannot be empty.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Must be signed in to send messages.");
  }

  const { error } = await supabase
    .from("messages")
    .insert({ sender_id: user.id, recipient_id: recipientId, body: trimmed });

  if (error) {
    throw new Error("Could not send message.");
  }

  revalidatePath(`/dashboard/messages/${handle}`);
  revalidatePath("/dashboard/messages");
}
