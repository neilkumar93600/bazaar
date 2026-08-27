-- Reference images for a persona are uploaded straight from the browser to
-- the "designs" bucket under the caller's own session, not proxied through a
-- Server Action. A Server Action body is capped by Vercel's serverless
-- function payload limit (hard 4.5MB, unrelated to next.config's own
-- bodySizeLimit setting) — 10-50 full-resolution reference images blow past
-- that immediately. Scoping the insert to persona-refs/{uid}/* keeps this
-- narrow: nothing else in the public "designs" bucket gets a client write
-- path (see 20260806000000_designs_storage_bucket.sql's "No public write").
create policy "persona_refs_owner_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'designs'
    and (storage.foldername(name))[1] = 'persona-refs'
    and (storage.foldername(name))[2] = (select auth.uid())::text
  );
