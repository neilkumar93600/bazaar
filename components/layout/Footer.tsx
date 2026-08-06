"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { LogoIcon } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Stagger, StaggerItem } from "@/components/ui/motion";
import { NewsletterForm } from "@/components/layout/NewsletterForm";
import { SOCIAL_LINKS } from "@/components/layout/social-links";

interface FooterProps {
  className?: string;
}

export function Footer({ className = "" }: FooterProps) {
  return (
    <section className={`w-full ${className}`}>
      <div className="m-2 sm:m-4 rounded-[20px] overflow-hidden relative min-h-[720px] md:min-h-[100dvh] flex flex-col justify-between font-sans">
        {/* ponytail: shares the hero's bazaar shot until a dedicated footer
            render exists — swap this one src, nothing else changes. */}
        <Image
          src="/bazaar/hero.jpg"
          alt=""
          fill
          sizes="100vw"
          className="z-0 object-cover object-center"
        />
        {/* Scrim for accessibility & contrast — the headline over this is
            near-black, so the veil is light rather than dark. */}
        <div className="absolute inset-0 z-0 bg-pitch/70" />

        {/* Row 1 — Hero section */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center gap-8 px-4 sm:px-8 md:px-20 pt-16 md:pt-20 pb-10 text-center">
          {/* h2, not h1. This renders on every page beneath that page's own
              h1, and two top-level headings split the document outline. */}
          <motion.h2
            className="text-[36px] sm:text-[52px] md:text-[80px] font-[800] text-foreground leading-tight md:leading-none tracking-[-0.02em] max-w-4xl"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
          >
            Your vibe is out there. Claim it.
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          >
            <Button size="lg" render={<Link href="/signup" />}>
              Get started
            </Button>
          </motion.div>
        </div>

        {/* Row 2 — Frosted footer card */}
        <motion.div
          className="relative z-10 glass-panel border rounded-[24px] mx-3 sm:mx-5 mb-3 sm:mb-5 p-6 sm:p-8 md:p-10 shadow-2xl"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.2 }}
        >
          {/* Footer Row A */}
          <Stagger className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8 lg:gap-10">
            {/* Column 1 — Brand & SUBSCRIBE Section */}
            <StaggerItem className="sm:col-span-2 md:col-span-2 flex flex-col justify-between gap-5">
              <div>
                <Link href="/" className="inline-flex items-center gap-2.5 group">
                  <LogoIcon className="text-foreground w-7 h-7 transition-transform group-hover:scale-105" />
                  <span className="text-xl font-black tracking-tight text-foreground uppercase font-sans">
                    SHIRT BAZAAR
                  </span>
                </Link>
                <p className="mt-3 text-foreground/60 text-[13px] leading-relaxed max-w-[320px]">
                  One prompt becomes a 1-of-1 AI shirt design. Claim it and it
                  is yours alone — with a storefront of your own and 10% of
                  every resale.
                </p>
              </div>

              {/* SUBSCRIBE Section below Brand */}
              <NewsletterForm />
            </StaggerItem>

            {/* Column 2 — Explore */}
            <StaggerItem>
              <h4 className="text-foreground text-[13px] font-semibold mb-4 uppercase tracking-wider">
                Explore
              </h4>
              <ul className="space-y-2.5">
                {[
                  { label: "Design generator", href: "/dashboard/create" },
                  { label: "Style library", href: "/blog" },
                  { label: "Browse the bazaar", href: "/shop" },
                ].map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-foreground/60 text-[13px] hover:text-foreground transition-colors block"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </StaggerItem>

            {/* Column 3 — About Project */}
            <StaggerItem>
              <h4 className="text-foreground text-[13px] font-semibold mb-4 uppercase tracking-wider">
                About Project
              </h4>
              <ul className="space-y-2.5">
                {[
                  { label: "Our mission", href: "/about" },
                  { label: "Careers", href: "/careers" },
                ].map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-foreground/60 text-[13px] hover:text-foreground transition-colors block"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </StaggerItem>

            {/* Column 4 — Support */}
            <StaggerItem>
              <h4 className="text-foreground text-[13px] font-semibold mb-4 uppercase tracking-wider">
                Support
              </h4>
              <ul className="space-y-2.5">
                {[
                  { label: "Help centre", href: "/contact" },
                  { label: "Privacy policy", href: "/privacy" },
                  { label: "Terms of service", href: "/terms" },
                ].map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-foreground/60 text-[13px] hover:text-foreground transition-colors block"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </StaggerItem>
          </Stagger>

          {/* Footer Row B */}
          <div className="mt-8 pt-5 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
              {SOCIAL_LINKS.some((s) => s.href) && (
                <>
                  <span className="text-foreground/50 text-[12px]">
                    Our Story Continues:
                  </span>
                  <div className="flex items-center gap-3">
                    {SOCIAL_LINKS.filter((s) => s.href).map((social) => (
                      <a
                        key={social.label}
                        href={social.href!}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={social.label}
                        className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-accent hover:border-foreground transition-all"
                      >
                        {social.icon}
                      </a>
                    ))}
                  </div>
                </>
              )}
            </div>

            <span className="text-foreground/40 text-[12px]">
              © {new Date().getFullYear()} Shirt Bazaar, Inc. All rights reserved.
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default Footer;
