import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format, formatDistanceToNowStrict } from "date-fns";
import { ChevronRight } from "lucide-react";

import {
  getCreatorDesigns,
  getDesignDetail,
  getRelatedDesigns,
} from "@/lib/data/design";
import { getOrderOptions } from "@/app/(public)/design/[id]/order-actions";
import { createClient } from "@/lib/supabase/server";
import { designLabel, formatListingPrice } from "@/lib/utils";
import { BuyForm } from "@/components/design/BuyForm";
import { CreatorCard } from "@/components/design/CreatorCard";
import { DesignGallery } from "@/components/design/DesignGallery";
import { OrderForm } from "@/components/design/OrderForm";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Carousel } from "@/components/shared/Carousel";
import { DesignCard } from "@/components/shared/DesignCard";

export async function generateMetadata(
  props: PageProps<"/design/[id]">,
): Promise<Metadata> {
  const { id } = await props.params;
  const design = await getDesignDetail(id);

  if (!design) return { title: "Design not found", robots: { index: false } };

  // Every design gets its own title. Heading these with `vibeName` gave every
  // design in a vibe the same <title>, which is a duplicate-content problem as
  // much as a UX one. 60 chars leaves room for the " — Shirt Bazaar" template.
  const label = designLabel(design, 44);

  return {
    title: `${label} — ${formatListingPrice(design.priceCents)}`,
    description: design.prompt
      ? `A 1-of-1 AI shirt design: ${design.prompt}. ${design.isClaimed ? "Already claimed." : "Unclaimed — claim it and it's yours alone, forever."}`
      : undefined,
    robots: design.isClaimed ? undefined : { index: false, follow: true },
  };
}

/** The design, as a product page.
 *
 *  Two columns, the way a storefront lays one out: media on the left with the
 *  maker directly beneath it, everything transactional on the right — name,
 *  price, the buy control, then the detail accordions. It used to be a modal,
 *  which had nowhere to put a maker or a recommendation strip and made the
 *  canonical URL feel like a fallback rather than the destination.
 */
