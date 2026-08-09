import { DAILY_CAP, DAILY_IMAGE_CAP } from "@/lib/generation/quota"
import { ROYALTY_RATE_PERCENT } from "@/lib/royalty"

export type FaqEntry = { q: string; a: string }
export type FaqGroup = { heading: string; entries: FaqEntry[] }

/** One source for both the home section and `/faq`.
 *
 *  Server-only by consequence, not decoration: `DAILY_CAP` reads an env var.
 *  Every number here comes from the constant that governs it rather than being
 *  retyped, so the copy cannot drift out of agreement with the product — and
 *  nothing here claims traction, audience or volume the site can't back.
 *
 *  Answers are plain strings on purpose. A ReactNode module would make this a
 *  .tsx data file for the sake of two links, and `/faq` puts those links in a
 *  footer block instead.
 */
export const FAQ_GROUPS: FaqGroup[] = [
  {
    heading: "Claiming",
    entries: [
      {
        q: "What does 1-of-1 actually mean?",
        a: "A design can be claimed exactly once. After that it belongs to one person — no reprints, no second edition, no identical shirt on anyone else.",
      },
      {
        q: "Who can claim a design I generate?",
        a: "Anyone. Generated designs land in the bazaar unclaimed, including the ones you made — so if you want one, claim it. That's also why there's always something here to take.",
      },
      {
        q: "What do I get when I claim one?",
        a: `Exclusive ownership of the design, a storefront of your own at /creator/yourhandle to show it off, and ${ROYALTY_RATE_PERCENT}% of every resale of that design after yours.`,
      },
      {
        q: "Can a claim be undone?",
        a: "No. A claim is permanent and a design gets exactly one, forever. That permanence is the whole product — an unwindable claim would make every other claim worth less.",
      },
      {
        q: "What happens to the designs nobody claims?",
        a: "They stay in the bazaar, unclaimed and claimable, until somebody takes them. Nothing expires and nothing is withdrawn.",
      },
    ],
  },
  {
    heading: "Making designs",
    entries: [
      {
        q: "How many designs can I generate?",
        a: `${DAILY_CAP} generations a day per account, and each one gives you ${DAILY_IMAGE_CAP / DAILY_CAP} images to pick from — ${DAILY_IMAGE_CAP} images a day in total. Generation costs real money to run, so the cap keeps it open to everyone without a queue.`,
      },
      {
        q: "Do I have to list what I generate?",
        a: "No. A design you generate is private until you list it. Listing is what puts it in the bazaar and sets its price; until then only you can see it.",
      },
      {
        q: "Who owns a design I made but nobody claimed?",
        a: "You are its maker and stay credited as such. Ownership transfers on claim — and you can claim your own design like anybody else.",
      },
      {
        q: "Why does the style picker change what the form asks?",
        a: "Because the styles genuinely differ. Picture styles draw a subject and ban letterforms outright; word styles make your exact text the artwork; poster styles want a title and a line. The form only asks for what the style can actually use.",
      },
    ],
  },
  {
    heading: "Shirts and orders",
    entries: [
      {
        q: "How is my shirt made?",
        a: "Print on demand — nothing exists until you order it, then it's printed and shipped by our fulfilment partner. That's also why orders can't be cancelled once production starts.",
      },
      {
        q: "Something arrived wrong. What now?",
        a: "Email support within 14 days of delivery with photos and we'll arrange a reprint or refund at no cost to you. Damage, defects, wrong design and print errors are all covered.",
      },
      {
        q: "Can I return a shirt because I changed my mind?",
        a: "No. Every shirt is made specifically for you after you order, so preference returns — size, placement, second thoughts about the design — aren't eligible once production has begun.",
      },
    ],
  },
  {
    heading: "Money",
    entries: [
      {
        q: `How does the ${ROYALTY_RATE_PERCENT}% resale royalty work?`,
        a: `If you claim a design and it later resells, you earn ${ROYALTY_RATE_PERCENT}% of that sale — automatically, for as long as the design keeps changing hands. Your taste keeps working after the sale.`,
      },
      {
        q: "When do royalties get paid out?",
        a: "Payouts aren't live yet. Royalties are published and tracked against every claim, and the payout path is the next thing being built — we'd rather say that plainly than quote you a date.",
      },
    ],
  },
]

/** The four the home page answers before anyone has scrolled to a price. */
export const HOME_FAQ: FaqEntry[] = [
  FAQ_GROUPS[0].entries[0],
  FAQ_GROUPS[0].entries[1],
  FAQ_GROUPS[1].entries[0],
  FAQ_GROUPS[0].entries[2],
]
