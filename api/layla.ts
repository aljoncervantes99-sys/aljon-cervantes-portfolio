import { createHash } from 'node:crypto'
import { isIP } from 'node:net'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

type ApiRequest = IncomingMessage & { body?: unknown }
type ApiResponse = ServerResponse & {
  status: (code: number) => ApiResponse
  json: (body: unknown) => void
}

const MAX_BODY_BYTES = 16_000
const MAX_MESSAGES = 12
const MAX_MESSAGE_LENGTH = 1_000
const REQUEST_TIMEOUT_MS = 20_000
const DEFAULT_MODEL = 'gpt-4o-mini'
const DEFAULT_RATE_LIMIT_REQUESTS = 10
const DEFAULT_RATE_LIMIT_WINDOW_SECONDS = 600
const MAX_RATE_LIMIT_REQUESTS = 10_000
const MAX_RATE_LIMIT_WINDOW_SECONDS = 86_400

function respond(res: ApiResponse, status: number, body: unknown) {
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  return res.status(status).json(body)
}

function getClientKey(req: ApiRequest) {
  const forwardedFor = req.headers['x-forwarded-for']
  const forwardedIp = typeof forwardedFor === 'string'
    ? forwardedFor.split(',')[0].trim()
    : undefined
  const candidate = forwardedIp || req.socket.remoteAddress
  if (!candidate || isIP(candidate) === 0) return null

  return createHash('sha256').update(candidate).digest('hex')
}

function parsePositiveInteger(value: string | undefined, defaultValue: number, maximum: number) {
  if (value === undefined) return defaultValue
  const normalized = value.trim()
  if (!/^[1-9]\d*$/.test(normalized)) return null

  const parsed = Number(normalized)
  return Number.isSafeInteger(parsed) && parsed <= maximum ? parsed : null
}

function getRateLimitSettings() {
  const requests = parsePositiveInteger(
    process.env.LAYLA_RATE_LIMIT_REQUESTS,
    DEFAULT_RATE_LIMIT_REQUESTS,
    MAX_RATE_LIMIT_REQUESTS,
  )
  const windowSeconds = parsePositiveInteger(
    process.env.LAYLA_RATE_LIMIT_WINDOW_SECONDS,
    DEFAULT_RATE_LIMIT_WINDOW_SECONDS,
    MAX_RATE_LIMIT_WINDOW_SECONDS,
  )

  return requests && windowSeconds ? { requests, windowSeconds } : null
}

function createRateLimiter(requests: number, windowSeconds: number) {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim()
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  if (!url || !token) return null

  return new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(requests, `${windowSeconds} s`),
    prefix: 'layla:ratelimit',
    analytics: false,
    ephemeralCache: false,
    timeout: 0,
  })
}

let rateLimiter: ReturnType<typeof createRateLimiter> | undefined

function getRateLimiter(requests: number, windowSeconds: number) {
  if (rateLimiter === undefined) {
    rateLimiter = createRateLimiter(requests, windowSeconds)
  }
  return rateLimiter
}

