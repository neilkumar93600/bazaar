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
