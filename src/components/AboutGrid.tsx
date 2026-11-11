import type { CSSProperties } from 'react'
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Gear, Code, Robot, Truck, type Icon } from '@/components/slab'
import { profile } from '@/data/profile'

/**
 * AboutGrid - the About view as a fixed viewport.
 *
 * One glass sheet, two columns: who you are on the left, the illustration
 * on the right. Sized to the panel, so nothing here scrolls.
 *
 * The left column is a ladder, not a paragraph block: one display statement,
 * one line of context, then the four things you do - each carrying the marks
 * of the tools it is built with. The tools are the proof, so they are the
 * visual. Swap the marks below for your own (any square SVG/PNG in public/).
 */

const SHOPIFY = { src: '/icons/shopify.svg', name: 'Shopify' }
const WORDPRESS = { src: '/icons/wordpress.svg', name: 'WordPress' }
const ELEMENTOR = { src: '/icons/elementor.svg', name: 'Elementor' }
const VERCEL = { src: '/icons/vercel.svg', name: 'Vercel' }
const GITHUB = { src: '/icons/ai/github.svg', name: 'GitHub' }
const N8N = { src: '/icons/n8n.svg', name: 'n8n' }
const ZAPIER = { src: '/icons/zapier.svg', name: 'Zapier' }
const GHL = { src: '/icons/gohighlevel.png', name: 'GoHighLevel' }
const SALESFORCE = { src: '/icons/salesforce.svg', name: 'Salesforce' }
const HUBSPOT = { src: '/icons/hubspot.svg', name: 'HubSpot' }
const CANVA = { src: '/icons/canva.svg', name: 'Canva' }
const OPENPHONE = { src: '/icons/openphone.svg', name: 'OpenPhone' }
const TWILIO = { src: '/icons/twilio.svg', name: 'Twilio' }
const AI = { src: '/icons/openai.svg', name: 'AI Tools' }

type Capability = {
  index: string
  title: string
  marks: { src: string; name: string }[]
}

const CAPABILITIES: Capability[] = [
  {
    index: '01',
    title: 'Ecommerce operations',
    marks: [SHOPIFY, GHL],
  },
  {
    index: '02',
    title: 'Web development',
    marks: [WORDPRESS, ELEMENTOR, VERCEL, GITHUB],
  },
  {
    index: '03',
    title: 'CRM and automation',
    marks: [SALESFORCE, HUBSPOT, N8N, ZAPIER],
  },
  {
    index: '04',
    title: 'Operations support',
    marks: [CANVA, OPENPHONE, TWILIO, AI],
  },
]

type DevelopmentItem = {
  index: string
  title: string
  description: string
  Icon: Icon
}

const DEVELOPMENT_ITEMS: DevelopmentItem[] = [
  {
    index: '01',
    title: 'CRM & Business Systems',
    description: 'Salesforce, GoHighLevel, and business process workflows.',
    Icon: Gear,
  },
  {
    index: '02',
    title: 'Web Development',
    description: 'React, HTML, CSS, JavaScript, GitHub, and Vercel.',
    Icon: Code,
  },
  {
    index: '03',
    title: 'AI & Automation',
    description: 'Exploring AI-assisted workflows, automation concepts, and business process improvement.',
    Icon: Robot,
  },
  {
    index: '04',
    title: 'Ecommerce & Operations',
    description: 'Shopify operations, inventory coordination, order management, and operational support.',
    Icon: Truck,
  },
]

export default function AboutGrid() {
  const { hash } = useLocation()

  useEffect(() => {
    if (hash === '#professional-development') {
      const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
      document.getElementById('credentials')?.scrollIntoView({ block: 'center', behavior })
    }
  }, [hash])

  return (
    <section className="pgrid agrid" aria-labelledby="about-title">
      <header className="pgrid__head agrid__head">
        <span className="pgrid__eyebrow">About</span>
        <h1 className="pgrid__title" id="about-title">
          {`Hi, I’m ${profile.firstName}.`}
        </h1>
        <p className="pgrid__lede">{profile.role}</p>
      </header>

      <div className="home__glass agrid__glass">
        <div className="agrid__copy">
          <p className="agrid__lead">
            {profile.hero.body}
          </p>

          <p className="agrid__note">
            I’m an Operations and Tech Virtual Assistant specializing in ecommerce
            operations, website development, CRM management, and business process
            automation. I combine hands-on operations experience with technology
            and automation to help businesses stay organized, improve workflows,
            and create better customer experiences. My work focuses on practical
            solutions that save time, reduce repetitive tasks, and make day-to-day
            business operations more efficient.
          </p>

          <ul className="agrid__caps" role="list">
            {CAPABILITIES.map((c) => (
              <li key={c.index} className="agrid__cap">
                <span className="agrid__cap-marks">
                  {c.marks.map((m, i) => (
                    <span
                      key={m.name}
                      className="agrid__mark"
                      style={{ '--i': c.marks.length - i } as CSSProperties}
                    >
                      <img src={m.src} alt={m.name} loading="lazy" decoding="async" />
                    </span>
                  ))}
                </span>
                <span className="agrid__cap-title">{c.title}</span>
                <span className="agrid__cap-index" aria-hidden="true">
                  {c.index}
                </span>
              </li>
            ))}
          </ul>

          {/* Professional Development */}
          <div className="agrid__dev">
            <span className="agrid__dev-eyebrow" id="professional-development">Professional Development</span>
            <h2 className="agrid__dev-title">Ongoing learning &amp; skill areas</h2>
            <ul className="agrid__dev-list" role="list">
              {DEVELOPMENT_ITEMS.map((d) => {
                const DevIcon = d.Icon
                return (
                  <li key={d.index} className="agrid__dev-item">
                    <span className="agrid__dev-index" aria-hidden="true">
                      {d.index}
                    </span>
                    <span className="agrid__dev-mark" aria-hidden="true">
                      <DevIcon size={20} weight="duotone" />
                    </span>
                    <span className="agrid__dev-body">
                      <span className="agrid__dev-title">{d.title}</span>
                      <span className="agrid__dev-desc">{d.description}</span>
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>

        <div className="agrid__portrait">
          <img
            src={profile.hero.portraitSrc}
            alt={profile.hero.portraitAlt}
            loading="eager"
            decoding="async"
            width={400}
            height={400}
          />
        </div>
      </div>
    </section>
  )
}