function parseMessages(body: unknown): ChatMessage[] | null {
  if (!body || typeof body !== 'object' || !('messages' in body)) return null

  const { messages } = body as { messages?: unknown }
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) {
    return null
  }

  const normalized: ChatMessage[] = []
  for (const [index, message] of messages.entries()) {
    if (!message || typeof message !== 'object') return null
    const candidate = message as { role?: unknown; content?: unknown }
    const expectedRole: ChatMessage['role'] = index % 2 === 0 ? 'user' : 'assistant'
    const role = candidate.role
    if (
      (role !== 'user' && role !== 'assistant') ||
      role !== expectedRole ||
      typeof candidate.content !== 'string'
    ) {
      return null
    }

    const content = candidate.content.trim()
    if (!content || content.length > MAX_MESSAGE_LENGTH) return null
    normalized.push({ role, content })
  }

  if (normalized[normalized.length - 1].role !== 'user') return null
  return normalized
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return respond(res, 405, { error: { code: 'method_not_allowed', message: 'Use POST.' } })
  }

  const origin = req.headers.origin
  const host = req.headers['x-forwarded-host'] ?? req.headers.host
  try {
    if (
      typeof origin !== 'string' ||
      !host ||
      new URL(origin).host !== String(host).split(',')[0].trim()
    ) {
      return respond(res, 403, { error: { code: 'forbidden_origin', message: 'Request origin is not allowed.' } })
    }
  } catch {
    return respond(res, 403, { error: { code: 'forbidden_origin', message: 'Request origin is not allowed.' } })
  }

  const fetchSite = req.headers['sec-fetch-site']
  if (typeof fetchSite === 'string' && fetchSite !== 'same-origin' && fetchSite !== 'none') {
    return respond(res, 403, { error: { code: 'forbidden_origin', message: 'Cross-site chat requests are not allowed.' } })
  }

  if (!req.headers['content-type']?.toLowerCase().includes('application/json')) {
    return respond(res, 415, { error: { code: 'unsupported_media_type', message: 'Send a JSON request.' } })
  }

  const declaredLength = Number(req.headers['content-length'] ?? 0)
  if (declaredLength > MAX_BODY_BYTES) {
    return respond(res, 413, { error: { code: 'request_too_large', message: 'The conversation is too long.' } })
  }

  let body: unknown = req.body
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body)
    } catch {
      return respond(res, 400, { error: { code: 'invalid_json', message: 'The request body must be valid JSON.' } })
    }
  }
  if (body === undefined || body === null) {
    return respond(res, 400, { error: { code: 'invalid_body', message: 'A JSON conversation is required.' } })
  }

  let serializedBody: string
  try {
    serializedBody = JSON.stringify(body)
  } catch {
    return respond(res, 400, { error: { code: 'invalid_body', message: 'The request body could not be read.' } })
  }
  if (Buffer.byteLength(serializedBody, 'utf8') > MAX_BODY_BYTES) {
    return respond(res, 413, { error: { code: 'request_too_large', message: 'The conversation is too long.' } })
  }

  const messages = parseMessages(body)
  if (!messages) {
    return respond(res, 400, {
      error: {
        code: 'invalid_messages',
        message: 'Send up to 12 user/assistant messages, ending with a user message.',
      },
    })
  }

  if (!process.env.OPENAI_API_KEY) {
    return respond(res, 503, {
      error: {
        code: 'not_configured',
        message: 'The Layla AI service is not configured. Demo replies remain available.',
      },
    })
  }

  const settings = getRateLimitSettings()
  if (!settings) {
    return respond(res, 503, {
      error: {
        code: 'rate_limit_misconfigured',
        message: 'The chat rate limiter is not configured correctly.',
      },
    })
  }

  const clientKey = getClientKey(req)
  if (!clientKey) {
    return respond(res, 503, {
      error: { code: 'client_ip_unavailable', message: 'The request could not be safely rate-limited.' },
    })
  }

  try {
    const limiter = getRateLimiter(settings.requests, settings.windowSeconds)
    if (!limiter) {
      return respond(res, 503, {
        error: {
          code: 'rate_limit_not_configured',
          message: 'The chat rate limiter is not configured.',
        },
      })
    }

    const result = await limiter.limit(clientKey)
    if (result.reason === 'timeout') {
      console.error('Layla rate-limit check timed out; refusing the AI request.')
      return respond(res, 503, {
        error: {
          code: 'rate_limit_unavailable',
          message: 'The chat is temporarily unavailable because rate limiting could not be verified.',
        },
      })
    }
    if (!result.success) {
      res.setHeader('Retry-After', String(Math.max(1, Math.ceil((result.reset - Date.now()) / 1_000))))
      return respond(res, 429, {
        error: {
          code: 'rate_limited',
          message: 'Too many chat requests. Please wait before trying again.',
        },
      })
    }
  } catch {
    console.error('Layla rate-limit service is unavailable; refusing the AI request.')
    return respond(res, 503, {
      error: {
        code: 'rate_limit_unavailable',
        message: 'The chat is temporarily unavailable because rate limiting could not be verified.',
      },
    })
  }

  const model = process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        max_tokens: 300,
        messages: [
          {
            role: 'system',
            content:
              'You are Layla, the portfolio assistant for Aljon Cervantes. Answer briefly and accurately about his services, skills, projects, and hiring. Services include Ecommerce VA, Shopify store management, web development, graphics design, social media management, and Medical VA. Tools include Shopify, Salesforce, GoHighLevel, Canva, Excel, Google Sheets, React, JavaScript, HTML5, CSS3, GitHub, Vercel, ChatGPT, Claude, Zapier, and n8n. Projects include Shopify Ecommerce Operations, Pearl White hospitality website and booking experience, and GoHighLevel CRM and automation workflows. Direct visitors to the portfolio contact form to hire him. Do not invent qualifications, guarantees, or project details.',
          },
          ...messages,
        ],
      }),
      signal: controller.signal,
    })

    const payload: unknown = await upstream.json().catch(() => null)
    if (!upstream.ok) {
      const error = payload && typeof payload === 'object' && 'error' in payload
        ? (payload as { error?: { code?: unknown } }).error
        : undefined
      const code = typeof error?.code === 'string' ? error.code : ''

      if (code === 'insufficient_quota' || code === 'billing_not_active') {
        return respond(res, 402, {
          error: {
            code: 'billing_not_configured',
            message: 'OpenAI billing or usage is not available. Demo replies will be used instead.',
          },
        })
      }
      if (upstream.status === 429) {
        return respond(res, 429, {
          error: { code: 'rate_limited', message: 'OpenAI is rate-limiting requests. Try again shortly.' },
        })
      }
      if (upstream.status === 401) {
        return respond(res, 503, {
          error: { code: 'invalid_api_key', message: 'The server-side OpenAI key is unavailable or invalid.' },
        })
      }
      return respond(res, 502, {
        error: { code: 'upstream_unavailable', message: 'OpenAI is temporarily unavailable.' },
      })
    }

    const reply = payload && typeof payload === 'object' && 'choices' in payload
      ? (payload as { choices?: Array<{ message?: { content?: unknown } }> }).choices?.[0]?.message?.content
      : undefined
    if (typeof reply !== 'string' || !reply.trim()) {
      return respond(res, 502, {
        error: { code: 'invalid_upstream_response', message: 'The AI service returned no response.' },
      })
    }

    return respond(res, 200, { reply: reply.trim().slice(0, 4_000), model })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return respond(res, 504, {
        error: { code: 'upstream_timeout', message: 'The AI service took too long to respond.' },
      })
    }
    return respond(res, 502, {
      error: { code: 'upstream_unavailable', message: 'The AI service could not be reached.' },
    })
  } finally {
    clearTimeout(timeout)
  }
}
