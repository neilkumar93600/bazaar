-- Storefronts need to look up any profile by handle (not just the logged-in
-- user's own row). profiles has no sensitive columns (handle, display_name,
-- avatar_url, created_at, id are all meant to be publicly visible on a
-- storefront/feed) so a plain public select policy is correct here — this
-- adds to, not replaces, the existing self-only policies.
create policy "profiles_select_public" on public.profiles
  for select using (true);