export default async function DesignDetailPage(props: PageProps<"/design/[id]">) {
  const { id } = await props.params;
  const design = await getDesignDetail(id);

  if (!design) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [orderOptions, { data: profile }, creatorDesigns, relatedDesigns] =
    await Promise.all([
      // Only a claimed design with a product can be ordered, so the Printify
      // catalogue call is skipped entirely for everything else.
      design.claimedBy && design.printifyProductId
        ? getOrderOptions(design.garmentSlug)
        : Promise.resolve(null),
      user
        ? supabase
            .from("profiles")
            .select("display_name")
            .eq("id", user.id)
            .maybeSingle()
        : Promise.resolve({ data: null as { display_name: string | null } | null }),
      design.creator ? getCreatorDesigns(design.creator.id, design.id) : Promise.resolve([]),
      getRelatedDesigns(design.vibeId, design.id),
    ]);

  const title = designLabel(design);

  return (
    <div className="mx-auto flex max-w-page flex-col gap-14 px-6 py-8 md:px-16 sm:py-12">
      <Breadcrumb vibeName={design.vibeName} title={title} />

      {/* Three grid children, placed rather than nested. On a phone they stack
          in reading order — image, then everything you buy with, then the
          maker. Nesting the maker under the image instead would have pushed
          the price and the buy button below a profile card on mobile.
          From lg: image top-left, maker under it, details spanning the right. */}
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="lg:col-start-1 lg:row-start-1">
          <DesignGallery
            imageUrl={design.imageUrl}
            mockupUrl={design.mockupUrl}
            alt={title}
          />
        </div>

        {/* Everything transactional. */}
        <div className="flex flex-col gap-6 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <div className="flex flex-col gap-2">
            <div className="flex items-start justify-between gap-4">
              <h1 className="min-w-0 text-heading md:text-heading-lg font-semibold break-words text-foreground">
                <FormattedTitle title={title} />
              </h1>
              {design.isClaimed ? (
                // Status Pill Badge: #dcfff1 surface, 1px solid #7ee2b8 edge, 9999px radius, ink text, mint dot
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#7ee2b8] bg-[#dcfff1] px-3 py-1 text-caption font-medium text-ink">
                  <span className="size-1.5 rounded-full bg-[#7ee2b8]" aria-hidden />
                  Claimed
                </span>
              ) : (
                // Pill Tag: transparent surface, 1px solid ink edge, 9999px radius, uppercase at 0.08em tracking
                <span className="shrink-0 rounded-full border border-ink bg-transparent px-3 py-1 text-caption font-medium tracking-[0.08em] text-ink uppercase">
                  1 of 1
                </span>
              )}
            </div>
            <p className="text-body text-muted-ink">
              {design.vibeName ? `${design.vibeName} · ` : ""}
              Minted{" "}
              {formatDistanceToNowStrict(new Date(design.createdAt), {
                addSuffix: true,
              })}
            </p>
          </div>

          <span className="font-mono text-heading text-foreground font-semibold">
            {formatListingPrice(design.priceCents)}
          </span>

          {design.isClaimed ? (
            <>
              {design.claimantHandle && (
                <p className="text-body-sm text-muted-ink">
                  Owned by{" "}
                  <Link
                    href={`/creator/${design.claimantHandle}`}
                    className="font-medium text-foreground underline underline-offset-4"
                  >
                    @{design.claimantHandle}
                  </Link>
                  . The artwork is spoken for — the print below is still open to
                  anyone.
                </p>
              )}

              {orderOptions ? (
                user ? (
                  <OrderForm
                    designId={design.id}
                    options={orderOptions}
                    featuredVariantId={design.featuredVariantId}
                    defaultEmail={user.email ?? ""}
                  />
                ) : (
                  <SignInPanel
                    message="Sign in to order this design printed."
                    label="Log in to order"
                  />
                )
              ) : null}
            </>
          ) : (
            // No account required. The form's name and email are all a
            // purchase needs — an account is made from that email behind it,
            // so a stranger can claim a design without stopping to sign up.
            <BuyForm
              designId={design.id}
              priceCents={design.priceCents}
              defaultName={profile?.display_name ?? ""}
              defaultEmail={user?.email ?? ""}
              isGuest={!user}
            />
          )}

          {/* Everything a buyer might want but shouldn't have to scroll past
              to reach the buy control. Prompt open by default — on this
              marketplace it is the thing people actually came to read. */}
          <Accordion defaultValue={["prompt"]} className="mt-2">
            <AccordionItem value="prompt">
              <AccordionTrigger className="text-body font-semibold">
                Prompt
              </AccordionTrigger>
              <AccordionContent>
                {design.isPromptHidden ? (
                  <p className="text-body-sm text-muted-ink">
                    The creator kept this one private. Hiding the prompt hides
                    the recipe, not the design.
                  </p>
                ) : design.prompt ? (
                  <>
                    <blockquote className="border-l-2 border-ink pl-3.5 py-1 font-mono text-body-sm break-words text-ink italic">
                      &ldquo;{design.prompt}&rdquo;
                    </blockquote>
                    {design.quote && (
                      <p className="mt-3 font-mono text-caption text-muted-ink">
                        Line text: {design.quote}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-body-sm text-muted-ink">
                    No prompt text was recorded for this design.
                  </p>
                )}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="details">
              <AccordionTrigger className="text-body font-semibold">
                Design details
              </AccordionTrigger>
              <AccordionContent>
                <DetailRow label="Edition" value="1 of 1 — never generated again" />
                <DetailRow
                  label="Status"
                  value={
                    design.isClaimed
                      ? design.claimantHandle
                        ? `Claimed by @${design.claimantHandle}`
                        : "Claimed"
                      : "Unclaimed"
                  }
                />
                {design.vibeName && (
                  <DetailRow label="Vibe" value={design.vibeName} />
                )}
                <DetailRow
                  label="Minted"
                  value={format(new Date(design.createdAt), "d MMMM yyyy")}
                />
                <DetailRow
                  label="File"
                  value="Flat artwork PNG, transparent, print-ready"
                />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="included">
              <AccordionTrigger className="text-body font-semibold">
                What you get
              </AccordionTrigger>
              <AccordionContent>
                <ul className="flex list-disc flex-col gap-1.5 pl-4 text-body-sm text-muted-ink">
                  <li>
                    The artwork file itself, emailed on purchase — the flat
                    design, not a photo of a shirt.
                  </li>
                  <li>Permanent ownership of a 1-of-1. Nobody else can claim it.</li>
                  <li>A storefront of your own, with this design on it.</li>
                  <li>A royalty on every printed order of it, forever.</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <div className="lg:col-start-1 lg:row-start-2">
          {design.creator ? (
            <CreatorCard
              creator={design.creator}
              designCount={creatorDesigns.length}
            />
          ) : (
            <div className="rounded-xl border border-border bg-card p-5 text-body-sm text-muted-ink">
              House stock — no maker attached to this one.
            </div>
          )}
        </div>
      </div>

      {creatorDesigns.length > 0 && design.creator && (
        <DesignStrip
          lead="More from"
          emphasis={design.creator.displayName ?? `@${design.creator.handle}`}
          subheading="Other work by the same maker"
          href={`/creator/${design.creator.handle}`}
          linkLabel="Visit store"
          designs={creatorDesigns}
        />
      )}

      {relatedDesigns.length > 0 && (
        <DesignStrip
          lead="More in"
          emphasis={design.vibeName ?? "the bazaar"}
          subheading="Same vibe, different hands"
          href="/shop"
          linkLabel="Browse all"
          designs={relatedDesigns}
        />
      )}
    </div>
  );
}

/** Splits multi-word headlines to give the final word Fraunces italic emphasis
 *  as required by docs/DESIGN.md. */
function FormattedTitle({ title }: { title: string }) {
  const words = title.trim().split(/\s+/);
  if (words.length <= 1) {
    return <>{title}</>;
  }
  const main = words.slice(0, -1).join(" ");
  const last = words[words.length - 1];
  return (
    <>
      {main} <em className="font-serif font-normal italic">{last}</em>
    </>
  );
}

function Breadcrumb({
  vibeName,
  title,
}: {
  vibeName: string | null;
  title: string;
}) {
  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Bazaar", href: "/shop" },
    ...(vibeName ? [{ label: vibeName, href: "/shop" }] : []),
  ];

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-caption">
      {crumbs.map((crumb) => (
        <span key={crumb.label} className="flex items-center gap-1.5">
          <Link
            href={crumb.href}
            className="text-muted-ink underline-offset-4 hover:text-ink hover:underline"
          >
            {crumb.label}
          </Link>
          <ChevronRight className="size-3 text-muted-gray" aria-hidden />
        </span>
      ))}
      {/* Truncated, not wrapped: a breadcrumb that runs to three lines on a
          phone pushes the product below the fold. */}
      <span className="min-w-0 truncate font-medium text-ink">{title}</span>
    </nav>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-rule py-2.5 last:border-0">
      <span className="shrink-0 text-body-sm font-medium text-ink">
        {label}
      </span>
      <span className="text-right text-body-sm text-muted-ink">{value}</span>
    </div>
  );
}

