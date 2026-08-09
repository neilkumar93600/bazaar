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
  -- Resolved from the chosen style's vibeSlug, not asked for separately.
  vibe_id uuid references public.vibes(id),
  reference_upload_ids uuid[],
  -- Slug of the lib/generation/styles.ts preset used, and the exact words for a
  -- typographic style. Neither is recoverable from designs.prompt.
  style_slug text,
  text_content text,
  -- A direct user control. Was draft|upscale, a pricing concept that never shipped.
  quality_tier text check (quality_tier in ('low', 'medium', 'high')),
  status text check (status in ('queued', 'generating', 'done', 'failed')) default 'queued',
  -- The FIRST design that landed. One job now produces up to four; the full set
  -- is `designs where generation_job_id = ?`.
  result_design_id uuid,
  created_at timestamptz default now()
);

-- Designs
create table public.designs (
  id uuid primary key default gen_random_uuid(),
  vibe_id uuid references public.vibes(id),
  generation_job_id uuid references public.generation_jobs(id),
  -- Who generated it. Paid once at claim, then out: no royalties, no control.
  -- Null for house stock.
  creator_id uuid references public.profiles(id),
  image_url text not null,
  print_ready_front_url text,
  print_ready_back_url text,
  -- When it went live in the bazaar. Null means private: freshly generated, or
  -- delisted. Generation is not publication — the maker lists deliberately.
  listed_at timestamptz,
  -- What it prints on. Set at listing, then frozen: syncDesignProduct
  -- early-returns on an existing product, so a later change would orphan one.
  -- featured_variant_id is a stand-in for the maker's COLOUR, used to pick the
  -- hero mockup — it is not what anyone buys.
  garment_slug text,
  featured_variant_id integer,
  placement text check (placement in ('front', 'back', 'both')),
  -- Nullable: null means the maker listed it free. No default — a listed
  -- design must have had a price decided, and free is a decision.
  price_cents integer check (price_cents is null or price_cents > 0),
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
- One `generation_job` produces **up to four** `designs` — MuAPI's image endpoint
  has no `n` parameter, so four images is four parallel model runs, and the job
  succeeds if at least one lands. `result_design_id` names the first.
- One `design` has at most one `claim` (unique on `design_id`).
- One `profile` has at most one `storefront` (unique on `owner_id`).
- One `order` has zero or one `royalty_ledger` row — only when it resells a claimed design to someone other than the original claimant.

## Ownership (maker vs owner)

Two different people, two different columns.

- **`creator_id`** — made it. Controls listing and price, *only while
  `claimed_by is null`*. Paid once when someone claims it, then has no further
  rights: no relisting, no resale, no royalties. Enforced by the
  `designs_update_creator_unclaimed` policy, not by application code.
- **`claimed_by`** — owns it. Exclusive, one per design. Gets a storefront and
  the royalty on every later order of that design.

A design's visible state is fully described by three columns; there is no
status enum:

| `listed_at` | `price_cents` | `claimed_by` | Meaning |
| --- | --- | --- | --- |
| null | any | null | Private — maker only. Freshly generated, or delisted. |
| set | null | null | Listed free. First claimer takes it. |
| set | > 0 | null | Listed at a price. |
| set | either | set | Claimed. Maker is out; owner controls it. |
