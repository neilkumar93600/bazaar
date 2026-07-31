import Link from "next/link";

const FOOTER_COLUMNS = [
  {
    heading: "Marketplace",
    links: [
      { href: "/", label: "Browse" },
      { href: "/search", label: "Search" },
    ],
  },
  {
    heading: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/blog", label: "Blog" },
      { href: "/careers", label: "Careers" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    heading: "Support",
    links: [
      { href: "/faq", label: "FAQ" },
      { href: "/refund-policy", label: "Refund policy" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { href: "/terms", label: "Terms" },
      { href: "/privacy", label: "Privacy" },
      { href: "/cookies", label: "Cookies" },
      { href: "/acceptable-use", label: "Acceptable use" },
      { href: "/child-safety", label: "Child safety" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-footer-rose bg-background border-t border-border">
      <div className="mx-auto grid max-w-[1400px] gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.2fr_repeat(4,1fr)] lg:px-8">
        <div className="flex flex-col gap-3">
          <span className="text-heading text-white">SHIRT BAZAAR</span>
          <p className="text-body-sm max-w-xs text-muted-foreground">
            One-of-one, AI-generated designs. Claim one and it&apos;s
            exclusively yours — plus a royalty on every resale.
          </p>
        </div>

        {FOOTER_COLUMNS.map((column) => (
          <div key={column.heading} className="flex flex-col gap-3">
            <h3 className="text-body-sm text-white">{column.heading}</h3>
            <ul className="flex flex-col gap-2.5">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-body-sm font-light text-muted-foreground transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-border">
        <div className="text-caption mx-auto flex max-w-[1400px] flex-col gap-2 px-4 py-6 text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span>© {new Date().getFullYear()} Shirt Bazaar. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
