-- Bug fix: public.messages has select/insert policies but no update policy.
-- lib/data/messages.ts's getThread() marks a thread read by updating
-- read_at on the recipient's own session client — with no update policy, RLS
-- default-denies the write. Supabase returns this as a 0-row success, not an
-- error, so the mark-as-read call has been silently doing nothing: unread
-- counts and the message bell never clear.
--
-- Scoped to the recipient only, both sides (using + with check), so a sender
-- cannot mark their own outgoing message read and a recipient cannot use this
-- opening to reassign a message to someone else.

create policy "messages_update_recipient" on public.messages
  for update to authenticated
  using ((select auth.uid()) = recipient_id)
  with check ((select auth.uid()) = recipient_id);
