import Flagship from '@/components/Flagship'

/**
 * ShowcaseGrid - the /showcase view on one glass sheet.
 *
 * A page head with a badge card on the right, then the Flagship build: the
 * five-tab product mock, the copy, the CTA, and the testimonial marquee that
 * runs under it. Same head and glass as Projects and Services, so the shell
 * reads as one system. Styles live in src/styles/showcase.css (.ktools).
 */
export default function ShowcaseGrid() {
  return (
    <section className="pgrid ktools" aria-labelledby="showcase-title">
      <header className="pgrid__head ktools__head">
        <div className="ktools__head-copy">
          <span className="pgrid__eyebrow">Ecommerce Expertise</span>
          <h1 className="pgrid__title" id="showcase-title">
            Helping Ecommerce Brands Run Smarter Operations.
          </h1>
          <p className="pgrid__lede">
            Reliable ecommerce support for Shopify store management, product listings, inventory
            monitoring, order processing, and customer experience.
          </p>
        </div>

        <div className="ktools__platforms" aria-labelledby="core-platforms-label">
          <span className="ktools__platforms-label" id="core-platforms-label">My Core Platforms</span>
          <div className="ktools__platform-list">
            <span className="ktools__platform">
              <span className="ktools__platform-mark"><img src="/icons/shopify.svg" alt="" /></span>
              Shopify
            </span>
            <span className="ktools__platform">
              <span className="ktools__platform-mark"><img src="/icons/salesforce.svg" alt="" /></span>
              Salesforce
            </span>
            <span className="ktools__platform">
              <span className="ktools__platform-mark ktools__platform-mark--excel" aria-hidden="true">X</span>
              Microsoft Excel
            </span>
            <span className="ktools__platform">
              <span className="ktools__platform-mark ktools__platform-mark--sheets" aria-hidden="true"><i /><i /><i /><i /></span>
              Google Sheets
            </span>
          </div>
        </div>
      </header>

      <div className="home__glass ktools__glass">
        <Flagship
          eyebrow="Ecommerce Operations"
          title="Ecommerce Operations & Shopify Store Management"
          description="I provide reliable ecommerce operational support to help businesses manage their online stores efficiently. From Shopify product management and inventory updates to order processing and customer service, I help maintain organized workflows and smooth day-to-day operations."
          buttonLabel="View Ecommerce Project"
          buttonHref="/projects/ecommerce-operations.html"
          screenshot={{
            src: '/projects/ecommerce/ecommerce-showcase.png',
            alt: 'Shopify product listing and catalog management screen',
            host: 'Shopify Admin',
            path: '/products',
          }}
        />
      </div>
    </section>
  )
}
