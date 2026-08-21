-- The whole schema, in one file.
--
-- Squashed from the eighteen migrations that built it, in the order they ran.
-- Everything is already applied to the live database; this file exists so a
-- fresh environment can be built from nothing, and so there is one place to
-- read the schema instead of eighteen.
--
-- Concatenated rather than rewritten by hand, deliberately. Several of the
-- migrations below revoke EXECUTE on SECURITY DEFINER functions from `anon`
-- and `authenticated` — Supabase grants those by default, and a tidier
-- hand-written baseline that dropped one of those lines would open a
-- privilege escalation without changing a single visible table. Replaying the
-- real statements in the real order cannot get that wrong.
--
-- So it reads as history: a table is created, then altered; a function is
-- created, then replaced. The end state is what matters and it is exact.


-- ==========================================================================
-- 20260731000000_init_schema.sql
-- ==========================================================================

-- Shirt Bazaar — full schema
-- Source of truth: docs/DATA_MODEL.md (shape) + docs/SECURITY.md (RLS policy per table)

-- ============================================================================
-- Tables
-- ============================================================================

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  handle text unique not null,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table public.vibes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  is_default_column boolean not null default true,
  owner_id uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.reference_uploads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  image_url text not null,
  created_at timestamptz not null default now()
);

create table public.generation_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  vibe_id uuid references public.vibes(id),
  reference_upload_ids uuid[] not null default '{}',
  quality_tier text not null check (quality_tier in ('draft', 'upscale')),
  status text not null check (status in ('queued', 'generating', 'done', 'failed')) default 'queued',
  result_design_id uuid,
  created_at timestamptz not null default now()
);

create table public.designs (
  id uuid primary key default gen_random_uuid(),
  vibe_id uuid references public.vibes(id),
  generation_job_id uuid references public.generation_jobs(id),
  image_url text not null,
  print_ready_front_url text,
  print_ready_back_url text,
  is_claimed boolean not null default false,
  claimed_by uuid references public.profiles(id),
  moderation_status text not null check (moderation_status in ('pending', 'approved', 'rejected')) default 'pending',
  created_at timestamptz not null default now()
);

alter table public.generation_jobs
  add constraint generation_jobs_result_design_id_fkey
  foreign key (result_design_id) references public.designs(id);

create table public.claims (
  id uuid primary key default gen_random_uuid(),
  design_id uuid not null unique references public.designs(id),
  claimant_id uuid not null references public.profiles(id),
  claimed_at timestamptz not null default now()
);

create table public.storefronts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references public.profiles(id) on delete cascade,
  slug text unique not null,
  created_at timestamptz not null default now()
);

create table public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  followed_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followed_id),
  constraint follows_no_self_follow check (follower_id <> followed_id)
);

create table public.column_rentals (
  id uuid primary key default gen_random_uuid(),
  renter_id uuid not null references public.profiles(id),
  vibe_id uuid not null references public.vibes(id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint column_rentals_valid_window check (ends_at > starts_at)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles(id),
  design_id uuid not null references public.designs(id),
  quality_tier text,
  placement_front boolean not null default true,
  placement_back boolean not null default false,
  size text,
  amount_cents integer not null,
  stripe_payment_intent_id text,
  status text not null check (status in ('pending', 'paid', 'fulfilled', 'refunded')) default 'pending',
  created_at timestamptz not null default now()
);

create table public.pod_provider_mapping (
  quality_tier text primary key,
  provider_key text not null
);

create table public.royalty_ledger (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id),
  design_id uuid not null references public.designs(id),
  original_claimant_id uuid not null references public.profiles(id),
  amount_cents integer not null,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id),
  recipient_id uuid not null references public.profiles(id),
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  created_at timestamptz not null default now()
);

create table public.notification_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  notify_claims boolean not null default true,
  notify_royalties boolean not null default true,
  notify_messages boolean not null default true,
  notify_orders boolean not null default true,
  updated_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('claim', 'royalty', 'message', 'order')),
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- Indexes
-- ============================================================================

create index designs_vibe_id_idx on public.designs(vibe_id);
create index designs_generation_job_id_idx on public.designs(generation_job_id);
create index designs_claimed_by_idx on public.designs(claimed_by);
create index designs_is_claimed_idx on public.designs(is_claimed);
create index claims_claimant_id_idx on public.claims(claimant_id);
create index reference_uploads_user_id_idx on public.reference_uploads(user_id);
create index generation_jobs_user_id_idx on public.generation_jobs(user_id);
create index generation_jobs_vibe_id_idx on public.generation_jobs(vibe_id);
create index vibes_owner_id_idx on public.vibes(owner_id);
create index orders_buyer_id_idx on public.orders(buyer_id);
create index orders_design_id_idx on public.orders(design_id);
create index follows_followed_id_idx on public.follows(followed_id);
create index messages_recipient_id_idx on public.messages(recipient_id);
create index messages_sender_id_idx on public.messages(sender_id);
create index column_rentals_renter_id_idx on public.column_rentals(renter_id);
create index column_rentals_vibe_id_active_idx on public.column_rentals(vibe_id, starts_at, ends_at);
create index royalty_ledger_order_id_idx on public.royalty_ledger(order_id);
create index royalty_ledger_design_id_idx on public.royalty_ledger(design_id);
create index royalty_ledger_original_claimant_id_idx on public.royalty_ledger(original_claimant_id);
create index notifications_user_id_created_at_idx on public.notifications(user_id, created_at desc);
create index notifications_user_id_unread_idx on public.notifications(user_id) where read_at is null;

