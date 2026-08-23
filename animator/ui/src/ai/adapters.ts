// ===========================================================================
// AI ADAPTERS — provider layer (A2 / D-0010 / spec 11 + 17). Plain fetch, NO
// SDKs. One narrow interface for every provider so the orchestrator (A6) and
// any future provider changes stay generic:
//
//     complete(cfg, key, request)  →  { text, usage, structured }
//     testConnection(cfg, key)     →  { ok, latencyMs, status?, detail? }
//
// Rules (binding):
//   • Keys travel ONLY in auth headers (never URLs — Gemini uses the
//     x-goog-api-key header, not the documented ?key= fallback).
//   • Every thrown error is an AiError whose message passed through redact.ts.
//   • Structured output uses each provider's strongest mechanism; where a
//     provider/model can't honor it, we degrade ONCE loudly (result.structured
//     flips to 'degraded') — never silently.
//   • Generic by construction: nothing here assumes a specific model name;
//     endpoint/model come from the config; new providers = new adapter entry.
// ===========================================================================

import type { ProviderConfig, ProviderType } from './providers'
import { DEFAULT_ENDPOINTS } from './providers'
import { redactErrorMessage, redactText } from './redact'

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface CompleteRequest {
  messages: ChatMessage[]
  /** When present, the adapter asks the provider for schema-strict JSON. */
  jsonSchema?: { name: string; schema: Record<string, unknown> }
  maxTokens?: number
  signal?: AbortSignal
}

export interface TokenUsage {
  inputTokens?: number
  outputTokens?: number
}

export interface CompleteResult {
  text: string
  usage?: TokenUsage
  /**
   * 'schema'   → provider enforced the JSON schema,
   * 'degraded' → provider/model refused schema mode; we retried without it
   *              (the caller MUST surface this — spec 11 "loud degradation"),
   * 'none'     → no schema was requested.
   */
  structured: 'schema' | 'degraded' | 'none'
}

export type AiErrorKind =
  | 'auth'
  | 'not-found'
  | 'rate'
  | 'server'
  | 'http'
  | 'network'
  | 'bad-response'
  | 'aborted'
  | 'config'

export class AiError extends Error {
  readonly kind: AiErrorKind
  readonly status?: number
  readonly provider: ProviderType

  constructor(kind: AiErrorKind, provider: ProviderType, message: string, status?: number) {
    super(redactText(message))
    this.name = 'AiError'
    this.kind = kind
    this.provider = provider
    this.status = status
  }
}

export interface ConnectionTestResult {
  ok: boolean
  latencyMs: number
  status?: number
  detail?: string
}

export interface ProviderAdapter {
  readonly type: ProviderType
  complete(
    cfg: ProviderConfig,
    key: string,
    req: CompleteRequest,
  ): Promise<CompleteResult>
  testConnection(
    cfg: ProviderConfig,
    key: string,
    signal?: AbortSignal,
  ): Promise<ConnectionTestResult>
}

export interface AdapterDeps {
  /** Injected for tests; defaults to globalThis.fetch. */
  fetchFn?: (url: string, init?: RequestInit) => Promise<Response>
  /** Injected for tests (retry backoff); defaults to a real timer. */
  sleep?: (ms: number) => Promise<void>
  /** Automatic retries on 429/5xx (spec 16: ≤2). Default 2. */
  maxRetries?: number
  now?: () => number
}

// ---------------------------------------------------------------------------
// Shared HTTP plumbing
// ---------------------------------------------------------------------------

