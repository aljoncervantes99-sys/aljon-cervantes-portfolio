import { isSupabaseConfigured } from './supabaseClient'
import { plannedIntegrations } from './integrations'
import type { IntegrationStatus } from './types'

export type SmartLogixConfig = {
  supabaseConfigured: boolean
  appUrl: string
}

export function getSmartLogixConfig(): SmartLogixConfig {
  return {
    supabaseConfigured: isSupabaseConfigured,
    appUrl: typeof window !== 'undefined' ? window.location.origin : '',
  }
}

export function getClientIntegrationStatus(): IntegrationStatus[] {
  return plannedIntegrations.map((integration) => {
    if (integration.key === 'supabase' && isSupabaseConfigured) {
      return {
        ...integration,
        state: 'configured_error',
        configured: true,
        working: false,
        message: 'Supabase environment variables are present. Running safe auth-endpoint runtime check; schema/RLS not verified and no tables created.',
      }
    }
    return integration
  })
}