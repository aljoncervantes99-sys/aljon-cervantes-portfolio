import { useRef, useState, type FormEvent } from 'react'
import { PaperPlaneTilt, CheckCircle, WarningCircle, EnvelopeSimple, ArrowUpRight, CaretDown, FilePdf, type Icon } from '@/components/slab'
import { FAQS } from '@/data/faqs'
import { profile } from '@/data/profile'
import { readLead, submitLead, SubmitError, MAX_NAME, MAX_COMPANY_NAME, MAX_EMAIL, MAX_MESSAGE } from '@/lib/contact'

/**
 * ContactGrid - the Contact view as a fixed viewport.
 *
 * One glass sheet, two columns: the questions people ask before they write
 * on the left, on a dark plate (one open at a time, the list scrolls), and
 * the form itself on the right. Sized to the panel, so
 * nothing here scrolls; the message box takes whatever height is left.
 *
 * Submission goes through lib/contact.ts. A success state is shown only when
 * the configured backend accepts the submission.
 */

type Status = { kind: 'idle' } | { kind: 'sending' } | { kind: 'error'; note: string } | { kind: 'sent' }

const CONTACT_LINKS: {
  label: string
  href: string
  title: string
  iconPath?: string
  Icon?: Icon
  brand?: string
}[] = [
  ...profile.socials.map((social) => ({
    label: social.label,
    href: social.href,
    title: social.label,
    iconPath: social.iconPath,
  })),
  {
    label: 'Upwork profile',
    href: profile.upworkProfileUrl,
    title: profile.upworkProfileUrl ? 'Visit Upwork profile' : 'Set the Upwork URL in src/data/profile.ts',
    iconPath: '/icons/upwork.svg',
    brand: 'upwork',
  },
  {
    label: 'Resume PDF',
    href: '/Aljon_Cervantes_Resume.pdf',
    title: 'Open resume PDF in a new tab',
    Icon: FilePdf,
  },
]

