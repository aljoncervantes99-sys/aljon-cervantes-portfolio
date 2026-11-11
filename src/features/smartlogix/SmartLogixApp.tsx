import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { ArrowUpRight, ChartBar, Lightning, ListBullets, Package, Robot, ShoppingBag, Truck, UsersThree } from '@/components/slab'
import { getClientIntegrationStatus, getSmartLogixConfig } from './lib/config'
import { checkSupabaseConnection, getSupabaseClient, isSupabaseConfigured, type SupabaseConnectionCheck } from './lib/supabaseClient'
import type { IntegrationStatus, ModuleDefinition, ModuleId } from './lib/types'
import DashboardModule from './modules/Dashboard'
import PlaceholderModule from './modules/PlaceholderModule'
import AutomationCenterModule from './modules/AutomationCenter'
import AIAssistantModule from './modules/AIAssistant'

const MODULES: ModuleDefinition[] = [
  { id: 'dashboard', label: 'Logistics Dashboard', summary: 'Operational overview for orders, inventory, shipments, suppliers, and automation health.', status: 'foundation' },
  { id: 'orders', label: 'Order Management', summary: 'Shopify order intake, validation, fulfillment status, and exception handling.', status: 'planned' },
  { id: 'inventory', label: 'Inventory Management', summary: 'Stock levels, movements, low-stock alerts, and replenishment planning.', status: 'planned' },
  { id: 'shipments', label: 'Shipment Tracking', summary: 'Tracking references, carrier updates, delivery statuses, and delay detection.', status: 'planned' },
  { id: 'suppliers', label: 'Supplier Management', summary: 'Purchase orders, supplier timelines, overdue detection, and approved follow-ups.', status: 'planned' },
  { id: 'automation', label: 'Automation Center', summary: 'n8n workflow architecture, execution logs, approvals, and integration readiness.', status: 'foundation' },
  { id: 'ai', label: 'AI Operations Assistant', summary: 'PO extraction, issue summaries, replenishment recommendations, and report drafts.', status: 'foundation' },
  { id: 'reports', label: 'Reports & Analytics', summary: 'Verified operational reports and KPIs from Supabase-backed data.', status: 'planned' },
]

const MODULE_ICONS = {
  dashboard: ChartBar,
  orders: ListBullets,
  inventory: Package,
  shipments: Truck,
  suppliers: UsersThree,
  automation: Lightning,
  ai: Robot,
  reports: ShoppingBag,
} as const

function IntegrationBadge({ state }: { state: string }) {
  return <span className={`slx-badge slx-badge--${state}`}>{state.replaceAll('_', ' ')}</span>
}

