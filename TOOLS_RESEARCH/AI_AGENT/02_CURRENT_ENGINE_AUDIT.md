# 02 — CURRENT ENGINE AUDIT (ground truth)

Inspected directly on 2026-08-23 (`animator/core/src` = 9,442 LOC; `animator/ui/src`). Every claim below carries evidence. Where a question's answer is "does not exist", that is a **verified absence** (grep/read), not an assumption.

## Q1. What command layer already exists?

`core/src/command.rs`. Trait (L43–46): `Command { label(), apply(doc), revert(doc) }` — **mutation-only, reversible, labeled**. Every document mutation is a Command (REQ-SYS-002). `History` (L60+): `undo`/`redo` stacks of `HistoryEntry { cmd, prev_selection, post_selection }`, bound `HISTORY_BOUND = 100` (L48), plus a **saved-snapshot dirty model** (`saved: Option<Document>`, `is_dirty` compares content; `next_id` excluded). Redo cleared on new execute. Selection is **not** commanded — Session captures/restores it around execute/undo (INV-EDIT-2).

**Key finding for AI:** there is **NO command grouping/batch/composite** — verified by exhaustive grep (`Composite|Batch|execute_group|begin_transaction|macro_command` → no hits). One user gesture = one command = one undo entry today. An AI transaction (N actions) needs a NEW composite mechanism → see `09`, dependency E-AI-1 in `23`.

## Q2. What actions can the current engine perform?

Derived from actual `Command` structs (`command.rs`) + `edit_ops.rs`:

- **Draw:** `DrawRect` (E1: parametric `rect`|`oval`, fill + stroke + stroke_width) — label follows shape ("Draw oval").
- **Select/transform:** `MoveSelection`, `TransformSelection` (absolute per-node transforms), `SetNodeProps` (width/height/fill/stroke tri-state), rotate/flip/remove-transform/arrange/align (session fns wrapping commands), `DeleteSelection`, `PasteObjects` (+duplicate offset).
- **Timeline:** `InsertKeyframe`, `InsertBlankKeyframe`, `ClearKeyframe`, `InsertFrames`, `DeleteFrames`, `MoveKeyframe`, `DuplicateKeyframe`, `RemoveFrames`, `PasteFrames`, `ReverseFrames`, `MoveKeyframeSequence`, `ResizeSpan`, `DuplicateFrames`, `ConvertToKeyframes`, `ConvertToBlankKeyframes`, `SetFrameLabel`.
- **Tween:** `SetClassicTween { start, end, ease }`, `RemoveClassicTween`.
- **Symbols:** `ConvertToSymbol`, `CreateSymbol`, `PlaceSymbol`, `RenameSymbol`, `SwapInstance`, `SetInstanceLoop`, `DeleteSymbol (break_apart)`.
- **Layers/scenes:** `CreateLayer`, `CreateFolder` (session), `DeleteLayer`, `RenameLayer`, `SetLayerVisible/Locked/Outline/OutlineColor`, `SetLayerFlags` (toggles), `DuplicateLayer`, `ReorderLayer`, `SetLayerParent`, `SetFolderCollapsed`, `DeleteLayerGroup`, `CreateScene`. Also `SetDocumentSettings` (SettingsPatch).
- **Clipboard:** app-level object clipboard (`edit_ops.rs`: `ObjectClip`, PasteMode, ArrangeOp, AlignOp/AlignSpace).

## Q3. How are document changes represented?

Only via Command apply/revert against `Document`. Session (`session.rs` L66+) owns `doc`, view state (`active_scene`, `active_layer`, `selection: Vec<NodeId>`, playhead), clipboard, `History`. Persistence (`persist.rs`): JSON `formatVersion = 1` + checksum sidecar + versioned `migrate(0→1)`; serde `#[serde(default)]` everywhere → old files load. `kineora_project_json()` / `kineora_load_json()` round-trip the whole doc through WASM.

## Q4. Layers?

`model.rs` L327–407: `LayerKind::Normal|Folder` (mask/guide/pose QUEUED — do not invent). `Layer { id, name, kind, keyframes: BTreeMap<u32, Frame>, visible, locked, outline, outline_color, parent, collapsed }`. Ancestor-aware helpers: `layer_and_ancestors_visible/unlocked` (L508/532), `layer_effective_*`, `layer_descendants`, `layer_is_ancestor`. Guards: draw/edit blocked on folder / hidden / locked (incl. ancestors) — the 10-rule guard already enforced in `draw_shape` (`draw:blocked(...)` log lines).

## Q5. Frames?

Sparse: `BTreeMap<u32, Frame>` per layer (REQ-TIM-001). `Frame::Keyframe { content: Vec<NodeId>, transforms: BTreeMap<NodeId, Transform>, label: Option<String> } | Frame::Blank` (L272+). **Hold rule**: content of nearest keyframe ≤ frame; Blank clears. `timeline_duration` = max keyframe. Per-keyframe transform overrides live inside keyframes (classic whole-frame key model).

## Q6. Shapes?

`Node` enum (L144) has exactly TWO variants:
- `Rect { id, transform, width, height, fill: String, stroke: Option<String>, stroke_width, shape: ShapeKind }` — `ShapeKind::Rect|Oval` (default rect, serde-lowercase).
- `SymbolInstance { id, transform, symbol_id, loop_mode, first_frame }`.

