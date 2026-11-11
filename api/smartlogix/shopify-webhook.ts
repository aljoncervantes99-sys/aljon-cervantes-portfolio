import { errorResponse } from './_lib/server'

export async function POST(): Promise<Response> {
  return errorResponse(
    'not_implemented',
    'Shopify webhook ingestion is not implemented in Stage 1. This endpoint will verify HMAC signatures, enforce idempotency, validate orders, and persist to Supabase in a later stage.',
    501,
  )
}