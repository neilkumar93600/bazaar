-- A maker's own persona, derived once from 20-50 reference designs they liked
-- via lib/generation/persona-analysis.ts. Distinct from the static presets in
-- lib/generation/personas.ts, but folded into the image-prompt call the same
-- way — a soft voice layer, never a replacement for the StylePreset's hard
-- rules (letterform family, cutField, palette).
create table public.personas (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  style_summary text not null,
  reference_image_urls text[] not null,
  created_at timestamptz not null default now()
);

comment on table public.personas is
  'A maker''s own style, derived once by a vision model from 20-50 reference designs they uploaded. Selected in the create form like a static persona, but richer and personal.';

alter table public.personas enable row level security;

create policy "owners select their personas"
  on public.personas for select
  using (auth.uid() = owner_id);

create policy "owners insert their personas"
  on public.personas for insert
  with check (auth.uid() = owner_id);

create policy "owners delete their personas"
  on public.personas for delete
  using (auth.uid() = owner_id);
