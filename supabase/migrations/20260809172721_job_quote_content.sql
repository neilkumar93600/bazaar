-- The second string an illustrated design carries.
--
-- `text_content` already stores the arched title. The line underneath was
-- passed to the prompt builder and then thrown away, so a poster design could
-- not show its own words on its detail page — the only thing displayed was the
-- illustration idea.
alter table public.generation_jobs
  add column quote_content text;

comment on column public.generation_jobs.quote_content is
  'The line under the illustration, for illustrated styles. Null for every other family.';
