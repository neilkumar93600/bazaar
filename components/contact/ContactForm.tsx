"use client"

import { useActionState, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Send,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RotateCcw,
  ShoppingBag,
  Store,
  Shield,
  Scale,
  MessageSquare,
} from "lucide-react"

import { submitContactMessage, type ContactFormState, type ContactCategory } from "@/app/actions/contact"
import { cn } from "@/lib/utils"

const CATEGORIES: {
  id: ContactCategory
  label: string
  icon: typeof ShoppingBag
  placeholderRef?: string
  refLabel?: string
}[] = [
  {
    id: "orders",
    label: "Orders & Reprints",
    icon: ShoppingBag,
    refLabel: "Order Number",
    placeholderRef: "e.g. SB-ORD-98214",
  },
  {
    id: "claims",
    label: "Claims & Storefronts",
    icon: Store,
    refLabel: "Creator Handle or Design ID",
    placeholderRef: "e.g. @yourhandle or design uuid",
  },
  {
    id: "privacy",
    label: "Privacy & Data Request",
    icon: Shield,
    refLabel: "Registered Account Email",
    placeholderRef: "e.g. your@email.com",
  },
  {
    id: "legal",
    label: "Legal & DMCA",
    icon: Scale,
    refLabel: "Work URL or Reference",
    placeholderRef: "e.g. https://shirtbazaar.com/design/...",
  },
  {
    id: "general",
    label: "General Inquiry",
    icon: MessageSquare,
  },
]

const initialState: ContactFormState = {}

