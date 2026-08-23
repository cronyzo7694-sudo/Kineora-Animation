import { describe, expect, it, vi } from 'vitest'
import type { CompleteRequest } from './adapters'
import { AiError, createAdapters } from './adapters'
import type { ProviderConfig, ProviderType } from './providers'
import { clearSecretRegistry } from './redact'

const KEY = 'sk-testkey-abcdef123456'

function cfg(over: Partial<ProviderConfig> & { type: ProviderType }): ProviderConfig {
  return { id: 'c1', label: 'L', model: 'm', createdAt: 1, ...over }
}

function jsonResponse(status: number, body: unknown, headers?: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...(headers ?? {}) },
  })
}

type FetchMock = ReturnType<typeof vi.fn> & ((url: string, init?: RequestInit) => Promise<Response>)

function fetchQueue(...responses: Array<Response | (() => never)>): FetchMock {
  const queue = [...responses]
  return vi.fn(async () => {
    const next = queue.shift()
    if (!next) throw new Error('unexpected extra fetch')
    if (typeof next === 'function') return next()
    return next
  }) as FetchMock
}

function callsOf(fetchFn: FetchMock): Array<{ url: string; init?: RequestInit }> {
  return fetchFn.mock.calls.map(
    ([url, init]) => ({ url: url as string, init: init as RequestInit | undefined }),
  )
}

function bodyOf(call: { init?: RequestInit }): Record<string, unknown> {
  return JSON.parse(String(call.init?.body)) as Record<string, unknown>
}

function headersOf(call: { init?: RequestInit }): Record<string, string> {
  return (call.init?.headers ?? {}) as Record<string, string>
}

const PLAN_SCHEMA = { name: 'kineora_plan', schema: { type: 'object', properties: {} } }
const REQ: CompleteRequest = {
  messages: [
    { role: 'system', content: 'SYS' },
    { role: 'user', content: 'red ball bounce' },
  ],
  jsonSchema: PLAN_SCHEMA,
}

// ---------------------------------------------------------------------------
describe('openai adapter', () => {
  const c = cfg({ type: 'openai', model: 'gpt-4o-mini' })

  it('sends the strict-schema chat-completions request; parses text + usage', async () => {
    const fetchFn = fetchQueue(
      jsonResponse(200, {
        choices: [{ message: { content: '{"plan":[]}' } }],
        usage: { prompt_tokens: 11, completion_tokens: 7 },
      }),
    )
    const adapters = createAdapters({ fetchFn, sleep: async () => {} })
    const res = await adapters.openai.complete(c, KEY, REQ)

    const calls = callsOf(fetchFn)
    expect(calls[0].url).toBe('https://api.openai.com/v1/chat/completions')
    expect(headersOf(calls[0])).toMatchObject({
      authorization: `Bearer ${KEY}`,
      'content-type': 'application/json',
    })
    const body = bodyOf(calls[0])
    expect(body.model).toBe('gpt-4o-mini')
    expect((body.messages as unknown[]).length).toBe(2)
    expect(JSON.stringify(body.response_format)).toContain('kineora_plan')
    expect(JSON.stringify(body.response_format)).toContain('"strict":true')

    expect(res.text).toBe('{"plan":[]}')
    expect(res.usage).toEqual({ inputTokens: 11, outputTokens: 7 })
    expect(res.structured).toBe('schema')
  })

  it('degrades LOUDLY once when the provider refuses response_format', async () => {
    const fetchFn = fetchQueue(
      jsonResponse(400, { error: { message: 'Unknown parameter: response_format' } }),
      jsonResponse(200, { choices: [{ message: { content: '{"plan":[{"x":1}]}' } }] }),
    )
    const adapters = createAdapters({ fetchFn, sleep: async () => {} })
    const res = await adapters.openai.complete(c, KEY, REQ)

    const calls = callsOf(fetchFn)
    expect(calls.length).toBe(2)
    expect('response_format' in bodyOf(calls[1])).toBe(false)
    expect(res.structured).toBe('degraded')
    expect(res.text).toContain('"plan"')
  })

  it('maps 401 to auth and NEVER echoes the key in the error message', async () => {
    const fetchFn = fetchQueue(
      jsonResponse(401, { error: { message: `invalid key ${KEY} provided` } }),
    )
    const adapters = createAdapters({ fetchFn, sleep: async () => {} })
    const err = (await adapters.openai.complete(c, KEY, REQ).catch((e) => e)) as AiError
    expect(err).toBeInstanceOf(AiError)
    expect(err.kind).toBe('auth')
    // redaction guarantee: the key must never appear in error text
    expect(err.message).not.toContain(KEY)
    expect(err.message).toContain('[REDACTED]')
    expect(err.message).toContain('API key')
  })

  it('retries 429 with bounded backoff, then succeeds', async () => {
    const sleeps: number[] = []
    const fetchFn = fetchQueue(
      jsonResponse(429, { error: { message: 'slow down' } }),
      jsonResponse(200, { choices: [{ message: { content: 'ok' } }] }),
    )
    const adapters = createAdapters({ fetchFn, sleep: async (ms) => void sleeps.push(ms) })
    const res = await adapters.openai.complete(c, KEY, { ...REQ, jsonSchema: undefined })
    expect(res.text).toBe('ok')
    expect(res.structured).toBe('none')
    expect(sleeps).toEqual([800])
  })

  it('gives up after maxRetries on persistent 429', async () => {
    const fetchFn = fetchQueue(
      jsonResponse(429, { error: { message: 'rl' } }),
      jsonResponse(429, { error: { message: 'rl' } }),
      jsonResponse(429, { error: { message: 'rl' } }),
      jsonResponse(429, { error: { message: 'rl' } }),
    )
    const adapters = createAdapters({ fetchFn, sleep: async () => {} })
    const err = (await adapters.openai
      .complete(c, KEY, { ...REQ, jsonSchema: undefined })
      .catch((e) => e)) as AiError
    expect(err.kind).toBe('rate')
    expect(callsOf(fetchFn).length).toBe(3) // 1 initial + 2 retries, then stop
  })

  it('maps network throws to a network kind with CORS hint', async () => {
    const fetchFn = fetchQueue(() => {
      throw new TypeError('Failed to fetch')
    })
    const adapters = createAdapters({ fetchFn, sleep: async () => {} })
    const err = (await adapters.openai
      .complete(c, KEY, { ...REQ, jsonSchema: undefined })
      .catch((e) => e)) as AiError
    expect(err.kind).toBe('network')
    expect(err.message).toContain('Network')
  })

  it('maps abort to the aborted kind', async () => {
    const fetchFn = fetchQueue(() => {
      throw new DOMException('sig', 'AbortError')
    })
    const adapters = createAdapters({ fetchFn, sleep: async () => {} })
    const err = (await adapters.openai
      .complete(c, KEY, { ...REQ, jsonSchema: undefined })
      .catch((e) => e)) as AiError
    expect(err.kind).toBe('aborted')
  })
})

