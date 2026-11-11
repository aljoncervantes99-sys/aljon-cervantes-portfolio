import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  Bell,
  CalendarBlank,
  CaretDown,
  ChartBar,
  CheckCircle,
  Clock,
  GearSix,
  Lightning,
  ListBullets,
  MagnifyingGlass,
  Megaphone,
  Package,
  ShoppingBag,
  SquaresFour,
  Storefront,
  UsersThree,
  X,
  type Icon,
} from '@/components/slab'
import {
  demoOrders,
  demoProducts,
  salesRanges,
  trafficSources,
  workflowExamples,
  type DemoOrder,
  type DemoProduct,
  type SalesRange,
} from '@/data/ecommerce-demo'

const DASHBOARD_NAV: { id: string; label: string; Icon: Icon }[] = [
  { id: 'overview', label: 'Overview', Icon: SquaresFour },
  { id: 'orders', label: 'Orders', Icon: ListBullets },
  { id: 'products', label: 'Products', Icon: Package },
  { id: 'inventory', label: 'Inventory', Icon: ShoppingBag },
  { id: 'analytics', label: 'Analytics', Icon: ChartBar },
  { id: 'customers', label: 'Customers', Icon: UsersThree },
  { id: 'marketing', label: 'Marketing', Icon: Megaphone },
  { id: 'automation', label: 'Automation', Icon: Lightning },
  { id: 'settings', label: 'Settings', Icon: GearSix },
]

const PRODUCT_CATEGORIES = ['All products', 'Home', 'Accessories', 'Beauty'] as const

function formatCurrency(value: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value)
}

function ProductArtwork({ product }: { product: DemoProduct }) {
  return (
    <span className={`shop-art shop-art--${product.accent} shop-art--${product.kind}`} aria-hidden="true">
      <i />
      <i />
    </span>
  )
}

function MetricCard({
  label,
  value,
  note,
  Icon,
  tone,
}: {
  label: string
  value: string
  note: string
  Icon: Icon
  tone: 'peach' | 'sage' | 'butter' | 'plain'
}) {
  return (
    <article className={`shop-metric shop-metric--${tone}`}>
      <div className="shop-metric__top">
        <span className="shop-metric__icon"><Icon size={17} weight="duotone" aria-hidden="true" /></span>
        <span className="shop-metric__label">{label}</span>
      </div>
      <strong>{value}</strong>
      <span className="shop-metric__caption">{note}</span>
    </article>
  )
}

function SalesChart({ range, currency }: { range: SalesRange; currency: string }) {
  const [activeBar, setActiveBar] = useState<number | null>(null)
  const data = salesRanges[range]
  const active = activeBar === null ? data.bars[data.bars.length - 1] : data.bars[activeBar]
  const linePath = data.bars.map((bar, index) => {
    const x = data.bars.length === 1 ? 50 : (index / (data.bars.length - 1)) * 100
    const y = 90 - bar.value * 0.72
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
  }).join(' ')

  return (
    <section className="shop-panel shop-chart" id="shop-analytics" aria-labelledby="shop-sales-heading">
      <header className="shop-panel__head">
        <div>
          <h3 id="shop-sales-heading">Sales over time</h3>
          <p>Revenue trend <span aria-hidden="true">·</span> {data.label}</p>
        </div>
        <span className="shop-chart__total">{formatCurrency(data.total, currency)}</span>
      </header>
      <div className="shop-chart__plot" key={range} role="group" aria-label={`Sales chart, ${data.label}`}>
        <div className="shop-chart__gridlines" aria-hidden="true"><i /><i /><i /><i /></div>
        <div className="shop-chart__bars">
          {data.bars.map((bar, index) => (
            <button
              className={`shop-chart__bar${activeBar === index || (activeBar === null && index === data.bars.length - 1) ? ' is-active' : ''}`}
              key={`${range}-${bar.label}`}
              type="button"
              data-zero={bar.amount === 0}
              style={{ '--bar-height': `${bar.value}%`, '--bar-index': index } as CSSProperties}
              aria-label={`${bar.label}: ${formatCurrency(bar.amount, currency)} revenue`}
              title={`${bar.label}: ${formatCurrency(bar.amount, currency)}`}
              onMouseEnter={() => setActiveBar(index)}
              onMouseLeave={() => setActiveBar(null)}
              onFocus={() => setActiveBar(index)}
              onBlur={() => setActiveBar(null)}
            >
              <span className="shop-chart__bar-fill" />
              <span className="shop-chart__bar-label">{bar.label}</span>
            </button>
          ))}
        </div>
        <svg className="shop-chart__line" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path d={linePath} pathLength="1" className="shop-chart__line-path" />
          <circle r="2.2" className="shop-chart__indicator">
            <animateMotion dur="5s" repeatCount="indefinite" path={linePath} />
          </circle>
        </svg>
        {active && <output className="shop-chart__tooltip">{active.label}<strong>{formatCurrency(active.amount, currency)}</strong></output>}
      </div>
      <footer className="shop-chart__legend"><i /> Gross sales <span>Updated for selected period</span></footer>
    </section>
  )
}

