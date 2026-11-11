import type { ReactNode } from 'react'
import { lazy, Suspense } from 'react'
import AIStackGrid from './AIStackGrid'
import { AppsSection } from './Projects'
import { useFunnelModal } from './FunnelModal'
import { websiteFunnel } from '@/data/funnels'
import { graphicDesigns } from '@/data/graphics-design'
import { logisticsProject } from '@/data/logistics-project'

const FunnelBarrel = lazy(() => import('./FunnelBarrel'))

/**
 * What the Projects dialogs show. Each panel is the work itself, on screen
 * the moment the dialog opens - no section chrome to read past and no second
 * dialog to click into.
 */

/** A plain mac window with a scrolling body, for the sections that are
 *  pages rather than frames. */
function SectionWindow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="ppanel ppanel--window">
      <div className="ppanel__bar">
        <span className="ppanel__dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className="ppanel__url">
          <span className="ppanel__url-host">{label}</span>
        </span>
      </div>
      <div className="ppanel__scroll">{children}</div>
    </div>
  )
}

/** Only the barrel, spinning on the backdrop. Its own page preview still
 *  stacks above (z 9000). */
export function BarrelPanel() {
  const { openItem, modal } = useFunnelModal()
  const items = graphicDesigns.length > 0 ? graphicDesigns : websiteFunnel
  return (
    <div className="ppanel ppanel--barrel">
      <Suspense fallback={<div className="funnels__barrel-skeleton" aria-hidden="true" />}>
        <FunnelBarrel items={items} onOpen={openItem} />
      </Suspense>
      {modal}
    </div>
  )
}

/** The systems as a logo-first grid, in a scrolling window. */
export function AIWindow() {
  return (
    <SectionWindow label="Your systems">
      <AIStackGrid />
    </SectionWindow>
  )
}
export function AppsWindow() {
  return (
    <SectionWindow label="Your apps">
      <AppsSection />
    </SectionWindow>
  )
}

export function LogisticsPanel() {
  return (
    <SectionWindow label="Illustrative logistics dashboard">
      <article className="logistics-dashboard">
        <header className="logistics-dashboard__head">
          <span className="logistics-dashboard__eyebrow">Illustrative portfolio project</span>
          <h1>Logistics &amp; Supply Chain Operations</h1>
          <p>{logisticsProject.description}</p>
        </header>

        <section className="logistics-dashboard__board" aria-label="Illustrative order tracking board">
          <div className="logistics-dashboard__board-head">
            <div>
              <span className="logistics-dashboard__eyebrow">Sample workflow</span>
              <h2>Order coordination</h2>
            </div>
            <span className="logistics-dashboard__sample">Illustrative data</span>
          </div>
          <div className="logistics-dashboard__orders">
            <div className="logistics-dashboard__order">
              <span><strong>ORD-2401</strong><small>Supplier follow-up</small></span>
              <span className="logistics-dashboard__status">Supplier confirmed</span>
            </div>
            <div className="logistics-dashboard__order">
              <span><strong>ORD-2402</strong><small>Shipment tracking</small></span>
              <span className="logistics-dashboard__status logistics-dashboard__status--moving">In transit</span>
            </div>
            <div className="logistics-dashboard__order">
              <span><strong>ORD-2403</strong><small>Inventory update</small></span>
              <span className="logistics-dashboard__status logistics-dashboard__status--review">Processing</span>
            </div>
          </div>
        </section>

        <section className="logistics-dashboard__details">
          <div>
            <h2>Project capabilities</h2>
            <ul>
              {logisticsProject.capabilities.map((capability) => (
                <li key={capability}>{capability}</li>
              ))}
            </ul>
          </div>
          <div>
            <h2>Category tags</h2>
            <ul className="logistics-dashboard__tags" aria-label="Project categories">
              {logisticsProject.tags.map((tag) => (
                <li key={tag}>{tag}</li>
              ))}
            </ul>
          </div>
        </section>
      </article>
    </SectionWindow>
  )
}
