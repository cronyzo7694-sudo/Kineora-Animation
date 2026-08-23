# 22 — CROSS-SYSTEM INTERACTION AUDIT (lane / ownership / protocol)

## Lane ownership check (protocol §2)

**New files (pure AI-T/aɪ lane — zero conflict):** everything under `animator/ui/src/ai/` (chat, orchestrator, adapters, validator, snapshot, activity, keyvault, variables), plus `aiActionSchemas` data.

**Owned-by-AI-T files that gain small additions:** `engine/client.ts` + `wasmTypes.ts` (facade additions for E-AI-2..5), `commands.ts` (AI panel toggle + mode shortcuts — appended in the AI-T `tool.*`-style block discipline), `App.tsx` (panel mount point), `outputLog.ts` reuse (redaction hook).

**AI-B-owned files — DO NOT TOUCH without protocol exception:** `panelLayout.ts`, `workspace.ts`, `TimelineStrip.tsx`, `components/timeline/*`, `LayersPanel.tsx`, `onion*`, `viewPrefs.ts`, `session.rs` frame/layer fns (Rust side), `command.rs` timeline command structs.

**Engine shared files needing PR-disclosed additions (protocol §2 exception, exactly like D-0009):**
- `command.rs`: add `CompositeCommand` (E-AI-1) — additive struct, no existing impl touched.
- `session.rs`: snapshot builder (E-AI-2), `set_selection(ids)` (E-AI-3), revision bump on execute/undo/redo (E-AI-4), `capabilities()` (E-AI-5) — additive fns only.
- `wasm.rs`/`lib.rs`: export the above.
Each engine PR body must list the exact hunks + justification per protocol.

## Interaction matrix (system × AI agent)

| Existing system | Interaction | Risk | Control |
|---|---|---|---|
| Undo/redo | composite entries interleave with human | cleared — 09 verified compatible | E-AI-1 design |
| Autosave/dirty | AI edits set dirty like human edits | none | inherited |
| Stage gestures | drag-in-progress vs apply | mid-gesture mutation = desync | runner waits for gesture-idle flag (03 rule 1) |
| Shortcut dispatcher | chat typing vs canvas shortcuts | hijack | dispatcher already suppresses in inputs; AI panel toggle gets fresh canonical (no conflict — validator enforced) |
| Tool colors/options | shape.create defaults may mirror tool colors | confusion | plan card discloses source; explicit params win |
| Timeline/Layers UI | re-render on AI edits | stale views | facade bus events reused (03 rule 2) |
| Onion skin / view prefs | none (view-only) | none | untouched (AI-B) |
| Export (SVG) | none (read path) | none | untouched |
| Find/replace, menus | none MVP | — | — |

## Decision register addendum proposed

**D-0010 (PENDING HUMAN):** (a) approve NEW FEATURE lane "Kineora AI Agent" (not in Blueprint — new, non-Adobe capability); (b) approve chat panel MVP mount as self-contained overlay via `App.tsx` with later migration into `panelLayout` (AI-B coordination); (c) approve engine additions E-AI-1..5 as additive-only changes to shared files; (d) key-storage policy (memory-default + opt-in persistence) per 12; (e) AI activity/transcript data session-only in MVP.

## Sync points with AI-B

Share this file + D-0010 with AI-B; request review on (b). AI-B's unified timeline/onion work is not modified by this feature; similarly AI-Agent must not bind to TimelineStrip internals — it talks to the facade/engine only.