function ProductRow({
  product,
  onOpen,
  currency,
}: {
  product: DemoProduct
  onOpen: (product: DemoProduct) => void
  currency: string
}) {
  return (
    <button className="shop-best-product" type="button" onClick={() => onOpen(product)}>
      <ProductArtwork product={product} />
      <span className="shop-best-product__name">{product.name}<small>{product.sold} units sold</small></span>
      <span className="shop-best-product__bar" aria-label={`${product.sold} units sold`}><i style={{ width: `${Math.min(product.sold / 3, 1) * 100}%` }} /></span>
      <strong>{formatCurrency(product.price, currency)}</strong>
    </button>
  )
}

function OrdersTable({ orders, currency }: { orders: DemoOrder[]; currency: string }) {
  return (
    <div className="shop-table-wrap">
      <table className="shop-table">
        <thead><tr><th>Order</th><th>Customer</th><th>Product</th><th>Payment</th><th>Fulfillment</th><th>Total</th></tr></thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td><strong>{order.id}</strong><small>{order.date}</small></td>
              <td><span className="shop-customer"><i>{order.initials}</i>{order.customer}</span></td>
              <td>{order.product}</td>
              <td><span className={`shop-status shop-status--${order.payment.toLowerCase()}`}>{order.payment}</span></td>
              <td><span className={`shop-fulfillment shop-fulfillment--${order.fulfillment.toLowerCase()}`}>{order.fulfillment}</span></td>
              <td><strong>{formatCurrency(order.total, currency)}</strong></td>
            </tr>
          ))}
          {!orders.length && <tr><td className="shop-table__empty" colSpan={6}>No sample orders match these filters.</td></tr>}
        </tbody>
      </table>
    </div>
  )
}

