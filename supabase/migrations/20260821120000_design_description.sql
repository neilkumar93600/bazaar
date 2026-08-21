-- Buyer-facing description, written by the composer alongside the title —
-- see lib/generation/compose.ts composeListing(). Split from the title into
-- its own column rather than reusing `prompt`: `prompt` is the maker's raw
-- idea, this is marketing copy for a browser deciding whether to buy.
--
-- Also replaces the hardcoded blurb lib/printify/sync.ts used to send as
-- every product's Printify description.
alter table public.designs add column if not exists description text;

comment on column public.designs.description is
  'Short buyer-facing description, written by the composer alongside the title in a separate call. Null on designs generated before this existed, or when the composer call failed.';
