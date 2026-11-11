import { errorResponse, getIntegrationFlags, jsonResponse } from './_lib/server'

/**
 * GET integration readiness for SmartLogix.
 * Reports configuration flags only - does not claim live connectivity.
 */
export async function GET(): Promise<Response> {
  const flags = getIntegrationFlags()
  return jsonResponse({
    ok: true,
    stage: 1,
    integrations: [
      { key: 'supabase_admin', configured: flags.supabase, working: false, state: flags.supabase ? 'configured_error' : 'not_configured', message: flags.supabase ? 'Server Supabase credentials detected. Connectivity/schema not verified in Stage 1.' : 'Not configured.' },
      { key: 'shopify', configured: flags.shopify, working: false, state: flags.shopify ? 'configured_error' : 'not_configured', message: flags.shopify ? 'Webhook secret detected. Ingestion not implemented in Stage 1.' : 'Not connected.' },
      { key: 'n8n', configured: flags.n8n, working: false, state: 'not_configured', message: 'Architecture prepared only. No n8n instance or paid service connected.' },
      { key: 'gmail', configured: flags.gmail, working: false, state: flags.gmail ? 'configured_error' : 'not_configured', message: flags.gmail ? 'Credentials detected. Draft/send endpoints not enabled in Stage 1.' : 'Not connected.' },
      { key: 'carrier_tracking', configured: flags.carrierTracking, working: false, state: flags.carrierTracking ? 'configured_error' : 'not_configured', message: flags.carrierTracking ? 'Secret detected. Tracking processing not implemented in Stage 1.' : 'Not connected.' },
      { key: 'ai_openai', configured: flags.aiOpenAI, working: false, state: flags.aiOpenAI ? 'configured_error' : 'not_configured', message: flags.aiOpenAI ? 'API key detected. AI endpoints not enabled in Stage 1.' : 'Not connected.' },
      { key: 'ai_ollama', configured: flags.aiOllama, working: false, state: flags.aiOllama ? 'configured_error' : 'not_configured', message: flags.aiOllama ? 'Base URL detected. AI endpoints not enabled in Stage 1.' : 'Not connected.' },
    ],
  })
}

export function POST() {
  return errorResponse('method_not_allowed', 'Use GET for integration status.', 405)
}