-- ============================================================================
-- Row Level Security
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.vibes enable row level security;
alter table public.reference_uploads enable row level security;
alter table public.generation_jobs enable row level security;
alter table public.designs enable row level security;
alter table public.claims enable row level security;
alter table public.storefronts enable row level security;
alter table public.follows enable row level security;
alter table public.column_rentals enable row level security;
alter table public.orders enable row level security;
alter table public.pod_provider_mapping enable row level security;
alter table public.royalty_ledger enable row level security;
alter table public.messages enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.notifications enable row level security;

-- profiles: read own, public fields via view (below) and via a public select
-- policy (storefronts/feed need to look up any profile by handle, not just
-- the logged-in user's own row — none of these columns are sensitive);
-- update own only
create policy "profiles_select_own" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "profiles_select_public" on public.profiles
  for select using (true);
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- security_invoker: without this the view would run as its owner and bypass
-- the RLS policies above, re-exposing every profile's public fields with no filtering
create view public.public_profiles
  with (security_invoker = true) as
  select id, handle, display_name, avatar_url from public.profiles;

-- vibes: publicly readable; writes are service-role only (curated in v1)
create policy "vibes_select_public" on public.vibes
  for select using (true);

-- reference_uploads: owner only
create policy "reference_uploads_owner_all" on public.reference_uploads
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- generation_jobs: owner only
create policy "generation_jobs_owner_all" on public.generation_jobs
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- designs: publicly readable (feed/storefront); insert/update restricted to
-- the owning generation job or the claimant
create policy "designs_select_public" on public.designs
  for select using (true);
create policy "designs_update_owner" on public.designs
  for update to authenticated
  using (
    (select auth.uid()) = claimed_by
    or (select auth.uid()) = (select user_id from public.generation_jobs where id = generation_job_id)
  )
  with check (
    (select auth.uid()) = claimed_by
    or (select auth.uid()) = (select user_id from public.generation_jobs where id = generation_job_id)
  );

-- claims: insert only via server-side function (service role, bypasses RLS);
-- readable by everyone since claimant handle is public storefront metadata
create policy "claims_select_public" on public.claims
  for select using (true);

-- storefronts: publicly readable; writes via server function only (service role)
create policy "storefronts_select_public" on public.storefronts
  for select using (true);

-- follows: manage own follow rows; reads are public
create policy "follows_select_public" on public.follows
  for select using (true);
create policy "follows_insert_own" on public.follows
  for insert to authenticated with check ((select auth.uid()) = follower_id);
create policy "follows_delete_own" on public.follows
  for delete to authenticated using ((select auth.uid()) = follower_id);

-- column_rentals: publicly readable (renders the takeover); writes via server function
create policy "column_rentals_select_public" on public.column_rentals
  for select using (true);

-- orders: owner (buyer) and service role only; never client-writable
create policy "orders_select_own" on public.orders
  for select to authenticated using ((select auth.uid()) = buyer_id);

-- pod_provider_mapping: service role only, never exposed to any client — no policy (default deny)

-- royalty_ledger: readable by the original claimant only; never client-writable
create policy "royalty_ledger_select_own" on public.royalty_ledger
  for select to authenticated using ((select auth.uid()) = original_claimant_id);

-- messages: sender or recipient only
create policy "messages_select_participant" on public.messages
  for select to authenticated
  using ((select auth.uid()) = sender_id or (select auth.uid()) = recipient_id);
create policy "messages_insert_as_sender" on public.messages
  for insert to authenticated with check ((select auth.uid()) = sender_id);

-- newsletter_subscribers: public insert-only, no read access for
-- anon/authenticated (an email address here isn't meant to be listable by
-- any client, only inserted by the subscriber themselves)
create policy "newsletter_subscribers_insert_public" on public.newsletter_subscribers
  for insert to anon, authenticated with check (true);

-- notification_preferences / notifications: owner-only. notifications rows
-- are only ever written by the security-definer trigger functions below —
-- never inserted directly by a client — so there is no client insert policy.
create policy "notification_preferences_select_own" on public.notification_preferences
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "notification_preferences_update_own" on public.notification_preferences
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "notifications_select_own" on public.notifications
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "notifications_update_own" on public.notifications
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ============================================================================
-- Auto-provision a profile + default notification preferences row on signup
-- ============================================================================

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, handle)
  values (new.id, 'user_' || substr(new.id::text, 1, 8));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.handle_new_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.notification_preferences (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_profile_created
  after insert on public.profiles
  for each row execute function public.handle_new_profile();

-- ============================================================================
-- Notification triggers — one per event the Notifications settings describe
-- (claims, royalties, messages, orders). Each checks the recipient's
-- preference before writing a row.
-- ============================================================================

create function public.notify_on_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.notification_preferences
    where user_id = new.recipient_id and notify_messages = true
  ) then
    insert into public.notifications (user_id, type, title, body, link)
    select new.recipient_id, 'message', 'New message from @' || p.handle,
      left(new.body, 140), '/dashboard/messages/' || p.handle
    from public.profiles p where p.id = new.sender_id;
  end if;
  return new;
