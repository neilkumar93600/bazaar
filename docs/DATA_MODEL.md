# Shirt Bazaar — Data Model (Supabase / Postgres)

Draft schema — types and constraints will be refined during implementation; this establishes the shape and relationships.

```sql
-- Profiles (extends Supabase auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id),
  handle text unique not null,
  display_name text,
  avatar_url text,
  created_at timestamptz default now()
);

-- Vibes (columns)
create table public.vibes (
  id uuid primary key default gen_random_uuid(),
  name text not null,               -- e.g. "Dusk Atelier"
  slug text unique not null,
  is_default_column boolean default true,
  created_at timestamptz default now()
);

-- Reference uploads (style references)
create table public.reference_uploads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),
  image_url text not null,
  created_at timestamptz default now()
);

-- Generation jobs
create table public.generation_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),
  vibe_id uuid references public.vibes(id),
  reference_upload_ids uuid[],
  quality_tier text check (quality_tier in ('draft', 'upscale')),
  status text check (status in ('queued', 'generating', 'done', 'failed')) default 'queued',
  result_design_id uuid,
  created_at timestamptz default now()
);

-- Designs
create table public.designs (
  id uuid primary key default gen_random_uuid(),
  vibe_id uuid references public.vibes(id),
  generation_job_id uuid references public.generation_jobs(id),
  image_url text not null,
  print_ready_front_url text,
  print_ready_back_url text,
  is_claimed boolean default false,
  claimed_by uuid references public.profiles(id),
  moderation_status text check (moderation_status in ('pending', 'approved', 'rejected')) default 'pending',
  created_at timestamptz default now()
);

-- Claims (ownership + first-use proof)
create table public.claims (
  id uuid primary key default gen_random_uuid(),
  design_id uuid references public.designs(id) unique,
  claimant_id uuid references public.profiles(id),
  claimed_at timestamptz default now()
);

-- Storefronts (auto-provisioned on claim)
create table public.storefronts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) unique,
  slug text unique not null,
  created_at timestamptz default now()
);

-- Follows
create table public.follows (
  follower_id uuid references public.profiles(id),
  followed_id uuid references public.profiles(id),
  created_at timestamptz default now(),
  primary key (follower_id, followed_id)
);

-- Column rentals (paid takeover)
create table public.column_rentals (
  id uuid primary key default gen_random_uuid(),
  renter_id uuid references public.profiles(id),
  vibe_id uuid references public.vibes(id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_at timestamptz default now()
);

-- Orders (purchases, including print/placement config)
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid references public.profiles(id),
  design_id uuid references public.designs(id),
  quality_tier text,
  placement_front boolean default true,
  placement_back boolean default false,
  size text,
  amount_cents integer not null,
  stripe_payment_intent_id text,
  status text check (status in ('pending', 'paid', 'fulfilled', 'refunded')) default 'pending',
  created_at timestamptz default now()
);

-- POD provider mapping (internal only, never exposed client-side)
create table public.pod_provider_mapping (
  quality_tier text primary key,
  provider_key text not null
);

-- Royalty ledger
create table public.royalty_ledger (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id),
  design_id uuid references public.designs(id),
  original_claimant_id uuid references public.profiles(id),
  amount_cents integer not null,
  paid_at timestamptz,
  created_at timestamptz default now()
);

-- Messages (dashboard inbox)
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references public.profiles(id),
  recipient_id uuid references public.profiles(id),
  body text not null,
  read_at timestamptz,
  created_at timestamptz default now()
);
```

## Relationships (summary)
- One `generation_job` produces at most one `design` (on success).
- One `design` has at most one `claim` (unique on `design_id`).
- One `profile` has at most one `storefront` (unique on `owner_id`).
- One `order` has zero or one `royalty_ledger` row — only when it resells a claimed design to someone other than the original claimant.
