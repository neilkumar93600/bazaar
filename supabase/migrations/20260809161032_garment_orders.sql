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
