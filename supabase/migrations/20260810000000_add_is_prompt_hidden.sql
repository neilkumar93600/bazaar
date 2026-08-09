-- Add is_prompt_hidden column to designs table to allow creators/owners to toggle prompt visibility
alter table public.designs
  add column if not exists is_prompt_hidden boolean not null default false;

comment on column public.designs.is_prompt_hidden is
  'When true, the prompt is hidden from public view ("Prompt hidden by creator").';