**No path/brush/text node kinds exist.** Nodes live in one doc-level `BTreeMap<NodeId, Node>`; keyframes reference them by id. Eval renders `RectItem { id, x, y, w, h, rotation, fill, stroke, stroke_width, outline_color?, shape }` (`eval.rs` L19+). Exact ellipse hit-test/marquee shipped (E1a). Renderer = SVG export = rasterizer share geometry (`export.rs` uses the same eval items; oval → `<ellipse>`).

## Q7. Symbols?

`Symbol { id, name, symbol_type: Graphic|MovieClip|Button, registration: Transform, timeline: Vec<Layer> }` (L108+), one library per document (`Document.library`, serde-default for legacy files). `LoopMode::Loop|PlayOnce|SingleFrame` (MovieClips ignore). Full command set per Q2. `symbol_use_count`, `referenced_node_ids` for safe delete.

## Q8. Colors?

Plain `#rrggbb` strings. Fill: `String` (**non-optional** — draw-time always has a fill; "no fill" is NOT representable today). Stroke: `Option<String>` + `stroke_width: f64`. Document: `background` + `background_alpha 0..=1`. Layer outline color (`#ff0000` default). **No per-node opacity** (`NodePropsPatch` = width/height/fill/stroke_enabled/stroke/stroke_width only, `session.rs` L42) — verified gap. No gradients/patterns.

## Q9. Transforms?

`Transform { x, y, scale_x, scale_y, rotation }` (L57+); rotation in **degrees, clockwise, Y-down**, pivot = shape **center** (renderer/eval/export agree). `TransformPatch` = all-`Option` partial (x/y/scale_x/scale_y/rotation). Classic tween interpolates x/y/scale lerp + rotation (`eval.rs` L113).

## Q10. Tweens?

`ClassicTween { end: u32, ease: f64 }` (L416) — ease is the **−100..+100 slider** mapped to quadratic in/out (`easing.rs::ease_classic`; positive = ease-out). Spans interpolate keyframe→keyframe transforms (`eval.rs` L51–113). `easing.rs` also ships the full Penner family (`EaseFn`: linear/quad/…/bounce, In/Out/InOut, steps) — but **only `ease_classic` is wired into classic tween evaluation**; named easings are dormant infrastructure. **No motion tween, no shape tween** (Blueprint parts exist; engine pending).

## Q11. Undo/redo conceptually?

`History` push on execute (apply → undo stack, clear redo, dirty_hint), `undo()` reverts top and restores `prev_selection`, `redo()` re-applies and restores `post_selection`. Labels exposed (`undo_labels`). Absolute 100-entry bound. Dirty = content-diff vs saved snapshot. One entry per command — **no grouping** (Q1).

## Q12. Functions already exposed to UI?

WASM (`wasm.rs`, wasm32-gated): ~95 `kineora_*` fns — doc manager (new/open/list/active/close/reorder/title), draw (`draw_rect`, `draw_shape`), selection (at/toggle/in_rect/all/clear), transform patches, full timeline set, tween set, symbol set, layer/scene set, object clipboard ops, arrange/align, undo/redo, `evaluate`, `export_svg(_scaled)`, save/load(+json), `status`, `library`, `set_document_settings`, `patch_transforms`, `set_node_props`. UI facade `engine/client.ts` (1024 LOC) wraps each with post-conditions: `docChanged(kind)` bus events, `emitSelectionChanged/LayerChanged` — **the facade is the correct AI call surface** (it already handles honest degradation, e.g. stale-wasm fallback for `drawShape`).

## Q13. Snapshot/export capability?

**Already exists (read paths):** `kineora_evaluate(frame)` → full resolved render JSON for a frame; `kineora_project_json()` → entire document JSON; `kineora_status()` → `{docs, active doc/scene/layer, selection ids, selection rects}`; `export_svg` + scaled. **Gaps for AI use:** no compact *semantic* snapshot (layers/keyframes/tweens/node summary in one small payload — project_json is full-fidelity, too heavy per-turn), no per-node lookup-by-id API, no doc revision counter for staleness. → Snapshot service design in `06`, engine adds E-AI-2/3 in `23`.

## Q14. Currently unavailable (verified absences)

Path/Pen/Pencil/Paint-Brush drawing (no path node kind), Eraser, Width, Text, per-node opacity, gradients, motion tween, shape tween, masks/guides, camera moves, bones, audio; **select-by-ids** WASM fn (selection only via point/rect/all/clear); **composite/group command**; engine-side playback control (playback is UI-side); capability manifest endpoint; doc revision counter.

## Q15. Safe to expose to an AI today?

All read paths (Q13), all non-destructive commands (Q2) behind validation. Destructive-but-valid commands (DeleteLayer, DeleteSelection, RemoveFrames, DeleteSymbol, ClearKeyframe, SetDocumentSettings) only with confirmation tiering (10 §modes). Never exposed: raw `load_json` overwrite, save-to-path, doc close/delete, any future engine-internal handle.

## Q16. Must be added later (engineering dependencies)

E-AI-1 `CompositeCommand` (transaction undo), E-AI-2 `scene_snapshot()` engine fn (compact semantic JSON), E-AI-3 `kineora_set_selection(ids)` + lookup-by-id, E-AI-4 `doc_revision` counter (staleness), E-AI-5 `capabilities()` manifest fn (build-time truth), E-AI-6 per-node `alpha` (only if scope approves; Blueprint-parity question → DECISIONS), PATH model (tools lane phase 3) before any draw-freehand actions. Details in `23`.
