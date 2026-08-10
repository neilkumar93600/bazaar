/** Transactional email, via Resend's HTTP API — or a Gmail account, for now.
 *
 *  Resend needs a verified domain, which is a wait. Setting GMAIL_USER and
 *  GMAIL_APP_PASSWORD sends through Gmail's SMTP instead so receipts land
 *  today. It is a stopgap and reads like one: Gmail caps a normal account at a
 *  few hundred messages a day, rewrites the From header to the account's own
 *  address no matter what we ask for, and marks nothing as transactional. Set
 *  RESEND_API_KEY and drop the Gmail vars to go back.
 *
 *  Optional the same way Printify is — with neither configured the app runs
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

/** Gmail's SMTP, when a domain isn't verified yet.
 *
 *  Requires an App Password, not the account password: Google blocks plain
 *  password auth on SMTP outright, and an App Password needs 2-Step
 *  Verification switched on for the account first.
 *
 *  nodemailer is imported inside the branch so a deployment on Resend never
 *  loads it. Its `path` attachment takes a URL, which is the same contract
 *  Resend's does — so callers pass the artwork URL either way and the bytes
 *  still never pass through this process.
 */
async function sendViaGmail(
  input: EmailInput,
  user: string,
  pass: string,
): Promise<boolean> {
  const { createTransport } = await import("nodemailer")

  const transport = createTransport({
    service: "gmail",
    auth: { user, pass },
  })

  // Gmail overwrites a From it doesn't own, so the display name is the only
  // part of EMAIL_FROM worth asking for here.
  await transport.sendMail({
    from: `${siteName} <${user}>`,
    to: input.to,
    subject: input.subject,
    html: input.html,
    attachments: input.attachments,
  })

  return true
}

export async function sendEmail(input: EmailInput): Promise<boolean> {
  const gmailUser = envValue("GMAIL_USER")
  const gmailPassword = envValue("GMAIL_APP_PASSWORD")

  if (gmailUser && gmailPassword) {
    try {
      return await sendViaGmail(input, gmailUser, gmailPassword)
    } catch (error) {
      console.error("[email] Gmail send failed", error)
      return false
    }
  }

  const apiKey = envValue("RESEND_API_KEY")
  if (!apiKey) {
    console.warn(
      `[email] no RESEND_API_KEY or GMAIL_USER/GMAIL_APP_PASSWORD — not sending "${input.subject}"`,
    )
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
