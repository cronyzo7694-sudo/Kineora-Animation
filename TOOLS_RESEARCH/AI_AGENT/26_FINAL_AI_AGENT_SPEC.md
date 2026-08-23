# 26 — FINAL AI AGENT SPEC (normative)

Status terms (RFC-2119-ish): MUST / SHOULD / MAY. IDs `AI-REQ-nnn` are the testable units for 27. Sources are cited per section; where this file and another disagree, THIS file wins.

## A. Visibility (what the AI can see)
- AI-REQ-001 The agent MUST receive only: system prompt, capability manifest, action schemas, snapshot (Tier 0/1 default; 2/3 on request), conversation window (≤12 turns), entity bindings, current mode, resolved variables. (06/19)
- AI-REQ-002 The agent MUST NEVER receive: API keys, other documents, file paths, clipboard contents, application logs, or pixel data (MVP). (12/18)
- AI-REQ-003 Snapshots MUST be rebuilt per turn and after every transaction; they MUST carry a revision stamp and MUST be read-only-frozen. (06)
- AI-REQ-004 Snapshot content MUST be wrapped as quoted data with instruction-hierarchy marking. (12)

## B. Capability honesty
- AI-REQ-010 A capability manifest (supported/partial/unsupported/deferred) MUST drive the system prompt, the validator, and the UI banner; unsupported requests MUST be refused with an alternative, never faked. (07)
- AI-REQ-011 The MVP manifest MUST equal 07's v0 table until an engine increment lands.

## C. What the AI can do (MVP closed vocabulary)
- AI-REQ-020 The executable vocabulary MUST be exactly the 04 table (Tier A/B), each action bound 1:1 to existing Commands/facade ops; unknown or invented actions MUST fail closed.
- AI-REQ-021 Actions MUST be atomic, sequential, ≤64 per plan, ≤256 mutated objects, ≤1000 selection size. (D-AI-BUDGETS)
- AI-REQ-022 Model output MUST NOT contain raw engine ids it was not given; references MUST use the 15 forms and resolve client-side.

## D. Validation & execution
- AI-REQ-030 Every plan MUST pass the 12-stage pipeline (05); stages 8/9 MUST be re-evaluated against live state at apply time.
- AI-REQ-031 Param coercion, expression evaluation, HTML rendering of AI text, and partial-plan drops MUST NOT exist anywhere in the pipeline. (05/08/16)
- AI-REQ-032 Execution MUST compile to exactly one `CompositeCommand` per approved plan → exactly one History entry labeled `AI — <report>`; revert order MUST be reverse of apply; mid-failure MUST roll back fully and push nothing. (09, E-AI-1)
- AI-REQ-033 Execution MUST wait for gesture-idle and MUST emit the existing facade bus events. (03)
- AI-REQ-034 Destructive tier-B actions MUST show an explicit confirmation listing affected content; mass-destructive (>20 nodes or >50% of content) MUST require typed confirmation — in every mode. (10/12)

## E. Modes & control
- AI-REQ-040 Modes MUST be ASK / PREVIEW(default) / APPLY; AUTO MUST NOT ship in MVP. (10 DEFAULT-7)
- AI-REQ-041 Stop MUST abort network generation immediately and MUST leave the document untouched unless a plan already passed approval (apply itself is atomic). (09/16)
- AI-REQ-042 At most one in-flight request per document. (03)

## F. Verification & reporting
- AI-REQ-050 Every applied transaction MUST be structurally verified against `expected[]` with verdicts pass|fail|unverifiable; unverifiable MUST NOT be reported as pass. (08)
- AI-REQ-051 Every transaction MUST produce an activity record (21) with per-action before→after, tokens, outcome; failures and rollbacks MUST remain visible.
- AI-REQ-052 The agent MUST NOT claim visual verification in MVP; reports say "structurally verified".

## G. Providers & keys (BYOK)
- AI-REQ-060 Provider types MUST include openai, anthropic, gemini, openai-compatible (endpoint); plain fetch, no SDKs. (11/17)
- AI-REQ-061 Structured output MUST use the strongest available mechanism with loud, advertised degradation to strict-parse mode. (11)
- AI-REQ-062 Keys MUST be memory-only by default; persistence is opt-in with a warning; keys MUST pass a redaction filter on all log/error paths and MUST never be baked via env/bundle or committed to git. (12)
- AI-REQ-063 First use MUST show the consent dialog enumerating exactly what leaves the device, with provider privacy links. (12)

## H. Agent-loop safety budgets (D-AI-BUDGETS, binding defaults)
| Budget | Value |
|---|---|
| In-flight requests / doc | 1 |
| Repair attempts (malformed/validation) | 1 each |
| Verify replans | 1 |
| Provider retries (429/5xx) | 2, exp backoff |
| Plan size | ≤64 actions / ≤256 mutated objects |
| Snapshot size | ≤~3k tokens (else summarize+focus) |
| Conversation window | ≤12 turns |
| Daily tokens | user-settable ceiling, hard stop |
| Generation timeout | 120s default, user-configurable 15–600s |
- AI-REQ-070 Budgets MUST be enforced client-side and MUST NOT be raisable by prompt content.
- AI-REQ-071 The agent MUST NOT be able to trigger another agent request (no self-chaining).

## I. Variables
- AI-REQ-080 `$vars` MUST resolve client-side pre-validation and re-pass range checks; undeclared vars MUST fail with a define affordance; models MUST NOT create variables silently. (13)
- AI-REQ-081 Session scope default; project-file persistence MUST NOT ship without its schema DECISION.

## J. Errors
- AI-REQ-090 The 16 taxonomy MUST map to actionable user cards; internal records carry stable `E_*` codes; silent-failure ban list (16) is normative.

## K. Lanes & process
- AI-REQ-100 Engine changes limited to additive E-AI-1..5 with PR disclosure; AI-B files untouched except disclosed panel migration later. (22)
- AI-REQ-101 No production system-prompt text is final in this package; it is written AND test-fixtured during U5/U8 engineering (spec compliance: research described its required contents — 14/19/26, engineering writes the text).

## L. Non-MVP guards
- AI-REQ-110 Anything in 25 (F1+) MUST be unreachable in MVP builds via manifest state, not via code absence alone.

## M. Engineering-handoff addendum (LOCKED 2026-08-23, overrides nothing above)
- AI-REQ-023 **Frame reuse & minimal mutation.** Animation plans MUST reuse existing frame content (duplicate/extend keyframes, hold content), MUST preserve unchanged objects, and MUST mutate only the properties that changed (transform-only for moves, style-only for recolors, timeline ops for structure). Recreating unchanged artwork per frame is a validation-level violation; `expected[]` rows MUST name the mutated properties so the verifier can check exactly those.
- AI-REQ-111 **Capability single source of truth.** The validator, prompt, and UI MUST consume ONE trusted runtime capability registry (E-AI-5 engine manifest + facade probes + tools status). Adding a new Kineora capability MUST require only registration — zero AI-orchestration edits. Hard-coded per-tool checks inside the agent are forbidden where a generic capability definition suffices.
- AI-REQ-112 A tool visible in the Kineora UI but not exposed through the trusted registry MUST be answered with: "Ye tool Kineora mein available hai, lekin AI ke liye abhi exposed nahi hai." UI presence never implies AI permission.
- AI-REQ-113 No image generation, ever (not MVP, not future scope in this lane). Pixels are never authoritative; structured engine state is. Vision (18) stays post-MVP and assist-only.
- AI-REQ-023+111 MUST NOT conflict: dynamic discovery never weakens frame reuse (new capabilities inherit the same minimal-mutation rule via their declared param/mutation metadata).