interface NormalizedRequestInit {
  method: string
  headers: Record<string, string>
  body?: string
  signal?: AbortSignal
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function num(v: unknown): number | undefined {
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined
}

/** Pull a human message out of provider error bodies without trusting shape. */
function providerErrorMessage(body: unknown): string | undefined {
  if (!isRecord(body)) return undefined
  const err = body.error
  if (isRecord(err)) {
    if (typeof err.message === 'string') return err.message
    if (typeof err.status === 'string') return err.status
  }
  if (typeof body.message === 'string') return body.message
  return undefined
}

function kindForStatus(status: number): AiErrorKind {
  // ONLY 429 and 5xx are retryable; other 4xx are client/param errors and
  // must surface immediately (openAiComplete reads 400s to degrade loudly).
  if (status === 401 || status === 403) return 'auth'
  if (status === 404) return 'not-found'
  if (status === 429) return 'rate'
  if (status >= 500) return 'server'
  return 'http'
}

function hintFor(kind: AiErrorKind): string {
  switch (kind) {
    case 'auth':
      return 'API key galat, revoked, ya is model ka access nahi — settings me check karo.'
    case 'not-found':
      return 'Model ya endpoint nahi mila — naam/URL check karo.'
    case 'rate':
      return 'Rate limit — thodi der me dobara, ya doosra model/key use karo.'
    case 'server':
      return 'Provider ki taraf se error — baad me dobara try karo.'
    case 'http':
      return 'Provider ne request reject ki — model/params check karo.'
    case 'network':
      return 'Network/CORS issue — connection check karo; public deploy ke liye proxy chahiye ho sakta hai.'
    default:
      return ''
  }
}

export class AdapterHttp {
  private readonly fetchFn: (url: string, init?: RequestInit) => Promise<Response>
  private readonly sleep: (ms: number) => Promise<void>
  private readonly maxRetries: number

  constructor(deps?: AdapterDeps) {
    this.fetchFn = deps?.fetchFn ?? ((u, i) => globalThis.fetch(u, i))
    this.sleep = deps?.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms)))
    this.maxRetries = Math.max(0, deps?.maxRetries ?? 2)
  }

  /**
   * POST/GET JSON with normalized errors + bounded retries (429/5xx only).
   * The request body/headers are NEVER logged; errors are redacted ON THROW.
   */
  async request(
    provider: ProviderType,
    url: string,
    init: NormalizedRequestInit,
  ): Promise<unknown> {
    let attempt = 0
    for (;;) {
      if (init.signal?.aborted) throw new AiError('aborted', provider, 'Request cancel ho gayi.')
      let res: Response
      try {
        res = await this.fetchFn(url, {
          method: init.method,
          headers: init.headers,
          body: init.body,
          signal: init.signal ?? null,
        })
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') {
          throw new AiError('aborted', provider, 'Request cancel ho gayi.')
        }
        throw new AiError('network', provider, `Network error — ${redactErrorMessage(e)}`)
      }

      if (res.ok) {
        try {
          return await res.json()
        } catch (e) {
          throw new AiError(
            'bad-response',
            provider,
            `Provider ne invalid JSON bheja — ${redactErrorMessage(e)}`,
          )
        }
      }

      // Error path: parse the provider message best-effort, then map.
      let detail: string | undefined
      let retryAfterMs: number | undefined
      try {
        const body: unknown = await res.json()
        detail = providerErrorMessage(body)
      } catch {
        /* body unreadable — status alone is enough */
      }
      const retryAfter = res.headers.get('retry-after')
      if (retryAfter) {
        const secs = Number(retryAfter)
        if (Number.isFinite(secs)) retryAfterMs = secs * 1000
      }
      const kind = kindForStatus(res.status)
      const retryable = kind === 'rate' || kind === 'server'
      if (retryable && attempt < this.maxRetries) {
        attempt += 1
        const backoff = retryAfterMs ?? 400 * 2 ** attempt
        await this.sleep(backoff)
        continue
      }
      const base = `HTTP ${res.status}${detail ? ` — ${detail}` : ''}`
      throw new AiError(kind, provider, `${base}. ${hintFor(kind)}`, res.status)
    }
  }
}

// ---------------------------------------------------------------------------
// OpenAI (+ openai-compatible — identical wire shape; endpoint required)
// ---------------------------------------------------------------------------

interface OpenAiChoice {
  message?: { content?: string | null }
}

function extractOpenAiText(data: unknown, provider: ProviderType): string {
  if (!isRecord(data)) throw new AiError('bad-response', provider, 'Response shape unknown.')
  const choices = data.choices
  if (!Array.isArray(choices) || choices.length === 0)
    throw new AiError('bad-response', provider, 'Response me choices khaali hain.')
  const first = choices[0] as OpenAiChoice
  const content = first?.message?.content
  if (typeof content !== 'string')
    throw new AiError('bad-response', provider, 'Response me text nahi mila.')
  return content
}

