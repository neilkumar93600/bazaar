/** A guest buyer still needs an account.
 *
 *  Everything a purchase creates hangs off a user id — the claim, the
 *  storefront it provisions, the royalty it will pay — so "buy without signing
 *  in" cannot mean "buy without a row in auth.users". It means the buyer never
 *  fills in a signup form: the address they typed for the receipt becomes the
 *  account, minted here with no password. They take it over later through the
 *  ordinary forgot-password flow, at that same address.
 *
 *  `handle_new_user` does the rest — profile, handle, notification prefs — the
 *  moment the auth row lands, so nothing downstream can tell a guest's account
 *  from one opened at the signup form.
 *
 *  The admin client is passed in rather than built here: both callers already
 *  hold one, and a module with no value imports is a module a test can load
 *  without dragging `next/headers` in behind it.
 */

import type { Buyer } from "@/lib/orders/buyer"
import type { createServiceClient } from "@/lib/supabase/server"

export type BuyerAccountAdmin = ReturnType<
  typeof createServiceClient
>["auth"]["admin"]

export async function resolveBuyerId(
  buyer: Buyer,
  admin: BuyerAccountAdmin,
): Promise<string | null> {
  const created = await admin.createUser({
    email: buyer.email,
    // Confirmed without a round trip. The receipt and the artwork file are
    // about to be sent to this address anyway, so leaving it unconfirmed would
    // only lock the buyer out of the thing they just bought. It grants no
    // session by itself: there is no password, and every way in goes through
    // that inbox.
    email_confirm: true,
    user_metadata: { display_name: buyer.name },
  })

  if (created.data?.user) return created.data.user.id

  // Already registered — the purchase joins the account that owns the address
  // instead of being refused. Refusing would mean telling a stranger which
  // emails have accounts, which the sign-in flow deliberately never does.
  //
  // generateLink is the only admin call that resolves a user by email. It
  // returns a link rather than sending one, and the link is thrown away here.
  const existing = await admin.generateLink({
    type: "magiclink",
    email: buyer.email,
  })

  return existing.data?.user?.id ?? null
}
