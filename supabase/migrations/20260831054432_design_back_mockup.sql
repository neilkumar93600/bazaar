-- The back-print photo for a `both`-placement design.
--
-- `mockup_url` already holds the hero shot (front camera, or back camera for a
-- back-only design). A `both` design prints on both sides, so the buyer needs
-- a second photo to actually see the back — without this the design page can
-- only ever show the chest mark and never the full back print it's sold on.
--
-- Nullable and never backfilled, same as `mockup_url`: it fills in on the next
-- sync for existing `both` designs, and every surface treats null as "no back
-- photo yet" rather than an error.
alter table public.designs
  add column back_mockup_url text;

comment on column public.designs.back_mockup_url is
  'Printify-hosted photo of this design''s back print. Only set for placement = both. Null falls back to hiding the back view.';
