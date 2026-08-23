# 28 — FINAL AUDIT + GATE + CONTRACT

## Spec checklist (from MISSION §FINAL RESEARCH AUDIT)

- [x] Existing engine architecture inspected (02 — file:line evidence; not assumed)
- [x] Command layer understood (02 Q1/Q11 — incl. verified absence of grouping)
- [x] Current capabilities mapped (02 Q2, 07 v0 manifest)
- [x] AI capability boundary defined (04 vocabulary, 07, AI-REQ-020/110)
- [x] Action system researched (04 — derived from `command.rs`)
- [x] Validation researched (05 — 12 stages, fail-closed)
- [x] Scene snapshot researched (06 — tiers, staleness, read-only)
- [x] Provider abstraction researched (11/17 — 4 types, no SDKs)
- [x] BYOK researched (11 — config model, test, usage)
- [x] Security researched (12 — keys, logs, prompts, deployment modes)
- [x] Privacy researched (12 — consent inventory, local-first split)
- [x] Chat UX researched (10 — command-center, cards, modes)
- [x] Human control researched (10 — modes, tiering, thresholds; 12 threat table)
- [x] Undo/transaction researched (09 — composite, rollback, interleave)
- [x] Plan/execute/verify researched (08 — loop, structured-vs-visual)
- [x] Error recovery researched (16 — full taxonomy + caps)
- [x] Variables researched (13 — 4 distinct concepts, no mixing)
- [x] Natural-language intent researched (14 — taxonomy, defaults, ambiguity policy)
- [x] Object reference resolution researched (15 — ID-first, deterministic)
- [x] Provider comparison researched (17 — matrix + decisions)
- [x] Vision researched (18 — post-MVP, opt-in)
- [x] Context/memory researched (19 — window, bindings, staleness, reset)
- [x] Cost researched (20 — budgets, caching layout, metering)
- [x] Activity history researched (21 — model, display, controls)
- [x] Threat model completed (12 §threat table + 03/05/09/16 controls)
- [x] Agent loop safety completed (12 §agent-loop + AI-REQ-070/071 budgets)
- [x] MVP defined (24 — incl. exclusion list + acceptance scenes)
- [x] Future scope defined (25 — with blockers; 3D/rigging permanently excluded)
- [x] Engineering dependencies defined (23 — graph, increments, build order)
- [x] No code written (verified — package contains only conceptual shapes/JSON-like protocol illustrations)

## Critical-ambiguity sweep

All open product questions were resolved to provisional defaults (below). Engine facts are verified against source (02). No remaining question blocks engineering start.

### Provisional defaults for human override (not blockers)
- DEFAULT-1: Modes default = **PREVIEW**. (10)
- DEFAULT-2: Transaction = **one CompositeCommand per plan**, all-or-nothing rollback. (09)
- DEFAULT-3: Conversation window **12 turns**; per-doc threads. (19)
- DEFAULT-4: Key storage **memory-only default**, opt-in persist w/ warning. (12)
- DEFAULT-5: Budgets table values as in AI-REQ-070 (64 actions / 256 objects / 120s / …).
- DEFAULT-6: Adapters = 4 types, plain fetch, no SDKs; structured-output strictness ladder per 11.
- DEFAULT-7: Panel MVP mounts as overlay via App.tsx; `panelLayout` migration coordinated with AI-B later. (22)
- DEFAULT-8: Per-node opacity & named easings stay **unsupported** until their engine decisions land.
- DEFAULT-9: Node naming absent → references ride activity bindings + selection + uniqueness heuristics (15); Node.name deferred (E-AI-7).
- DEFAULT-10: Chat/activity/variables are session-only in MVP (no new persistence surfaces).

### Awaiting human/AI-B (tracked, non-blocking)
- **D-0010:** APPROVED 2026-08-23 via the final engineering handoff (with four locked
  spec additions → 26 §M: AI-REQ-023/111/112/113). Engineering slices proceed per 27
  with per-slice approval gates; **A1 (CompositeCommand) done** 2026-08-23.
