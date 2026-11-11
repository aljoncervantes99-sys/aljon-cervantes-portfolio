/**
 * Contact submission.
 *
 * A submission is accepted only when a configured backend returns success.
 *
 * To wire a real backend (Formspree, a serverless function, a webhook...):
 *   1. Set VITE_CONTACT_ENDPOINT in .env.production to the URL that accepts
 *      a JSON POST of the Lead type below.
 *   2. Have it answer 2xx on success, or a non-2xx with { "error": "..." }
 *      and that sentence is shown to the visitor as-is.
 */

export const ENDPOINT: string = import.meta.env.VITE_CONTACT_ENDPOINT ?? ''

export const MAX_NAME = 80
export const MAX_COMPANY_NAME = 120
export const MAX_EMAIL = 254
export const MAX_MESSAGE = 5000

// Built from \u escapes so the source stays pure ASCII.
// Control chars U+0000-U+001F and U+007F; when newlines are allowed, tab,
// LF and CR survive. Zero-width and bidi marks always go.
// eslint-disable-next-line no-control-regex -- Strip untrusted control characters from submitted text.
const CTRL_NO_NL = new RegExp('[\\u0000-\\u001F\\u007F]', 'g')
// eslint-disable-next-line no-control-regex -- Preserve only tab and line breaks in multiline text.
const CTRL_KEEP_NL = new RegExp('[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\u007F]', 'g')
const ZERO_WIDTH = new RegExp('[\\u200B-\\u200F\\u202A-\\u202E\\u2060\\uFEFF]', 'g')

export function sanitize(input: string, allowNewlines = false): string {
  const controls = allowNewlines ? CTRL_KEEP_NL : CTRL_NO_NL
  return input.replace(controls, '').replace(ZERO_WIDTH, '')
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type Lead = {
  firstName: string
  lastName: string
  email: string
  companyName: string
  service: string
  message: string
  /** Honeypot. Empty for a person; your backend should drop anything else. */
  website: string
}

export type SubmitResult = { via: 'webhook' }

/** Read, trim, cap and sanitise the fields. Returns null if a required field
 *  is missing or the email does not look like one. */
export function readLead(data: FormData): Lead | null {
  const firstName = sanitize(String(data.get('firstName') ?? '').trim()).slice(0, MAX_NAME)
  const lastName = sanitize(String(data.get('lastName') ?? '').trim()).slice(0, MAX_NAME)
  const email = sanitize(String(data.get('email') ?? '').trim()).slice(0, MAX_EMAIL)
  const companyName = sanitize(String(data.get('companyName') ?? '').trim()).slice(0, MAX_COMPANY_NAME)
  const service = sanitize(String(data.get('service') ?? '').trim()).slice(0, MAX_NAME)
  const message = sanitize(String(data.get('message') ?? '').trim(), true).slice(0, MAX_MESSAGE)
  if (!firstName || !lastName || !email || !service || !message || !EMAIL_RE.test(email)) return null
  const website = String(data.get('website') ?? '')
  return { firstName, lastName, email, companyName, service, message, website }
}

export class SubmitError extends Error {}

export async function submitLead(lead: Lead): Promise<SubmitResult> {
  if (!ENDPOINT) {
    throw new SubmitError('The contact form is not connected yet. Please email me directly instead.')
  }

  const formData = new URLSearchParams()
  formData.set('name', `${lead.firstName} ${lead.lastName}`.trim())
  formData.set('email', lead.email)
  formData.set('service', lead.service)
  formData.set('message', lead.message)
  if (lead.companyName) formData.set('company', lead.companyName)
  // Honeypot field — Formspree will ignore empty values; a filled honeypot
  // indicates a bot submission and should be dropped by the backend.
  formData.set('website', lead.website)

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
    },
    body: formData,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new SubmitError(body?.error || `The server answered ${res.status}.`)
  }
  return { via: 'webhook' }
}
