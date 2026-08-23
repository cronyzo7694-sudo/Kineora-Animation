# 16 — ERROR HANDLING & RECOVERY

**Prime directive: never pretend success.** Every failure surfaces with (a) plain-language cause, (b) what did/didn't change, (c) a next action. Everything below assumes the 12-stage pipeline (05) and all-or-nothing transactions (09).

## Taxonomy → behavior matrix

| Class | Example | Behavior |
|---|---|---|
| Provider: auth | 401 invalid key | error card: "API key galat/revoked — settings me update karo" + link; no auto-retry |
| Provider: rate-limit / 5xx / network | 429, 503, offline | ≤2 auto-retries (exp backoff, respects Retry-After), then card with Retry button; Stop always available |
| Provider: model/endpoint | 404 model | card: model name check + suggestions list |
| Output: malformed JSON | model prose instead of plan | 1 auto-repair attempt (schema reminder + error echo); then card showing "AI ne structured plan nahi diya" + retry/regenerate |
| Output: schema/unknown action | `plan[2].action="fly"` | fail-closed; 1 self-correct loop with exact validation errors fed back; then user-visible card with offending row |
| Validation: range/format | `#red`, frame 0, ease 400 | same self-correct path; cards list each row with stage code |
| Validation: reference | "the ball" matches 2 nodes | quick-pick chips; no execution until resolved |
| Capability | `path.draw`, `opacity`, named easing | honest refusal w/ alternative + roadmap note (07); offer nearest plan ("opacity engine me nahi hai — chhota/lighter color duplicate try karun?") |
| Document state | layer locked, folder target, target deleted mid-plan | guarded message ("layer 'ink' locked hai — unlock karke dobara bolun?"); no bypass ever |
| Tier/permissions | delete in ASK mode | plan card greyed + mode hint |
| Budget | plan 200 actions | reject + suggest split; budget table link |
| Execution | engine op returns false at child k | **full rollback** (09), card names the failing action + label; doc provably pre-plan state (verifier asserts rollback cleanliness) |
| Verification | expected ≠ actual post-state | 1 replan attempt WITH the diff; else card: "plan apply hua par verify fail: rows ✗… — Undo dabana safe hai" |
| Cancellation | user hits Stop | generation: nothing applied; apply phase: n/a atomic (09); plan kept as "cancelled" card |
| Mass-destructive | heuristic trip | type-to-confirm interstitial; refusal recorded |

## Message style

User-facing strings avoid stack traces and HTTP junk; codes available under "Details". Hinglish-friendly, professional tone; always actionable. Internally, every failure logs a structured record (stage, code, plan id) to the activity store (21) — session-only, redaction-filtered (12).

## Repair loops (hard caps — repeats 12 §Agent-safety)

malformed-output repair ×1 · validation self-correct ×1 · verify-replan ×1 · provider retry ×2. After caps: human decides. The agent can never self-start a new request (no recursive agency).

## Silent-failure ban list (explicit)

No silent param coercion · no silent plan truncation to fit budgets · no silent dropping of unsupported clauses (08) · no "verify pass" when checks are unverifiable · no localStorage downgrade without checkbox · no error swallowing in catch-all (catch-all = card with code `E_UNKNOWN`).