function SignInPanel({ message, label }: { message: string; label: string }) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-ink bg-card p-6 text-card-foreground shadow-[var(--shadow-xl-2)]">
      <p className="text-body-sm text-muted-ink">{message}</p>
      <Button variant="ember" className="h-11 w-full" render={<Link href="/login" />}>
        {label}
      </Button>
    </div>
  );
}

/** `lead` + `emphasis` rather than one string: docs/DESIGN.md wants exactly one
 *  Fraunces italic emphasis inside every weight-600 headline, and the only way
 *  to guarantee that is to make the caller name the emphasis. */
function DesignStrip({
  lead,
  emphasis,
  subheading,
  href,
  linkLabel,
  designs,
}: {
  lead: string;
  emphasis: string;
  subheading: string;
  href: string;
  linkLabel: string;
  designs: Awaited<ReturnType<typeof getCreatorDesigns>>;
}) {
  const label = `${lead} ${emphasis}`;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-3 border-t border-hairline pt-6">
        {/* Wraps rather than truncating: "More from Niles…" on a phone tells
            the reader nothing the heading was there to say. */}
        <div className="flex min-w-0 flex-col gap-0.5">
          <h2 className="text-heading-sm font-semibold break-words text-foreground">
            {lead}{" "}
            <em className="font-serif font-normal italic">{emphasis}</em>
          </h2>
          <p className="text-caption text-muted-ink">{subheading}</p>
        </div>
        {/* Outlined Secondary Button: white, ink text, 4px radius, 1px ink
            border, no shadow. It was a pill, and pills are tags and status. */}
        <Link
          href={href}
          className="shrink-0 rounded-lg border border-ink bg-paper-white px-4 py-2 text-caption font-medium text-ink hover:bg-accent"
        >
          {linkLabel}
        </Link>
      </div>

      <Carousel label={label}>
        {designs.map((item) => (
          <DesignCard key={item.id} design={item} aspectClassName="aspect-[4/5]" />
        ))}
      </Carousel>
    </section>
  );
}