- AI-B review ping for panel-mount plan (still open; needed by A6, not before).

## AI AGENT RESEARCH STATUS

**✅ READY FOR ENGINEERING SPECIFICATION** — critical ambiguity = zero after the provisional defaults above; every architectural claim in this package traces to inspected source (02) or an explicit default. *Not marked READY on document volume: each acceptance scene in 24 is implementable from 26's requirements without a single open design question.*

---

# FINAL AI AGENT CONTRACT (authoritative for the future implementation)

## What the AI CAN see
The active document's read-only snapshot (status/scene-summary tiers by default; detail/frame tiers on request), the current selection, the capability manifest, the conversation (≤12 turns), its own activity-derived entity bindings, current mode, and user-defined variables. Fresh every turn; revision-stamped.

## What the AI CANNOT see
API keys, other documents, file system paths, clipboard, logs, pixels (MVP), anything not enumerated above.

## What the AI CAN do (MVP)
Emit plans over the closed vocabulary (~30 actions derived 1:1 from real Commands — audit 02 Q2): inspect scene; create/rename/configure/reorder layers & folders (delete w/ confirmation); create rect/oval shapes w/ fill/stroke; transform & style nodes; duplicate/delete (delete w/ confirmation); full keyframe/frame operations; classic tweens w/ numeric ease; symbol lifecycle; set document settings (confirmation); set selection; UI playback requests. All as ONE undoable transaction per approved plan with structured verification and an activity record.

## What the AI CANNOT do (MVP)
Anything outside that vocabulary — incl. all freehand/path drawing, text, opacity, gradients, named easings, masks, camera, document lifecycle (new/open/save/close), code execution, network calls, arbitrary file access, permission changes, raising its own budgets, starting further agent requests, or bypassing locked/hidden/folder guards. 3D/rigging permanently.

## How actions are validated
12 closed, ordered stages (05): parse → shape → name → param structure → values (ranges/formats) → variable resolution → reference resolution (live doc, deterministic) → document-state predicates → permissions/guards → capability manifest → policy budgets → dry-run compile. Stages 8/9 re-run at apply time. Fail-closed, one repair loop, then human-actionable error.

## How actions execute
Only after mode-appropriate approval (ASK never; PREVIEW explicit; APPLY auto for tier-A within budgets, tier-B always human-confirmed; mass-destructive typed-confirm). Runner compiles to one CompositeCommand through the existing facade/command path, waits gesture-idle, emits existing bus events. All-or-nothing with full rollback on any failure.

## How undo works
One user request = one History entry ("AI — …"); Ctrl+Z reverts the entire transaction; interleaves with human entries per normal stack semantics; no AI-parallel history exists.

## How errors work
Fixed taxonomy (16) → user card with cause + impact + next action; internal stable codes; ≤1 repair & ≤1 verify-replan; ≤2 provider retries; never silent, never fake success, unverifiable ≠ pass.

## How approval works
PREVIEW default. Plan cards show exactly the compiled action list. Tier-B always confirms. AUTO mode exists only past MVP with separate trust settings.

## How credentials work
BYOK, 4 provider types, plain fetch + strongest structured-output mechanism per provider, memory-only keys by default (opt-in persist w/ warning), redaction everywhere, first-use consent listing outbound data, one-click delete, connection test on demand.

## How scene context works
Local snapshot service builds tiered, aliased, frozen, revision-stamped snapshots per turn and post-transaction; snapshot is advisory — the document is authority at apply time.

## How verification works
Structured expected-vs-actual checks post-transaction (existence, geometry at frames, tween spans, affected-range), verdicts pass/fail/unverifiable, verdict diff can trigger one replan; visual verification is a later opt-in feature.

## MVP includes / excludes
Per 24 (in: BYOK, chat, snapshot, capability, vocabulary, validation, transactions, verify, activity, errors, variables-lite, safety; out: vision, AUTO, opacity, paths, persistence surfaces, proxy, memory-beyond-session). Future path per 25 with blockers.

*Contract end. Engineering starts at 27, gate 28.*
