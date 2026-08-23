# 08 — PLAN → EXECUTE → VERIFY LOOP

## Researched workflow options

| # | Flow | Verdict |
|---|---|---|
| 1 | Execute as tokens stream in | ❌ irreversible mid-flight writes, unbounded risk |
| 2 | Plan silently → execute all → report | ❌ user blind until done; PREVIEW mode impossible |
| 3 | **Plan first (explicit plan object) → validate → preview → execute whole plan as one transaction → verify → report** | ✅ chosen |
| 4 | Verify after EVERY action (re-snapshot per step) | ⚠️ token/cost heavy; only for ASK-mode walkthroughs. Default: verify after the complete transaction |

Chosen per-request loop (one user message = one loop iteration):

```
1 INTAKE   user message + mode + fresh Tier-0/1 snapshot (+T2 only if refs need it)
2 PLAN     model returns {plan[], expected[], report} (structured; 04)
3 VALIDATE 12-stage pipeline (05) — fail ⇒ repair loop ×1 ⇒ or honest error
4 CONFIRM  mode-dependent: ASK → discuss only; PREVIEW → plan card, user approves;
           APPLY → auto if all tier-A + budgets pass; tier-B rows need per-plan confirm
5 EXECUTE  TransactionRunner → CompositeCommand (09); progress streamed to UI (10)
6 SNAPSHOT fresh snapshot (post-state)
7 VERIFY   compare `expected[]` vs actual state (structured checks below)
8 REPORT   success / partial(=rolled back) / failure + next-step hints (16, 21)
```

## Verification policy — STRUCTURED first, VISUAL later

MVP verification is **structured only** (no pixels): post-state queries assert each `expected[]` item, e.g. ball-bounce:
- layer 'ball' exists ∧ kind normal ✓
- node n (oval k) exists on it, fill = #e11d48 ✓
- keyframes at 1/15/30 exist; evaluated y@1≈100, y@15≈820 (via `evaluate`), direction down-then-up ✓
- tween span 1..30 exists with ease 60 ✓
- effect within declared range: no frames >30 touched (affected-frames check) ✓

Each check: `{expectation, result, evidence}` → overall `pass | fail | unverifiable` (unverifiable is reported as such — never upgraded to pass silently).

**Visual verification** (canvas PNG → vision model) is explicitly post-MVP (18). The system prompt forbids claims of visual certainty ("maine dekh liya bilkul sahi hai" is impossible; the agent says "verified structurally").

## Multi-step dependency handling (spec example: ball → bounce → fade)

Model plans dependencies via order + `ref`/`lastCreated` (04). Runner executes strictly in order. Opacity steps in that example hit capability `unsupported` → at PLAN time the validator flags the fade as closed-fail and the orchestrator asks the model to replan without it (or ask the user) — partial silent drops are forbidden: **the reported plan must equal the executed plan.**

## Retry/auto-loop bounds (agentic behavior)

Per user request: max **1 repair replan** on validation failure; max **1 replan** on verification mismatch (with the diff fed to the model); then honest failure. No open-ended "keep trying" loops (budgets in 12 §Agent-loop safety). Follow-up user messages start a fresh loop with fresh memory context (19).
