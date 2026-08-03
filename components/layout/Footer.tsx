"use client";

import React, { type ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { LogoIcon } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Stagger, StaggerItem } from "@/components/ui/motion";
import { NewsletterForm } from "@/components/layout/NewsletterForm";

// Fill in a real profile URL to have that icon appear in the footer — icons
// for unset platforms stay hidden rather than linking to "#".
const SOCIAL_LINKS: { label: string; href: string | null; icon: ReactNode }[] = [
  {
    label: "TikTok",
    href: null,
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" className="fill-current text-foreground">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.77 0 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.31 6.31 0 00-.79-.05 6.34 6.34 0 000 12.68 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z" />
      </svg>
    ),
  },
  {
    label: "Facebook",
    href: null,
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" className="fill-current text-foreground">
        <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
      </svg>
    ),
  },
  {
    label: "X",
    href: null,
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" className="fill-current text-foreground">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    label: "YouTube",
    href: null,
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" className="fill-current text-foreground">
        <path d="M23 7s-.3-1.9-1.2-2.7c-1.1-1.2-2.4-1.2-3-1.3C16.2 3 12 3 12 3s-4.2 0-6.8.2c-.6.1-1.9.1-3 1.3C1.3 5.1 1 7 1 7S.7 9.1.7 11.2v2c0 2.1.3 4.2.3 4.2s.3 1.9 1.2 2.7c1.1 1.2 2.6 1.1 3.3 1.2C7.5 21.5 12 21.5 12 21.5s4.2 0 6.8-.3c.6-.1 1.9-.1 3-1.3.9-.8 1.2-2.7 1.2-2.7s.3-2.1.3-4.2v-2C23.3 9.1 23 7 23 7zM9.7 15.5V8.4l8 3.6-8 3.5z" />
      </svg>
    ),
  },
  {
    label: "Instagram",
    href: null,
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="stroke-current text-foreground" strokeWidth="2">
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="17.5" cy="6.5" r="1" className="fill-current stroke-none" />
      </svg>
    ),
  },
];

interface FooterProps {
  className?: string;
}

export function Footer({ className = "" }: FooterProps) {
  return (
    <section className={`w-full ${className}`}>
      <div className="m-2 sm:m-4 rounded-[20px] overflow-hidden relative min-h-[800px] md:h-screen md:min-h-[800px] flex flex-col justify-between font-sans">
        {/* Background layer with global CSS class (NO INLINE STYLES) */}
        <div className="absolute inset-0 z-0 bg-cover bg-center bg-footer-train" />
        {/* Subtle dark overlay for accessibility & contrast */}
        <div className="absolute inset-0 z-0 bg-pitch/75" />

        {/* Row 1 — Hero section */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center gap-8 px-4 sm:px-8 md:px-20 pt-16 md:pt-20 pb-10 text-center">
          <motion.h1
            className="text-[36px] sm:text-[52px] md:text-[80px] font-[800] text-foreground leading-tight md:leading-none tracking-[-0.02em] max-w-4xl"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
          >
            Your vibe is out there. Claim it.
          </motion.h1>
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
                  <LogoIcon className="text-ember-orange w-7 h-7 transition-transform group-hover:scale-105" />
                  <span className="text-xl font-black tracking-tight text-foreground uppercase font-sans">
                    SHIRT BAZAAR
                  </span>
                </Link>
                <p className="mt-3 text-foreground/60 text-[13px] leading-relaxed max-w-[320px]">
                  Shirt Bazaar empowers creators with state-of-the-art AI image
                  generation tools to bring any vision to life instantly.
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
                  { label: "AI Generator", href: "/search" },
                  { label: "Style Library", href: "/blog" },
                  { label: "Community Gallery", href: "/" },
                ].map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-foreground/60 text-[13px] hover:text-ember-orange transition-colors block"
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
                  { label: "Our Mission", href: "/about" },
                  { label: "Careers", href: "/careers" },
                ].map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-foreground/60 text-[13px] hover:text-ember-orange transition-colors block"
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
                  { label: "Help Center", href: "/contact" },
                  { label: "Privacy Policy", href: "/privacy" },
                  { label: "Terms of Service", href: "/terms" },
                ].map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-foreground/60 text-[13px] hover:text-ember-orange transition-colors block"
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
                        className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-ember-orange/20 hover:border-ember-orange transition-all"
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