export default function EcommerceDashboard() {
  const [activeSection, setActiveSection] = useState('overview')
  const [range, setRange] = useState<SalesRange>('30d')
  const [productCategory, setProductCategory] = useState<(typeof PRODUCT_CATEGORIES)[number]>('All products')
  const [orderStatus, setOrderStatus] = useState<'All statuses' | DemoOrder['payment']>('All statuses')
  const [search, setSearch] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<DemoProduct | null>(null)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [weeklySummary, setWeeklySummary] = useState(true)
  const [currency, setCurrency] = useState('USD')

  const filteredProducts = useMemo(() => demoProducts
    .filter((product) => {
      const categoryMatches = productCategory === 'All products' || product.category === productCategory
      const queryMatches = `${product.name} ${product.category}`.toLowerCase().includes(search.toLowerCase())
      return categoryMatches && queryMatches
    })
    .sort((a, b) => b.sold - a.sold), [productCategory, search])

  const filteredOrders = useMemo(() => demoOrders.filter((order) => {
    const statusMatches = orderStatus === 'All statuses' || order.payment === orderStatus
    const queryMatches = `${order.id} ${order.customer} ${order.product} ${order.payment} ${order.fulfillment}`.toLowerCase().includes(search.toLowerCase())
    return statusMatches && queryMatches
  }), [orderStatus, search])

  const lowStock = demoProducts.filter((product) => product.stock < 10)

  const navigateTo = (id: string) => {
    setActiveSection(id)
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    document.getElementById(`shop-${id}`)?.scrollIntoView({ behavior, block: 'start' })
  }

  useEffect(() => {
    if (!selectedProduct) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedProduct(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selectedProduct])

  return (
    <section className="ecom-demo" aria-labelledby="ecom-title">
      <header className="ecom-intro">
        <div>
          <span className="ecom-eyebrow">PORTFOLIO CASE STUDY <i aria-hidden="true" /> ECOMMERCE OPERATIONS</span>
          <h1 id="ecom-title">Ecommerce Operations &amp; Shopify Management</h1>
          <p>An operations-focused case study of catalog management, inventory monitoring, order processing, and customer support.</p>
        </div>
        <div className="ecom-intro__actions">
          <Link to="/projects" className="ecom-text-link">Back to featured work <ArrowUpRight size={14} aria-hidden="true" /></Link>
          <a href="/projects/ecommerce-operations.html" className="ecom-text-link" target="_blank" rel="noreferrer">Existing Shopify sample <ArrowUpRight size={14} aria-hidden="true" /></a>
        </div>
      </header>

      <div className="ecom-showcase">
        <div className="shop-window">
          <div className="shop-window__chrome">
            <span className="shop-window__lights" aria-hidden="true"><i /><i /><i /></span>
            <span className="shop-window__address">Commerce operations workspace</span>
          </div>
          <div className="shop-app">
            <aside className="shop-sidebar" aria-label="Operations navigation">
              <div className="shop-brand">
                <span className="shop-brand__mark"><Storefront size={18} weight="fill" aria-hidden="true" /></span>
                <span>FIELD<span>&</span>FORM<small>OPERATIONS STUDIO</small></span>
              </div>
              <span className="shop-sidebar__label">WORKSPACE</span>
              <nav className="shop-sidebar__nav">
                {DASHBOARD_NAV.map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    type="button"
                    className={activeSection === id ? 'is-active' : ''}
                    onClick={() => navigateTo(id)}
                    aria-current={activeSection === id ? 'location' : undefined}
                  >
                    <Icon size={16} weight={activeSection === id ? 'fill' : 'regular'} aria-hidden="true" />
                    <span>{label}</span>
                    {id === 'orders' && <i className="shop-sidebar__count">{demoOrders.filter((order) => order.fulfillment === 'Processing' || order.fulfillment === 'Ready').length}</i>}
                  </button>
                ))}
              </nav>
              <div className="shop-sidebar__help">
                <span className="shop-sidebar__help-icon"><Lightning size={16} weight="duotone" /></span>
                <strong>Workflows,<br />without the busywork.</strong>
                <small>Organized operations start with good systems.</small>
                <button type="button" onClick={() => navigateTo('automation')}>Explore workflows <ArrowUpRight size={12} /></button>
              </div>
              <div className="shop-sidebar__profile"><span>AC</span><div><strong>Operations team</strong><small>Store workspace</small></div><CaretDown size={13} /></div>
            </aside>

            <main className="shop-content">
              <div className="shop-topbar">
                <label className="shop-search">
                  <MagnifyingGlass size={15} aria-hidden="true" />
                  <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products or orders" aria-label="Search products and orders" />
                  {search && <button type="button" onClick={() => setSearch('')} aria-label="Clear search"><X size={14} /></button>}
                </label>
                <label className="shop-range"><CalendarBlank size={14} aria-hidden="true" /><span className="sr-only">Reporting date range</span><select value={range} onChange={(event) => setRange(event.target.value as SalesRange)}><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option><option value="year">Year to date</option></select><CaretDown size={13} aria-hidden="true" /></label>
                <div className="shop-topbar__right">
                  <button type="button" className="shop-notifications" onClick={() => setNotificationsOpen((open) => !open)} aria-label="Toggle workspace notifications" aria-expanded={notificationsOpen}>
                    <Bell size={17} aria-hidden="true" /><i />
                  </button>
                  <span className="shop-topbar__avatar" aria-label="Store manager">AC</span>
                  {notificationsOpen && (
                    <div className="shop-notifications-panel" role="status">
                      <strong>Workspace updates</strong>
                      <span><i className="is-peach" /> 3 orders are awaiting fulfillment.</span>
                      <span><i className="is-sage" /> Inventory review is up to date.</span>
                    </div>
                  )}
                </div>
              </div>

              <section className="shop-section shop-overview" id="shop-overview" aria-labelledby="shop-overview-heading">
                <header className="shop-overview__head">
                  <div><span className="shop-section-kicker">OPERATIONS DASHBOARD</span><h2 id="shop-overview-heading">Store Operations Overview</h2><p>Monitor sales performance, manage orders, track inventory, and oversee daily ecommerce operations.</p></div>
                </header>
                <div className="shop-metrics">
                  <MetricCard label="Gross sales" value={formatCurrency(salesRanges[range].total, currency)} note="Selected period" Icon={ChartBar} tone="peach" />
                  <MetricCard label="Total orders" value={String(salesRanges[range].orders)} note="Selected period" Icon={ShoppingBag} tone="sage" />
                  <MetricCard label="Active products" value={String(demoProducts.length)} note="Across 3 categories" Icon={Package} tone="butter" />
                  <MetricCard label="Low stock" value={String(lowStock.length).padStart(2, '0')} note="Below 10 units" Icon={Clock} tone="plain" />
                </div>
              </section>

              <div className="shop-analytics-grid">
                <SalesChart key={range} range={range} currency={currency} />
                <section className="shop-panel shop-traffic" aria-labelledby="shop-traffic-heading">
                  <header className="shop-panel__head"><div><h3 id="shop-traffic-heading">Traffic sources</h3><p>Visits by channel <span aria-hidden="true">·</span> current period</p></div><button type="button" className="shop-more-button" onClick={() => navigateTo('analytics')} aria-label="View traffic analytics"><ArrowUpRight size={16} /></button></header>
                  <div className="shop-traffic__body">
                    <div className="shop-traffic__donut" role="img" aria-label="Traffic sources: Direct 42 percent, Social 31 percent, Search 27 percent"><span><strong>2,480</strong><small>visits</small></span></div>
                    <ul>{trafficSources.map((source) => <li key={source.name}><i style={{ background: source.color }} />{source.name}<strong>{source.value}%</strong></li>)}</ul>
                  </div>
                </section>
              </div>

              <div className="shop-performance-grid">
                <section className="shop-panel shop-products" id="shop-products" aria-labelledby="shop-products-heading">
                  <header className="shop-panel__head">
                    <div><span className="shop-section-kicker">PRODUCT CATALOG</span><h3 id="shop-products-heading">Product performance</h3></div>
                    <label className="shop-select"><span className="sr-only">Filter products by category</span><select value={productCategory} onChange={(event) => setProductCategory(event.target.value as (typeof PRODUCT_CATEGORIES)[number])}>{PRODUCT_CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select><CaretDown size={12} aria-hidden="true" /></label>
                  </header>
                  <div className="shop-best-list">
                    {filteredProducts.slice(0, 4).map((product) => <ProductRow key={product.id} product={product} onOpen={setSelectedProduct} currency={currency} />)}
                    {!filteredProducts.length && <p className="shop-empty">No products match this filter.</p>}
                  </div>
                  <button type="button" className="shop-panel-link" onClick={() => navigateTo('products')}>Browse product catalog <ArrowUpRight size={13} /></button>
                </section>

                <section className="shop-panel shop-stock" id="shop-inventory" aria-labelledby="shop-stock-heading">
                  <header className="shop-panel__head"><div><span className="shop-section-kicker">INVENTORY HEALTH</span><h3 id="shop-stock-heading">Needs attention</h3></div><span className="shop-stock__badge">{lowStock.length} items</span></header>
                  <p className="shop-stock__intro">A quick look at products below the 10-unit restock threshold.</p>
                  <ul className="shop-stock__list">
                    {lowStock.map((product) => <li key={product.id}><ProductArtwork product={product} /><span>{product.name}<small>{product.category}</small></span><strong>{product.stock}<small>left</small></strong></li>)}
                  </ul>
                  <button type="button" className="shop-panel-link" onClick={() => navigateTo('inventory')}>Review inventory <ArrowUpRight size={13} /></button>
                </section>
              </div>

              <section className="shop-panel shop-orders" id="shop-orders" aria-labelledby="shop-orders-heading">
                <header className="shop-panel__head shop-orders__head">
                  <div><span className="shop-section-kicker">FULFILLMENT WORKFLOW</span><h3 id="shop-orders-heading">Recent orders</h3><p>Latest activity across payment and fulfillment.</p></div>
                  <label className="shop-select"><span className="sr-only">Filter orders by payment status</span><select value={orderStatus} onChange={(event) => setOrderStatus(event.target.value as typeof orderStatus)}><option>All statuses</option><option>Paid</option><option>Pending</option><option>Refunded</option></select><CaretDown size={12} aria-hidden="true" /></label>
                </header>
                <OrdersTable orders={filteredOrders.slice(0, 5)} currency={currency} />
                <div className="shop-orders__footer"><span>Showing {Math.min(filteredOrders.length, 5)} of {filteredOrders.length} matching orders</span><button type="button" onClick={() => setOrderStatus('All statuses')}>Show all statuses <X size={12} /></button></div>
              </section>

              <section className="shop-panel shop-ops-section" id="shop-customers" aria-labelledby="shop-customers-heading">
                <header className="shop-panel__head"><div><span className="shop-section-kicker">CUSTOMER EXPERIENCE</span><h3 id="shop-customers-heading">Customer snapshot</h3><p>Customer activity across the latest orders.</p></div><UsersThree size={18} aria-hidden="true" /></header>
                <div className="shop-customer-stats"><div><span>Returning customers</span><strong>0%</strong><small>6 unique customers</small></div><div><span>Average order value</span><strong>{formatCurrency(230 / demoOrders.length, currency)}</strong><small>gross sales / 6 orders</small></div><div><span>Support conversations</span><strong>2</strong><small>this period</small></div></div>
              </section>

              <section className="shop-panel shop-ops-section" id="shop-marketing" aria-labelledby="shop-marketing-heading">
                <header className="shop-panel__head"><div><span className="shop-section-kicker">CAMPAIGN PLANNING</span><h3 id="shop-marketing-heading">Marketing calendar</h3><p>Example campaign tasks and channel coordination.</p></div><Megaphone size={18} aria-hidden="true" /></header>
                <div className="shop-campaign"><span className="shop-campaign__date">NOV 13 <i>FRI</i></span><div><strong>Weekend collection email</strong><small>Product feature <span aria-hidden="true">·</span> Draft campaign</small></div><span className="shop-status shop-status--pending">In review</span></div>
                <div className="shop-campaign"><span className="shop-campaign__date">NOV 17 <i>TUE</i></span><div><strong>Restock social post</strong><small>Inventory update <span aria-hidden="true">·</span> Content planning</small></div><span className="shop-status shop-status--paid">Scheduled</span></div>
              </section>

              <section className="shop-panel shop-ops-section" id="shop-automation" aria-labelledby="shop-automation-heading">
                <header className="shop-panel__head"><div><span className="shop-section-kicker">WORKFLOW OPTIMIZATION</span><h3 id="shop-automation-heading">Automation overview</h3><p>Illustrative workflow patterns for common store operations.</p></div><Lightning size={18} aria-hidden="true" /></header>
                <div className="shop-workflows">{workflowExamples.map((workflow) => <article key={workflow.name}><span className={`shop-workflow-status${workflow.state === 'Active' ? ' is-active' : ''}`}><i />{workflow.state}</span><strong>{workflow.name}</strong><small>{workflow.detail}</small><ArrowUpRight size={15} aria-hidden="true" /></article>)}</div>
              </section>

              <section className="shop-panel shop-ops-section shop-settings" id="shop-settings" aria-labelledby="shop-settings-heading">
                <header className="shop-panel__head"><div><span className="shop-section-kicker">PREFERENCES</span><h3 id="shop-settings-heading">Workspace settings</h3><p>Adjust local display preferences.</p></div><GearSix size={18} aria-hidden="true" /></header>
                <label className="shop-setting-row"><span><strong>Display currency</strong><small>Applied to all monetary values</small></span><select value={currency} onChange={(event) => setCurrency(event.target.value)}><option value="USD">USD - US Dollar</option><option value="CAD">CAD - Canadian Dollar</option><option value="AUD">AUD - Australian Dollar</option></select></label>
                <label className="shop-setting-row"><span><strong>Weekly operations summary</strong><small>Toggle this workspace preference</small></span><input type="checkbox" checked={weeklySummary} onChange={(event) => setWeeklySummary(event.target.checked)} /></label>
                <span className="shop-setting-confirm" role="status"><CheckCircle size={14} /> {weeklySummary ? 'Weekly summary enabled' : 'Weekly summary paused'} <i>·</i> {currency} display selected</span>
              </section>

              <footer className="shop-footer-note"><span>FIELD &amp; FORM <i aria-hidden="true">/</i> OPERATIONS</span></footer>
            </main>
          </div>
        </div>
      </div>

      <p className="ecom-disclosure">Illustrative portfolio data <span aria-hidden="true">·</span> Not connected to a live Shopify store.</p>

      <section className="ecom-capabilities" aria-labelledby="ecom-capabilities-heading">
        <div><span className="ecom-eyebrow">OPERATIONS, MADE VISIBLE</span><h2 id="ecom-capabilities-heading">The details behind a smoother store.</h2><p>A practical showcase of the day-to-day systems that keep ecommerce moving.</p></div>
        <ul>
          <li><CheckCircle size={16} /> Product catalog management</li>
          <li><CheckCircle size={16} /> Inventory monitoring</li>
          <li><CheckCircle size={16} /> Order processing & fulfillment coordination</li>
          <li><CheckCircle size={16} /> Customer experience support</li>
          <li><CheckCircle size={16} /> Sales reporting & workflow improvement</li>
        </ul>
      </section>

      {selectedProduct && (
        <div className="shop-product-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedProduct(null) }}>
          <section className="shop-product-dialog" role="dialog" aria-modal="true" aria-labelledby="shop-product-dialog-title">
            <button type="button" className="shop-product-dialog__close" onClick={() => setSelectedProduct(null)} aria-label="Close product preview"><X size={18} /></button>
            <ProductArtwork product={selectedProduct} />
            <span className="shop-section-kicker">PRODUCT DETAILS <i aria-hidden="true">/</i> {selectedProduct.category.toUpperCase()}</span>
            <h2 id="shop-product-dialog-title">{selectedProduct.name}</h2>
            <p>Product catalog details, availability, and recent sales activity.</p>
            <div className="shop-product-dialog__facts"><span>Price<strong>{formatCurrency(selectedProduct.price, currency)}</strong></span><span>Available stock<strong>{selectedProduct.stock} units</strong></span><span>Units sold<strong>{selectedProduct.sold}</strong></span></div>
            <button type="button" className="shop-primary-button" onClick={() => setSelectedProduct(null)}>Close product details</button>
          </section>
        </div>
      )}
    </section>
  )
}