function extractOpenAiUsage(data: unknown): TokenUsage | undefined {
  if (!isRecord(data) || !isRecord(data.usage)) return undefined
  const inputTokens = num(data.usage.prompt_tokens)
  const outputTokens = num(data.usage.completion_tokens)
  if (inputTokens === undefined && outputTokens === undefined) return undefined
  return { inputTokens, outputTokens }
}

async function openAiComplete(
  http: AdapterHttp,
  cfg: ProviderConfig,
  key: string,
  req: CompleteRequest,
  provider: ProviderType,
): Promise<CompleteResult> {
  const base = (cfg.endpoint ?? DEFAULT_ENDPOINTS.openai).replace(/\/+$/, '')
  const url = `${base}/v1/chat/completions`
  const headers = {
    authorization: `Bearer ${key}`,
    'content-type': 'application/json',
  }
  const messages = req.messages.map((m) => ({ role: m.role, content: m.content }))

  const withSchema = {
    model: cfg.model,
    messages,
    max_tokens: req.maxTokens ?? 2048,
    response_format: {
      type: 'json_schema',
      json_schema: { name: req.jsonSchema?.name, strict: true, schema: req.jsonSchema?.schema },
    },
  }
  const withoutSchema = {
    model: cfg.model,
    messages,
    max_tokens: req.maxTokens ?? 2048,
  }

  if (req.jsonSchema) {
    try {
      const data = await http.request(provider, url, {
        method: 'POST',
        headers,
        body: JSON.stringify(withSchema),
        signal: req.signal,
      })
      return {
        text: extractOpenAiText(data, provider),
        usage: extractOpenAiUsage(data),
        structured: 'schema',
      }
    } catch (e) {
      // Loud degradation ONLY when the provider refused the schema mechanism
      // itself (HTTP 400 mentioning response_format). Everything else rethrows.
      const isSchemaRefusal =
        e instanceof AiError && e.status === 400 && /response_format|json_schema/i.test(e.message)
      if (!isSchemaRefusal) throw e
      const data = await http.request(provider, url, {
        method: 'POST',
        headers,
        body: JSON.stringify(withoutSchema),
        signal: req.signal,
      })
      return {
        text: extractOpenAiText(data, provider),
        usage: extractOpenAiUsage(data),
        structured: 'degraded',
      }
    }
  }

  const data = await http.request(provider, url, {
    method: 'POST',
    headers,
    body: JSON.stringify(withoutSchema),
    signal: req.signal,
  })
  return {
    text: extractOpenAiText(data, provider),
    usage: extractOpenAiUsage(data),
    structured: 'none',
  }
}

async function openAiTest(
  http: AdapterHttp,
  cfg: ProviderConfig,
  key: string,
  provider: ProviderType,
  signal?: AbortSignal,
): Promise<{ detail?: string }> {
  const base = (cfg.endpoint ?? DEFAULT_ENDPOINTS.openai).replace(/\/+$/, '')
  const data = await http.request(provider, `${base}/v1/models`, {
    method: 'GET',
    headers: { authorization: `Bearer ${key}` },
    signal,
  })
  let detail: string | undefined
  if (isRecord(data) && Array.isArray(data.data)) {
    const ids = data.data
      .map((m) => (isRecord(m) && typeof m.id === 'string' ? m.id : null))
      .filter((x): x is string => x !== null)
    detail = ids.includes(cfg.model) ? `model available (${ids.length} listed)` : undefined
  }
  return { detail }
}

// ---------------------------------------------------------------------------
// Anthropic
// ---------------------------------------------------------------------------

function anthropicBody(cfg: ProviderConfig, req: CompleteRequest): Record<string, unknown> {
  const system = req.messages
    .filter((m) => m.role === 'system')
    .map((m) => m.content)
    .join('\n\n')
  const messages = req.messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({ role: m.role, content: m.content }))
  const body: Record<string, unknown> = {
    model: cfg.model,
    max_tokens: req.maxTokens ?? 1024,
    messages: messages.length > 0 ? messages : [{ role: 'user', content: 'ping' }],
  }
  if (system.length > 0) body.system = system
  if (req.jsonSchema) {
    // Forced tool-use IS Anthropic's strict-JSON mechanism (spec 11).
    body.tools = [{ name: req.jsonSchema.name, input_schema: req.jsonSchema.schema }]
    body.tool_choice = { type: 'tool', name: req.jsonSchema.name }
  }
  return body
}

