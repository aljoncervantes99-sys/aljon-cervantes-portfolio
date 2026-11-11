import { Fragment, useCallback, useEffect, useRef, useState, type ComponentType, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { ArrowUpRight, X, CursorClick } from '@/components/slab'
import { FlowIcon, PlanIcon, GlobeIcon, LogisticsIcon } from './ProjectIcons'
import { BarrelPanel } from './ProjectPanels'
import { gymFunnel, bookingFunnel, websiteFunnel, type Funnel } from '@/data/funnels'
import { graphicDesigns } from '@/data/graphics-design'
import { logisticsProject } from '@/data/logistics-project'
import { useIsPhone } from '@/hooks/useMediaQuery'

/**
 * Projects, as one viewport in Home's bento language: a glass panel of cards,
 * each previewing its own body of work with a live inner track, each
 * opening the work itself in a near-fullscreen dialog (see ProjectPanels for
 * the first three; the rest are the sections the long page used to stack).
 *
 * The dialog is a portal at z 8000, under the funnel preview (9000) so the
 * barrel's own "open this page" dialog can still stack on top of it.
 */
type Project = {
  id: string
  index: string
  title: string
  desc: string
  Icon: ComponentType<{ size?: number }>
  eyebrow: string
  Section?: ComponentType
  span?: 2
  /** Open Builds style: a small orange kicker above the title. */
  kicker?: string
  /** Real marks of what the work was built in; replaces the icon tile. */
  logos?: string[]
  Preview: ComponentType
  /** Phone filter bucket. */
  cat: Cat
  /** Dedicated public case study for the featured projects. */
  caseStudy?: string
  /** Use client-side navigation for a portfolio route rather than a static case-study file. */
  appRoute?: boolean
  /** Project disciplines shown above the description. */
  category?: string
}

type Cat = 'work' | 'sites' | 'apps' | 'ai'
const FILTERS: { key: Cat | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'work', label: 'Work' },
  { key: 'sites', label: 'Sites' },
  { key: 'apps', label: 'Apps' },
  { key: 'ai', label: 'AI' },
]

/** Example tool marks, from public/icons. Swap for what you build with. */
const GHL = '/icons/gohighlevel.png'
const WF_SHOTS = ['/projects/pearl-white.png']

const thumbSrc = (f: Funnel) => `/${f.dir ?? 'funnels'}/thumbs/${f.file.replace('.html', '.jpeg')}`
const FUNNEL_SHOTS = graphicDesigns.length
  ? graphicDesigns.map((design) => design.imageSrc)
  : [gymFunnel[0], bookingFunnel[0], websiteFunnel[0]].filter(Boolean).map(thumbSrc)

/* ---------- Previews ---------- */

function WorkflowsPreview() {
  return (
    <div className="bento__media bento__reel bento__reel--featured" aria-hidden="true">
      <div className="bento__reel-track">
        {WF_SHOTS.map((src) => (
          <span key={src} className="bento__shot">
            <img src={src} alt="" loading="lazy" decoding="async" />
          </span>
        ))}
      </div>
    </div>
  )
}

/** A compact preview of the Ecommerce operations case study. */
function PlanPreview() {
  return (
    <div className="bento__media bento__doc bento__doc--ecommerce" aria-hidden="true">
      <div className="bento__ecommerce-heading">
        <img src="/icons/shopify.svg" alt="" />
        <span>
          <span className="bento__doc-eyebrow">Sample Project</span>
          <span className="bento__doc-title">Ecommerce Operations</span>
        </span>
      </div>
      <span className="bento__doc-flow">
        <i>Catalog</i>
        <i>Orders</i>
        <i>Inventory</i>
        <i className="is-on">Customer care</i>
      </span>
      <span className="bento__ecommerce-tools">Shopify · Salesforce · Google Workspace</span>
    </div>
  )
}

/** The three builds as Open Builds rows: plate, eyebrow, title, arrow. */
function FunnelsPreview() {
  return (
    <div className="bento__media bento__fan" aria-hidden="true">
      {FUNNEL_SHOTS.map((src, i) => (
        <span key={src} className="bento__photo bento__photo--page" style={{ ['--i' as string]: i }}>
          <img src={src} alt="" loading="lazy" decoding="async" />
        </span>
      ))}
    </div>
  )
}

function LogisticsPreview() {
  return (
    <div className="bento__media bento__logistics-preview" aria-hidden="true">
      <div className="bento__logistics-preview-head">
        <LogisticsIcon size={18} />
        <span>
          <span className="bento__logistics-preview-label">Illustrative sample</span>
          <strong>Daily logistics</strong>
        </span>
      </div>
      <div className="bento__logistics-preview-row">
        <span>ORD-2401</span>
        <span>Supplier confirmed</span>
      </div>
      <div className="bento__logistics-preview-row">
        <span>ORD-2402</span>
        <span>In transit</span>
      </div>
      <div className="bento__logistics-preview-row">
        <span>ORD-2403</span>
        <span>Inventory check</span>
      </div>
    </div>
  )
}

