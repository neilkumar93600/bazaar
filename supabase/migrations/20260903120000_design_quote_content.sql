-- Bug fix: the design detail page's creator box and poster-style quote line
-- both went through a `generation_jobs -> profiles` join
-- (lib/data/design.ts's getDesignDetail), but 20260809140315's migration #5
-- dropped generation_jobs' only public-read policy — it was scoped to
-- attribution, which designs.creator_id already answers, so dropping it was
-- correct for attribution. It was never correct for quote_content, which has
-- no equivalent on designs: every visitor except the design's own maker has
-- been silently getting a null creator box and a missing quote line on every
-- listed design since that migration, because RLS quietly filters the job row
-- to nothing rather than erroring.
--
-- Fix: give designs its own copy of quote_content, the same way it already
-- carries title/description instead of reading them off the job. Attribution
-- is fixed in application code (lib/data/design.ts now reads
-- designs.creator_id -> profiles directly instead of joining generation_jobs)
-- and needs no schema change — creator_id has been public since
-- 20260824120000_hide_prompt_column.sql granted every non-prompt column.

alter table public.designs add column quote_content text;

comment on column public.designs.quote_content is
  'The line under the illustration, for illustrated styles. Copy of '
  'generation_jobs.quote_content, kept in sync at generation time — see '
  'app/api/generate/route.ts. Null for every other style family.';

update public.designs d
set quote_content = j.quote_content
from public.generation_jobs j
where j.id = d.generation_job_id
  and d.quote_content is null
  and j.quote_content is not null;

-- Same pattern as 20260831054753_design_back_mockup_grant.sql: designs has no
-- table-level select grant for anon/authenticated (see
-- 20260824120000_hide_prompt_column.sql), so a new column is invisible to the
-- browser until explicitly granted.
grant select (quote_content) on public.designs to anon, authenticated;
