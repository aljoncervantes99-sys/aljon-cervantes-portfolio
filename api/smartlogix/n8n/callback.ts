import { errorResponse } from '../_lib/server'

export async function POST(): Promise<Response> {
  return errorResponse(
    'not_implemented',
    'n8n callback logging is not implemented in Stage 1. This endpoint will verify signed callbacks and record workflow execution results/errors in a later stage.',
    501,
  )
}