import { Link } from 'react-router-dom'
import { ArrowUpRight } from '@/components/slab'
import { profile } from '@/data/profile'
import ToolsSection from './ToolsSection'
import HomeBento from './HomeBento'
import { HomeProfile, HomeStats } from './HomeMobile'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { useIsPhone } from '@/hooks/useMediaQuery'

/**
 * Home. Three bands in a scrollable overview:
 *
 *   head       the display line the intro writes, then the lede
 *   tools      daily drivers and the tools marquee, on its own plate
 *   showcase   the six-card bento, with its previews and service index
 *
 * The home panel scrolls when the full-size cards extend past the viewport.
 *
 * On a phone the profile header and proof stats remain, while the same bento
 * reflows into a two-column tablet grid or a one-column phone stack.
 *
 * `.home__title` is also the intro's landing target: IntroOverlay measures it
 * and flies its copy into this exact rect, so the line the visitor watched
 * being written is the line that stays on the page.
 */
export default function Home() {
  useScrollReveal()
  const phone = useIsPhone()
  const { displayName, hero } = profile

  return (
    <section className="home" aria-labelledby="home-title">
      {phone && <HomeProfile />}

      <div className="home__head">
        <div className="home__headline">
          <h1 className="home__title" id="home-title">
            <span className="home__line">
              {displayName.line1} {displayName.line2}
            </span>
          </h1>

          {!phone && (
            <Link className="home__cta" to="/contact">
              Let's Work Together
              <ArrowUpRight size={16} weight="bold" aria-hidden="true" />
            </Link>
          )}
        </div>

        <p className="home__lede">{hero.body}</p>
        {phone && <HomeStats />}
      </div>

      {/* Two plates, not one. The tools band and the bento are different
          objects - a strip you read across and a grid you pick from - and one
          shared sheet made the strip look like the bento's header. */}
      <div className="home__glass home__glass--tools">
        <div className="home__tools">
          <div className="home__tools-head">
            <span className="home__tools-eyebrow">DAILY DRIVERS</span>
            <h2 className="home__tools-label">Tools I work with</h2>
          </div>
          <ToolsSection />
        </div>
      </div>

      {phone && (
        <div className="hsec">
          <h2 className="hsec__title">Explore</h2>
        </div>
      )}
      <div className="home__glass home__glass--showcase">
        <div className="home__showcase">
          <HomeBento />
        </div>
      </div>
    </section>
  )
}
