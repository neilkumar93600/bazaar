-- The prompt is the recipe, and until now anyone could read it.
--
-- Dropping `prompt` from the app's select() lists stops the browser being SENT
-- it. It does not stop the browser ASKING for it: NEXT_PUBLIC_SUPABASE_ANON_KEY
-- is in the page bundle by design, RLS is row-level with no column granularity,
-- and `designs_select_listed` lets anon read every listed row. So
--
--     GET $SUPABASE_URL/rest/v1/designs?select=id,prompt&limit=1000
--
-- returned every prompt in the marketplace, in one request. PostgREST honours
-- column privileges, so that is the layer this has to be fixed at.
--
-- Postgres will not let a column-level REVOKE carve a hole in a table-level
-- GRANT, so the table grant comes off and every column except `prompt` goes
-- back on. The list is built from the catalogue rather than typed out, so this
-- cannot silently disagree with the schema it runs against.
--
-- A COLUMN ADDED AFTER THIS MIGRATION IS NOT READABLE BY anon/authenticated
-- until it is granted. That is the safe direction — a new column is invisible
-- rather than public by default — but it is a real step to remember:
--
--     grant select (new_column) on public.designs to anon, authenticated;
--
-- The service role is unaffected; it bypasses grants, which is how
-- app/api/generate/route.ts still writes the prompt and lib/printify/sync.ts
-- still reads what it needs.
--
-- Requires that nothing using the browser's key filters on `prompt`. That was
-- true of every select() and, as of the same change, of the search filter in
-- lib/data/bazaar.ts searchFilter() — which used to `ilike` the prompt and so
-- read it out a character at a time whether or not the page rendered it.

do $$
declare
  readable text;
begin
  select string_agg(quote_ident(column_name), ', ' order by ordinal_position)
    into readable
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'designs'
    and column_name <> 'prompt';

  if readable is null then
    raise exception 'public.designs has no columns — refusing to drop the grant';
  end if;

  revoke select on public.designs from anon, authenticated;
  execute format(
    'grant select (%s) on public.designs to anon, authenticated',
    readable
  );
end
$$;

comment on column public.designs.prompt is
  'The maker''s raw idea. Never public: not selected by any app query, and not '
  'readable by anon or authenticated — see 20260824120000_hide_prompt_column.sql. '
  'Read it with the service role only.';
