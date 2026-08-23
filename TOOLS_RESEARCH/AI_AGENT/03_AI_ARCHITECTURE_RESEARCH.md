# 03 — AI ARCHITECTURE RESEARCH

## Governing idea

One new **UI-side subsystem** (`animator/ui/src/ai/`, AI-T lane) sits *beside* the existing tool system and calls the **same `engine/client.ts` facade** the tools call. The engine (Rust/WASM) gains only small, generic primitives (23). The LLM is a stateless remote planner; everything authoritative lives locally.

```
┌─ Kineora UI ────────────────────────────────────────────────────────┐
│ AiChatPanel (10) ── AiActivityLog (21)                              │
│        │                                                            │
│  AiOrchestrator          ← conversation, modes, budgets (12/19)     │
│   │        │                                                        │
│   │   SnapshotService (06) ── engine read fns (evaluate/status/…)   │
│   │        │                                                        │
│   │   PromptBuilder (system prompt + capability manifest (07)       │
│   │        │            + context tier + user message)              │
│   │        ▼                                                        │
│   │   ProviderAdapter (11/17) ──fetch──► LLM API (BYOK, browser)    │
│   │        ▼ raw text                                               │
│   │   ActionParser → ActionValidator (05) ── reads live doc state   │
│   │        ▼ validated Action[]                                     │
│   │   PlanPreview / Confirmation UI (10)  ←── ASK/PREVIEW modes     │
│   │        ▼ approved                                               │
│   │   TransactionRunner (09) ── compiles Actions → Commands         │
│   │        ▼                     → ONE CompositeCommand (E-AI-1)    │
│   └──► engine/client.ts facade ──► WASM ──► Session/History ──► Doc │
│        ▼                                                            │
│   Verifier (08): fresh snapshot vs expected effects → report        │
└─────────────────────────────────────────────────────────────────────┘
```

## Component contracts (conceptual)

- **AiOrchestrator** — one in-flight request at a time per document. Owns mode (ASK/PREVIEW/APPLY), budgets, cancellation (`AbortController`), and the plan→confirm→run→verify loop. Never touches the document directly.
- **SnapshotService** — builds read-only snapshots from existing engine read fns (+ E-AI-2 compact snapshot). Pure read; no write path exists on this object by construction.
- **CapabilityRegistry** — merges (a) engine build capabilities (E-AI-5), (b) tools-lane status (`TOOLS_STATUS_AND_PLAN.md` mirrored as machine-readable data), (c) runtime flags (wasm facade presence, e.g. `hasShapeDrawFacade()`). Emits the manifest injected into the system prompt and consulted by the validator.
- **ProviderAdapter** — one narrow interface: `complete(messages, {model, jsonSchema, signal}) → {text, usage}` + `testConnection()`. Concrete adapters: OpenAI, Anthropic, Gemini, OpenAI-compatible (17). No SDKs — plain `fetch` (keeps bundle lean, CORS-verified for all three first-party APIs, see 17).
- **ActionParser/Validator** — see 05. Output of parser is untyped text; output of validator is a frozen, fully-resolved action list (ids resolved, colors normalized, frames bounds-checked) ready for compilation.
- **TransactionRunner** — compiles each validated action to the client-facade calls that build the corresponding `Command`s, wrapped in one `CompositeCommand` (E-AI-1) → one undo entry (09). All-or-nothing with rollback on mid-failure.
- **Verifier** — compares post-run snapshot against the plan's declared expected effects (structured verification; pixels only post-MVP, 18) and produces the honest report (21).

## Why this shape (alternatives considered)

| Option | Verdict | Why |
|---|---|---|
| AI calls WASM `kineora_*` directly | ❌ Rejected | Bypasses facade side-effects (bus events, degradation handling, selection capture); UI would desync |
| AI issues Commands in Rust (agent inside core) | ❌ Rejected | Provider/network/chat is UI territory; core stays offline-first and deterministic; wasm boundary churn |
| **AI as UI-side controlled user on the client facade** | ✅ Chosen | Same path as human tools; undo/guards/dirty/bus all inherited; engine diff minimal (23) |
| Parallel "AI document ops" beside commands | ❌ Rejected | Violates principle 1; undo/redo corruption risk |

## Synchronization rules

1. Orchestrator runs actions **only when the editor is idle** (no active drag gesture — Stage sets a gesture flag the runner awaits).
2. Every executed plan triggers the facade's existing events (`docChanged`, `emitSelectionChanged`, layer events) → Timeline/Layers/Stage re-render exactly as if a human acted.
3. Human edits during AI generation are allowed; **execution always re-validates against live state at apply time** (snapshots are planning aids, never authority — 06 §staleness).
4. Undo interleaving: an AI composite is one stack entry, identical in kind to human entries; no special-casing (09).

## State ownership

| State | Owner | Persisted? |
|---|---|---|
| Conversation thread(s) | AiOrchestrator (per doc id) | Session-only (MVP); export transcript optional future |
| Provider configs (non-secret) | UI prefs store | Yes (localStorage, existing prefs pattern) |
| API keys | KeyVault (memory) | No by default; opt-in localStorage w/ warning (12) |
| Variables | VariableStore | Session-only MVP (13) |
| Activity log | AiActivityLog store | Session-only MVP (21) |
| Document/everything undoable | Engine (unchanged owner) | Existing persist |
