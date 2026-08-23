# 23 — ENGINEERING DEPENDENCY GRAPH

## Graph (every edge = hard dependency)

```
AiChatPanel ─► AiOrchestrator ─► PromptBuilder ─► ProviderAdapter ─► (network) LLM
     │              │  │  │             ▲                ▲
     │              │  │  └────────────►│ CapabilityRegistry ◄── kineora_capabilities (E-AI-5)
     │              │  └───────────────►│ SnapshotService ◄───── kineora_scene_snapshot (E-AI-2)
     │              │                   │                        kineora_status/evaluate/project_json (EXISTING)
     │              ▼                   │
     │        ActionParser ─► ActionValidator ─► (live doc reads via client.ts)
     │              │                     │
     │              ▼                     ▼
     │        PlanPreviewUI ◄── compiled Command-arg rows (stage 12)
     │              │ approve
     │              ▼
     │        TransactionRunner ─► CompositeCommand (E-AI-1) ─► Session/History ─► Document
     │              │                     ▲ set-by-ids harness (E-AI-3)
     │              ▼                     ▲ revision counter for staleness (E-AI-4)
     │        Verifier ◄── fresh snapshot ◄┘
     │              ▼
     └────── AiActivityLog ◄── transaction record ──► chat cards / references (15) / memory (19)

KeyVault (12) ─► ProviderAdapter · VariableStore (13) ─► PromptBuilder+Validator(stage 6)
OutputLog redaction hook (12) ◄── KeyVault
```

## Engine increments (Rust/WASM — additive only, PR-disclosed per 22)

| ID | Addition | Depends on | Blocked work |
|---|---|---|---|
| **E-AI-1** | `CompositeCommand` in `command.rs` (label+children; reverse revert; counts 1 history entry) | nothing | E-AI-1 blocks EVERYTHING executable (transactions) — first engine PR |
| **E-AI-2** | `Session::scene_snapshot() -> String` (compact semantic JSON, 06 T0/T1 format) | nothing | SnapshotService |
| **E-AI-3** | `kineora_set_selection(ids_json)` + node lookup-by-id in snapshot | nothing | selection harness actions (delete/duplicate nodes by ref) |
| **E-AI-4** | `doc_revision: u64` bumped in History execute/undo/redo; surfaced in snapshot/status | nothing | staleness control (interim tuple fallback documented until then) |
| **E-AI-5** | `kineora_capabilities()` build manifest | nothing (hand-edit until PATH) | CapabilityRegistry honesty |
| E-AI-6 | per-node `alpha` | DECISION needed (Blueprint parity) | fade/opacity intents — NOT MVP |
| E-AI-7 | optional node `name` field | DECISION (schema) | richer references — NICE-TO-HAVE |
| (tools lane) | PATH model | tools phase 3 | path/pen/brush actions (25) |

## UI increments (TS — all new `src/ai/` except noted)

U1 `ai/keys` (KeyVault+redaction hook) → U2 `ai/providers` (4 adapters + test-connection) → U3 `ai/schemas` (action schemas+manifest data) → U4 `ai/snapshot` (service; interim without E-AI-2 possible via project_json pruning — heavier, marked throwaway) → U5 `ai/validator` (+alias/ref resolver) → U6 `ai/runner` (needs **E-AI-1**; selection ops need E-AI-3) → U7 `ai/activity` (+store) → U8 `ai/chat` (panel, cards, composer, modes; mount via App.tsx + commands.ts toggle — disclosed touches) → U9 `ai/variables` (store + resolution + drawer UI) → U10 verifier polish + plan-card diff UI.

## Build order (strict)

1. **E-AI-1 (+unit tests)** — standalone, reviewable alone.
2. U1+U2 (BYOK + adapters + connection test) — usable settings-only PR.
3. E-AI-2+3+4+5 consolidated engine PR (small, additive) + U3+U4.
4. U5 validator (+fuzz) → U6 runner (first end-to-end: Preview-apply of a hand-built plan, no chat yet) → U7.
5. U8 chat (the visible feature) → variables U9 → U10.
6. Locked-order tools increments (rect radius/PolyStar, PATH) continue in parallel; agent lights them up by manifest+schema edit only (07).

## External dependencies

Provider API stability (adapter layer absorbs) · CORS behavior (verified 17) · no new npm packages required (fetch + React + existing test tooling; JSON-schema validation handwritten to keep bundle lean — decision: no ajv dependency, schemas live as typed TS validators generated from one definition table).
