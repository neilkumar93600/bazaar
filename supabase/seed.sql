-- Placeholder seed data for local/dev only — local shirt renders from
-- public/t-shirt stand in until the image-gen adapter is wired up.
-- Safe to re-run: deletes its own rows first.
--
-- Requires 20260802000000_add_design_price.sql (designs.price_cents) —
-- applied idempotently below too, in case migrations haven't been pushed
-- to this database yet.
--
-- Seeds 6 vibes, 84 designs (14 per vibe — matches feed.ts's
-- DESIGNS_PER_COLUMN so every column actually fills instead of showing half
-- a column of gaps), and 10 fake creators with real auth.users rows so
-- profiles/storefronts/claims/follows all exist for real. ~1/3 of designs
-- are claimed by those creators via actual public.claims rows, so
-- /creator/[handle], the trending rail (reads public.claims), and top
-- creators (reads public.follows) all have real data to fetch instead of
-- rendering empty.
--
-- Every design also gets a generation_jobs row (a "creator" — whoever
-- prompted it) assigned independently from claimed_by (whoever bought it) —
-- same duality the schema already models (designs.generation_job_id vs
-- designs.claimed_by), just never populated until now. Storefronts show
-- both: designs a profile created and designs they claimed.
--
-- Only 10 tee renders exist in public/t-shirt, so within one vibe's 14
-- slots a couple of images repeat — price, claim state and created_at
-- still differ per row, so no two rows are identical.
--
-- DEV DATA ONLY: this inserts fake rows directly into auth.users (password
-- 'seed-password', @seed.bazaar.test emails). Only run this against a local
-- `supabase start` database, never against a hosted/production project.

-- ============================================================================
-- Schema catch-up (idempotent — no-op if the migration already ran)
-- ============================================================================

alter table public.designs add column if not exists price_cents integer not null default 2900;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'designs_price_cents_positive'
  ) then
    alter table public.designs
      add constraint designs_price_cents_positive check (price_cents > 0);
  end if;
end $$;

alter table public.designs add column if not exists prompt text;
alter table public.profiles add column if not exists bio text;

-- ============================================================================
-- Creator source of truth (session-scoped temp table, referenced below)
-- ============================================================================

drop table if exists seed_creators;
create temporary table seed_creators (
  ord int,
  id uuid,
  email text,
  handle text,
  display_name text,
  bio text
);

insert into seed_creators (ord, id, email, handle, display_name, bio) values
  (0, 'c0000001-0000-0000-0000-000000000001', 'creator1@seed.bazaar.test', 'threadforge', 'Thread Forge', 'Prompting mythic silhouettes since the first draft model. Every drop starts as a one-line idea at 2am.'),
  (1, 'c0000002-0000-0000-0000-000000000002', 'creator2@seed.bazaar.test', 'midnightpress', 'Midnight Press', 'Runs a one-person print shop from a laptop. Obsessed with gold ink on black.'),
  (2, 'c0000003-0000-0000-0000-000000000003', 'creator3@seed.bazaar.test', 'novastitch', 'Nova Stitch', 'Ex-tattoo artist turned prompt engineer. Line work is the whole point.'),
  (3, 'c0000004-0000-0000-0000-000000000004', 'creator4@seed.bazaar.test', 'rustlabel', 'Rust Label', 'Collects vintage propaganda posters and remixes them into new myths.'),
  (4, 'c0000005-0000-0000-0000-000000000005', 'creator5@seed.bazaar.test', 'glasshousetee', 'Glasshouse Tee', 'Designs for the people who read the fine print on their own shirts.'),
  (5, 'c0000006-0000-0000-0000-000000000006', 'creator6@seed.bazaar.test', 'velvetriot', 'Velvet Riot', 'Soft colors, hard opinions. Every design is a tiny manifesto.'),
  (6, 'c0000007-0000-0000-0000-000000000007', 'creator7@seed.bazaar.test', 'staticbloom', 'Static Bloom', 'Grew up on comic inserts and cereal-box mythology. It shows.'),
  (7, 'c0000008-0000-0000-0000-000000000008', 'creator8@seed.bazaar.test', 'paperclipco', 'Paperclip Co', 'One prompt a day, no exceptions. Consistency beats inspiration.'),
  (8, 'c0000009-0000-0000-0000-000000000009', 'creator9@seed.bazaar.test', 'lowtidestudio', 'Lowtide Studio', 'Coastal kid making apocalypse art that somehow still feels warm.'),
  (9, 'c000000a-0000-0000-0000-00000000000a', 'creator10@seed.bazaar.test', 'amberline', 'Amberline', 'Believes every good shirt should look like it belongs in a museum gift shop.');

