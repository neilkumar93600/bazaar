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
