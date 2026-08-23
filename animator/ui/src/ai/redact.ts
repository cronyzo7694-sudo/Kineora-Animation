// ===========================================================================
// AI REDACT — secret redaction filter (A2 / D-0010 / spec 12: "redact
// Authorization/x-api-key/key-shaped secrets from error/log paths").
//
// Two mechanisms, both fail-closed:
//   1. PATTERNS — provider key shapes + auth header/query transports. Anything
//      matching is masked even if the vault never saw it (defense in depth).
//   2. REGISTRY — every key the KeyVault stores is also registered here by
//      VALUE, so even a non-standard-shaped key is masked wherever it appears.
//
// INVARIANT: no function in src/ai/ ever logs a raw key. All error messages
// produced by adapters pass through redactText. If a new log/error path is
// added ANYWHERE in the AI subsystem, the review checklist (27) requires it
// to route through this module.
// ===========================================================================

const MASK = '[REDACTED]'

// Bare-secret patterns: the whole match IS the secret → mask everything.
const BARE_PATTERNS: ReadonlyArray<RegExp> = [
  // Anthropic keys.
  /sk-ant-[A-Za-z0-9_\-]{8,}/g,
  // OpenAI keys: legacy `sk-…` and project `sk-proj-…`.
  /sk-(?:proj-)?[A-Za-z0-9_\-]{8,}/g,
  // Google AI (Gemini) keys.
  /\bAIza[0-9A-Za-z_\-]{10,}/g,
]

// Transport patterns: capture group 1 is the PUBLIC prefix (scheme / header
// name / query key) — kept as-is; only the value after it is masked.
const TRANSPORT_PATTERNS: ReadonlyArray<RegExp> = [
  // "Authorization: Bearer <token>" — keep the scheme, mask the token.
  /(bearer\s+)[A-Za-z0-9._~+\-/=]{8,}/gi,
  // Header transports in serialized/error text: x-api-key, x-goog-api-key.
  /((?:x-api-key|x-goog-api-key)"?\s*[:=]\s*"?\s*)[A-Za-z0-9._~+\-/=]{8,}/gi,
  // Query transports: ?key=… &api_key=… &access_token=…
  /([?&](?:key|api_key|apikey|access_token)=)[^&\s]+/gi,
]

/**
 * Exact-value registry (refcounted — the same key string may serve two
 * configs). Values shorter than 8 chars are refused: masking a short common
 * word would corrupt legitimate log text.
 */
const registry = new Map<string, number>()

export function registerSecret(value: string): void {
  if (typeof value !== 'string' || value.length < 8) return
  registry.set(value, (registry.get(value) ?? 0) + 1)
}

export function unregisterSecret(value: string): void {
  const n = registry.get(value)
  if (n === undefined) return
  if (n <= 1) registry.delete(value)
  else registry.set(value, n - 1)
}

/** Test hook: drop all registered exact secrets. */
export function clearSecretRegistry(): void {
  registry.clear()
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Redact every known/registered secret and every key-shaped pattern from
 * arbitrary text. Safe on any string; returns the input unchanged when
 * nothing matches.
 */
export function redactText(text: string, extraSecrets: readonly string[] = []): string {
  if (typeof text !== 'string' || text.length === 0) return text
  let out = text
  // Exact secrets first (longest first so overlapping keys mask fully).
  const exact = [...registry.keys(), ...extraSecrets]
    .filter((s) => typeof s === 'string' && s.length >= 8)
    .sort((a, b) => b.length - a.length)
  for (const secret of exact) {
    if (out.includes(secret)) {
      out = out.replace(new RegExp(escapeRegExp(secret), 'g'), MASK)
    }
  }
  for (const pattern of BARE_PATTERNS) {
    out = out.replace(pattern, MASK)
  }
  for (const pattern of TRANSPORT_PATTERNS) {
    out = out.replace(pattern, (m, prefix: unknown) =>
      typeof prefix === 'string' ? `${prefix}${MASK}` : m,
    )
  }
  return out
}

/**
 * Redact a thrown value's display message (Error, string, or arbitrary
 * JSON-able value). Never throws; never returns secret material.
 */
export function redactErrorMessage(err: unknown): string {
  let raw: string
  if (err instanceof Error) raw = err.message
  else if (typeof err === 'string') raw = err
  else {
    try {
      raw = JSON.stringify(err) ?? String(err)
    } catch {
      raw = String(err)
    }
  }
  return redactText(raw)
}