function anthropicHeaders(key: string): Record<string, string> {
  return {
    'x-api-key': key,
    'anthropic-version': '2023-06-01',
    // Anthropic's documented opt-in for direct browser calls (spec 17).
    'anthropic-dangerous-direct-browser-access': 'true',
    'content-type': 'application/json',
  }
}

function extractAnthropic(data: unknown, provider: ProviderType): { text: string; usage?: TokenUsage } {
  if (!isRecord(data)) throw new AiError('bad-response', provider, 'Response shape unknown.')
  const content = data.content
  if (!Array.isArray(content))
    throw new AiError('bad-response', provider, 'Response me content blocks nahi hain.')
  let text = ''
  let toolJson: string | undefined
  for (const block of content) {
    if (!isRecord(block)) continue
    if (block.type === 'text' && typeof block.text === 'string') text += block.text
    if (block.type === 'tool_use' && block.input !== undefined) {
      try {
        toolJson = JSON.stringify(block.input)
      } catch {
        throw new AiError('bad-response', provider, 'Tool input serialize nahi hua.')
      }
    }
  }
  const finalText = toolJson ?? text
  if (finalText.length === 0)
    throw new AiError('bad-response', provider, 'Response me text/tool output khaali hai.')
  let usage: TokenUsage | undefined
  if (isRecord(data.usage)) {
    const inputTokens = num(data.usage.input_tokens)
    const outputTokens = num(data.usage.output_tokens)
    if (inputTokens !== undefined || outputTokens !== undefined)
      usage = { inputTokens, outputTokens }
  }
  return { text: finalText, usage }
}

// ---------------------------------------------------------------------------
// Gemini
// ---------------------------------------------------------------------------

function geminiBody(req: CompleteRequest): Record<string, unknown> {
  const system = req.messages
    .filter((m) => m.role === 'system')
    .map((m) => m.content)
    .join('\n\n')
  const contents = req.messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))
  const generationConfig: Record<string, unknown> = {
    maxOutputTokens: req.maxTokens ?? 2048,
  }
  if (req.jsonSchema) {
    generationConfig.responseMimeType = 'application/json'
    generationConfig.responseSchema = req.jsonSchema.schema
  }
  const body: Record<string, unknown> = {
    contents: contents.length > 0 ? contents : [{ role: 'user', parts: [{ text: 'ping' }] }],
    generationConfig,
  }
  if (system.length > 0) body.systemInstruction = { parts: [{ text: system }] }
  return body
}

function extractGemini(data: unknown, provider: ProviderType): { text: string; usage?: TokenUsage } {
  if (!isRecord(data)) throw new AiError('bad-response', provider, 'Response shape unknown.')
  const candidates = data.candidates
  if (!Array.isArray(candidates) || candidates.length === 0)
    throw new AiError('bad-response', provider, 'Response me candidates khaali hain.')
  let text = ''
  const first = candidates[0]
  if (isRecord(first) && isRecord(first.content) && Array.isArray(first.content.parts)) {
    for (const part of first.content.parts) {
      if (isRecord(part) && typeof part.text === 'string') text += part.text
    }
  }
  if (text.length === 0)
    throw new AiError('bad-response', provider, 'Response me text nahi mila.')
  let usage: TokenUsage | undefined
  if (isRecord(data.usageMetadata)) {
    const inputTokens = num(data.usageMetadata.promptTokenCount)
    const outputTokens = num(data.usageMetadata.candidatesTokenCount)
    if (inputTokens !== undefined || outputTokens !== undefined)
      usage = { inputTokens, outputTokens }
  }
  return { text, usage }
}

// ---------------------------------------------------------------------------
// Adapter factory
// ---------------------------------------------------------------------------

