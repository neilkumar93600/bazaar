import type { Metadata } from "next"
import Link from "next/link"
import { Mail, HelpCircle, ArrowRight, ShieldCheck, Clock, Building } from "lucide-react"

import { CONTACT_EMAILS } from "@/lib/site"
import { ContactForm } from "@/components/contact/ContactForm"

export const metadata: Metadata = {
  title: "Contact | Shirt Bazaar",
  description:
    "Direct contact form and departmental routing inboxes for orders, physical reprints, 1-of-1 claims, privacy data requests, and legal counsel on Shirt Bazaar.",
  alternates: { canonical: "/contact" },
}

const INBOXES = [
  {
    title: "Orders & Reprints",
    email: CONTACT_EMAILS.support,
    description: "Damaged items, misprints, delivery tracking, and returns.",
    badge: "14-Day Guarantee",
  },
  {
    title: "Claims & Storefronts",
    email: CONTACT_EMAILS.support,
    description: "1-of-1 genesis claim questions, creator stores, and royalties.",
    badge: "Creator Desk",
  },
  {
    title: "Privacy & Data (DSR)",
    email: CONTACT_EMAILS.privacy,
    description: "GDPR/CCPA access, data export, and deletion requests.",
    badge: "Privacy Desk",
  },
  {
    title: "Legal & DMCA Notices",
    email: CONTACT_EMAILS.legal,
    description: "Copyright takedowns (17 U.S.C. § 512) and licensing inquiries.",
    badge: "Compliance",
  },
]

export default function ContactPage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-16 px-6 py-16 sm:py-24 md:px-10 font-sans text-ink">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-rule pb-10">
        <div className="inline-flex items-center gap-2 text-xs font-mono tracking-wider uppercase text-muted-gray">
          <span>Get in Touch</span>
          <span>/</span>
          <span>Support & Inquiries</span>
        </div>
        <h1 className="text-display font-semibold tracking-tight text-ink sm:text-6xl">
          Direct lines to{" "}
          <span className="font-serif italic font-normal text-ink">
            the team.
          </span>
        </h1>
        <p className="max-w-3xl text-body text-muted-ink leading-relaxed">
          Send a message via the interactive form below for automated ticket generation, or write directly to our specialized department inboxes.
        </p>
      </div>

      {/* Main Grid: Contact Form (Left) & Department Channels (Right) */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_380px] xl:gap-14">
        {/* Left Column: Interactive Contact Form inside Cream Card */}
        <div className="flex flex-col gap-6 rounded-[8px] border border-rule bg-cream p-6 sm:p-10 transition-all hover:border-ink hover:shadow-[2px_2px_0_0_#262626]">
          <div className="flex flex-col gap-1 border-b border-rule pb-5">
            <h2 className="text-subheading font-semibold text-ink">
              Send an Inquiry
            </h2>
            <p className="text-xs text-muted-ink">
              Fill out the form below and we will dispatch a confirmation receipt directly to your inbox.
            </p>
          </div>

          <ContactForm />
        </div>

        {/* Right Column: Direct Department Inboxes & Trust Cards */}
        <div className="flex flex-col gap-6">
          {/* Department Inboxes */}
          <div className="flex flex-col gap-4 rounded-[8px] border border-rule bg-cream p-6">
            <div className="flex items-center justify-between border-b border-rule pb-3">
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-gray">
                Direct Inboxes
              </span>
              <span className="font-mono text-[10px] text-muted-gray">
                Mon–Fri
              </span>
            </div>

            <div className="flex flex-col gap-4 pt-1">
              {INBOXES.map((inbox) => (
                <div key={inbox.title} className="flex flex-col gap-1.5 border-b border-rule pb-3.5 last:border-b-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-ink">
                      {inbox.title}
                    </h3>
                    <span className="rounded-full border border-rule bg-paper-white px-2 py-0.5 font-mono text-[9px] text-muted-gray">
                      {inbox.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-ink">
                    {inbox.description}
                  </p>
                  <a
                    href={`mailto:${inbox.email}`}
                    className="inline-flex items-center gap-1.5 font-mono text-xs font-medium text-ink underline underline-offset-2 hover:opacity-80 pt-1"
                  >
                    <Mail className="h-3 w-3" />
                    <span>{inbox.email}</span>
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* 14-Day Guarantee Card */}
          <div className="flex flex-col gap-2 rounded-[8px] border border-rule bg-paper-white p-5 transition-all hover:border-ink hover:shadow-[2px_2px_0_0_#262626]">
            <div className="flex items-center gap-2 text-xs font-semibold text-ink">
              <ShieldCheck className="h-4 w-4" />
              <span>14-Day Free Reprint Guarantee</span>
            </div>
            <p className="text-xs text-muted-ink leading-relaxed">
              If your garment arrives damaged, defective, or misprinted, attach photos when replying to your ticket email and we will rush a free reprint immediately.
            </p>
          </div>

          {/* Quick FAQ Helper Box */}
          <div className="flex flex-col gap-3 rounded-[8px] border border-ink bg-paper-white p-5 shadow-[2px_2px_0_0_#262626]">
            <div className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-ink" />
              <h3 className="text-xs font-semibold text-ink">
                Instant Answers in FAQ
              </h3>
            </div>
            <p className="text-xs text-muted-ink leading-relaxed">
              Find immediate details about AI generations, 100% commercial IP rights, and custom storefront dropshipping.
            </p>
            <Link
              href="/faq"
              className="inline-flex items-center justify-between rounded-[4px] border border-ink bg-lime-sprint px-3.5 py-2 text-xs font-medium text-ink transition-all hover:brightness-105"
            >
              <span>Explore FAQ</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {/* Registered Corporate Details */}
          <div className="flex items-start gap-2.5 rounded-[8px] border border-rule bg-cream p-4 text-[11px] text-muted-gray font-mono">
            <Building className="h-4 w-4 shrink-0 mt-0.5 text-ink" />
            <div>
              <p className="font-semibold text-ink">Shirt Bazaar, Inc.</p>
              <p>1209 Orange Street, Wilmington, DE 19801, USA</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
