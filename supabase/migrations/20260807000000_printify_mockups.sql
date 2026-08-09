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