async function timedTest(
  fn: () => Promise<{ detail?: string }>,
  now: () => number,
): Promise<ConnectionTestResult> {
  const t0 = now()
  try {
    const { detail } = await fn()
    return { ok: true, latencyMs: Math.max(0, now() - t0), detail }
  } catch (e) {
    const err = e as AiError
    return {
      ok: false,
      latencyMs: Math.max(0, now() - t0),
      status: err instanceof AiError ? err.status : undefined,
      detail: err instanceof AiError ? err.message : redactErrorMessage(e),
    }
  }
}

export function createAdapters(deps?: AdapterDeps): Record<ProviderType, ProviderAdapter> {
  const http = new AdapterHttp(deps)
  const now = deps?.now ?? Date.now

  return {
    openai: {
      type: 'openai',
      complete: (cfg, key, req) => openAiComplete(http, cfg, key, req, 'openai'),
      testConnection: (cfg, key, signal) =>
        timedTest(() => openAiTest(http, cfg, key, 'openai', signal), now),
    },
    'openai-compatible': {
      type: 'openai-compatible',
      complete: (cfg, key, req) => {
        if (!cfg.endpoint || cfg.endpoint.trim().length === 0) {
          return Promise.reject(
            new AiError(
              'config',
              'openai-compatible',
              'OpenAI-compatible provider ke liye endpoint (base URL) zaroori hai.',
            ),
          )
        }
        return openAiComplete(http, cfg, key, req, 'openai-compatible')
      },
      testConnection: (cfg, key, signal) => {
        if (!cfg.endpoint || cfg.endpoint.trim().length === 0) {
          return Promise.resolve({
            ok: false,
            latencyMs: 0,
            detail: 'Endpoint (base URL) missing hai.',
          } satisfies ConnectionTestResult)
        }
        return timedTest(() => openAiTest(http, cfg, key, 'openai-compatible', signal), now)
      },
    },
    anthropic: {
      type: 'anthropic',
      complete: async (cfg, key, req) => {
        const base = (cfg.endpoint ?? DEFAULT_ENDPOINTS.anthropic).replace(/\/+$/, '')
        const data = await http.request('anthropic', `${base}/v1/messages`, {
          method: 'POST',
          headers: anthropicHeaders(key),
          body: JSON.stringify(anthropicBody(cfg, req)),
          signal: req.signal,
        })
        const { text, usage } = extractAnthropic(data, 'anthropic')
        return { text, usage, structured: req.jsonSchema ? 'schema' : 'none' }
      },
      testConnection: (cfg, key, signal) =>
        timedTest(
          async () => {
            // Cheapest reliable probe: a 1-token completion (spec 11).
            const base = (cfg.endpoint ?? DEFAULT_ENDPOINTS.anthropic).replace(/\/+$/, '')
            await http.request('anthropic', `${base}/v1/messages`, {
              method: 'POST',
              headers: anthropicHeaders(key),
              body: JSON.stringify(
                anthropicBody(cfg, { messages: [{ role: 'user', content: 'ping' }], maxTokens: 1 }),
              ),
              signal,
            })
            return {}
          },
          now,
        ),
    },
    gemini: {
      type: 'gemini',
      complete: async (cfg, key, req) => {
        const base = (cfg.endpoint ?? DEFAULT_ENDPOINTS.gemini).replace(/\/+$/, '')
        const url = `${base}/v1beta/models/${encodeURIComponent(cfg.model)}:generateContent`
        const data = await http.request('gemini', url, {
          method: 'POST',
          // Key in the HEADER (x-goog-api-key) — never in the URL (spec 12:
          // URLs end up in network logs by default, headers do not).
          headers: { 'x-goog-api-key': key, 'content-type': 'application/json' },
          body: JSON.stringify(geminiBody(req)),
          signal: req.signal,
        })
        const { text, usage } = extractGemini(data, 'gemini')
        return { text, usage, structured: req.jsonSchema ? 'schema' : 'none' }
      },
      testConnection: (cfg, key, signal) =>
        timedTest(
          async () => {
            const base = (cfg.endpoint ?? DEFAULT_ENDPOINTS.gemini).replace(/\/+$/, '')
            await http.request('gemini', `${base}/v1beta/models`, {
              method: 'GET',
              headers: { 'x-goog-api-key': key },
              signal,
            })
            return {}
          },
          now,
        ),
    },
  }
}