end;
$$;

create trigger on_message_insert
  after insert on public.messages
  for each row execute function public.notify_on_message();

create function public.notify_on_claim()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  creator_id uuid;
begin
  select gj.user_id into creator_id
  from public.designs d
  join public.generation_jobs gj on gj.id = d.generation_job_id
  where d.id = new.design_id;

  if creator_id is not null and creator_id <> new.claimant_id and exists (
    select 1 from public.notification_preferences
    where user_id = creator_id and notify_claims = true
  ) then
    insert into public.notifications (user_id, type, title, link)
    values (creator_id, 'claim', 'Someone claimed a design you created', '/dashboard/designs');
  end if;
  return new;
end;
$$;

create trigger on_claim_insert
  after insert on public.claims
  for each row execute function public.notify_on_claim();

create function public.notify_on_royalty()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.notification_preferences
    where user_id = new.original_claimant_id and notify_royalties = true
  ) then
    return new;
  end if;

  if TG_OP = 'INSERT' then
    insert into public.notifications (user_id, type, title, link)
    values (new.original_claimant_id, 'royalty', 'You earned a royalty', '/dashboard/settings');
  elsif TG_OP = 'UPDATE' and new.paid_at is not null and old.paid_at is null then
    insert into public.notifications (user_id, type, title, link)
    values (new.original_claimant_id, 'royalty', 'Royalty paid out', '/dashboard/settings');
  end if;
  return new;
end;
$$;

create trigger on_royalty_ledger_change
  after insert or update on public.royalty_ledger
  for each row execute function public.notify_on_royalty();

create function public.notify_on_order_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if TG_OP = 'UPDATE' and new.status is distinct from old.status and exists (
    select 1 from public.notification_preferences
    where user_id = new.buyer_id and notify_orders = true
  ) then
    insert into public.notifications (user_id, type, title, link)
    values (new.buyer_id, 'order', 'Order ' || new.status, '/dashboard/orders');
  end if;
  return new;
end;
$$;

create trigger on_order_status_update
  after update on public.orders
  for each row execute function public.notify_on_order_status_change();


-- ==========================================================================
-- 20260802000000_add_design_price.sql
-- ==========================================================================

-- Designs carry their own list price. Until now price only existed per-order
-- (`orders.amount_cents`), so nothing could render a price before purchase —
-- the catalog, the storefront and the feed all had nothing to show.
--
-- Integer cents, never float: money in floating point accumulates rounding
-- error, and Stripe takes cents anyway.
alter table public.designs
  add column price_cents integer not null default 2900;

alter table public.designs
  add constraint designs_price_cents_positive check (price_cents > 0);


-- ==========================================================================
-- 20260803010000_claim_design_function.sql
-- ==========================================================================

