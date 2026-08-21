/** Hands the buyer what they paid for: a receipt, and the design file itself.
 *
 *  Called from both purchase paths — the free claim's server action and
 *  Bolt fulfilment — so "what a buyer receives" is written down once.
 *
 *  Never throws. Every caller is downstream of a completed claim, and a mail
 *  provider having a bad minute must not turn a finished purchase into an
 *  error the buyer sees.
 */

import { getDesignDetail } from "@/lib/data/design"
import { designFileEmail, purchaseReceiptEmail } from "@/lib/email/templates"
import { sendEmail } from "@/lib/email/send"
import type { Buyer } from "@/lib/orders/buyer"
import { siteUrl } from "@/lib/site"
import { designLabel } from "@/lib/utils"

export type Delivery = {
  designId: string
  orderId: string
  buyer: Buyer
  /** The claimant's handle, for the storefront link. */
  handle: string | null
}

/** The artwork, not the mockup. `design.imageUrl` is the flat transparent
 *  design; `design.mockupUrl` is a photo of a shirt with it printed on. The
 *  buyer bought the former, and attaching a shirt photo instead would be
 *  delivering the advertisement in place of the product. */
function attachmentFor(imageUrl: string, label: string) {
  const extension = new URL(imageUrl).pathname.split(".").pop() ?? "png"
  const slug =
    label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "design"

  return { filename: `${slug}.${extension}`, path: imageUrl }
}

export async function deliverDesignPurchase(delivery: Delivery): Promise<boolean> {
  try {
    const design = await getDesignDetail(delivery.designId)
    if (!design) {
      console.error(`[purchase] no design ${delivery.designId} to deliver`)
      return false
    }

    const label = designLabel(design)

    const storefrontUrl = delivery.handle
      ? `${siteUrl}/creator/${delivery.handle}`
      : `${siteUrl}/dashboard/designs`

    const receipt = purchaseReceiptEmail({
      orderId: delivery.orderId,
      buyerName: delivery.buyer.name,
      designLabel: label,
      priceCents: design.priceCents,
      purchasedAt: new Date(),
      storefrontUrl,
    })

    const file = designFileEmail({
      buyerName: delivery.buyer.name,
      designLabel: label,
      storefrontUrl,
    })

    // Two emails, sent together: the receipt is the record, the file is the
    // product. Not `&&` — the file must still go out if the receipt bounces,
    // since one of these is the thing they actually paid for.
    const [receiptSent, fileSent] = await Promise.all([
      sendEmail({ to: delivery.buyer.email, ...receipt }),
      sendEmail({
        to: delivery.buyer.email,
        ...file,
        attachments: [attachmentFor(design.imageUrl, label)],
      }),
    ])

    return receiptSent && fileSent
  } catch (error) {
    console.error("[purchase] delivery failed", error)
    return false
  }
}
