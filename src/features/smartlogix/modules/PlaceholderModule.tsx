import type { ModuleDefinition } from '../lib/types'

const plannedFeatures: Record<string, string[]> = {
  orders: [
    'Receive new ecommerce orders through Shopify webhooks (server-side, HMAC verified).',
    'Validate order information and check product availability.',
    'Persist orders to Supabase with idempotent processing.',
    'Update fulfillment status and trigger notifications.',
  ],
  inventory: [
    'Monitor stock changes with transactional inventory movements.',
    'Calculate available inventory and detect low-stock thresholds.',
    'Generate suggested reorder quantities and purchase order drafts.',
    'Require approval before purchase order execution.',
  ],
  shipments: [
    'Save tracking references and carrier details.',
    'Process carrier tracking updates only when a supported integration is configured.',
    'Update delivery statuses and detect shipment delays.',
    'Trigger exception notifications with execution logs.',
  ],
  suppliers: [
    'Track purchase orders and supplier delivery dates.',
    'Detect overdue orders and prepare follow-up drafts.',
    'Require human approval before sending supplier commitments.',
    'Record communication and workflow outcomes in audit logs.',
  ],
  reports: [
    'Operational KPIs from verified Supabase data.',
    'Inventory, fulfillment, shipment, and supplier performance reports.',
    'Daily logistics report generation via approved AI workflows.',
    'Export-ready summaries with clear data-source labeling.',
  ],
}

export default function PlaceholderModule({ module }: { module: ModuleDefinition }) {
  const items = plannedFeatures[module.id] ?? ['Module implementation is planned in later stages.']
  return (
    <section className="slx-module" aria-labelledby="slx-module-title">
      <header className="slx-module__head">
        <h2 id="slx-module-title">{module.label}</h2>
        <p>{module.summary}</p>
      </header>
      <div className="slx-cards">
        <article className="slx-card">
          <h3>Planned capabilities</h3>
          <ul>
            {items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
        <article className="slx-card slx-card--muted">
          <h3>Current state</h3>
          <p><strong>Stage 1 scaffold.</strong> This module is visible in the SmartLogix app but not yet connected to live data or external services. No fake records or simulated integrations are shown.</p>
        </article>
      </div>
    </section>
  )
}