// ---------------------------------------------------------------------------
describe('anthropic adapter', () => {
  const c = cfg({ type: 'anthropic', model: 'claude-haiku-4-5' })

  it('uses forced tool-use for strict JSON; browser-direct header present', async () => {
    const fetchFn = fetchQueue(
      jsonResponse(200, {
        content: [{ type: 'tool_use', input: { plan: [] } }],
        usage: { input_tokens: 5, output_tokens: 9 },
      }),
    )
    const adapters = createAdapters({ fetchFn, sleep: async () => {} })
    const res = await adapters.anthropic.complete(c, KEY, REQ)

    const calls = callsOf(fetchFn)
    expect(calls[0].url).toBe('https://api.anthropic.com/v1/messages')
    const headers = headersOf(calls[0])
    expect(headers['x-api-key']).toBe(KEY)
    expect(headers['anthropic-version']).toBe('2023-06-01')
    expect(headers['anthropic-dangerous-direct-browser-access']).toBe('true')

    const body = bodyOf(calls[0])
    expect(body.system).toBe('SYS')
    expect(body.messages).toEqual([{ role: 'user', content: 'red ball bounce' }])
    expect(JSON.stringify(body.tools)).toContain('kineora_plan')
    expect(JSON.stringify(body.tool_choice)).toContain('kineora_plan')

    expect(res.text).toBe('{"plan":[]}')
    expect(res.usage).toEqual({ inputTokens: 5, outputTokens: 9 })
    expect(res.structured).toBe('schema')
  })

  it('joins text blocks when no schema requested', async () => {
    const fetchFn = fetchQueue(
      jsonResponse(200, { content: [{ type: 'text', text: 'namaste' }] }),
    )
    const adapters = createAdapters({ fetchFn, sleep: async () => {} })
    const res = await adapters.anthropic.complete(c, KEY, { ...REQ, jsonSchema: undefined })
    expect(res.text).toBe('namaste')
    expect(res.structured).toBe('none')
  })

  it('testConnection uses the 1-token messages probe', async () => {
    const fetchFn = fetchQueue(jsonResponse(200, { content: [{ type: 'text', text: '' }] }))
    const adapters = createAdapters({ fetchFn, sleep: async () => {} })
    const res = await adapters.anthropic.testConnection(c, KEY)
    expect(res.ok).toBe(true)
    const body = bodyOf(callsOf(fetchFn)[0])
    expect(callsOf(fetchFn)[0].url).toContain('/v1/messages')
    expect(body.max_tokens).toBe(1)
  })
})

