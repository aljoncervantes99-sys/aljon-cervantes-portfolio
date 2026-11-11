import type { IntegrationStatus, ModuleDefinition } from '../lib/types'

export default function AIAssistantModule({ module, integrations }: { module: ModuleDefinition; integrations: IntegrationStatus[] }) {
  const ai = integrations.find((integration) => integration.key === 'ai')
  return (
    <section className="slx-module" aria-labelledby="slx-module-title">
      <header className="slx-module__head">
        <h2 id="slx-module-title">{module.label}</h2>
        <p>{module.summary}</p>
      </header>
      <div className="slx-cards">
        <article className="slx-card">
          <h3>Planned AI operations</h3>
          <ul>
            <li>Extract information from purchase order documents.</li>
            <li>Summarize operational issues across orders, inventory, and shipments.</li>
            <li>Recommend inventory replenishment based on verified data.</li>
            <li>Draft supplier follow-ups and daily logistics reports for review.</li>
          </ul>
        </article>
        <article className="slx-card slx-card--muted">
          <h3>Provider status</h3>
          <p><span className={`slx-badge slx-badge--${ai?.state ?? 'not_configured'}`}>{(ai?.state ?? 'not_configured').replace('_', ' ')}</span></p>
          <p>{ai?.message ?? 'No AI provider configured.'}</p>
          <p className="slx-subtle">AI calls will be handled through secure server-side endpoints only. Optional providers: Ollama or OpenAI.</p>
        </article>
      </div>
    </section>
  )
}