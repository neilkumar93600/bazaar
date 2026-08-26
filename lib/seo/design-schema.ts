import { siteUrl } from "@/lib/site";

/** JSON-LD for a design page.
 *
 *  The design pages are the only product pages this site has, they are the
 *  ones the sitemap lists, and they carried no structured data at all — so a
 *  claimed design with a real garment price was reaching Google as plain HTML
 *  and earning none of the price/availability treatment a product page is
 *  eligible for.
 *
 *  Two rules keep this honest, because schema that overstates the page is a
 *  policy problem rather than a missed opportunity:
 *
 *  - Product is emitted only when the garment can actually be ordered. That
 *    means a claimed design (lib/orders/eligibility.ts refuses unclaimed ones)
 *    with a resolved Printify price. No price, no Offer, no Product.
 *  - BreadcrumbList mirrors the visible Breadcrumb component exactly. If that
 *    trail changes, this changes with it.
 */

export type DesignSchemaInput = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  vibeName: string | null;
  /** The page's own buy gate — claimed, with a Printify product behind it.
   *  Same rule as lib/orders/eligibility.ts, so the schema can never advertise
   *  an order the server would refuse. */
  canOrder: boolean;
  /** Null when Printify's catalogue could not be read, which is a supported
   *  answer on this page — it means no order form, so no Offer either. */
  garmentPriceCents: number | null;
  creatorName: string | null;
};

/** Schema requires absolute URLs; a relative one silently invalidates the
 *  whole block. Storage and Printify already hand back absolute URLs, so this
 *  is the guard for the day one of them doesn't. */
function absolute(url: string): string {
  return url.startsWith("http://") || url.startsWith("https://")
    ? url
    : `${siteUrl}${url.startsWith("/") ? "" : "/"}${url}`;
}

export function designJsonLd(design: DesignSchemaInput): object[] {
  const url = `${siteUrl}/design/${design.id}`;

  // Mirrors the visible Breadcrumb: Home / Bazaar / [vibe] / title.
  const trail = [
    { name: "Home", item: siteUrl },
    { name: "Bazaar", item: `${siteUrl}/shop` },
    ...(design.vibeName
      ? [{ name: design.vibeName, item: `${siteUrl}/shop` }]
      : []),
    { name: design.name, item: url },
  ];

  const blocks: object[] = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: trail.map((crumb, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: crumb.name,
        item: crumb.item,
      })),
    },
  ];

  // An unclaimed design has no owner for the royalty and cannot be ordered, so
  // it is not a product yet. An orderable one with no resolved price has
  // nothing to put in the Offer, and a Product without an Offer earns no rich
  // result anyway — in both cases the breadcrumb block stands alone.
  if (!design.canOrder || design.garmentPriceCents === null) return blocks;

  blocks.push({
    "@context": "https://schema.org",
    "@type": "Product",
    name: design.name,
    ...(design.description ? { description: design.description } : {}),
    ...(design.imageUrl ? { image: absolute(design.imageUrl) } : {}),
    sku: design.id,
    ...(design.creatorName
      ? { brand: { "@type": "Brand", name: design.creatorName } }
      : {}),
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "USD",
      // Schema wants a decimal string, not cents.
      price: (design.garmentPriceCents / 100).toFixed(2),
      availability: "https://schema.org/InStock",
    },
  });

  return blocks;
}
