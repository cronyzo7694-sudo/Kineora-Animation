# 17 — PROVIDER COMPARISON (capability matrix)

Research target: plan-generation quality signals (structured outputs, tool calling, JSON schema), browser-direct feasibility, streaming, vision, limits, auth, error shapes. Verify per-provider specifics again at implementation time (APIs move); the adapter design absorbs drift.

| Axis | OpenAI | Anthropic | Google Gemini | OpenAI-compatible (LM Studio/Ollama-ish/OpenRouter etc.) |
|---|---|---|---|---|
| Auth | `Authorization: Bearer` key | `x-api-key` + `anthropic-version` header | key (`?key=` or header where offered) | usually Bearer or none (local) |
| **Browser-direct CORS** | Works (official JS SDK even gates it behind a `dangerouslyAllowBrowser` warning flag — i.e. technically callable, key-exposure is the concern) | Works via opt-in header `anthropic-dangerous-direct-browser-access: true` [1](https://github.com/ianarawjo/ChainForge/issues/367) [2](https://dev.to/sendotltd/calling-the-anthropic-api-directly-from-the-browser-a-150-line-byok-comparison-tool-for-opus--nh) [3](https://x.com/simonw/status/1826810346054844764?lang=en) | Works (public quickstarts use browser fetch) | Local servers often permissive; remote varies — adapter surfaces CORS errors with proxy advice (12) |
| Structured plan output | `response_format: json_schema` (strict structured outputs) | forced **tool-use** with input_schema | `responseMimeType=application/json` + `responseSchema` | best-effort: schema→json instruction→strict parse fallback (11) |
| Tool calling | yes | yes | function calling | varies; not required (plan-in-text is enough) |
| Streaming | SSE | SSE | SSE/stream endpoints | usually SSE |
| Vision input | yes (gpt-* vision tiers) | yes | yes | varies — vision is post-MVP anyway (18) |
| Context window | large (≥128k tier) | large (≥200k tier) | very large (1M tier) | varies (local = small; tiering matters, 20) |
| Usage fields in response | yes | yes | yes | often yes |
| Rate limits / errors | 401/404/429 w/ `error.message` | typed `error.type` (rate_limit_error…) | HTTP+`error.status` | normalize in adapter to our error classes (16) |
| Pricing | per-model, public tables | per-model, public tables | per-model incl. free tier | local = free compute |
| Notes | default first-class adapter | plan-via-tool fits our schema perfectly | cheap/fast tier good for ASK mode | enables offline/private setups — big privacy win for hobbyists (19/12) |

## Decisions

1. **Adapter set (MVP):** OpenAI + Anthropic + Gemini + OpenAI-compatible endpoint. No third-party SDKs — plain `fetch` (bundle size, auditable surface).
2. **Structured-output strategy per 11:** strictest available mechanism first, degrade loudly, never silently.
3. **Model suggestions:** curated short list per provider + free text (models deprecate constantly; free text prevents UI rot).
4. **Usage/cost:** from response usage fields × user-visible approx. price table (marked approximate; links to provider pricing pages).
5. **No backend proxy in MVP**; proxy architecture documented as the public-deploy answer (12 matrix) and kept adapter-compatible (`endpoint` override can point at a same-origin proxy path later).
