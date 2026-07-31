-- Placeholder seed data for local/dev only — picsum.photos stand-ins until
-- the image-gen adapter is wired up. Safe to re-run: deletes its own rows first.

delete from public.designs where vibe_id in (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444',
  '55555555-5555-5555-5555-555555555555',
  '66666666-6666-6666-6666-666666666666'
);
delete from public.vibes where id in (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444',
  '55555555-5555-5555-5555-555555555555',
  '66666666-6666-6666-6666-666666666666'
);

insert into public.vibes (id, name, slug, is_default_column) values
  ('11111111-1111-1111-1111-111111111111', 'Dusk Atelier', 'dusk-atelier', true),
  ('22222222-2222-2222-2222-222222222222', 'Late Bloomer', 'late-bloomer', true),
  ('33333333-3333-3333-3333-333333333333', 'Riot', 'riot', true),
  ('44444444-4444-4444-4444-444444444444', 'Insatiable', 'insatiable', true),
  ('55555555-5555-5555-5555-555555555555', 'Untamed Worldwide', 'untamed-worldwide', true),
  ('66666666-6666-6666-6666-666666666666', 'Compound', 'compound', true);

insert into public.designs (vibe_id, image_url, is_claimed, moderation_status)
select
  v.id,
  'https://picsum.photos/seed/' || v.slug || '-' || n || '/600/750',
  n = 2,
  'approved'
from public.vibes v
cross join generate_series(1, 7) as n
where v.id in (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444',
  '55555555-5555-5555-5555-555555555555',
  '66666666-6666-6666-6666-666666666666'
);
