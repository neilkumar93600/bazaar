-- A paid claim now completes outside the buyer's session.
--
-- Stripe Checkout takes the buyer to stripe.com and tells us the payment
-- landed either by webhook or on the success page — in the webhook case there
-- is no cookie, no JWT and therefore no auth.uid(), so claim_design's
-- `v_buyer := auth.uid()` has nobody to claim for.
--
-- The whole body moves into claim_design_for(p_buyer_id, ...), granted to
-- service_role only, and claim_design becomes the thin session-bound wrapper
-- it always was underneath. One body, two doors: nothing can drift.

create function public.claim_design_for(
  p_buyer_id uuid,
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
  v_design public.designs%rowtype;
  v_order_id uuid;
  v_handle text;
begin
  if p_buyer_id is null then
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
  if v_design.creator_id = p_buyer_id then
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
  values (p_buyer_id, p_design_id, coalesce(v_design.price_cents, 0), p_payment_ref, 'paid')
  returning id into v_order_id;

  update public.designs
  set is_claimed = true, claimed_by = p_buyer_id
  where id = p_design_id;

  insert into public.claims (design_id, claimant_id)
  values (p_design_id, p_buyer_id);

  select p.handle into v_handle from public.profiles p where p.id = p_buyer_id;

  insert into public.storefronts (owner_id, slug)
  values (p_buyer_id, v_handle)
  on conflict (owner_id) do nothing;

  return query select v_order_id, v_handle;
end;
$$;

-- Claiming *for* an arbitrary buyer is exactly the privilege escalation the
-- session-bound version exists to prevent, so this door opens for trusted
-- server code only. Revoked from `anon` and `authenticated` explicitly, not
-- just from PUBLIC: Supabase's default privileges grant every new function to
-- both directly, and PostgREST would otherwise expose this at /rest/v1/rpc.
revoke execute on function public.claim_design_for(uuid, uuid, integer, text)
  from public, anon, authenticated;
grant  execute on function public.claim_design_for(uuid, uuid, integer, text)
  to service_role;

-- The signed-in path keeps its own name, its own signature and its own
-- grant — every existing caller is untouched. It is `security definer`, so the
-- call below runs as the owner and passes claim_design_for's grant check.
create or replace function public.claim_design(
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
begin
  if v_buyer is null then
    raise exception 'Must be signed in to claim a design.';
  end if;

  return query
    select * from public.claim_design_for(
      v_buyer, p_design_id, p_expected_cents, p_payment_ref
    );
end;
$$;
