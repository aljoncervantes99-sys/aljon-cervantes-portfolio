import type { CSSProperties } from 'react'

import {
  MagnetStraight,
  Timer,
  Trophy,
  CheckCircle,
  Truck,
} from '@/components/slab'

import type { Icon } from '@/components/slab'

import Autopilot, { TOOLS } from '@/components/Autopilot'

type Stage = {
  index: string
  label: string
  body: string
  Icon: Icon
  chips: string[]
}

const STAGES: Stage[] = [
  {
    index: '01',
    label: 'Understand',
    body: 'Review the current workflow, identify bottlenecks, and understand where time is being lost.',
    Icon: MagnetStraight,
    chips: ['Operations', 'Ecommerce', 'CRM'],
  },
  {
    index: '02',
    label: 'Build',
    body: 'Create the website, ecommerce system, CRM workflow, or digital solution the business needs.',
    Icon: Timer,
    chips: ['Shopify', 'WordPress', 'GoHighLevel'],
  },
  {
    index: '03',
    label: 'Automate',
    body: 'Connect the right tools to reduce repetitive work, improve follow-ups, and keep operations moving.',
    Icon: Trophy,
    chips: ['Zapier', 'n8n', 'AI Tools'],
  },
]

const GHL = '/icons/gohighlevel.png'
const SHOPIFY = '/icons/shopify.svg'
const WORDPRESS = '/icons/wordpress.svg'
const ELEMENTOR = '/icons/elementor.svg'
const VERCEL = '/icons/vercel.svg'
const GITHUB = '/icons/ai/github.svg'
const N8N = '/icons/n8n.svg'
const ZAPIER = '/icons/zapier.svg'
const OPENAI = '/icons/openai.svg'
const SALESFORCE = '/icons/salesforce.svg'
const HUBSPOT = '/icons/hubspot.svg'
const CANVA = '/icons/canva.svg'
const OPENPHONE = '/icons/openphone.svg'

type Service = {
  index: string
  title: string
  description: string
  chip: string
  logos: string[]
  Icon?: Icon
  bullets: string[]
}

const SERVICES: Service[] = [
  {
    index: '01',
    title: 'Ecommerce VA',
    description:
      'Reliable ecommerce support that keeps your online store organized, updated, and running smoothly.',
    chip: 'Ecommerce Operations',
    logos: [SHOPIFY, CANVA, HUBSPOT],
    bullets: [
      'Product listings and updates',
      'Inventory and order management',
      'Customer support and follow-ups',
    ],
  },
  {
    index: '02',
    title: 'Web Development',
    description:
      'Professional websites and landing pages designed to create a polished digital presence for your business.',
    chip: 'Web Solutions',
    logos: [WORDPRESS, ELEMENTOR, VERCEL],
    bullets: [
      'Business and portfolio websites',
      'Landing pages and digital experiences',
      'Website updates and maintenance',
    ],
  },
  {
    index: '03',
    title: 'Graphics Design',
    description:
      'Clean and engaging visual designs that help businesses communicate their brand clearly and professionally.',
    chip: 'Creative Design',
    logos: [CANVA],
    bullets: [
      'Social media graphics and marketing materials',
      'Brand visuals and promotional designs',
      'Presentation and digital content design',
    ],
  },
  {
    index: '04',
    title: 'Logistics & Supply Chain VA',
    description:
      'Reliable operational support to keep orders, suppliers, and inventory organized.',
    chip: 'LOGISTICS OPERATIONS',
    logos: [],
    Icon: Truck,
    bullets: [
      'Order processing and fulfillment coordination',
      'Supplier communication and follow-ups',
      'Inventory monitoring and updates',
      'Purchase order and shipment tracking',
      'Logistics documentation and data entry',
    ],
  },
]

function Marks({ logos, Icon: MarkIcon }: { logos: string[]; Icon?: Icon }) {
  return (
    <span className="bento__logos" aria-hidden="true">
      {MarkIcon && (
        <span className="bento__logo">
          <MarkIcon size={22} weight="duotone" />
        </span>
      )}
      {logos.map((src) => (
        <span key={src} className="bento__logo">
          <img src={src} alt="" width={22} height={22} decoding="async" />
        </span>
      ))}
    </span>
  )
}

