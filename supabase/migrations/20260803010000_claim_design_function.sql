-- Claiming a design *is* buying it (docs/TRD.md "Claim & storefront"): one
-- atomic transaction that records the order, marks the design claimed,
-- inserts the permanent claims row, and provisions the claimant's
-- storefront. security definer + explicit grant, same pattern as
-- handle_new_user()/notify_on_*() below it in 20260731000000_init_schema.sql
-- — this is why claims/orders/storefronts have no client INSERT policy.
create function public.claim_design(
  p_design_id uuid,
  p_quality_tier text,
  p_size text,
  p_placement_front boolean,
  p_placement_back boolean,
  p_amount_cents integer,
  p_payment_ref text
)
returns table (order_id uuid, handle text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_buyer uuid := (select auth.uid());
  v_is_claimed boolean;
  v_moderation_status text;
  v_order_id uuid;
  v_handle text;
begin
  if v_buyer is null then
    raise exception 'Must be signed in to claim a design.';
  end if;

  if not p_placement_front and not p_placement_back then
    raise exception 'Choose at least one placement.';
  end if;

  -- Row lock: two concurrent claims on the same design must not both pass
  -- this check. claims.design_id being unique is the backstop if they did.
  select is_claimed, moderation_status into v_is_claimed, v_moderation_status
  from public.designs
  where id = p_design_id
  for update;

  if not found then
    raise exception 'Design not found.';
  end if;
  if v_moderation_status <> 'approved' then
    raise exception 'Design not available.';
  end if;
  if v_is_claimed then
    raise exception 'Someone just claimed this design.';
  end if;

  insert into public.orders (
    buyer_id, design_id, quality_tier, size,
    placement_front, placement_back, amount_cents,
    stripe_payment_intent_id, status
  ) values (
    v_buyer, p_design_id, p_quality_tier, p_size,
    p_placement_front, p_placement_back, p_amount_cents,
    p_payment_ref, 'paid'
  )
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

grant execute on function public.claim_design(
  uuid, text, text, boolean, boolean, integer, text
) to authenticated;
