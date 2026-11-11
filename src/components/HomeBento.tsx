import type React from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  FolderOpen,
  User,
  Robot,
  Stack,
  FileText,
  FunnelSimple,
  Gear,
  AddressBook,
  Truck,
} from '@/components/slab'
import { profile } from '@/data/profile'

/**
 * Home's six-card overview shared across desktop, tablet, and phone. Each
 * card is a semantic link to an existing
 * portfolio view; previews use real project and service content.
 *
 * Motion is transform-only on clipped inner tracks; cards retain the height
 * needed for their previews and descriptions.
 */

const PROJECT_SHOTS = [
  '/projects/ecommerce/ecommerce-showcase.png',
  '/projects/pearl-white.png',
]

const OFFERS = [
  { Icon: FunnelSimple, title: 'Ecommerce VA', note: 'Store operations' },
  { Icon: Gear, title: 'Web Development', note: 'Websites and landing pages' },
  { Icon: AddressBook, title: 'Graphics Design', note: 'Brand and marketing visuals' },
  { Icon: Truck, title: 'Logistics & Supply Chain VA', note: 'Order and inventory operations' },
] as const

const WEB_BUILDS = [
  'Pearl White website',
  'GoHighLevel CRM',
  'Booking automation',
  'Shopify operations',
]

const PHOTOS = [profile.avatarSrc, profile.avatarSrc, profile.avatarSrc]

function CardHead({
  Icon,
  title,
  desc,
}: {
  Icon: typeof FolderOpen
  title: string
  desc: string
}) {
  return (
    <header className="bento__head">
      <span className="bento__label">
        <span className="bento__icon">
          <Icon size={20} weight="fill" aria-hidden="true" />
        </span>
        <h3 className="bento__title">{title}</h3>
      </span>
      <p className="bento__desc">{desc}</p>
      <ArrowUpRight size={15} weight="bold" aria-hidden="true" className="bento__arrow" />
    </header>
  )
}

export default function HomeBento() {
  return (
    <nav className="bento" aria-label="Explore the portfolio">
      {/* Projects: actual previews from the two featured case studies. */}
      <Link to="/projects" className="bento__card bento__card--projects">
        <CardHead
          Icon={FolderOpen}
          title="Projects"
          desc="Ecommerce operations and Pearl White website development."
        />
        <div className="bento__media bento__reel" aria-hidden="true">
          <div className="bento__reel-track">
            {[...PROJECT_SHOTS, ...PROJECT_SHOTS].map((src, i) => (
              <span key={i} className="bento__shot">
                <img src={src} alt="" loading="lazy" decoding="async" />
              </span>
            ))}
          </div>
        </div>
      </Link>

      {/* About: a fanned stack of photos. */}
      <Link to="/about" className="bento__card bento__card--about">
        <CardHead Icon={User} title="About" desc="My profile, professional introduction, and skills." />
        <div className="bento__media bento__fan" aria-hidden="true">
          {PHOTOS.map((src, i) => (
            <span key={i} className="bento__photo" style={{ ['--i' as string]: i }}>
              <img src={src} alt="" loading="lazy" decoding="async" />
            </span>
          ))}
        </div>
      </Link>

      {/* Website and automation work: real builds from the featured projects. */}
      <Link to="/projects" className="bento__card bento__card--ai">
        <CardHead
          Icon={Robot}
          title="AI Builds"
          desc="Website development, CRM, and booking automation projects."
        />
        <div className="bento__media bento__chips" aria-hidden="true">
          {[WEB_BUILDS.slice(0, 2), WEB_BUILDS.slice(2)].map((row, r) => (
            <div key={r} className="bento__chip-row" data-dir={r ? 'right' : 'left'}>
              <div className="bento__chip-track">
                {[...row, ...row].map((build, i) => (
                  <span key={`${build}-${i}`} className="bento__chip">
                    {build}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Link>

      {/* Professional development areas. */}
      <Link to="/about#professional-development" className="bento__card bento__card--creds">
        <CardHead
          Icon={FileText}
          title="Professional Development"
          desc="Ongoing learning across CRM, web development, AI automation, and ecommerce operations."
        />
        <div className="bento__media bento__badge" aria-hidden="true">
          <span className="bento__badge-tag">Skill areas</span>
        </div>
      </Link>

      {/* Services: the current offers as a compact index. */}
      <Link to="/services" className="bento__card bento__card--services">
        <CardHead
          Icon={Stack}
          title="Services"
          desc="Ecommerce, web, design, and logistics operations support."
        />
        <ul className="bento__media bento__offers" role="list">
          {OFFERS.map(({ Icon, title, note }, i) => (
            <li key={title} className="bento__offer" style={{ '--i': i } as React.CSSProperties}>
              <span className="bento__offer-tile">
                <Icon size={15} weight="duotone" aria-hidden="true" />
              </span>
              <span className="bento__offer-text">
                <span className="bento__offer-title">{title}</span>
                <span className="bento__offer-note">{note}</span>
              </span>
              <span className="bento__offer-num" aria-hidden="true">
                0{i + 1}
              </span>
            </li>
          ))}
        </ul>
      </Link>

      {/* Contact: the direct path to start a project. */}
      <Link to="/contact" className="bento__card bento__card--contact">
        <CardHead
          Icon={AddressBook}
          title="Contact Me"
          desc="Ready to work together? Send me a message to discuss your needs."
        />
        <div className="bento__media bento__reviews" aria-hidden="true">
          <span className="bento__review">
            <span className="bento__review-top"><b>Ready to work together?</b></span>
            <span className="bento__review-role">Send me a message to discuss your needs.</span>
          </span>
        </div>
      </Link>
    </nav>
  )
}
