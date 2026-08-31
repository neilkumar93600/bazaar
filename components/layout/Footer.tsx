"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { LogoIcon } from "@/components/ui/logo";
import { NewsletterForm } from "@/components/layout/NewsletterForm";
import { SOCIAL_LINKS } from "@/components/layout/social-links";

interface FooterProps {
  className?: string;
}

const NAV_COLUMNS = [
  {
    title: "Explore",
    links: [
      { label: "Design generator", href: "/create" },
      { label: "Browse the bazaar", href: "/shop" },
      { label: "Search", href: "/search" },
      { label: "Creator storefronts", href: "/creator" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Our mission", href: "/about" },
      { label: "Careers", href: "/careers" },
      { label: "FAQ", href: "/faq" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms of service", href: "/terms" },
      { label: "Privacy policy", href: "/privacy" },
      { label: "Commercial IP & DMCA", href: "/ip-policy" },
      { label: "Refund policy", href: "/refund-policy" },
      { label: "Cookie policy", href: "/cookies" },
    ],
  },
];

export function Footer({ className = "" }: FooterProps) {
  return (
    <footer className={`w-full ${className}`} aria-label="Site Footer">
      <div className="m-2 sm:m-4 rounded-[8px] overflow-hidden relative flex flex-col justify-between font-sans border border-rule bg-paper-white">
        {/* Subtle background image */}
        <Image
          src="/bazaar/footer.jpg"
          alt=""
          fill
          sizes="100vw"
          className="z-0 object-cover object-center opacity-10"
        />
        <div className="absolute inset-0 z-0 bg-paper-white/85" />

        {/* Hero CTA section */}
        <div className="relative z-10 flex flex-col items-center justify-center gap-6 px-6 py-20 sm:py-28 text-center">
          <motion.h2
            className="text-4xl sm:text-6xl md:text-7xl font-semibold text-ink leading-tight tracking-tight max-w-4xl"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            Your vibe is out there.{" "}
            <span className="font-serif italic font-normal text-ink">
              Claim it.
            </span>
          </motion.h2>

          <motion.p
            className="max-w-xl text-body text-muted-ink leading-relaxed"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          >
            One prompt becomes a 1-of-1 shirt design. Claim it and it is yours alone — with full commercial IP ownership and a storefront of your own.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
          >
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-[4px] border border-ink bg-lime-sprint px-6 py-3 text-sm font-medium text-ink shadow-[2px_2px_0_0_#262626] transition-all hover:brightness-105 active:translate-y-px active:shadow-none"
            >
              <span>Get started</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>

        {/* Main Footer Links & Newsletter */}
        <div className="relative z-10 border-t border-rule bg-cream p-6 sm:p-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-12 pb-10 border-b border-rule">
            {/* Brand column with Newsletter & Social Media below */}
            <div className="md:col-span-5 flex flex-col gap-4">
              <Link href="/" className="inline-flex items-center gap-2.5 group">
                <LogoIcon className="text-ink w-7 h-7 transition-transform group-hover:scale-105" />
                <span className="text-lg font-bold tracking-tight text-ink uppercase font-sans">
                  SHIRT BAZAAR
                </span>
              </Link>
              <p className="text-muted-ink text-xs sm:text-sm leading-relaxed max-w-sm">
                1-of-1 AI generative apparel with 100% commercial IP rights and automated creator storefronts.
              </p>
              
              {/* Newsletter Subscription Form */}
              <div className="pt-2 max-w-sm">
                <NewsletterForm />
              </div>

              {/* Social Media Icons below Newsletter Section */}
              <div className="flex items-center gap-2.5 pt-1">
                {SOCIAL_LINKS.filter((s) => s.href).map((social) => (
                  <a
                    key={social.label}
                    href={social.href!}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    title={social.label}
                    className="flex h-8 w-8 items-center justify-center rounded-[4px] border border-rule bg-paper-white text-muted-ink hover:border-ink hover:text-ink hover:shadow-[2px_2px_0_0_#262626] transition-all"
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Navigation links */}
            <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-8">
              {NAV_COLUMNS.map((column) => (
                <div key={column.title} className="flex flex-col gap-3">
                  <h4 className="text-ink text-xs font-semibold uppercase tracking-wider font-mono">
                    {column.title}
                  </h4>
                  <ul className="space-y-2">
                    {column.links.map((link) => (
                      <li key={link.label}>
                        <Link
                          href={link.href}
                          className="text-muted-ink text-xs hover:text-ink hover:underline underline-offset-4 transition-colors block leading-relaxed"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom copyright & quick links */}
          <div className="pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left text-xs text-muted-gray">
            <span>
              © {new Date().getFullYear()} Shirt Bazaar, Inc. All rights reserved.
            </span>

            <div className="flex items-center gap-4 font-mono text-[11px]">
              <Link href="/terms" className="hover:text-ink underline underline-offset-2">
                Terms
              </Link>
              <Link href="/privacy" className="hover:text-ink underline underline-offset-2">
                Privacy
              </Link>
              <Link href="/ip-policy" className="hover:text-ink underline underline-offset-2">
                IP Policy
              </Link>
              <Link href="/refund-policy" className="hover:text-ink underline underline-offset-2">
                Refunds
              </Link>
              <Link href="/cookies" className="hover:text-ink underline underline-offset-2">
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
