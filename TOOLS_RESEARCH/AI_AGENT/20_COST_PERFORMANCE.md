# 20 — COST / PERFORMANCE RESEARCH

## Token budget anatomy (per user request, MVP feature set)

| Component | Est. tokens | Notes |
|---|---|---|
| System prompt + rules + defaults + taxonomy | ~1.0–1.4k | **static prefix** → provider prompt-caching friendly |
| Capability manifest (07) | ~0.3–0.6k | static per engine build — rides the prefix |
| Action schemas (04, compact) | ~0.5–0.8k | static per build |
| Snapshot Tier 0 + Tier 1 | 0.3k (empty doc) … ~2k (busy doc, ~100 nodes) | dynamic suffix; aliasing + range-collapsing (06) |
| Conversation window (≤12 turns, summarized cards) | 0.3–1.2k | oldest dropped first (19) |
| **Typical request total in** | **~2.5–5k** | |
| Model output (plan + report, ≤64 actions) | 0.4–1.5k | hard-capped by maxTokens setting |
| Verify turn (only on mismatch — replan adds ~1 extra round-trip) | +2–4k | rare path |

## Efficiency architecture (binding decisions)

1. **Never resend the whole project** per request (spec demand) — Tier 0/1 default; Tier 2/3 strictly on-demand via `scene.inspect` detail calls (06).
2. **Static prefix ordering** (system+manifest+schemas) maximizes provider-side prompt caching where offered; user-volatile content (snapshot, window) always at the end.
3. **One completion per loop** — planning is single-shot structured output; no conversational back-and-forth between plan/execute (the loop steps 3–8 in 08 are local).
4. **Action batching:** one plan = one transaction = one verification snapshot — not per-action snapshots (08, option-4 rejected).
5. **Model tiering:** cheap model acceptable for ASK chit-chat; plan generation wants structured-output-strong models — user picks per provider; UI labels suggestions "fast/cheap" vs "best plans".
6. **Small docs are the norm** — but the agency killer is pathology: caps (64 actions/256 objects) + snapshot hard cap (~3k tokens; beyond → summarized layer/node counts + "too big—use @layer name to focus" guidance + on-demand T2).
7. **Streaming:** stream text for chat feel; plan JSON parsed only at completion (partial JSON is not executed — ever).
8. **Usage meter:** per-request + session totals + user-settable **daily token ceiling with hard stop** (12 threat table) + approximate ₹/$ cost via price table (17).

## Local-side performance

Validation <1ms/action; composite apply of 64 leaf commands matches one heavy human gesture (sub-16ms typical on 1080p scenes — same code path as multi-object ops); snapshot build = one traversal of layers/keyframes, trivially O(doc). No engine perf changes required.

## Retry cost honesty

Repair/replan loops multiply tokens (×2–3 worst case per request: initial + repair + verify-replan). The caps in 16 double as cost caps; meter shows multiplier events plainly ("repair attempt used +1.8k tokens").