export function ContactForm() {
  const [state, formAction, isPending] = useActionState(submitContactMessage, initialState)
  const [selectedCategory, setSelectedCategory] = useState<ContactCategory>("orders")
  const [copiedTicket, setCopiedTicket] = useState(false)

  const activeCategoryConfig = CATEGORIES.find((c) => c.id === selectedCategory)

  const copyTicketId = (ticketId: string) => {
    navigator.clipboard.writeText(ticketId)
    setCopiedTicket(true)
    setTimeout(() => setCopiedTicket(false), 2000)
  }

  return (
    <div className="flex w-full flex-col font-sans">
      <AnimatePresence mode="wait">
        {state.success && state.ticketId ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex flex-col gap-6 rounded-[8px] border border-ink bg-cream p-8 text-ink shadow-[2px_2px_0_0_#262626]"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px] border border-ink bg-mint-wash text-ink">
                <CheckCircle2 className="h-5 w-5 text-ink" />
              </div>
              <div>
                <h3 className="text-subheading font-semibold text-ink">
                  Message Dispatched Successfully
                </h3>
                <p className="text-xs text-muted-ink">
                  Your inquiry has been routed to our direct team desk.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-[4px] border border-rule bg-paper-white p-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-muted-gray uppercase tracking-wider">
                  Ticket Reference
                </span>
                <button
                  type="button"
                  onClick={() => copyTicketId(state.ticketId!)}
                  className="inline-flex items-center gap-1 font-mono text-xs text-ink underline underline-offset-2 hover:opacity-80 cursor-pointer"
                >
                  {copiedTicket ? (
                    <>
                      <Check className="h-3 w-3" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy ID</span>
                    </>
                  )}
                </button>
              </div>
              <div className="font-mono text-lg font-bold text-ink">
                {state.ticketId}
              </div>
              <p className="text-xs text-muted-ink leading-relaxed">
                A confirmation email with this ticket receipt has been sent to your email. You can reply directly to that email if you have photos or additional files to attach.
              </p>
            </div>

            <div className="flex items-center justify-between border-t border-rule pt-4">
              <span className="font-mono text-xs text-muted-gray">
                SLA: Reply within 24 business hours
              </span>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-1.5 rounded-[4px] border border-ink bg-paper-white px-3.5 py-1.5 text-xs font-medium text-ink hover:bg-cream transition-colors cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Send Another</span>
              </button>
            </div>
          </motion.div>
        ) : (
          <form action={formAction} className="flex flex-col gap-6">
            {/* Category Selector Chips */}
            <div className="flex flex-col gap-2">
              <label className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-gray">
                01 / Select Inquiry Topic
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon
                  const isSelected = selectedCategory === cat.id
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-[4px] px-3.5 py-2 text-xs font-medium transition-all cursor-pointer",
                        isSelected
                          ? "border border-ink bg-lime-sprint text-ink font-semibold shadow-[2px_2px_0_0_#262626]"
                          : "border border-rule bg-paper-white text-muted-ink hover:border-ink hover:text-ink"
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{cat.label}</span>
                    </button>
                  )
                })}
              </div>
              <input type="hidden" name="category" value={selectedCategory} />
            </div>

            {/* User Details Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="name" className="text-xs font-medium text-ink">
                  Your Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Alex Mercer"
                  disabled={isPending}
                  className="rounded-[4px] border border-rule bg-paper-white px-3.5 py-2.5 text-xs text-ink placeholder:text-muted-gray outline-none transition-colors focus:border-ink disabled:opacity-60"
                />
                {state.fieldErrors?.name && (
                  <span className="font-mono text-[11px] text-red-600">
                    {state.fieldErrors.name}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-xs font-medium text-ink">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  required
                  placeholder="alex@example.com"
                  disabled={isPending}
                  className="rounded-[4px] border border-rule bg-paper-white px-3.5 py-2.5 text-xs text-ink placeholder:text-muted-gray outline-none transition-colors focus:border-ink disabled:opacity-60"
                />
                {state.fieldErrors?.email && (
                  <span className="font-mono text-[11px] text-red-600">
                    {state.fieldErrors.email}
                  </span>
                )}
              </div>
            </div>

            {/* Dynamic Reference Field (if applicable) */}
            {activeCategoryConfig?.refLabel && (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="reference" className="text-xs font-medium text-ink">
                    {activeCategoryConfig.refLabel}{" "}
                    <span className="text-muted-gray text-[11px] font-normal">(Optional)</span>
                  </label>
                  {selectedCategory === "orders" && (
                    <span className="font-mono text-[10px] text-muted-gray">
                      Fast-tracks reprint approvals
                    </span>
                  )}
                </div>
                <input
                  id="reference"
                  type="text"
                  name="reference"
                  placeholder={activeCategoryConfig.placeholderRef}
                  disabled={isPending}
                  className="rounded-[4px] border border-rule bg-paper-white px-3.5 py-2.5 text-xs text-ink placeholder:text-muted-gray outline-none transition-colors focus:border-ink disabled:opacity-60"
                />
              </div>
            )}

            {/* Subject */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="subject" className="text-xs font-medium text-ink">
                Subject <span className="text-red-500">*</span>
              </label>
              <input
                id="subject"
                type="text"
                name="subject"
                required
                placeholder="What is your inquiry about?"
                disabled={isPending}
                className="rounded-[4px] border border-rule bg-paper-white px-3.5 py-2.5 text-xs text-ink placeholder:text-muted-gray outline-none transition-colors focus:border-ink disabled:opacity-60"
              />
              {state.fieldErrors?.subject && (
                <span className="font-mono text-[11px] text-red-600">
                  {state.fieldErrors.subject}
                </span>
              )}
            </div>

            {/* Message */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="message" className="text-xs font-medium text-ink">
                Message Details <span className="text-red-500">*</span>
              </label>
              <textarea
                id="message"
                name="message"
                required
                rows={5}
                placeholder="Please describe your question or issue in detail..."
                disabled={isPending}
                className="rounded-[4px] border border-rule bg-paper-white p-3.5 text-xs text-ink placeholder:text-muted-gray outline-none transition-colors focus:border-ink disabled:opacity-60 resize-y leading-relaxed"
              />
              {state.fieldErrors?.message && (
                <span className="font-mono text-[11px] text-red-600">
                  {state.fieldErrors.message}
                </span>
              )}
            </div>

            {/* Error banner if general error */}
            {state.error && !state.fieldErrors && (
              <div className="flex items-center gap-2 rounded-[4px] border border-red-300 bg-red-50 p-3 text-xs text-red-800">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                <span>{state.error}</span>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex items-center justify-between border-t border-rule pt-4">
              <span className="font-mono text-[11px] text-muted-gray">
                Encrypted via TLS 1.3 & Delivered Directly
              </span>
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-[4px] border border-ink bg-lime-sprint px-6 py-2.5 text-xs font-medium font-sans text-ink shadow-[2px_2px_0_0_#262626] transition-all hover:brightness-105 active:translate-y-px active:shadow-none disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? (
                  <span>Dispatching Message...</span>
                ) : (
                  <>
                    <span>Send Message</span>
                    <Send className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </AnimatePresence>
    </div>
  )
}
