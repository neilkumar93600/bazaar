"use server";

import { after } from "next/server";
import { CONTACT_EMAILS, siteName, siteUrl } from "@/lib/site";
import { sendEmail } from "@/lib/email/send";
import { renderEmail } from "@/lib/email/layout";

export type ContactCategory =
  | "orders"
  | "claims"
  | "privacy"
  | "legal"
  | "general";

export type ContactFormState = {
  success?: boolean;
  ticketId?: string;
  error?: string;
  fieldErrors?: {
    name?: string;
    email?: string;
    category?: string;
    subject?: string;
    message?: string;
  };
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function submitContactMessage(
  _prevState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const category = (String(formData.get("category") ?? "general") as ContactCategory);
  const reference = String(formData.get("reference") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  // Validate inputs
  const fieldErrors: ContactFormState["fieldErrors"] = {};

  if (!name || name.length < 2) {
    fieldErrors.name = "Please enter your name.";
  }
  if (!email || !EMAIL_PATTERN.test(email)) {
    fieldErrors.email = "Please enter a valid email address.";
  }
  if (!subject || subject.length < 3) {
    fieldErrors.subject = "Please enter a descriptive subject.";
  }
  if (!message || message.length < 10) {
    fieldErrors.message = "Please provide more details (at least 10 characters).";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { error: "Please correct the errors in the form.", fieldErrors };
  }

  // Generate a random ticket reference ID
  const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const ticketId = `SB-${category.toUpperCase().slice(0, 3)}-${timestamp}${randomSuffix}`;

  // Determine routing inbox based on category
  let destinationEmail: string = CONTACT_EMAILS.support;
  if (category === "privacy") destinationEmail = CONTACT_EMAILS.privacy;
  if (category === "legal") destinationEmail = CONTACT_EMAILS.legal;

  // Dispatch email notifications asynchronously using Brainfish layout
  after(async () => {
    // 1. Send confirmation receipt to user
    const userMeta = [
      { label: "Ticket ID", value: ticketId, mono: true },
      { label: "Department", value: category.toUpperCase() },
      ...(reference ? [{ label: "Reference / Order #", value: reference, mono: true }] : []),
    ];

    const userReceiptHtml = renderEmail({
      preheader: `Ticket #${ticketId} — We received your inquiry regarding "${subject}"`,
      eyebrow: "Support Desk Receipt",
      heading: {
        before: "Inquiry",
        emphasis: "received.",
        after: "",
      },
      paragraphs: [
        `Hi ${name}, thank you for reaching out to ${siteName}. Your inquiry regarding "${subject}" has been dispatched to our ${category} team.`,
        `Message details:\n\n"${message}"`,
        "Our standard response turnaround is within 24 business hours. If you have photos, attachments, or additional details to provide, simply reply directly to this email.",
      ],
      meta: userMeta,
      cta: {
        label: "Visit Help & FAQ",
        href: `${siteUrl}/faq`,
      },
      footnote: "Keep this ticket receipt for your records.",
    });

    await sendEmail({
      to: email,
      subject: `[${ticketId}] Inquiry Received: ${subject}`,
      html: userReceiptHtml,
    });

    // 2. Dispatch internal ticket alert to target team inbox
    const teamNoticeHtml = renderEmail({
      preheader: `[${ticketId}] New Message from ${name} (${category})`,
      eyebrow: "Internal Ticket Dispatch",
      heading: {
        before: "New",
        emphasis: "ticket",
        after: `from ${name}`,
      },
      paragraphs: [
        `Sender: ${name} <${email}>`,
        `Subject: ${subject}`,
        `Message Content:\n\n${message}`,
      ],
      meta: [
        { label: "Ticket ID", value: ticketId, mono: true },
        { label: "User Email", value: email },
        { label: "Category", value: category },
        ...(reference ? [{ label: "Reference", value: reference, mono: true }] : []),
      ],
      cta: {
        label: `Reply to ${name}`,
        href: `mailto:${email}?subject=Re: [${ticketId}] ${encodeURIComponent(subject)}`,
      },
    });

    await sendEmail({
      to: destinationEmail,
      subject: `[${ticketId}] ${category.toUpperCase()}: ${subject} (from ${name})`,
      html: teamNoticeHtml,
    });
  });

  return {
    success: true,
    ticketId,
  };
}