export default function ServicesGrid() {
  return (
    <section className="pgrid sgrid" aria-labelledby="services-title">
      <header className="pgrid__head">
        <span className="pgrid__eyebrow">Services</span>

        <h1 className="pgrid__title" id="services-title">
           Digital Support That Moves Your Business Forward.
        </h1>

        <p className="pgrid__lede">
          From ecommerce operations and web development to creative design and
          logistics, I provide reliable support that helps businesses stay
          organized, productive, and growing.
        </p>
      </header>

      <div className="home__glass sgrid__glass">
        <div className="sgrid__method" aria-labelledby="method-title">
          <div className="sgrid__method-copy">
            <span className="sgrid__method-eyebrow">My Method</span>

            <h2 className="sgrid__method-title" id="method-title">
              Understand. Build. Automate.
              <br />
              <span>A practical approach to better workflows.</span>
            </h2>

            <p className="sgrid__method-sub">
              Every solution starts with understanding the process, building
              what the business needs, and automating repetitive work wherever
              possible.
            </p>
          </div>

          <ol className="sgrid__stages" role="list">
            {STAGES.map((s, i) => {
              const StageIcon = s.Icon

              return (
                <li
                  key={s.index}
                  className="sgrid__stage"
                  style={{ '--i': i } as CSSProperties}
                >
                  <span className="sgrid__stage-ghost" aria-hidden="true">
                    {s.index}
                  </span>

                  <span className="sgrid__stage-icon" aria-hidden="true">
                    <StageIcon size={22} weight="duotone" />
                  </span>

                  <h3 className="sgrid__stage-label">{s.label}.</h3>

                  <p className="sgrid__stage-body">{s.body}</p>

                  <ul
                    className="sgrid__stage-chips"
                    role="list"
                    aria-label={`${s.label} touches`}
                  >
                    {s.chips.map((c) => (
                      <li key={c} className="sgrid__stage-chip">
                        {c}
                      </li>
                    ))}
                  </ul>
                </li>
              )
            })}
          </ol>
        </div>

        <div className="sgrid__offers">
          <div className="sgrid__offers-head">
            <h2 className="sgrid__offers-title">How I can help.</h2>

            <p className="sgrid__offers-sub">
              Flexible support across ecommerce, technology, and operations.
            </p>
          </div>

          <ul className="bento sgrid__services" role="list">
            {SERVICES.map((s) => (
              <li key={s.title} className="bento__card sgrid__service">
                <span className="bento__head">
                  <span className="sgrid__service-top">
                    <Marks logos={s.logos} Icon={s.Icon} />

                    <span className="sgrid__service-index" aria-hidden="true">
                      {s.index} / 04
                    </span>
                  </span>

                  <span className="bento__title">{s.title}</span>

                  <span className="bento__desc">{s.description}</span>
                </span>

                <span className="sgrid__chip" aria-hidden="true">
                  {s.chip}
                </span>

                <ul className="sgrid__bullets" role="list">
                  {s.bullets.map((b) => (
                    <li key={b} className="sgrid__bullet">
                      <CheckCircle
                        size={15}
                        weight="duotone"
                        aria-hidden="true"
                      />

                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>

        <div className="sgrid__flow">
          <header className="sgrid__flow-head">
            <div className="sgrid__flow-copy">
              <span className="sgrid__flow-eyebrow">
                Live automation
              </span>

              <h2 className="sgrid__flow-title">
                Turn repetitive work into automated workflows.
              </h2>

              <p className="sgrid__flow-sub">
                Connect your tools, automate repetitive tasks, and create
                smoother workflows for your business.
              </p>
            </div>

            <ul
              className="sgrid__flow-tools"
              role="list"
              aria-label="Tools that power this flow"
            >
              {TOOLS.map(({ Icon: ToolIcon, label }) => (
                <li key={label} className="sgrid__flow-tool">
                  <ToolIcon size={14} weight="duotone" aria-hidden="true" />
                  <span>{label}</span>
                </li>
              ))}
            </ul>
          </header>

          <div className="sgrid__flow-main">
            <Autopilot compact maxScale={1.08} />
          </div>
        </div>
      </div>
    </section>
  )
}