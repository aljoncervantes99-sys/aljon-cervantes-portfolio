/**
 * SmartLogix secure server-side scaffolding (Stage 1).
 * External integrations must be implemented behind /api endpoints.
 * Never import service-role keys or third-party secrets into frontend code.
 */

export type ApiError = {
  code: string
  message: string
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  })
}

export function errorResponse(code: string, message: string, status = 400): Response {
  return jsonResponse({ ok: false, error: { code, message } satisfies ApiError }, status)
}

export function getIntegrationFlags() {
  return {
    supabase: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
    n8n: Boolean(process.env.SMARTLOGIX_N8N_CALLBACK_SECRET),
    shopify: Boolean(process.env.SHOPIFY_WEBHOOK_SECRET),
    gmail: Boolean(process.env.GMAIL_CLIENT_ID && process.env.GMAIL_CLIENT_SECRET && process.env.GMAIL_REFRESH_TOKEN),
    aiOpenAI: Boolean(process.env.OPENAI_API_KEY),
    aiOllama: Boolean(process.env.OLLAMA_BASE_URL),
    carrierTracking: Boolean(process.env.CARRIER_TRACKING_WEBHOOK_SECRET),
  }
}