-- Claiming a design *is* buying it (docs/TRD.md "Claim & storefront"): one
-- atomic transaction that records the order, marks the design claimed,
-- inserts the permanent claims row, and provisions the claimant's
-- storefront. security definer + explicit grant, same pattern as
-- handle_new_user()/notify_on_*() below it in 20260731000000_init_schema.sql
-- — this is why claims/orders/storefronts have no client INSERT policy.
--
-- Claim is ownership only, at the design's base price — no quality
-- tier/placement/size here. Those are print-fulfillment choices for
-- when a Printify (or similar) adapter is wired in later; orders.quality_tier
-- and orders.size stay null and placement_front/back keep their table
-- defaults until that exists.
create function public.claim_design(
  p_design_id uuid,
  p_amount_cents integer,
  p_payment_ref text
)
returns table (order_id uuid, handle text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_buyer uuid := (select auth.uid());
  v_is_claimed boolean;
  v_moderation_status text;
  v_order_id uuid;
  v_handle text;
begin
  if v_buyer is null then
    raise exception 'Must be signed in to claim a design.';
  end if;

  -- Row lock: two concurrent claims on the same design must not both pass
  -- this check. claims.design_id being unique is the backstop if they did.
  select is_claimed, moderation_status into v_is_claimed, v_moderation_status
  from public.designs
  where id = p_design_id
  for update;

  if not found then
    raise exception 'Design not found.';
  end if;
  if v_moderation_status <> 'approved' then
    raise exception 'Design not available.';
  end if;
  if v_is_claimed then
    raise exception 'Someone just claimed this design.';
  end if;

  insert into public.orders (buyer_id, design_id, amount_cents, stripe_payment_intent_id, status)
  values (v_buyer, p_design_id, p_amount_cents, p_payment_ref, 'paid')
  returning id into v_order_id;

  update public.designs
  set is_claimed = true, claimed_by = v_buyer
  where id = p_design_id;

  insert into public.claims (design_id, claimant_id)
  values (p_design_id, v_buyer);

  select p.handle into v_handle from public.profiles p where p.id = v_buyer;

  insert into public.storefronts (owner_id, slug)
  values (v_buyer, v_handle)
  on conflict (owner_id) do nothing;

  return query select v_order_id, v_handle;
end;
$$;

grant execute on function public.claim_design(uuid, integer, text) to authenticated;


-- ==========================================================================
-- 20260803020000_design_prompt_profile_bio.sql
-- ==========================================================================

-- Design dialog needs two fields that don't exist yet: the prompt used to
-- generate the design, and a short creator bio.
alter table public.designs add column prompt text;
alter table public.profiles add column bio text;


-- ==========================================================================
-- 20260803040000_generation_jobs_public_creator_read.sql
-- ==========================================================================

-- The design dialog's creator box needs to resolve "who prompted this
-- design" for any visitor, not just the job's owner — the existing
-- owner-only policy (generation_jobs_owner_all) blocks that read entirely
-- for everyone else. Adds a second, narrower permissive policy: a
-- generation_jobs row becomes publicly readable once it produced a design
-- that's actually public. Postgres ORs multiple permissive policies
-- together, so the owner's own full access is unaffected — this only adds
-- visibility, never removes it.
--
-- Two conditions, both load-bearing:
--
--   * `listed_at is not null` — approval alone is not publication. Designs are
--     auto-approved at generation and stay private until the maker lists them
--     (see designs_select_listed, which gates the design itself the same way).
--     Without this, `text_content` and `quote_content` — the words printed on
--     an unlisted design — would be readable by anyone with the anon key, past
--     the gate that hides the design itself.
--
--   * joined on `generation_job_id`, not `result_design_id` — a job produces
--     four images but records only the first as its result. Keying on the
--     result would hide the job (and so the creator box) for the other three
--     whenever the first one wasn't the listed one.
create policy "generation_jobs_select_public_result" on public.generation_jobs
  for select using (
    exists (
      select 1 from public.designs d
      where d.generation_job_id = generation_jobs.id
        and d.moderation_status = 'approved'
        and d.listed_at is not null
    )
  );


-- ==========================================================================
-- 20260806000000_designs_storage_bucket.sql
-- ==========================================================================

-- Storage for generated design images.
--
-- Public read: designs are a public marketplace catalogue — the feed, shop and
-- storefronts all render these URLs to signed-out visitors.
--
-- No public write: uploads happen server-side from the generation route using
-- the service role, so there is deliberately no insert/update policy for
-- authenticated users here. Nothing client-side can put bytes in this bucket.

insert into storage.buckets (id, name, public)
values ('designs', 'designs', true)
on conflict (id) do nothing;

drop policy if exists "designs_public_read" on storage.objects;
create policy "designs_public_read" on storage.objects
  for select
  using (bucket_id = 'designs');


-- ==========================================================================
-- 20260807000000_printify_mockups.sql
-- ==========================================================================

-- Printify holds the physical product; these two columns are the only trace of
-- it the app needs.
--
-- `printify_product_id` doubles as the sync marker: null means this design has
-- no product yet, so nothing has to track attempts separately.
--
-- `mockup_url` is a photographic render of the design on a real garment,
-- produced by Printify as a side effect of creating the product. It is
-- deliberately nullable and never required: mockups arrive seconds after the
-- product does, and every surface falls back to the drawn `ShirtMockup` until
-- one lands (or forever, if Printify is not configured).
alter table public.designs
  add column printify_product_id text,
  add column mockup_url text;

comment on column public.designs.printify_product_id is
  'Printify product id. Null until the design is claimed and synced.';
comment on column public.designs.mockup_url is
  'Printify-hosted photo of this design on a garment. Null falls back to the drawn mockup.';


-- ==========================================================================
-- 20260809140315_design_ownership_listing.sql
-- ==========================================================================

-- Ownership and listing. Generation stops being publication: a design is
-- private to its maker until they list it, free or priced, and the maker loses
-- every right to it the moment somebody claims it.
--
-- The gate is RLS, not query filters. `designs` is read from the browser with
-- the anon key (the create page polls it), so a filter that lives only in
-- lib/data/* leaves every private row readable straight from PostgREST.

-- 1. Columns -----------------------------------------------------------------

alter table public.designs
  add column creator_id uuid references public.profiles(id),
  add column listed_at  timestamptz;

comment on column public.designs.creator_id is
  'Who generated this design. Paid once at claim, then out — no royalties, no control.';
comment on column public.designs.listed_at is
  'When it went live in the bazaar. Null means private: freshly generated, or delisted.';

-- 2. Price becomes optional: null means the maker listed it free -------------
--
-- The 2900 default goes too. A listed design must have had a price decided,
-- and free is a decision; defaulting into a number hides the difference
-- between "the maker chose $29.00" and "nobody chose anything".

alter table public.designs alter column price_cents drop not null;
alter table public.designs alter column price_cents drop default;
alter table public.designs drop constraint designs_price_cents_positive;
alter table public.designs
  add constraint designs_price_cents_positive
    check (price_cents is null or price_cents > 0);

-- 3. Backfill ----------------------------------------------------------------
--
-- Every existing design stays exactly as visible as it was. Seeded rows have
-- no generation job and so no maker; they are house stock and creator_id
-- stays null, which the claim gate handles (`creator_id is not null and ...`).

update public.designs d
set creator_id = j.user_id
from public.generation_jobs j
where j.id = d.generation_job_id
  and d.creator_id is null;

update public.designs
set listed_at = created_at
where listed_at is null;

create index designs_creator_id_idx on public.designs (creator_id);
create index designs_listed_at_idx on public.designs (listed_at desc)
  where listed_at is not null;

-- 4. Read gate ---------------------------------------------------------------
--
-- Anon carries auth.uid() = null, so this collapses to "listed only". A maker
-- keeps seeing their own drafts; an owner keeps seeing a design they delist.

drop policy "designs_select_public" on public.designs;

create policy "designs_select_listed" on public.designs
  for select using (
    listed_at is not null
    or (select auth.uid()) = creator_id
    or (select auth.uid()) = claimed_by
  );

-- 5. generation_jobs public read is now both redundant and a leak ------------
--
-- It gated on moderation_status = 'approved', but privacy now comes from
-- listed_at and a private design is still 'approved'. Left in place it hands
-- anon the ids and maker ids of every unlisted design. It existed only to
-- attribute a design to its creator, which designs.creator_id now answers.

drop policy "generation_jobs_select_public_result" on public.generation_jobs;

-- 6. Write gate --------------------------------------------------------------
--
-- "The maker has nothing to do with it after a claim" is enforced here: the
-- instant claimed_by is set, the maker's policy stops matching. Both policies
-- carry USING and WITH CHECK — without WITH CHECK a user could reassign a
-- row's creator_id or claimed_by to somebody else.

drop policy "designs_update_owner" on public.designs;

create policy "designs_update_creator_unclaimed" on public.designs
  for update to authenticated
  using      ((select auth.uid()) = creator_id and claimed_by is null)
  with check ((select auth.uid()) = creator_id and claimed_by is null);

create policy "designs_update_claimant" on public.designs
  for update to authenticated
  using      ((select auth.uid()) = claimed_by)
  with check ((select auth.uid()) = claimed_by);

-- 7. Trigger functions are not HTTP endpoints --------------------------------
--
-- Postgres grants EXECUTE to PUBLIC on every new function, and the init
-- migration never revoked it, so every one of these SECURITY DEFINER trigger
-- functions is callable by anon via /rest/v1/rpc. Flagged by the security
-- advisor; notify_on_claim and notify_on_royalty sit on the path this
-- migration rewrites.

revoke execute on function
  public.handle_new_user(),
  public.handle_new_profile(),
  public.notify_on_claim(),
  public.notify_on_message(),
  public.notify_on_order_status_change(),
  public.notify_on_royalty(),
  public.rls_auto_enable()
from public, anon, authenticated;

-- 8. claim_design ------------------------------------------------------------
--
-- Dropped and recreated rather than replaced: CREATE OR REPLACE cannot rename
-- an input parameter, and p_amount_cents becomes p_expected_cents.
--
-- The rename is the point. The caller used to pass the amount to record; it
-- now passes the price the buyer was *shown*, and the row's own price is what
-- gets written. A maker editing the price between page render and claim can no
-- longer cause a buyer to be charged one number while the order records
-- another — the claim fails and the buyer retries against the real price.
--
-- Branch order and error strings mirror claimEligibility() in lib/listing.ts.

drop function if exists public.claim_design(uuid, integer, text);

create function public.claim_design(
  p_design_id uuid,
  p_expected_cents integer,
  p_payment_ref text
)
returns table (order_id uuid, handle text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_buyer uuid := (select auth.uid());
  v_design public.designs%rowtype;
  v_order_id uuid;
  v_handle text;
begin
  if v_buyer is null then
    raise exception 'Must be signed in to claim a design.';
  end if;

  -- Row lock: two concurrent claims on the same design must not both pass
  -- these checks. claims.design_id being unique is the backstop if they did.
  select * into v_design
  from public.designs
  where id = p_design_id
  for update;

  if not found then
    raise exception 'Design not found.';
  end if;

  if v_design.moderation_status <> 'approved' then
    raise exception 'Design not available.';
  end if;

  -- Same message as the branch above, deliberately: an unlisted design must
  -- not be distinguishable from a nonexistent one by a stranger probing ids.
  if v_design.listed_at is null then
    raise exception 'Design not available.';
  end if;

  if v_design.is_claimed or v_design.claimed_by is not null then
    raise exception 'Someone just claimed this design.';
  end if;

  -- Null creator_id (house stock) makes this comparison null, so the branch is
  -- not taken — which is correct: house stock has no maker to exclude.
  if v_design.creator_id = v_buyer then
    raise exception 'You made this design.';
  end if;

  -- `is distinct from`, not `<>`: a free design compares null against null,
  -- and `null <> null` is null, which would fall through the check.
  if v_design.price_cents is distinct from p_expected_cents then
    raise exception 'The price changed. Refresh and try again.';
  end if;

  -- coalesce: a free claim records a real order for zero. orders.amount_cents
  -- has no positivity constraint, so this needs no schema change.
  insert into public.orders (buyer_id, design_id, amount_cents, stripe_payment_intent_id, status)
  values (v_buyer, p_design_id, coalesce(v_design.price_cents, 0), p_payment_ref, 'paid')
  returning id into v_order_id;

  update public.designs
  set is_claimed = true, claimed_by = v_buyer
  where id = p_design_id;

  insert into public.claims (design_id, claimant_id)
  values (p_design_id, v_buyer);

  select p.handle into v_handle from public.profiles p where p.id = v_buyer;

  insert into public.storefronts (owner_id, slug)
  values (v_buyer, v_handle)
  on conflict (owner_id) do nothing;

  return query select v_order_id, v_handle;
end;
$$;

-- Revoked from `anon` explicitly, not just from `public`. Supabase ships
-- `alter default privileges in schema public grant all on functions to anon,
-- authenticated, service_role`, so a brand-new function is granted to anon
-- *directly* — revoking from PUBLIC leaves that grant standing, and the
-- security advisor rightly flags it. An anon call would only ever hit the
-- "Must be signed in" branch, but the grant should not exist at all.
revoke execute on function public.claim_design(uuid, integer, text) from public, anon;
grant  execute on function public.claim_design(uuid, integer, text) to authenticated;


-- ==========================================================================
-- 20260809144020_create_v2_job_inputs.sql
-- ==========================================================================

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


-- ==========================================================================
-- 20260809151521_design_garment_config.sql
-- ==========================================================================

-- What the maker chose to print this design on.
--
-- All nullable and not backfilled: designs minted before this have a Printify
-- product and a default mockup already, and the drawn mockup covers anything
-- that doesn't. A null garment means "the configured default", which is what
-- the claim-path backfill has always used.
alter table public.designs
  add column garment_slug        text,
  add column featured_variant_id integer,
  add column placement           text check (placement in ('front', 'back', 'both'));

comment on column public.designs.garment_slug is
  'Which configured Garment the Printify product was minted on. Null = the default.';
comment on column public.designs.featured_variant_id is
  'A representative variant of the colour the maker picked, used to select the hero mockup. Not what anyone buys — the buyer picks their own variant.';
comment on column public.designs.placement is
  'front | back | both. `both` is a small chest mark plus a full back print.';


-- ==========================================================================
-- 20260809161032_garment_orders.sql
-- ==========================================================================

-- `orders` has meant ownership claims. It now also means garment orders, and
-- `kind` is what tells them apart.
--
-- Defaulting to 'claim' is deliberate: claim_design's insert needs no change at
-- all, and there are no existing rows to backfill.
alter table public.orders
  add column kind text not null default 'claim'
    check (kind in ('claim', 'garment')),
  add column variant_id        integer,
  add column printify_order_id text,
  -- Printify's own word, unconstrained. `status` keeps its four values so the
  -- orders page's badge variants stay valid; the granularity lives here.
  add column printify_status   text,
  -- Address snapshot. Never written to profiles: an order shipped where it
  -- shipped, even if the buyer later moves.
  add column ship_first_name text,
  add column ship_last_name  text,
  add column ship_email      text,
  add column ship_phone      text,
  add column ship_country    text,
  add column ship_region     text,
  add column ship_address1   text,
  add column ship_address2   text,
  add column ship_city       text,
  add column ship_zip        text;

comment on column public.orders.kind is
  'claim = bought ownership of the design. garment = bought a printed item.';
comment on column public.orders.printify_status is
  'Printify''s raw status word. `status` is a coarse mapping of it.';
comment on column public.orders.ship_address1 is
  'Shipping address snapshot (PII). Buyer-only under RLS. No retention policy yet.';

create index orders_kind_idx on public.orders (kind);


-- ==========================================================================
-- 20260809172721_job_quote_content.sql
-- ==========================================================================

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


-- ==========================================================================
-- 20260810000000_add_is_prompt_hidden.sql
-- ==========================================================================

-- Add is_prompt_hidden column to designs table to allow creators/owners to toggle prompt visibility
alter table public.designs
  add column if not exists is_prompt_hidden boolean not null default false;

comment on column public.designs.is_prompt_hidden is
  'When true, the prompt is hidden from public view ("Prompt hidden by creator").';


-- ==========================================================================
-- 20260810141800_add_profile_banner.sql
-- ==========================================================================

-- Add banner_url to public.profiles table for creator storefront banners
alter table public.profiles add column if not exists banner_url text;


-- ==========================================================================
-- 20260810150000_claim_design_for_buyer.sql
-- ==========================================================================

-- A paid claim now completes outside the buyer's session.
--
-- Stripe Checkout takes the buyer to stripe.com and tells us the payment
-- landed either by webhook or on the success page — in the webhook case there
-- is no cookie, no JWT and therefore no auth.uid(), so claim_design's
-- `v_buyer := auth.uid()` has nobody to claim for.
--
-- The whole body moves into claim_design_for(p_buyer_id, ...), granted to
-- service_role only, and claim_design becomes the thin session-bound wrapper
-- it always was underneath. One body, two doors: nothing can drift.

create function public.claim_design_for(
  p_buyer_id uuid,
  p_design_id uuid,
  p_expected_cents integer,
  p_payment_ref text
)
returns table (order_id uuid, handle text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_design public.designs%rowtype;
  v_order_id uuid;
  v_handle text;
begin
  if p_buyer_id is null then
    raise exception 'Must be signed in to claim a design.';
  end if;

  -- Row lock: two concurrent claims on the same design must not both pass
  -- these checks. claims.design_id being unique is the backstop if they did.
  select * into v_design
  from public.designs
  where id = p_design_id
  for update;

  if not found then
    raise exception 'Design not found.';
  end if;

  if v_design.moderation_status <> 'approved' then
    raise exception 'Design not available.';
  end if;

  -- Same message as the branch above, deliberately: an unlisted design must
  -- not be distinguishable from a nonexistent one by a stranger probing ids.
  if v_design.listed_at is null then
    raise exception 'Design not available.';
  end if;

  if v_design.is_claimed or v_design.claimed_by is not null then
    raise exception 'Someone just claimed this design.';
  end if;

  -- Null creator_id (house stock) makes this comparison null, so the branch is
  -- not taken — which is correct: house stock has no maker to exclude.
  if v_design.creator_id = p_buyer_id then
    raise exception 'You made this design.';
  end if;

  -- `is distinct from`, not `<>`: a free design compares null against null,
  -- and `null <> null` is null, which would fall through the check.
  if v_design.price_cents is distinct from p_expected_cents then
    raise exception 'The price changed. Refresh and try again.';
  end if;

  -- coalesce: a free claim records a real order for zero. orders.amount_cents
  -- has no positivity constraint, so this needs no schema change.
  insert into public.orders (buyer_id, design_id, amount_cents, stripe_payment_intent_id, status)
  values (p_buyer_id, p_design_id, coalesce(v_design.price_cents, 0), p_payment_ref, 'paid')
  returning id into v_order_id;

  update public.designs
  set is_claimed = true, claimed_by = p_buyer_id
  where id = p_design_id;

  insert into public.claims (design_id, claimant_id)
  values (p_design_id, p_buyer_id);

  select p.handle into v_handle from public.profiles p where p.id = p_buyer_id;

  insert into public.storefronts (owner_id, slug)
  values (p_buyer_id, v_handle)
  on conflict (owner_id) do nothing;

  return query select v_order_id, v_handle;
end;
$$;

-- Claiming *for* an arbitrary buyer is exactly the privilege escalation the
-- session-bound version exists to prevent, so this door opens for trusted
-- server code only. Revoked from `anon` and `authenticated` explicitly, not
-- just from PUBLIC: Supabase's default privileges grant every new function to
-- both directly, and PostgREST would otherwise expose this at /rest/v1/rpc.
revoke execute on function public.claim_design_for(uuid, uuid, integer, text)
  from public, anon, authenticated;
grant  execute on function public.claim_design_for(uuid, uuid, integer, text)
  to service_role;

-- The signed-in path keeps its own name, its own signature and its own
-- grant — every existing caller is untouched. It is `security definer`, so the
-- call below runs as the owner and passes claim_design_for's grant check.
create or replace function public.claim_design(
  p_design_id uuid,
  p_expected_cents integer,
  p_payment_ref text
)
returns table (order_id uuid, handle text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_buyer uuid := (select auth.uid());
begin
  if v_buyer is null then
    raise exception 'Must be signed in to claim a design.';
  end if;

  return query
    select * from public.claim_design_for(
      v_buyer, p_design_id, p_expected_cents, p_payment_ref
    );
end;
$$;


-- ==========================================================================
-- 20260810160000_design_title.sql
-- ==========================================================================

-- Designs get a name of their own.
--
-- Until now `designLabel()` fell back to the raw prompt, so a card, a page
-- title and a receipt all read "a moth with cathedral windows for wings, wings
-- spread wide". That is the art direction, not a name — it is long, it repeats
-- the prompt block directly underneath it, and it makes every <title> a
-- paragraph.
--
-- Written by the same model call that writes the prompt (lib/generation/kimi.ts)
-- so the two always describe the same design. Nullable: every design generated
-- before this has no title and keeps falling back to the prompt.
alter table public.designs add column if not exists title text;

comment on column public.designs.title is
  'Short human name, 5-7 words. Written by the composer alongside the prompt. Null on pre-composer designs, which fall back to the prompt.';

-- Backfill: the first seven words of the prompt.
--
-- Not as good as a written title and not trying to be — it is the same clamp
-- the no-model fallback applies (lib/generation/compose.ts titleFromIdea), so
-- every existing design gets a headline instead of a paragraph today rather
-- than after somebody regenerates it. Anything already titled is left alone.
update public.designs
set title = array_to_string(
  (string_to_array(regexp_replace(trim(prompt), '\s+', ' ', 'g'), ' '))[1:7],
  ' '
)
where title is null
  and prompt is not null
  and trim(prompt) <> '';

-- Seven words into a sentence usually lands mid-clause, so a clipped title
-- ends in a stray comma. Same trailing-punctuation strip cleanTitle() does.
update public.designs
set title = regexp_replace(title, '[[:punct:]]+$', '')
where title ~ '[[:punct:]]$';


-- ==========================================================================
-- 20260810170000_design_original_image.sql
-- ==========================================================================

-- Background removal moves out of generation and becomes the maker's button.
--
-- Generation used to cut the flat field off every design automatically. On a
-- poster-style plate that was destructive and silent: ai-background-remover
-- isolates a *subject*, so it kept the character and deleted the title and the
-- line. Nobody could undo it, because the uncut file was never stored.
--
-- Now the cut writes a new object and records where the original lives, so
-- "remove background" has an undo and a bad cut costs a click.
alter table public.designs add column if not exists original_image_url text;

comment on column public.designs.original_image_url is
  'The uncut artwork, set the first time a maker removes the background. Null means image_url is still the original.';


-- ==========================================================================
-- 20260811000000_bolt_checkout.sql
-- ==========================================================================

-- Stripe out, Bolt in.
--
-- Three changes, all of them about the fact that a payment reference is no
-- longer a Stripe payment intent:
--
--   1. orders.stripe_payment_intent_id becomes orders.payment_ref. The column
--      held the processor's id for a payment; naming it after one processor was
--      only ever true by accident.
--   2. That reference gets a unique index. Fulfilment is idempotent because it
--      checks for an existing order first, but "check then insert" is not
--      atomic — two webhook deliveries arriving together could both pass the
--      check. The index is what actually makes a double-claim impossible.
--   3. checkout_intents: what we knew about the buyer when we sent them to
--      Bolt. Stripe let us stash a name and an email in session metadata;
--      keeping a buyer's details in the processor's key-value store was always
--      the wrong home for them. They live here now and the reference is the
--      only thing that crosses the wire.

alter table public.orders
  rename column stripe_payment_intent_id to payment_ref;

comment on column public.orders.payment_ref is
  'The payment processor''s reference for this order — a Bolt transaction reference. Null for a free claim, where no money moved and inventing one would make this table lie.';

-- Partial: a free claim records a real order with no payment reference, and
-- several nulls must not collide.
create unique index orders_payment_ref_key
  on public.orders (payment_ref)
  where payment_ref is not null;

create table public.checkout_intents (
  -- Ours, not Bolt's: we mint it, send it as the cart's order_reference, and
  -- read it back off the transaction when the webhook lands.
  order_reference text primary key,
  design_id uuid not null references public.designs(id),
  -- Null for a guest. The account is minted at fulfilment, after the money
  -- moved, so an abandoned checkout leaves nothing behind.
  buyer_id uuid references public.profiles(id),
  buyer_name text not null,
  buyer_email text not null,
  -- What the buyer was shown. Compared against the transaction Bolt reports,
  -- never trusted as the amount to charge.
  expected_cents integer not null,
  created_at timestamptz not null default now()
);

create index checkout_intents_design_idx on public.checkout_intents (design_id);

-- Enabled with no policies at all: this table is written and read by trusted
-- server code through the service role, which bypasses RLS. Every other role —
-- anon and authenticated alike — gets nothing, which is right for a table
-- holding buyers' names and email addresses.
alter table public.checkout_intents enable row level security;

-- claim_design_for names the renamed column, so it has to be replaced in the
-- same migration or the rename leaves a function that cannot insert. The body
-- is otherwise untouched from 20260810150000.
create or replace function public.claim_design_for(
  p_buyer_id uuid,
  p_design_id uuid,
  p_expected_cents integer,
  p_payment_ref text
)
returns table (order_id uuid, handle text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_design public.designs%rowtype;
  v_order_id uuid;
  v_handle text;
begin
  if p_buyer_id is null then
    raise exception 'Must be signed in to claim a design.';
  end if;

  -- Row lock: two concurrent claims on the same design must not both pass
  -- these checks. claims.design_id being unique is the backstop if they did.
  select * into v_design
  from public.designs
  where id = p_design_id
  for update;

  if not found then
    raise exception 'Design not found.';
  end if;

  if v_design.moderation_status <> 'approved' then
    raise exception 'Design not available.';
  end if;

  -- Same message as the branch above, deliberately: an unlisted design must
  -- not be distinguishable from a nonexistent one by a stranger probing ids.
  if v_design.listed_at is null then
    raise exception 'Design not available.';
  end if;

  if v_design.is_claimed or v_design.claimed_by is not null then
    raise exception 'Someone just claimed this design.';
  end if;

  -- Null creator_id (house stock) makes this comparison null, so the branch is
  -- not taken — which is correct: house stock has no maker to exclude.
  if v_design.creator_id = p_buyer_id then
    raise exception 'You made this design.';
  end if;

  -- `is distinct from`, not `<>`: a free design compares null against null,
  -- and `null <> null` is null, which would fall through the check.
  if v_design.price_cents is distinct from p_expected_cents then
    raise exception 'The price changed. Refresh and try again.';
  end if;

  -- coalesce: a free claim records a real order for zero. orders.amount_cents
  -- has no positivity constraint, so this needs no schema change.
  insert into public.orders (buyer_id, design_id, amount_cents, payment_ref, status)
  values (p_buyer_id, p_design_id, coalesce(v_design.price_cents, 0), p_payment_ref, 'paid')
  returning id into v_order_id;

  update public.designs
  set is_claimed = true, claimed_by = p_buyer_id
  where id = p_design_id;

  insert into public.claims (design_id, claimant_id)
  values (p_design_id, p_buyer_id);

  select p.handle into v_handle from public.profiles p where p.id = p_buyer_id;

  insert into public.storefronts (owner_id, slug)
  values (p_buyer_id, v_handle)
  on conflict (owner_id) do nothing;

  return query select v_order_id, v_handle;
end;
$$;

