# 27 — ENGINEERING HANDOFF

**Gate:** starts only after 28's verdict + human sign-off of D-0010. One PR = one slice below. Every PR: tests green (`npm ci && npx tsc -b && npx vitest run && npm run build`; Rust: fmt+clippy+test), coordination docs updated (CHANGELOG, status, DECISIONS), no scope bleed.

## PR slicing (merge order; sizes are honest estimates)

| PR | Slice | Contains | Depends |
|---|---|---|---|
| A1 | **CompositeCommand (E-AI-1)** | `command.rs` additive struct + Rust tests (order/reverse-revert/label/history-count-1/dirty interplay); wasm exposure not needed yet | — |
| A2 | **BYOK foundations (U1+U2)** | KeyVault (memory default), redaction filter + its tests, provider configs store, 4 fetch adapters, test-connection, settings UI tab, consent dialog, usage meter | — |
| A3 | **Snapshot & capability (E-AI-2..5 + U3+U4)** | additive session fns + wasm + Rust tests; TS snapshot service (alias map, tiers, freeze), capability registry w/ manifest v0 | — (parallel w/ A2) |
| A4 | **Action schemas + validator (U5)** | schema table (04), 12-stage pipeline, ref resolver, redaction-safe errors; **fuzz suite** (malformed/hostile plans) | A3 |
| A5 | **Transaction runner + activity (U6+U7)** | runner on CompositeCommand, rollback paths, activity store + inline cards, entity bindings; dev-only hand-crafted plan executor | A1, A4 |
| A6 | **Chat UI (U8)** | dock panel via App.tsx overlay + commands toggle (disclosed touches), message stream, plan/progress/verification/result/error cards, modes, Stop, prompt builder (production system prompt + few-shots), memory window | A2, A5 |
| A7 | **Variables (U9)** | store, `$` autocomplete, resolution in stage 6, drawer UI, exposed-params re-run | A6 |
| A8 | **Polish** | verifier diff UI, plan-card humanizer pass, keyboard nav, perf check, docs | A6 |

Tools-lane locked order (rect-radius/PolyStar → refactor → PATH → …) proceeds in parallel; each shipped tool = manifest+schema edit (07 rule).

## Test strategy (per layer)

- **Rust (A1, A3):** composite apply/revert ordering, rollback-no-entry, snapshot JSON stability (fixture golden), revision bump, set-selection guards, capabilities non-empty. Runbook reminder: cargo unavailable in sandbox — user PC runs fmt/clippy/test per repo convention; PR body states "cargo NOT RUN" honestly where applicable.
- **TS unit:** validator stage matrix (each E_* code reachable) + fuzz (random/garbage/adversarial plans, unicode names, boundary numbers); schema table ↔ 04 parity test (no orphan actions); redaction filter tests (key formats); adapters against recorded-response fixtures (mock fetch; success+401/429/404/CORS-fail); snapshot aliasing round-trip; reference resolver ambiguity paths; budgets enforcement.
- **TS integration (vitest + jsdom):** full loop with mock adapter — prompt→plan-card→approve→single undo entry; rollback injected mid-plan; tier-B interstitial in APPLY; Stop mid-generation; verification unverifiable ≠ pass.
- **Acceptance:** 24 §acceptance scenes 1–7 scripted.
- **Manual checklist (A6+):** panel vs Stage shortcuts; chat while dragging (gesture-idle); two-doc switching; autosave interplay.

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| Provider API drift | adapter isolation + per-PR fixture refresh (17) |
| Wasm build lag on user PC (facade missing) | facade-probe pattern (hasShapeDrawFacade precedent) → manifest downgrades loudly |
| Snapshot too big on huge docs | hard cap + summarize + focus guidance (20) |
| Composite corrupts history (worst case) | A1 lands alone w/ exhaustive tests; revertible single PR |
| Scope creep into "general chatbot" | AI-REQ-020 closed vocab; review gate per PR |
| AI-B merge churn (App.tsx/commands.ts) | tiny additive hunks, protocol disclosure, merge origin/main before push |

## Explicit non-goals for engineering phase 1
Anything in 25 · new npm deps · proxy server · production prompt “improvement” without fixture updates · touching AI-B lanes beyond disclosed hunks.
