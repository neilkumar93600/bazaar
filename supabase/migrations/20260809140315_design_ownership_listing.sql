-- Ownership and listing. Generation stops being publication: a design is
-- private to its maker until they list it, free or priced, and the maker loses
-- every right to it the moment somebody claims it.
--
-- The gate is RLS, not query filters. `designs` is read from the browser with
-- the anon key (the create page polls it), so a filter that lives only in
-- lib/data/* leaves every private row readable straight from PostgREST.

-- 1. Columns -----------------------------------------------------------------

alter table public.designs
  add column creator_id uuid references public.profiles(id),
  add column listed_at  timestamptz;

comment on column public.designs.creator_id is
  'Who generated this design. Paid once at claim, then out — no royalties, no control.';
comment on column public.designs.listed_at is
  'When it went live in the bazaar. Null means private: freshly generated, or delisted.';

-- 2. Price becomes optional: null means the maker listed it free -------------
--
-- The 2900 default goes too. A listed design must have had a price decided,
-- and free is a decision; defaulting into a number hides the difference
-- between "the maker chose $29.00" and "nobody chose anything".

alter table public.designs alter column price_cents drop not null;
alter table public.designs alter column price_cents drop default;
alter table public.designs drop constraint designs_price_cents_positive;
alter table public.designs
  add constraint designs_price_cents_positive
    check (price_cents is null or price_cents > 0);

-- 3. Backfill ----------------------------------------------------------------
--
-- Every existing design stays exactly as visible as it was. Seeded rows have
-- no generation job and so no maker; they are house stock and creator_id
-- stays null, which the claim gate handles (`creator_id is not null and ...`).

update public.designs d
set creator_id = j.user_id
from public.generation_jobs j
where j.id = d.generation_job_id
  and d.creator_id is null;

update public.designs
set listed_at = created_at
where listed_at is null;

create index designs_creator_id_idx on public.designs (creator_id);
create index designs_listed_at_idx on public.designs (listed_at desc)
  where listed_at is not null;

-- 4. Read gate ---------------------------------------------------------------
--
-- Anon carries auth.uid() = null, so this collapses to "listed only". A maker
-- keeps seeing their own drafts; an owner keeps seeing a design they delist.

drop policy "designs_select_public" on public.designs;

create policy "designs_select_listed" on public.designs
  for select using (
    listed_at is not null
    or (select auth.uid()) = creator_id
    or (select auth.uid()) = claimed_by
  );

-- 5. generation_jobs public read is now both redundant and a leak ------------
--
-- It gated on moderation_status = 'approved', but privacy now comes from
-- listed_at and a private design is still 'approved'. Left in place it hands
-- anon the ids and maker ids of every unlisted design. It existed only to
-- attribute a design to its creator, which designs.creator_id now answers.

drop policy "generation_jobs_select_public_result" on public.generation_jobs;

-- 6. Write gate --------------------------------------------------------------
--
-- "The maker has nothing to do with it after a claim" is enforced here: the
-- instant claimed_by is set, the maker's policy stops matching. Both policies
-- carry USING and WITH CHECK — without WITH CHECK a user could reassign a
-- row's creator_id or claimed_by to somebody else.

drop policy "designs_update_owner" on public.designs;

create policy "designs_update_creator_unclaimed" on public.designs
  for update to authenticated
  using      ((select auth.uid()) = creator_id and claimed_by is null)
  with check ((select auth.uid()) = creator_id and claimed_by is null);

create policy "designs_update_claimant" on public.designs
  for update to authenticated
  using      ((select auth.uid()) = claimed_by)
  with check ((select auth.uid()) = claimed_by);

-- 7. Trigger functions are not HTTP endpoints --------------------------------
--
-- Postgres grants EXECUTE to PUBLIC on every new function, and the init
-- migration never revoked it, so every one of these SECURITY DEFINER trigger
-- functions is callable by anon via /rest/v1/rpc. Flagged by the security
-- advisor; notify_on_claim and notify_on_royalty sit on the path this
-- migration rewrites.

revoke execute on function
  public.handle_new_user(),
  public.handle_new_profile(),
  public.notify_on_claim(),
  public.notify_on_message(),
  public.notify_on_order_status_change(),
  public.notify_on_royalty(),
  public.rls_auto_enable()
from public, anon, authenticated;

-- 8. claim_design ------------------------------------------------------------
--
-- Dropped and recreated rather than replaced: CREATE OR REPLACE cannot rename
-- an input parameter, and p_amount_cents becomes p_expected_cents.
--
-- The rename is the point. The caller used to pass the amount to record; it
-- now passes the price the buyer was *shown*, and the row's own price is what
-- gets written. A maker editing the price between page render and claim can no
-- longer cause a buyer to be charged one number while the order records
-- another — the claim fails and the buyer retries against the real price.
--
-- Branch order and error strings mirror claimEligibility() in lib/listing.ts.

drop function if exists public.claim_design(uuid, integer, text);

create function public.claim_design(
  p_design_id uuid,
  p_expected_cents integer,
  p_payment_ref text
)
returns table (order_id uuid, handle text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_buyer uuid := (select auth.uid());
  v_design public.designs%rowtype;
  v_order_id uuid;
  v_handle text;
begin
  if v_buyer is null then
    raise exception 'Must be signed in to claim a design.';
  end if;

  -- Row lock: two concurrent claims on the same design must not both pass
  -- these checks. claims.design_id being unique is the backstop if they did.
  select * into v_design
  from public.designs
  where id = p_design_id
  for update;

  if not found then
    raise exception 'Design not found.';
  end if;

  if v_design.moderation_status <> 'approved' then
    raise exception 'Design not available.';
  end if;

  -- Same message as the branch above, deliberately: an unlisted design must
  -- not be distinguishable from a nonexistent one by a stranger probing ids.
  if v_design.listed_at is null then
    raise exception 'Design not available.';
  end if;

  if v_design.is_claimed or v_design.claimed_by is not null then
    raise exception 'Someone just claimed this design.';
  end if;

  -- Null creator_id (house stock) makes this comparison null, so the branch is
  -- not taken — which is correct: house stock has no maker to exclude.
  if v_design.creator_id = v_buyer then
    raise exception 'You made this design.';
  end if;

  -- `is distinct from`, not `<>`: a free design compares null against null,
  -- and `null <> null` is null, which would fall through the check.
  if v_design.price_cents is distinct from p_expected_cents then
    raise exception 'The price changed. Refresh and try again.';
  end if;

  -- coalesce: a free claim records a real order for zero. orders.amount_cents
  -- has no positivity constraint, so this needs no schema change.
  insert into public.orders (buyer_id, design_id, amount_cents, stripe_payment_intent_id, status)
  values (v_buyer, p_design_id, coalesce(v_design.price_cents, 0), p_payment_ref, 'paid')
  returning id into v_order_id;

  update public.designs
  set is_claimed = true, claimed_by = v_buyer
  where id = p_design_id;

  insert into public.claims (design_id, claimant_id)
  values (p_design_id, v_buyer);

  select p.handle into v_handle from public.profiles p where p.id = v_buyer;

  insert into public.storefronts (owner_id, slug)
  values (v_buyer, v_handle)
  on conflict (owner_id) do nothing;

  return query select v_order_id, v_handle;
end;
$$;

-- Revoked from `anon` explicitly, not just from `public`. Supabase ships
-- `alter default privileges in schema public grant all on functions to anon,
-- authenticated, service_role`, so a brand-new function is granted to anon
-- *directly* — revoking from PUBLIC leaves that grant standing, and the
-- security advisor rightly flags it. An anon call would only ever hit the
-- "Must be signed in" branch, but the grant should not exist at all.
revoke execute on function public.claim_design(uuid, integer, text) from public, anon;
grant  execute on function public.claim_design(uuid, integer, text) to authenticated;
