# 06 — SCENE SNAPSHOT RESEARCH

## What exists today (audit 02 Q13)

`kineora_status()` (doc/scene/layer/selection summary) · `kineora_evaluate(frame)` (resolved render items) · `kineora_project_json()` (full-fidelity doc) · `kineora_library()`. All read-only by type (no `&mut` semantics exposed); strings out of WASM — the model physically cannot mutate through them.

## Snapshot = strictly read-only, tiered (token-efficient, see 20)

**Tier 0 — STATUS (~150–300 tokens).** Always attached. `{settings:{w,h,fps,bg}, scene{name,index,count}, activeLayer, playhead, selectionIds[], counts:{layers,nodes,keyframes,tweens,symbols}, docRevision (E-AI-4), dirty}`

**Tier 1 — SCENE SUMMARY (~0.5–1.5k tokens for typical docs).** Default for planning.
Per layer (bottom→top): `{id, index, name, kind, visible/locked/outline, parent, keyframes:[{frame,label?,nodeCount}], tweens:[{start,end,ease}], color}`.
Per node (compact): `{id, layer, name?, kind:rect|oval|symbol, fill, stroke?, frame span(s), pos@firstKey, size, rotation}`.
Selection block when non-empty: full detail for selected nodes only.
Library summary: `{id,name,type,uses}`.

**Tier 2 — DETAIL (on demand).** Full node geometry at frame(s), keyframe transform rows for a range, symbol timeline expansion. Fetched via follow-up `scene.inspect` actions when the model declares it needs more (08) — never sent preemptively.

**Tier 3 — FRAME RENDER (rare).** `evaluate(f)` JSON; used by the verifier and when geometry questions need resolved (tweened) positions.

## Answers to the research questions

- **What to send:** Tier 0+1 by default; Tier 2/3 on request. **Never** whole-project dump per turn (20).
- **Selected-object context:** always included when a selection exists (drives "this/selected" references, 15).
- **Minimum context:** Tier 0 + user message suffices for pure creation requests on empty docs.
- **Compression:** names truncated to 40 chars; ids shortened in prompt with server-side alias map (model sees `n1…`; alias→real id resolved in validation stage 7 — also blocks id-injection); unlabeled frames collapsed as ranges.
- **Staleness:** every snapshot stamped with `docRevision` (E-AI-4: monotonic counter bumped on each History execute/undo/redo; until E-AI-4 lands, interim staleness key = `undoLen:redoLen:nodeCount:layerCount` tuple). Any execution re-validates against live doc (05) — a stale snapshot can cause a wrong *plan* but never a wrong *write*.
- **Refresh policy:** rebuilt after each completed/rolled-back transaction and on demand; never cached across turns.
- **Privacy:** snapshot content (names, colors, positions) **is** sent to the provider when chat is used — disclosed in the consent dialog (12); nothing else (no file paths, no keys, no clipboard, no other documents).

## Snapshot kinds (from spec) → realization

scene ✓(T0+T1) · layer ✓(T1 rows) · object ✓(T2) · timeline ✓(T1 keyframe/tween rows) · selection ✓(T1 block) · style ✓(T2 fill/stroke rows) · **capability** ✓(manifest, 07 — travels beside the snapshot in the system prompt, not inside it).

## Read-only enforcement

Structural (no write fns on the service) + review checklist item. Snapshot objects are `Object.freeze`d at construction to make accidental mutation a visible dev-time error.