// ---------------------------------------------------------------------------
describe('gemini adapter', () => {
  const c = cfg({ type: 'gemini', model: 'gemini-2.5-flash' })

  it('key travels in the HEADER, never in the URL', async () => {
    const fetchFn = fetchQueue(
      jsonResponse(200, {
        candidates: [{ content: { parts: [{ text: '{"plan":[]}' }] } }],
        usageMetadata: { promptTokenCount: 3, candidatesTokenCount: 4 },
      }),
    )
    const adapters = createAdapters({ fetchFn, sleep: async () => {} })
    const res = await adapters.gemini.complete(c, KEY, REQ)

    const calls = callsOf(fetchFn)
    expect(calls[0].url).toBe(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
    )
    expect(calls[0].url).not.toContain(KEY)
    expect(calls[0].url).not.toContain('key=')
    expect(headersOf(calls[0])['x-goog-api-key']).toBe(KEY)

    const body = bodyOf(calls[0])
    expect(JSON.stringify(body.generationConfig)).toContain('application/json')
    expect(JSON.stringify(body.generationConfig)).toContain('responseSchema')

    expect(res.text).toBe('{"plan":[]}')
    expect(res.usage).toEqual({ inputTokens: 3, outputTokens: 4 })
    expect(res.structured).toBe('schema')
  })
})

// ---------------------------------------------------------------------------
describe('openai-compatible adapter', () => {
  it('rejects without an endpoint (config error, no fetch)', async () => {
    const fetchFn = fetchQueue()
    const adapters = createAdapters({ fetchFn, sleep: async () => {} })
    const err = (await adapters['openai-compatible']
      .complete(cfg({ type: 'openai-compatible' }), KEY, { ...REQ, jsonSchema: undefined })
      .catch((e) => e)) as AiError
    expect(err.kind).toBe('config')
    expect(callsOf(fetchFn).length).toBe(0) // no network call on config error
  })

  it('uses the custom endpoint with the OpenAI wire shape', async () => {
    const fetchFn = fetchQueue(
      jsonResponse(200, { choices: [{ message: { content: 'hi' } }] }),
    )
    const adapters = createAdapters({ fetchFn, sleep: async () => {} })
    const res = await adapters['openai-compatible'].complete(
      cfg({ type: 'openai-compatible', endpoint: 'http://localhost:11434/', model: 'llama3' }),
      KEY,
      { ...REQ, jsonSchema: undefined },
    )
    expect(callsOf(fetchFn)[0].url).toBe('http://localhost:11434/v1/chat/completions')
    expect(res.text).toBe('hi')
  })
})

// ---------------------------------------------------------------------------
describe('testConnection across providers', () => {
  it('openai: GET /v1/models, reports model availability', async () => {
    const fetchFn = fetchQueue(jsonResponse(200, { data: [{ id: 'gpt-4o-mini' }, { id: 'x' }] }))
    const adapters = createAdapters({ fetchFn, sleep: async () => {} })
    const res = await adapters.openai.testConnection(cfg({ type: 'openai', model: 'gpt-4o-mini' }), KEY)
    expect(res.ok).toBe(true)
    expect(res.detail).toContain('model available')
    expect(headersOf(callsOf(fetchFn)[0]).authorization).toBe(`Bearer ${KEY}`)
  })

  it('openai: 401 → ok:false with a redacted human message', async () => {
    const fetchFn = fetchQueue(jsonResponse(401, { error: { message: `bad key ${KEY}` } }))
    const adapters = createAdapters({ fetchFn, sleep: async () => {} })
    const res = await adapters.openai.testConnection(cfg({ type: 'openai', model: 'm' }), KEY)
    expect(res.ok).toBe(false)
    expect(res.status).toBe(401)
    expect(res.detail ?? '').not.toContain(KEY)
    expect(res.detail ?? '').toContain('API key')
  })

  it('gemini: GET /v1beta/models with header key', async () => {
    const fetchFn = fetchQueue(jsonResponse(200, { models: [] }))
    const adapters = createAdapters({ fetchFn, sleep: async () => {} })
    const res = await adapters.gemini.testConnection(cfg({ type: 'gemini', model: 'g' }), KEY)
    expect(res.ok).toBe(true)
    const call = callsOf(fetchFn)[0]
    expect(call.url).toContain('/v1beta/models')
    expect(call.url).not.toContain('key=')
    expect(headersOf(call)['x-goog-api-key']).toBe(KEY)
  })

  it('compatible without endpoint: ok:false, zero network calls', async () => {
    const fetchFn = fetchQueue()
    const adapters = createAdapters({ fetchFn, sleep: async () => {} })
    const res = await adapters['openai-compatible'].testConnection(
      cfg({ type: 'openai-compatible' }),
      KEY,
    )
    expect(res.ok).toBe(false)
    expect(callsOf(fetchFn).length).toBe(0)
  })
})

// Secret registry hygiene across tests.
clearSecretRegistry()
