-- 20260824120000_hide_prompt_column.sql revoked the table-level grant on
-- public.designs and replaced it with an explicit per-column one: a column
-- added after that migration is invisible to anon/authenticated until it is
-- granted here — a plain `add column` alone leaves it unreadable.
grant select (back_mockup_url) on public.designs to anon, authenticated;
