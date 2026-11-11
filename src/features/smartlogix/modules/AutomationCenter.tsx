import { plannedWorkflows } from '../lib/integrations'
import type { IntegrationStatus, ModuleDefinition } from '../lib/types'

export default function AutomationCenterModule({ module, integrations }: { module: ModuleDefinition; integrations: IntegrationStatus[] }) {
  return (
    <section className="slx-module" aria-labelledby="slx-module-title">
      <header className="slx-module__head">
        <h2 id="slx-module-title">{module.label}</h2>
        <p>{module.summary}</p>
      </header>
      <div className="slx-cards slx-cards--wide">
        <article className="slx-card">
          <h3>Prepared n8n workflow architecture</h3>
          <p className="slx-note">Workflow definitions are prepared for review only. <strong>No n8n instance, paid service, or external integration is connected.</strong> Consequential actions require human approval.</p>
          <div className="slx-table-wrap">
            <table className="slx-table">
              <thead>
                <tr>
                  <th>Workflow</th>
                  <th>Status</th>
                  <th>Integrations</th>
                  <th>Approval</th>
                </tr>
              </thead>
              <tbody>
                {plannedWorkflows.map((workflow) => (
                  <tr key={workflow.key}>
                    <td>
                      <strong>{workflow.name}</strong>
                      <div className="slx-subtle">{workflow.description}</div>
                    </td>
                    <td><span className={`slx-badge slx-badge--${workflow.status}`}>{workflow.status.replace('_', ' ')}</span></td>
                    <td>{workflow.integrations.join(', ')}</td>
                    <td>{workflow.approvalsRequired ? 'Required for consequential actions' : 'Not required'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
        <article className="slx-card">
          <h3>Integration readiness</h3>
          <ul className="slx-status-list">
            {integrations.map((integration) => (
              <li key={integration.key}>
                <span className={`slx-badge slx-badge--${integration.state}`}>{integration.state.replace('_', ' ')}</span>
                <div>
                  <strong>{integration.label}</strong>
                  <div className="slx-subtle">{integration.message}</div>
                </div>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  )
}