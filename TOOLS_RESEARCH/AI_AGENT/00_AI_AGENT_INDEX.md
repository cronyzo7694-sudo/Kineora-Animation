# 00 — AI AGENT RESEARCH PACKAGE · INDEX

**Lane:** AI-T (research) · **Date:** 2026-08-23 · **Base:** `main` @ `ee6e715` (PR #4 merged; working tree carries its content)
**Status:** Research + specification only. **ZERO code written** (no Rust/TS/JS/schema-implementation — action examples are conceptual protocol illustrations).

This package is the complete pre-engineering research for the **Kineora AI Animation Agent** — a built-in, provider-agnostic (BYOK) assistant that operates the editor like a second controlled user, exclusively through the validated command boundary.

## Reading order

| # | File | One-liner |
|---|------|-----------|
| 01 | PRODUCT_VISION | What we are building and the non-negotiable principles |
| 02 | CURRENT_ENGINE_AUDIT | **Ground truth.** 16 audit questions answered from the actual repo (file:line refs) |
| 03 | ARCHITECTURE_RESEARCH | Module map: chat → orchestrator → validator → command layer → snapshot → verify |
| 04 | ACTION_SYSTEM_RESEARCH | Action vocabulary **derived from `command.rs`**, not from imagination |
| 05 | ACTION_VALIDATION_RESEARCH | 12-stage pipeline; every raw-LLM-output distrust rule |
| 06 | SCENE_SNAPSHOT_RESEARCH | Read-only scene representation; context tiers; staleness |
| 07 | CAPABILITY_SYSTEM | SUPPORTED / PARTIAL / NOT SUPPORTED / DEFERRED manifest |
| 08 | PLAN_EXECUTE_VERIFY | Agentic workflow and verification policy |
| 09 | UNDO_TRANSACTION_MODEL | ONE REQUEST = ONE UNDO; composite command; rollback |
| 10 | FRONTEND_CHAT_UX | Animation command-center chat, not a generic chatbot |
| 11 | BYOK_PROVIDER_RESEARCH | Provider config, key handling, connection test, usage |
| 12 | SECURITY_PRIVACY_RESEARCH | **Threat model included here** (keys, injection, deployment modes) |
| 13 | VARIABLE_SYSTEM | `$variables` — kinds, types, resolution, scope |
| 14 | NATURAL_LANGUAGE_INTENT | Intent → plan mapping, defaults, ambiguity policy |
| 15 | REFERENCE_RESOLUTION | "the ball" → stable NodeId; ID-first protocol |
| 16 | ERROR_RECOVERY | Full failure taxonomy + user-facing behavior |
| 17 | PROVIDER_COMPARISON | OpenAI / Anthropic / Gemini / OpenAI-compatible matrix |
| 18 | VISION_RESEARCH | Image understanding — explicitly post-MVP |
| 19 | MEMORY_CONTEXT_RESEARCH | Conversation + scene memory; staleness rules |
| 20 | COST_PERFORMANCE | Token budgets, compression, caching layout |
| 21 | AI_ACTIVITY_LOG | "What did the AI just do?" — grouped, honest history |
| 22 | CROSS_SYSTEM_INTERACTION_AUDIT | Lane ownership (AI-T/AI-B), protocol exceptions, D-0010 |
| 23 | ENGINEERING_DEPENDENCY_GRAPH | Every dependency + build order |
| 24 | MVP_SCOPE | Smallest genuinely useful agent, derived from audit |
| 25 | FUTURE_SCOPE | Everything deliberately excluded from MVP |
| 26 | FINAL_AI_AGENT_SPEC | Normative specification (AI-REQ-xxx) |
| 27 | ENGINEERING_HANDOFF | PR slicing, test strategy, risks, toolchain |
| 28 | FINAL_AUDIT | Gate verdict + **FINAL AI AGENT CONTRACT** |

## Method

1. Repository inspected directly (`animator/core/src/*`, `animator/ui/src/*`, tests, coordination docs) — findings in `02` carry file/line evidence. Nothing assumed from prior conversation.
2. Capability and action vocabulary **derived** from the real command layer (`command.rs`), session API (`session.rs`), and WASM surface (`wasm.rs`).
3. Every product ambiguity resolved to a **provisional default**, flagged `DEFAULT(n)` and collected in `28 §Provisional defaults` for human override. Critical ambiguity after defaults = zero.
4. Authority order respected: Blueprint > Phase docs > Engineering > DECISIONS > forensic > tests > code > Adobe helpx. This feature is **not in the Blueprint and not in Adobe Animate** — it is marked throughout as `[NEW FEATURE — NOT IN BLUEPRINT]`, coordinated via decision D-0010.

## Hard boundaries restated

- 2D only. No 3D anything. No rigging/bones in scope.
- AI never mutates the document outside the validated command boundary.
- No code in this phase; engineering begins only from `27` after human sign-off of `28`.