-- ============================================================================
-- Cleanup (children first, so FKs never block a re-run)
-- ============================================================================

-- designs.generation_job_id and generation_jobs.result_design_id reference
-- each other with no cascade — null out one side before deleting either.
update public.designs set generation_job_id = null where vibe_id in (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444',
  '55555555-5555-5555-5555-555555555555',
  '66666666-6666-6666-6666-666666666666'
);

delete from public.generation_jobs
where result_design_id in (
  select id from public.designs where vibe_id in (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333',
    '44444444-4444-4444-4444-444444444444',
    '55555555-5555-5555-5555-555555555555',
    '66666666-6666-6666-6666-666666666666'
  )
)
or user_id in (select id from seed_creators);

delete from public.claims
where design_id in (
  select id from public.designs where vibe_id in (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333',
    '44444444-4444-4444-4444-444444444444',
    '55555555-5555-5555-5555-555555555555',
    '66666666-6666-6666-6666-666666666666'
  )
)
or claimant_id in (select id from seed_creators);

delete from public.designs where vibe_id in (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444',
  '55555555-5555-5555-5555-555555555555',
  '66666666-6666-6666-6666-666666666666'
);

-- cascades public.profiles, storefronts, follows, notification_preferences, notifications
delete from auth.users where id in (select id from seed_creators);

delete from public.vibes where id in (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444',
  '55555555-5555-5555-5555-555555555555',
  '66666666-6666-6666-6666-666666666666'
);

-- ============================================================================
-- Vibes
-- ============================================================================

insert into public.vibes (id, name, slug, is_default_column) values
  ('11111111-1111-1111-1111-111111111111', 'Dusk Atelier', 'dusk-atelier', true),
  ('22222222-2222-2222-2222-222222222222', 'Late Bloomer', 'late-bloomer', true),
  ('33333333-3333-3333-3333-333333333333', 'Riot', 'riot', true),
  ('44444444-4444-4444-4444-444444444444', 'Insatiable', 'insatiable', true),
  ('55555555-5555-5555-5555-555555555555', 'Untamed Worldwide', 'untamed-worldwide', true),
  ('66666666-6666-6666-6666-666666666666', 'Compound', 'compound', true);

