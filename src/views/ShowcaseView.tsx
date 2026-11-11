import ShowcaseGrid from '@/components/ShowcaseGrid'
import { Link } from 'react-router-dom'
import { ArrowUpRight } from '@/components/slab'

/**
 * Showcase. Like Projects and Services, the whole view is one grid component
 * with its own head and glass - no ViewShell, because there is no scrolling
 * stack of legacy sections here to reveal.
 */
export default function ShowcaseView() {
  return (
    <>
      <ShowcaseGrid />
      <section className="business-impact-entry" aria-labelledby="business-impact-entry-title">
        <div>
          <span className="bi-eyebrow">Business Support &amp; Digital Operations</span>
          <h2 id="business-impact-entry-title">Explore the value, packages, and project work.</h2>
        </div>
        <Link className="bi-button bi-button--primary" to="/business-impact">
          Explore business impact <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </section>
    </>
  )
}
