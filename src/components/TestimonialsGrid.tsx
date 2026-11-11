import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck, Lightning, Sparkle, Rocket, Gear, FunnelSimple } from '@/components/slab'
import type { Icon } from '@/components/slab'

/**
 * WhyWorkWithMe - a four-feature value-prop section replacing Testimonials,
 * followed by a three-step working approach and a compact CTA.
 *
 * Balanced, compact feature list with phosphor icons and subtle hover motion.
 * No fake client names, testimonial placeholders, video placeholders, or dummy
 * review content.
 */

type Feature = {
  index: string
  title: string
  description: string
  Icon: Icon
}

type Step = {
  index: string
  title: string
  description: string
  Icon: Icon
}

const FEATURES: Feature[] = [
  {
    index: '01',
    title: 'Clear Communication',
    description: 'Timely updates, thoughtful follow-ups, and clear coordination.',
    Icon: ShieldCheck,
  },
  {
    index: '02',
    title: 'Attention to Detail',
    description: 'Careful handling of tasks, records, and operational details.',
    Icon: Lightning,
  },
  {
    index: '03',
    title: 'Adaptable Support',
    description: 'Flexible support aligned with business needs and priorities.',
    Icon: Sparkle,
  },
  {
    index: '04',
    title: 'Continuous Improvement',
    description: 'Finding practical ways to improve processes and workflows.',
    Icon: Rocket,
  },
]

const STEPS: Step[] = [
  {
    index: '01',
    title: 'Understand',
    description: 'Learn the business, priorities, and challenges.',
    Icon: Gear,
  },
  {
    index: '02',
    title: 'Organize',
    description: 'Structure tasks, systems, and workflows.',
    Icon: FunnelSimple,
  },
  {
    index: '03',
    title: 'Execute & Improve',
    description: 'Deliver support, track progress, and improve processes.',
    Icon: Rocket,
  },
]

export default function TestimonialsGrid() {
  const [hovered, setHovered] = useState<number | null>(null)

  return (
    <section className="pgrid tgrid" aria-labelledby="why-work-with-me-title">
      <header className="pgrid__head">
        <span className="pgrid__eyebrow">Why Work With Me?</span>
        <h1 className="pgrid__title" id="why-work-with-me-title">
          Reliable Support. Smarter Operations.
        </h1>
        <p className="pgrid__lede">
          A practical approach to helping businesses stay organized, efficient,
          and connected through dependable virtual assistance, technology, and
          process improvement.
        </p>
      </header>

      <div className="home__glass tgrid__glass">
        <ul className="tgrid__features" role="list">
          {FEATURES.map((f, i) => {
            const FeatureIcon = f.Icon
            const isActive = hovered === i
            return (
              <li
                key={f.index}
                className={`tgrid__feature${isActive ? ' is-active' : ''}`}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              >
                <span className="tgrid__feature-ghost" aria-hidden="true">
                  {f.index}
                </span>
                <span className="tgrid__feature-mark" aria-hidden="true">
                  <FeatureIcon size={24} weight="duotone" />
                </span>
                <span className="tgrid__feature-body">
                  <span className="tgrid__feature-title">{f.title}</span>
                  <span className="tgrid__feature-desc">{f.description}</span>
                </span>
              </li>
            )
          })}
        </ul>

        {/* My Working Approach */}
        <div className="tgrid__approach-head">
          <span className="tgrid__approach-eyebrow">My Working Approach</span>
          <h2 className="tgrid__approach-title">Three steps to smoother operations</h2>
        </div>
        <ul className="tgrid__steps" role="list">
          {STEPS.map((s) => {
            const StepIcon = s.Icon
            return (
              <li key={s.index} className="tgrid__step">
                <span className="tgrid__step-ghost" aria-hidden="true">
                  {s.index}
                </span>
                <span className="tgrid__step-mark" aria-hidden="true">
                  <StepIcon size={20} weight="duotone" />
                </span>
                <span className="tgrid__step-body">
                  <span className="tgrid__step-title">{s.title}</span>
                  <span className="tgrid__step-desc">{s.description}</span>
                </span>
              </li>
            )
          })}
        </ul>

        {/* CTA */}
        <div className="tgrid__cta">
          <p className="tgrid__cta-text">
            Have a project in mind? Let's discuss how I can support your business operations.
          </p>
          <Link to="/contact" className="tgrid__cta-button">
            Let's Talk
          </Link>
        </div>
      </div>
    </section>
  )
}