-- ============================================================================
-- Creators: auth.users row per creator (handle_new_user() trigger fires and
-- auto-creates a placeholder public.profiles + notification_preferences row
-- for each), then personalize the profile with a real handle/display name.
-- ============================================================================

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
select
  '00000000-0000-0000-0000-000000000000', id, 'authenticated', 'authenticated',
  email, crypt('seed-password', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now(),
  '', '', '', ''
from seed_creators;

update public.profiles p set handle = c.handle, display_name = c.display_name, bio = c.bio
from seed_creators c
where p.id = c.id;

insert into public.storefronts (owner_id, slug)
select id, handle from seed_creators;

-- Pyramid of follows so follower counts vary instead of tying: creator N
-- follows every creator before it (ord 0 ends up most-followed, ord 9 has none).
insert into public.follows (follower_id, followed_id)
select f.id, t.id
from seed_creators f
cross join seed_creators t
where f.ord > t.ord;

-- ============================================================================
-- Designs + claims — 14 per vibe (84 total), 4 of the 14 claimed by a
-- creator (round-robined across all 10, so counts vary 2-3 each).
-- ============================================================================

with vibe_data as (
  select
    id as vibe_id,
    (row_number() over (order by slug) - 1)::int as vibe_ord,
    (row_number() over (order by slug) - 1)::int * 3 as tee_offset
  from public.vibes
  where id in (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333',
    '44444444-4444-4444-4444-444444444444',
    '55555555-5555-5555-5555-555555555555',
    '66666666-6666-6666-6666-666666666666'
  )
),
new_designs as (
  select
    v.vibe_id,
    (v.tee_offset + n) % 10 + 1 as tee_num,
    '/t-shirt/tee-' || lpad(((v.tee_offset + n) % 10 + 1)::text, 2, '0') || '.png' as image_url,
    (n <= 4) as is_claimed,
    2400 + ((v.tee_offset + n) % 6) * 500 as price_cents,
    case when n <= 4 then cr.id end as claimed_by,
    now() - ((v.vibe_ord * 14 + n) || ' hours')::interval as created_at
  from vibe_data v
  cross join generate_series(1, 14) as n
  left join seed_creators cr
    on n <= 4 and cr.ord = (v.vibe_ord * 4 + (n - 1)) % 10
),
inserted as (
  insert into public.designs
    (vibe_id, image_url, is_claimed, price_cents, moderation_status, claimed_by, created_at, prompt)
  select
    vibe_id, image_url, is_claimed, price_cents, 'approved', claimed_by, created_at,
    case tee_num
      when 1 then 'A hooded elder with a golden halo holding a scale weighing two planets, seated on dark waves, gold ink on midnight blue, vintage woodcut style.'
      when 2 then 'A lone figure kneeling to forge a glowing blade under a blossoming tree at dusk, a child watching, a crowd of silhouettes gathering in the firelit distance.'
      when 3 then 'An infinity symbol split into day and night: sunrise over mountains on one side, crescent moon over a lake on the other, thin gold outline.'
      when 4 then 'An anatomical heart dripping blood with virus icons and butterflies drifting around it, soldier silhouettes below, stark black background.'
      when 5 then 'A katana crossing an infinity symbol made of a mountain-and-moon emblem fused with a clockface, two soldier silhouettes standing guard, sepia tone.'
      when 6 then 'Two crowds of silhouettes holding hands forming an infinity symbol, one side warm sunrise, one side starry night, radiating sunburst lines.'
      when 7 then 'A glowing archway at night with figures walking toward the light, a bare tree beside it, deep purple sky scattered with stars.'
      when 8 then 'A winged figure with blue skin, gold halo, and a red-and-white draped robe, arms open, feathers falling, museum-fresco style.'
      when 9 then 'A winged warrior angel holding a dagger, gold and teal feathers, a glowing eight-point star medallion, floating above clouds.'
      else 'A glowing circuit-lined human silhouette with wings, crowd silhouettes fading into the dark on either side, standing on a neon grid floor.'
    end
  from new_designs
  returning id, claimed_by, created_at
)
insert into public.claims (design_id, claimant_id, claimed_at)
select id, claimed_by, created_at + interval '1 day'
from inserted
where claimed_by is not null;

-- ============================================================================
-- Generation jobs — one per design, the "creator" (whoever prompted it).
-- Assigned with a different formula than claimed_by above so creator and
-- claimant are usually different people (sometimes the same, like real life).
-- ============================================================================

with numbered_designs as (
  select id, vibe_id, (row_number() over (order by created_at) - 1)::int as seq
  from public.designs
  where vibe_id in (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333',
    '44444444-4444-4444-4444-444444444444',
    '55555555-5555-5555-5555-555555555555',
    '66666666-6666-6666-6666-666666666666'
  )
),
new_jobs as (
  insert into public.generation_jobs (user_id, vibe_id, quality_tier, status, result_design_id)
  select cr.id, nd.vibe_id, 'upscale', 'done', nd.id
  from numbered_designs nd
  join seed_creators cr on cr.ord = (nd.seq * 7) % 10
  returning id, result_design_id
)
update public.designs d
set generation_job_id = nj.id
from new_jobs nj
where d.id = nj.result_design_id;

drop table seed_creators;
