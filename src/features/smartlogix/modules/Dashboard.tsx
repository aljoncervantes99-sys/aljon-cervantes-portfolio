import type { ModuleDefinition } from '../lib/types'

export default function DashboardModule({ module }: { module: ModuleDefinition }) {
  return (
    <section className="slx-module" aria-labelledby="slx-module-title">
      <header className="slx-module__head">
        <h2 id="slx-module-title">{module.label}</h2>
        <p>{module.summary}</p>
      </header>
      <div className="slx-cards">
        <article className="slx-card">
          <h3>Foundation status</h3>
          <p>SmartLogix routing, layout shell, authentication gate, and integration architecture are scaffolded in this stage. Live operational data will be connected in later stages.</p>
        </article>
        <article className="slx-card">
          <h3>Planned metrics</h3>
          <ul>
            <li>Orders received, validated, and fulfilled</li>
            <li>Inventory on hand, reserved, and low-stock alerts</li>
            <li>Shipment status, delays, and delivery exceptions</li>
            <li>Supplier purchase orders and overdue follow-ups</li>
          </ul>
        </article>
        <article className="slx-card">
          <h3>Data source</h3>
          <p><strong>Not connected.</strong> Metrics will load from Supabase PostgreSQL after project provisioning, schema migration, and secure API wiring.</p>
        </article>
      </div>
    </section>
  )
}