export default function ContactGrid() {
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const submitting = useRef(false)
  // Bumped on every failed submit so the shake replays even if the same
  // error is already showing.
  const [shake, setShake] = useState(0)
  // One question open at a time so the plate never grows past the form.
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (submitting.current) return

    const form = e.currentTarget
    if (!form.reportValidity()) return

    const lead = readLead(new FormData(form))
    if (!lead) {
      setStatus({ kind: 'error', note: 'Please complete the required fields with a valid email address.' })
      setShake((n) => n + 1)
      return
    }

    submitting.current = true
    setStatus({ kind: 'sending' })
    try {
      await submitLead(lead)
      setStatus({ kind: 'sent' })
    } catch (err) {
      submitting.current = false
      const note = err instanceof SubmitError ? err.message : 'Your inquiry could not be submitted. Please email me directly.'
      setStatus({ kind: 'error', note })
      setShake((n) => n + 1)
    }
  }

  const busy = status.kind === 'sending'

  return (
    <section className="pgrid cgrid" aria-labelledby="contact-title">
      <header className="pgrid__head">
        <span className="pgrid__eyebrow">FAQs / Contact</span>
        <h1 className="pgrid__title" id="contact-title">
          Let&apos;s Work Together
        </h1>
        <p className="pgrid__lede">
          Have a project in mind? Tell me what you need, and let&apos;s discuss how I can help.
        </p>
      </header>

      <div className="home__glass cgrid__glass">
        {/* Left: the dark plate. What happens after you press send. */}
        <aside className="cgrid__aside" aria-labelledby="contact-faq">
          <div className="cgrid__aside-head">
            <span className="cgrid__eyebrow">FAQs</span>
            <h2 className="cgrid__aside-title" id="contact-faq">
              Quick answers.
              <br />
              <span>Let&apos;s make working together simple.</span>
            </h2>
          </div>

          <ul className="cgrid__faqs" role="list">
            {FAQS.map((f, i) => {
              const isOpen = openFaq === i
              return (
                <li key={f.q} className={`cgrid__faq${isOpen ? ' is-open' : ''}`}>
                  <button
                    type="button"
                    className="cgrid__faq-q"
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    aria-controls={`cfaq-${i}`}
                  >
                    <span className="cgrid__step-index" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                    <span className="cgrid__faq-text">{f.q}</span>
                    <CaretDown size={14} weight="bold" className="cgrid__faq-caret" aria-hidden="true" />
                  </button>
                  <div className="cgrid__faq-a" id={`cfaq-${i}`} hidden={!isOpen}>
                    <p>{f.a}</p>
                  </div>
                </li>
              )
            })}
          </ul>

          <div className="cgrid__direct">
            <a className="cgrid__mail" href={`mailto:${profile.email}`}>
              <EnvelopeSimple size={16} weight="fill" aria-hidden="true" />
              <span>{profile.email}</span>
            </a>
            <ul className="cgrid__socials" role="list">
              {CONTACT_LINKS.map(({ label, href, title, iconPath, Icon, brand }) => (
                <li key={label}>
                  {href ? (
                    <a
                      className={`cgrid__social${brand ? ` cgrid__social--${brand}` : ''}`}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      title={title}
                    >
                      {Icon ? (
                        <Icon size={18} aria-hidden="true" />
                      ) : iconPath ? (
                        <img src={iconPath} alt="" loading="lazy" decoding="async" />
                      ) : null}
                    </a>
                  ) : (
                    <button
                      className={`cgrid__social cgrid__social--disabled${brand ? ` cgrid__social--${brand}` : ''}`}
                      type="button"
                      disabled
                      aria-label={label}
                      title={title}
                    >
                      {iconPath && <img src={iconPath} alt="" loading="lazy" decoding="async" />}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Right: the form. */}
        <div className="cgrid__panel">
          {status.kind === 'sent' ? (
            <div className="cgrid__done" role="status">
              <span className="cgrid__done-mark" aria-hidden="true">
                <CheckCircle size={30} weight="fill" />
              </span>
              <h2 className="cgrid__done-title">
                Your inquiry was submitted.
              </h2>
              <p className="cgrid__done-body">
                Thank you for getting in touch. Your message was accepted by the contact form.
              </p>
              <button
                type="button"
                className="cgrid__again"
                onClick={() => {
                  submitting.current = false
                  setStatus({ kind: 'idle' })
                }}
              >
                Write another
              </button>
            </div>
          ) : (
            <form className={`cgrid__form${busy ? ' is-sending' : ''}`} onSubmit={onSubmit} aria-busy={busy}>
              <header className="cgrid__form-head">
                <h2 className="cgrid__form-title">Let&apos;s Work Together</h2>
                <p className="cgrid__form-description">
                  Have a project in mind? Tell me what you need, and let&apos;s discuss how I can help.
                </p>
                <p className="cgrid__required-note"><span aria-hidden="true">*</span> Required fields</p>
              </header>
              {/* Honeypot. Hidden from people and assistive tech; a script that
                  fills every field trips it and the backend can drop the
                  post. autoComplete off so a browser never fills it either. */}
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="cgrid__trap"
              />
              <div className="cgrid__row">
                <label className="cgrid__field">
                  <span className="cgrid__label">First Name <span aria-hidden="true">*</span><span className="sr-only"> (required)</span></span>
                  <input type="text" name="firstName" autoComplete="given-name" required maxLength={MAX_NAME} placeholder="First name" />
                </label>
                <label className="cgrid__field">
                  <span className="cgrid__label">Last Name <span aria-hidden="true">*</span><span className="sr-only"> (required)</span></span>
                  <input type="text" name="lastName" autoComplete="family-name" required maxLength={MAX_NAME} placeholder="Last name" />
                </label>
              </div>

              <div className="cgrid__row">
                <label className="cgrid__field">
                  <span className="cgrid__label">Email Address <span aria-hidden="true">*</span><span className="sr-only"> (required)</span></span>
                  <input type="email" name="email" autoComplete="email" required maxLength={MAX_EMAIL} placeholder="you@yourbusiness.com" />
                </label>
                <label className="cgrid__field">
                  <span className="cgrid__label">Company or Business Name</span>
                  <input type="text" name="companyName" autoComplete="organization" maxLength={MAX_COMPANY_NAME} placeholder="Your business (optional)" />
                </label>
              </div>

              <label className="cgrid__field">
                <span className="cgrid__label">Service Interested In <span aria-hidden="true">*</span><span className="sr-only"> (required)</span></span>
                <select name="service" required defaultValue="">
                  <option value="" disabled>Select a service</option>
                  <option>Ecommerce VA</option>
                  <option>Shopify Store Management</option>
                  <option>Web Development</option>
                  <option>Graphics Design</option>
                  <option>Logistics &amp; Supply Chain VA</option>
                  <option>Other</option>
                </select>
              </label>
              <label className="cgrid__field cgrid__field--grow">
                <span className="cgrid__label">Project Details <span aria-hidden="true">*</span><span className="sr-only"> (required)</span></span>
                <textarea
                  name="message"
                  required
                  maxLength={MAX_MESSAGE}
                  placeholder="Share your project requirements and how I can help."
                />
              </label>

              <div className="cgrid__actions">
                <button
                  key={shake}
                  type="submit"
                  className={`cgrid__submit${busy ? ' is-sending' : ''}${status.kind === 'error' ? ' is-shaking' : ''}`}
                  disabled={busy}
                >
                  <span className="cgrid__submit-plane" aria-hidden="true">
                    <PaperPlaneTilt size={17} weight="fill" />
                  </span>
                  <span className="cgrid__submit-label">{busy ? 'Sending' : 'Send message'}</span>
                  <ArrowUpRight className="cgrid__submit-arrow" size={15} weight="bold" aria-hidden="true" />
                </button>
                {status.kind === 'error' ? (
                  <span className="cgrid__status" role="alert">
                    <WarningCircle size={16} weight="fill" aria-hidden="true" />
                    <span>{status.note}</span>
                    <a href={`mailto:${profile.email}`}>Email directly</a>
                  </span>
                ) : (
                  <span className="cgrid__hint">Please share only details relevant to your inquiry; avoid sensitive personal information.</span>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
