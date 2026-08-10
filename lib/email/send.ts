/** Transactional email, via Resend's HTTP API.
 *
 *  No SDK: one POST with a JSON body is the whole integration, and Resend is
 *  the only sender this app has.
 *
 *  Optional the same way Printify is — with no RESEND_API_KEY the app runs
 *  exactly as before and a purchase just doesn't email anything. It logs
 *  loudly instead of throwing: every caller is downstream of money that has
 *  already moved, and a failed receipt must never fail a paid claim.
 */

import { CONTACT_EMAILS, envValue, siteName } from "@/lib/site"

export type EmailAttachment = {
  filename: string
  /** A publicly reachable URL. Resend fetches the bytes itself, which keeps
   *  multi-megabyte artwork out of this process's memory. */
  path: string
}

export type EmailInput = {
  to: string
  subject: string
  html: string
  attachments?: EmailAttachment[]
}

export async function sendEmail(input: EmailInput): Promise<boolean> {
  const apiKey = envValue("RESEND_API_KEY")
  if (!apiKey) {
    console.warn(`[email] RESEND_API_KEY unset — not sending "${input.subject}"`)
    return false
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: envValue("EMAIL_FROM") ?? `${siteName} <${CONTACT_EMAILS.support}>`,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        attachments: input.attachments,
      }),
    })

    if (!response.ok) {
      console.error(`[email] Resend ${response.status}: ${await response.text()}`)
      return false
    }
    return true
  } catch (error) {
    console.error("[email] send failed", error)
    return false
  }
}
