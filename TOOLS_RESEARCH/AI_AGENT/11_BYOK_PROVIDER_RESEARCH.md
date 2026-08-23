# 11 — BYOK / PROVIDER CONFIGURATION RESEARCH

## Requirement

User brings their OWN key from the Kineora frontend; any of several providers; no server required (public deploy notes in 12).

## Provider config model (conceptual)

```
ProviderConfig {
  id: uuid · type: 'openai' | 'anthropic' | 'gemini' | 'openai-compatible'
  label: string                     // "Work OpenAI", "Personal Claude"
  endpoint?: string                 // required for openai-compatible (base URL); override allowed for others
  model: string                     // free text + curated suggestions per type
  keyRef: KeyHandle                 // never the key itself outside KeyVault (12)
  createdAt/lastUsedAt · lastTestOk?: {at, latencyMs, modelSeen?}
}
```

Non-secret fields persist in the existing prefs pattern (localStorage, like toolColors — never undoable, never in project files). Keys live in the KeyVault (12).

## UI surface (in chat settings)

Provider type → endpoint (conditional) → model (+suggestions datalist) → key field (password input, "paste karke Enter"; show-on-demand; **Test connection** button; storage choice: "remember this browser (less safe)" checkbox default OFF) → usage line (last request in/out tokens + session totals, 20) → disconnect/delete-key. Multiple configs allowed (fast provider/model switching chip in chat header).

## Connection test

Cheapest possible call per provider: list-models endpoint where available (`GET /v1/models` OpenAI/compatible; Gemini `GET /v1beta/models`) else a 1-token completion (Anthropic `messages` max_tokens=1). Reports: HTTP status → mapped messages (401 = "key galat/revoked", 429 = "rate limit", 404 = "endpoint/model check", CORS/network = plain explanation + proxy advice per 12 matrix). Never retries in a loop; one shot per click.

## Provider abstraction (research outcome; full matrix in 17)

Narrow adapter interface — conceptually `complete({system, messages, jsonSchema, maxTokens, signal}) → {text, usage{in,out}}`. Structured-plan extraction strategy per provider:
- **OpenAI**: response_format json_schema (structured outputs) — plan guaranteed parseable.
- **Anthropic**: forced tool-use with the plan schema as the tool input.
- **Gemini**: `responseSchema` + `application/json` mime.
- **OpenAI-compatible**: try schema/tooling; on capability failure degrade to "JSON-only system instruction + fenced-block extraction + strict parse" (stage 1 of the validator still applies). Degradation is advertised in the UI ("structured mode unavailable — strict parsing on").

## Usage information where available

All three first-party APIs return token usage in responses → accumulate per-session + per-day counters (display only; persisted session-only). Cost estimate = usage × user-visible static price table (editable; marked approximate, URL to provider pricing, 17). No background polling of billing APIs (scope-out; surprise keys/scopes).

## Hard rules

Key never appears in: git, project files, snapshots, prompts, logs (redaction filter on all error/log paths), activity entries, or URLs (except Gemini's documented `?key=` transport — mitigated by preferring header option where offered, else documented). `dangerouslyAllowBrowser`-style SDK flags are not used because **no SDKs ship** — plain fetch only (17).
