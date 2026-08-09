-- Job inputs the prompt cannot be reverse-engineered from. The design row
-- keeps the maker's idea (designs.prompt); these two are what turned that idea
-- into this particular image.
alter table public.generation_jobs
  add column style_slug   text,
  add column text_content text;

comment on column public.generation_jobs.style_slug is
  'Slug of the STYLE_PRESETS entry used. Null for jobs created before create v2.';
comment on column public.generation_jobs.text_content is
  'The exact words for a typographic style. Null for pictorial styles.';

-- quality_tier was draft|upscale, a pricing concept that never shipped. It is
-- now a direct user control.
--
-- Order matters: existing rows hold 'draft', so they are migrated BEFORE the
-- new constraint is added, or the ALTER fails on its own validation pass.
alter table public.generation_jobs
  drop constraint generation_jobs_quality_tier_check;

update public.generation_jobs set quality_tier = 'medium' where quality_tier = 'draft';
update public.generation_jobs set quality_tier = 'high'   where quality_tier = 'upscale';

alter table public.generation_jobs
  add constraint generation_jobs_quality_tier_check
    check (quality_tier in ('low', 'medium', 'high'));
