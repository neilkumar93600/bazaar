/** Hands the buyer what they paid for: a receipt, and the design file itself.
 *
 *  Called from both purchase paths — the free claim's server action and
 *  Stripe fulfilment — so "what a buyer receives" is written down once.
 *
 *  Never throws. Every caller is downstream of a completed claim, and a mail
 *  provider having a bad minute must not turn a finished purchase into an
 *  error the buyer sees.
 */

import { getDesignDetail } from "@/lib/data/design"
import { purchaseReceiptEmail } from "@/lib/email/templates"
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

    const { subject, html } = purchaseReceiptEmail({
      orderId: delivery.orderId,
      buyerName: delivery.buyer.name,
      designLabel: label,
      priceCents: design.priceCents,
      purchasedAt: new Date(),
      storefrontUrl: delivery.handle
        ? `${siteUrl}/creator/${delivery.handle}`
        : `${siteUrl}/dashboard/designs`,
    })

    return await sendEmail({
      to: delivery.buyer.email,
      subject,
      html,
      attachments: [attachmentFor(design.imageUrl, label)],
    })
  } catch (error) {
    console.error("[purchase] delivery failed", error)
    return false
  }
}