export default function SmartLogixApp() {
  const [activeModule, setActiveModule] = useState<ModuleId>('dashboard')
  const [session, setSession] = useState<Session | null>(null)
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured)
  const [connectionCheck, setConnectionCheck] = useState<SupabaseConnectionCheck | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState<string | null>(null)
  const [authBusy, setAuthBusy] = useState(false)

  const supabase = useMemo(() => getSupabaseClient(), [])
  const config = useMemo(() => getSmartLogixConfig(), [])
  const baseIntegrations = useMemo(() => getClientIntegrationStatus(), [])
  const integrations = useMemo<IntegrationStatus[]>(
    () =>
      baseIntegrations.map((integration) => {
        if (integration.key !== 'supabase' || !isSupabaseConfigured) return integration
        if (!connectionCheck) return integration
        if (connectionCheck.ok) {
          return {
            ...integration,
            state: 'configured_working',
            configured: true,
            working: true,
            message: connectionCheck.message,
          }
        }
        return {
          ...integration,
          state: 'configured_error',
          configured: true,
          working: false,
          message: connectionCheck.message,
        }
      }),
    [baseIntegrations, connectionCheck],
  )
  const active = MODULES.find((module) => module.id === activeModule) ?? MODULES[0]

  useEffect(() => {
    if (!supabase) return
    let mounted = true
    void checkSupabaseConnection().then((result) => {
      if (!mounted) return
      setConnectionCheck(result)
    })
    supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      if (!mounted) return
      setSession(data.session)
      setAuthReady(true)
    })
    const { data: subscription } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, nextSession: Session | null) => {
      setSession(nextSession)
      setAuthReady(true)
    })
    return () => {
      mounted = false
      subscription.subscription.unsubscribe()
    }
  }, [supabase])

  const signIn = async (event: FormEvent) => {
    event.preventDefault()
    if (!supabase) return
    setAuthBusy(true)
    setAuthError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setAuthError(error.message)
    setAuthBusy(false)
  }

  const signOut = async () => {
    if (!supabase) return
    await supabase.auth.signOut()
  }

  const moduleContent = (() => {
    switch (active.id) {
      case 'dashboard':
        return <DashboardModule module={active} />
      case 'automation':
        return <AutomationCenterModule module={active} integrations={integrations} />
      case 'ai':
        return <AIAssistantModule module={active} integrations={integrations} />
      default:
        return <PlaceholderModule module={active} />
    }
  })()

  if (!config.supabaseConfigured) {
    return (
      <div className="slx">
        <section className="slx-auth" aria-labelledby="slx-title">
          <div className="slx-auth__card">
            <p className="slx-eyebrow">SmartLogix AI · Stage 1 foundation</p>
            <h1 id="slx-title">Logistics &amp; Supply Chain Operations</h1>
            <p>SmartLogix AI is scaffolded inside this portfolio project. Database, authentication, automation, and external integrations are <strong>not configured</strong> yet.</p>
            <div className="slx-notice slx-notice--warn">
              <strong>Supabase not configured.</strong> Create a dedicated Supabase project, then set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> in a local <code>.env</code> file (see <code>.env.example</code>). Do not place service-role keys or third-party secrets in frontend env vars.
            </div>
            <div className="slx-auth__actions">
              <Link className="slx-btn slx-btn--ghost" to="/projects">Back to projects <ArrowUpRight size={14} weight="bold" aria-hidden="true" /></Link>
            </div>
          </div>
          <aside className="slx-auth__aside">
            <h2>Integration status</h2>
            <ul className="slx-status-list">
              {integrations.map((integration) => (
                <li key={integration.key}>
                  <IntegrationBadge state={integration.state} />
                  <div>
                    <strong>{integration.label}</strong>
                    <div className="slx-subtle">{integration.message}</div>
                  </div>
                </li>
              ))}
            </ul>
          </aside>
        </section>
      </div>
    )
  }

  if (!authReady) {
    return <div className="slx"><div className="slx-loading">Checking SmartLogix session…</div></div>
  }

  if (!session) {
    return (
      <div className="slx">
        <section className="slx-auth" aria-labelledby="slx-title">
          <form className="slx-auth__card slx-form" onSubmit={signIn}>
            <p className="slx-eyebrow">SmartLogix AI</p>
            <h1 id="slx-title">Operator sign in</h1>
            <p>Sign in with Supabase Auth (email and password) to access the SmartLogix operations workspace.</p>
            <label>
              <span>Email</span>
              <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label>
              <span>Password</span>
              <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </label>
            {authError && <p className="slx-form__error" role="alert">{authError}</p>}
            <button className="slx-btn" type="submit" disabled={authBusy}>{authBusy ? 'Signing in…' : 'Sign in'}</button>
            <p className="slx-subtle">No account creation is exposed in the UI. Provision operators in your dedicated Supabase project.</p>
            <Link className="slx-btn slx-btn--ghost" to="/projects">Back to projects</Link>
          </form>
          <aside className="slx-auth__aside">
            <h2>Environment</h2>
            <p><IntegrationBadge state={integrations.find((i) => i.key === 'supabase')?.state ?? 'not_configured'} /> {integrations.find((i) => i.key === 'supabase')?.message ?? 'Supabase status unavailable.'}</p>
          </aside>
        </section>
      </div>
    )
  }

  return (
    <div className="slx">
      <header className="slx-topbar">
        <div>
          <p className="slx-eyebrow">SmartLogix AI · Ecommerce logistics &amp; supply chain automation</p>
          <h1>Operations workspace</h1>
        </div>
        <div className="slx-topbar__actions">
          <span className="slx-user">{session.user.email}</span>
          <button type="button" className="slx-btn slx-btn--ghost" onClick={signOut}>Sign out</button>
        </div>
      </header>

      <div className="slx-layout">
        <nav className="slx-nav" aria-label="SmartLogix modules">
          {MODULES.map((module) => {
            const Icon = MODULE_ICONS[module.id]
            return (
              <button
                key={module.id}
                type="button"
                className={`slx-nav__item${activeModule === module.id ? ' is-active' : ''}`}
                onClick={() => setActiveModule(module.id)}
                aria-current={activeModule === module.id ? 'page' : undefined}
              >
                <Icon size={18} weight="duotone" aria-hidden="true" />
                <span>{module.label}</span>
                <small>{module.status === 'foundation' ? 'Stage 1' : 'Planned'}</small>
              </button>
            )
          })}
        </nav>

        <main className="slx-main">
          <div className="slx-integration-strip" aria-label="Integration status">
            {integrations.map((integration) => (
              <div key={integration.key} className="slx-integration-strip__item" title={integration.message}>
                <span>{integration.label}</span>
                <IntegrationBadge state={integration.state} />
              </div>
            ))}
          </div>
          {moduleContent}
        </main>
      </div>
    </div>
  )
}