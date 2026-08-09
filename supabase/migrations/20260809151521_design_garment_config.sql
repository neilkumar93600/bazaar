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