const PROJECTS: Project[] = [
  { id: 'plan', cat: 'work', index: '01', title: 'Ecommerce Operations & Shopify Store Management', category: 'Ecommerce VA | Shopify | Operations Support', desc: 'Ecommerce operations support covering Shopify product listings, catalog management, inventory monitoring, order processing, fulfillment coordination, customer inquiries, and order tracking.', Icon: PlanIcon, logos: ['/icons/shopify.svg'], eyebrow: 'Sample Project', caseStudy: '/projects/ecommerce-dashboard', appRoute: true, Preview: PlanPreview },
  { id: 'workflows', cat: 'work', index: '02', title: 'Pearl White – Website Development & Booking Automation', category: 'Web Development | GoHighLevel | Business Automation', desc: 'A premium website development project for a transient accommodation business, featuring responsive website design, booking inquiry forms, an accommodation pricing calculator, and GoHighLevel workflow integration.', Icon: FlowIcon, logos: [GHL], eyebrow: 'Pearl White', caseStudy: '/projects/pearl-white-case-study.html', span: 2, Preview: WorkflowsPreview },
  { id: 'funnels', cat: 'sites', index: '06', title: 'Graphics Design', desc: 'Creative visual designs for branding, marketing materials, social media, promotional content, and digital experiences.', Icon: GlobeIcon, logos: [GHL], eyebrow: 'Graphic design', Section: BarrelPanel, Preview: FunnelsPreview },
  { id: 'logistics', cat: 'work', index: '04', title: 'Logistics & Supply Chain Operations', category: logisticsProject.tags.join(' | '), desc: logisticsProject.description, Icon: LogisticsIcon, logos: [], eyebrow: 'Logistics Operations', Preview: LogisticsPreview },
]

/** The icon tile, or the real marks stacked horizontally in its place. */
function Marks({ p, size = 22 }: { p: Project; size?: number }) {
  if (!p.logos?.length) {
    return (
      <span className="bento__icon">
        <p.Icon size={size} />
      </span>
    )
  }
  return (
    <span className="bento__logos" aria-hidden="true">
      {p.logos.map((src) => (
        <span key={src} className="bento__logo">
          <img src={src} alt="" width={22} height={22} decoding="async" />
        </span>
      ))}
    </span>
  )
}

/* ---------- Dialog ----------
   A backdrop, a close button in the corner, and the work. No panel, no
   header: each Section brings its own window (or, for the strip, none). */
function ProjectModal({ project, onClose, children }: { project: Project; onClose: () => void; children: ReactNode }) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    requestAnimationFrame(() => closeRef.current?.focus())
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return createPortal(
    <div
      className="pmodal"
      role="dialog"
      aria-modal="true"
      aria-label={project.title}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <button ref={closeRef} type="button" className="pmodal__close" onClick={onClose} aria-label="Close">
        <X size={18} weight="bold" />
      </button>
      <div className="pmodal__stage">{children}</div>
    </div>,
    document.body,
  )
}

/* ---------- The page ---------- */

export default function ProjectsGrid() {
  const [open, setOpen] = useState<Project | null>(null)
  const phone = useIsPhone()
  const [cat, setCat] = useState<Cat | 'all'>('all')
  const keep = (p: Project) => !phone || cat === 'all' || p.cat === cat
  const projects = PROJECTS.filter(keep)
  const triggerRef = useRef<HTMLElement | null>(null)

  const show = useCallback((p: Project, el: HTMLElement) => {
    triggerRef.current = el
    setOpen(p)
  }, [])
  const close = useCallback(() => {
    setOpen(null)
    requestAnimationFrame(() => triggerRef.current?.focus())
  }, [])

  return (
    <section className="pgrid" aria-labelledby="projects-title">
      <header className="pgrid__head">
        <span className="pgrid__eyebrow">Featured Projects</span>
        <h1 className="pgrid__title" id="projects-title">
        Selected Work & Digital Solutions.
        </h1>
        <p className="pgrid__lede">Selected case studies spanning ecommerce operations, web development, and digital business workflows.</p>
      </header>

      {phone && (
        <div className="pfilter" role="group" aria-label="Filter projects">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              className="pfilter__btn"
              aria-pressed={cat === f.key}
              onClick={() => setCat(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      <div className="home__glass pgrid__glass">
        {/* Hung on the sheet's top edge so it reads as a tag on the container,
            not a seventh card. aria-hidden: the lede already says it. */}
        <span className="pgrid__hint" aria-hidden="true">
          <CursorClick size={14} weight="duotone" />
          Featured case studies
        </span>
        <div className="bento bento--projects">
          {projects.map((p) => {
            const content = (
              <>
                <span className="bento__head">
                  <Marks p={p} />
                  <span className="bento__title">{p.title}</span>
                  {p.category && <span className="bento__project-category">{p.category}</span>}
                  <span className="bento__desc">{p.desc}</span>
                  {!p.caseStudy && <ArrowUpRight size={15} weight="bold" aria-hidden="true" className="bento__arrow" />}
                </span>
                <p.Preview />
              </>
            )

            return (
              <Fragment key={p.id}>
                {p.caseStudy ? (
                  p.appRoute ? (
                    <Link
                      to={p.caseStudy}
                      className={`bento__card bento__card--btn bento__card--featured${p.span === 2 ? ' bento__card--wide' : ''}`}
                      data-id={p.id}
                    >
                      {content}
                      <span className="bento__project-link">View Project <ArrowUpRight size={14} weight="bold" aria-hidden="true" /></span>
                    </Link>
                  ) : (
                    <a
                      href={p.caseStudy}
                      className={`bento__card bento__card--btn bento__card--featured${p.span === 2 ? ' bento__card--wide' : ''}`}
                      data-id={p.id}
                    >
                      {content}
                      <span className="bento__project-link">View Project <ArrowUpRight size={14} weight="bold" aria-hidden="true" /></span>
                    </a>
                  )
                ) : (
                  <button
                    type="button"
                    className={`bento__card bento__card--btn${p.span === 2 ? ' bento__card--wide' : ''}`}
                    data-id={p.id}
                    onClick={(e) => show(p, e.currentTarget)}
                    aria-haspopup="dialog"
                  >
                    {content}
                  </button>
                )}
              </Fragment>
            )
          })}
        </div>
      </div>

      {open?.Section && (
        <ProjectModal project={open} onClose={close}>
          <open.Section />
        </ProjectModal>
      )}
    </section>
  )
}
