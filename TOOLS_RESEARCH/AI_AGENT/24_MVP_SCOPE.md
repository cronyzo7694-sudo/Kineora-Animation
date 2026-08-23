# 24 — MVP SCOPE (derived from the actual engine, not assumed)

## MVP = the smallest agent that genuinely animates

**In:**

1. **BYOK settings** — 4 provider types, key memory-default (+opt-in persist), test-connection, model select, usage meter, daily token ceiling (11/12/17/20).
2. **AI chat dock** — messages, plan cards, progress, Stop, regenerate, retry, clear, mode selector ASK/PREVIEW/APPLY (PREVIEW default), confirmation interstitials incl. mass-destructive type-confirm (10).
3. **Scene snapshot service** — Tier 0/1 via E-AI-2 (aliases, selection block, revision stamp); Tier 2 on-demand (06).
4. **Capability manifest** — v0 table from 07 wired into prompt + validator (E-AI-5 + machine-mirror of tools status).
5. **Action vocabulary (04 table)** — the full Tier-A/B list EXCEPT the explicitly excluded below; incl. `tween.classic.set` (numeric ease only).
6. **12-stage validation** incl. reference resolution + apply-time revalidation + closed schemas (05/15).
7. **Transactions** — CompositeCommand, one-request-one-undo, all-or-nothing rollback (09, E-AI-1).
8. **Plan→verify loop** — max 1 repair + 1 verify-replan; structured verification with honest verdicts (08).
9. **Activity log** — inline groups + tab; entity bindings; undo affordance (21).
10. **Error system** — full taxonomy, redaction, user-actionable cards (16/12).
11. **Variables (lite)** — prompt `$vars` + exposed animation parameters re-running adjust plans (13); session-scoped.
12. **Safety** — budgets table (26), one in-flight request, gesture-idle rule, consent dialog, key hygiene rules (12/03).

**Explicitly out of MVP:** vision (18) · AUTO mode (10) · document lifecycle ops (new/open/save/close via AI) · per-node opacity + named easings (need engine/decisions) · paths/pen/brush/eraser/text (need PATH model) · project-file variables · templates · long-term memory · proxy server · desktop keychain · multi-doc/cross-scene actions · npm SDKs.

## Why this cut

Every "in" item is either (a) already backed by a real Command/facade (so the MVP is pure orchestration, zero new engine semantics beyond 4 small additive fns), or (b) required for safety/honesty (validator, budgets, activity). Everything "out" is blocked on a real dependency (PATH model, decisions) rather than desire — per spec, MVP is *derived*.

## Acceptance scenes (must all pass before MVP is called done)

1. Red-ball bounce (01 criteria) — 1 undo.
2. "Scene me kya hai?" — ASK answer from snapshot, zero writes.
3. Selection recolor: select 3 shapes → "inhe blue karo" — 1 transaction, verify pass.
4. Unsupported honesty: "pen se sketch banao" → refusal + alternative, no writes.
5. Destructive gate: "saare layers delete karo" → interstitial + type-confirm; cancel leaves doc byte-identical.
6. Rollback: induced mid-plan failure (fixture) → activity shows rolled-back, doc unchanged, undo stack depth unchanged.
7. Locked layer: draw request on locked layer → guarded error, no bypass.
