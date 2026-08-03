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
