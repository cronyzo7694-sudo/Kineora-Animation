# KINEORA — LAYER / FOLDER / TIMELINE FORENSIC RESEARCH

**Status:** RESEARCH ONLY — NO PRODUCT CODE CHANGED IN THIS DOCUMENT
**Worker:** AI-B (SYS-08→14) · **Date:** 2026-08-22
**Base commits:** reconstructed from `7ab803a` (origin/main at research time)
**Purpose:** two future coding agents must be able to implement/repair layers without repeating this research.

> Authority order (binding): **[BLUEPRINT]** > Phase 2 / 2.5 / 3 > **[ENGINEERING]** > approved decisions > **[FORENSIC]** > **[ADOBE]** > **[CODE]** / **[TEST]**. An inference is tagged **[INFERENCE]** and is never a requirement.

---

## 1. Executive summary

Kineora's layer model is **mostly coherent and intentionally minimal**:

- `Document → Scene[] → Layer[] → keyframes (BTreeMap<frame,Frame>)` [CODE model.rs:402-447]. Every scene owns its layers and its timeline (a per-layer frame map). There is no global layer list.
- Two layer kinds exist: **Normal** (has keyframes, is drawable) and **Folder** (organizational, NO keyframes) [CODE model.rs:307-397]. Folders form a tree via `Layer.parent_id: Option<LayerId>` and support arbitrary nesting with a cycle guard [CODE model.rs:588-627].
- Folders cascade visibility/outline to descendants (one undoable `SetLayerFlags` command) [CODE session.rs:1813-1855], but **locking a folder does NOT cascade** [CODE session.rs:1759-1786] — this asymmetry is a BUG (see §28 B-3).
- Several **folder-target bugs** exist that silently create broken/orphan data or no-op edits: frame ops (F5/F6/F7) and object draw/paste/duplicate on a folder; hidden-folder children still render; duplicate_folder does not copy the subtree. These are the highest-priority fixes.
- The `active_layer` is a flat **array index**, not an id, and is the cursor for drawing/frame ops. It MAY point at a folder today (which causes the bugs above). The invariant "active_layer must be drawable when a draw/frame/paste op runs" is not enforced.
- Layer stacking: `Scene.layers` is bottom→top; rendering walks the vec and skips `!visible||locked`; **it does not walk the folder tree**, so folder hierarchy is currently a panel/UI concept more than a render concept. Folders themselves are skipped at render (they have no content), but children of a hidden folder are rendered — BUG.

No product code is changed here. Sections 19–37 give the target architecture, coding blueprint, test matrix, and do-not-invent list.

---

## 2. Repository reconstruction

- `git fetch origin/main` → HEAD `7ab803a`. Working tree clean after pull.
- Recent workers touching layers/folders/timeline:
  - **AI-C (SYS-16):** F-20-04/05 layer outline, duplicate, batch flags, **folders** (`create_folder`, `set_layer_parent`, `set_folder_collapsed`, `DeleteLayerGroup`, `SetLayerParent`, `SetFolderCollapsed`, `SetLayerFlags`) — commits 9128ad9, 46d3b9e, 35098a6, 9128ad9..; multiple toolchain-less break/fix cycles (INT-AID-004/005, BLK-D-007).
  - **AI-D (SYS-22..28):** reconstructed missing SYS-16 Rust facades verbatim from AI-C's tests; later a mechanical `cargo fmt` (401370c); SYS-05 Scene append (290cc7d); flagged pre-existing `edit_ops` test failure BUG-D-001 (7ab803a).
  - **AI-A (SYS-01/03):** F8/selection, panel commandIds, C-2 prevSelection.
  - **AI-B (this worker):** SYS-14 selection payload, SYS-09/10/11/12, Edit folder-paste block (`40999d7`).
- Rust toolchain is **NOT available in this sandbox** (no `cargo`/`rustc`). All Rust findings here are from static reading; BUG-D-001 reports a compile/test failure that could not be independently run. **NOT TESTED — TOOLCHAIN.**

---

## 3. Authority hierarchy

1. **[BLUEPRINT]** `animate-blueprint/` (Part 01 app map, Part 03 selection, Part 07 timeline, Part 20 layers, Part 25 scenes, Part 33 data model).
2. **[ENGINEERING]** `engineering/` (MOD-DOC, MOD-LAYER, MOD-TIMELINE, MOD-COMMAND, state machines).
3. **[FORENSIC]** `FORENSIC_SPECS/SYS-03/*`, SYS-01, SYS-02 H00, and the F-20 references in code/specs.
4. **[ADOBE]** Adobe Animate user guide (Timeline layers, layer folders, layer parenting) — comparison only; never overrides Kineora.
5. **[CODE]/[TEST]** evidence.

Key [BLUEPRINT] anchors:
- §1.1 shell: a workspace saves panel layout; **dark/light via CSS tokens**; a single event bus carries `context/selection/timeline/document/tool:changed`; **panels never read each other directly** [BLUEPRINT 01:56-57].
- §1.2.4 Insert menu: Timeline → Frame/Keyframe/Blank Keyframe = F5/F6/F7; **Scene appends a scene (Part 25)** [BLUEPRINT 01:108-117].
- §1.4.1 view transform is on top and never stored in the document [BLUEPRINT].
- Part 03: selection is transient IDs; Select All selects on **unlocked, visible layers of the current timeline (scene)** [BLUEPRINT 03:3.3.5].
- Folders are organizational and (Adobe/Kineora) store no drawable frames.

---

## 4. Blueprint requirements (layers/folders/timeline)

- **Layers** organize content over time; each layer has its own frame sequence; timeline = stack of layers [BLUEPRINT Part 07/20].
- **Layer folder** groups layers; can contain layers and other folders (tree); has expand/collapse; controls cascade to contained layers; deleting a folder deletes its contents [BLUEPRINT Part 20 / ADOBE].
- **Active layer** is the draw/frame target. Drawing, pasting, and frame insertions apply to the active layer.
- **Visible/locked/outline** flags exist. Locked/hidden layers are excluded from selection and Select All [BLUEPRINT Part 03 §3.3.5, Part 20.2].
- **Layer order = stacking order**: bottom of the list renders first/back; top renders last/front.
- **Each scene has its own timeline**; scene switching changes the visible layers/frames [BLUEPRINT Part 25].
- Layer/frame **context menu** and Timeline panel own create/delete/reorder/rename/hide/lock [BLUEPRINT Part 30].
- Preferences/shortcuts/toolbars are editor settings (PREF), not document [BLUEPRINT §1.2.2].

---

## 5. Current Kineora architecture (evidence)

### 5.1 Data model — `animator/core/src/model.rs`
```
Document { settings, scenes: Vec<Scene>, nodes: BTreeMap<NodeId,Node>,
           library, meta, format_version, next_id }      // model.rs:429
Scene    { id: SceneId, name: String, layers: Vec<Layer> } // 402  ("bottom → top")
Layer    { id: LayerId, name, keyframes: BTreeMap<u32,Frame>, tweens,
           visible, locked, outline, outline_color,
           kind: LayerKind::{Normal,Folder}, parent_id: Option<LayerId>,
           collapsed }                                     // 314-348
Frame    :: Keyframe{content:Vec<NodeId>, transforms, label} | Blank   // 252
```
- **Normal layer** is created with an initial keyframe at frame 1 [model.rs:359].
- **Folder** has `keyframes: BTreeMap::new()` (empty) and `tweens: empty` [model.rs:375].
- `parent_id` is documented as **"Folder parent (F-20-05). Organizational only — NOT transform parenting"** [model.rs:341-343]. So concepts A (folder hierarchy) and D (rigging/parenting) are already correctly separated in the model.
- IDs are `LayerId(u64)`/`SceneId(u64)`/`NodeId(u64)`, allocated from `Document.next_id`. Stable across save/load.

### 5.2 Timeline = per-layer frame map
There is **no separate `Timeline` struct**. The "timeline" of a scene is the collection of its layers' `keyframes` maps. This matches the [BLUEPRINT] scene→timeline→layers model. A frame number is global within the scene; each layer independently holds/inserts keyframes at that number.

### 5.3 Folder tree helpers — `model.rs`
- `layer_depth(scene, id)` with cycle guard [588].
- `layer_descendants(scene, folder_id)` — all direct+nested children [607].
- `layer_is_ancestor(scene, maybe_ancestor, child)` [625].
- These are pure reads on the flat `layers` vec via `parent_id`.

### 5.4 Session operations — `session.rs`
| Op | Method | Command | Undoable | Notes |
|---|---|---|---|---|
| create layer | `create_layer()` 1521 | `CreateLayer` | yes | inserts ABOVE active; becomes active |
| create folder | `create_folder()` 1540 | `CreateLayer` | yes | inserts above active; becomes active (**BUG seed**: can be active) |
| nest/unnest | `set_layer_parent(child, Option<parent>)` 1576 | `SetLayerParent` | yes | blocks non-folder parent & cycles |
| collapse | `set_folder_collapsed(i,c)` 1614 | `SetFolderCollapsed` | yes | folders only |
| delete | `delete_layer(i)` 1657 | `DeleteLayer` / `DeleteLayerGroup` | yes | last layer blocked; folder = deletes subtree (unless it would empty doc) |
| rename | `rename_layer(i,name)` 1698 | (RenameLayer) | yes | empty = no-op |
| visible | `set_layer_visible(i,v)` 1726 | folder→`SetLayerFlags` (cascade) / leaf→`SetLayerVisible` | yes | hide drops selection |
| locked | `set_layer_locked(i,l)` 1759 | `SetLayerLocked` (leaf only) | yes | **does NOT cascade for folders** |
| outline | `set_layer_outline(i,o)` 1788 | folder→cascade / leaf→`SetLayerOutline` | yes | view-only |
| outline color | `set_layer_outline_color` 1850 | `SetLayerOutlineColor` | yes | |
| duplicate | `duplicate_layer(i)` 1943 | `DuplicateLayer` | yes | deep node id remap; **folder subtree NOT duplicated** |
| Alt-click others | `toggle_other_layers_*` | `SetLayerFlags` batch | yes | M.3 all-hidden rescue for eye |
| move/reorder | (reorder command near 2085) | layer reorder command | yes | |

- `active_layer: usize` is a **vector index** into the active scene's `layers` [session.rs:71].
- After structural mutations, `sanitize_indices()` clamps `active_scene/active_layer` [2181] and `prune_selection_existence()` drops deleted node ids [2197].
- Commands live in `command.rs` / `edit_ops.rs`; History captures `prev_selection`/`post_selection` (C-2) and is bounded at 100 (`HISTORY_BOUND`) [command.rs:49].

---

## 6. Scene → Timeline → Layer relationship (HIGH PRIORITY question)

**Answer: YES — layers belong to each scene (its timeline), not globally.**

Evidence:
- [CODE] `Scene { layers: Vec<Layer> }`; all layer operations take `self.active_scene` and index `doc.scene(active_scene).layers` [session.rs everywhere].
- [CODE] name generators (`next_layer_name`, `next_folder_name`) scan **all scenes' layers** only to avoid duplicate display names [session.rs:1557-1568] — IDs remain globally unique.
- [BLUEPRINT Part 25] a Scene owns its timeline; multiple scenes are separate timelines. SYS-05's `append_scene` (290cc7d) creates a scene with a default Normal layer, consistent.
- Active scene + active layer reset/clamp via `sanitize_indices` on scene changes/delete.

So the target structure is:
```
Document
└── Scene
    └── Timeline = ordered LayerTree (flat Vec<Layer> + parent_id)
        ├── Folder (no frames; organizes)
        │   ├── Layer  (keyframes BTreeMap<u32,Frame>)
        │   └── Folder
        └── Layer
```
The flat `Vec<Layer>` + `parent_id` representation is fine; render/UI must derive tree order from it. No global layer list should be introduced.

---

## 7. Folder forensics — the 20 questions

| # | Question | Answer | Evidence |
|---|---|---|---|
| 1 | Folder contains folder? | YES (arbitrary depth) | set_layer_parent allows any folder parent; layer_depth unlimited |
| 2 | Folder contains normal layer? | YES | parent_id → folder id |
| 3 | Normal layer contains anything? | NO (leaf; nodes are in keyframes, not children) | model |
| 4 | Folder has frames? | NO (keyframes empty by construction) | Layer::new_folder |
| 5 | Folder active for drawing? | ALLOWED today → **BUG** (draw blocked, but frame/paste/dup not fully) | draw_rect blocks [127-138]; paste now blocked (40999d7); F5/F6/F7 do NOT block |
| 6 | Folder receives pasted objects? | Now blocked by 40999d7 | session.rs paste_objects |
| 7 | Folder target of frame ops? | ALLOWED → **BUG** | insert_keyframe/blank/clear only check `locked`, not `is_folder` |
| 8 | Folder selected? | Layer-row selection is UI state; a folder can be active/selected. Stage object selection is separate (SYS-14) | code |
| 9 | Folder locked? | flag exists; toggle does not cascade → **BUG** | set_layer_locked |
| 10 | Folder hidden? | yes, cascades | set_layer_visible |
| 11 | Hide hides descendants? | YES (cascade_flag) | session.rs |
| 12 | Lock locks descendants? | NO → **BUG (B-3)** | set_layer_locked leaf-only |
| 13 | Delete deletes descendants? | YES (DeleteLayerGroup packs descendants) | delete_layer 1657 |
| 14 | Hierarchy reordered? | YES via set_layer_parent + reorder command | code |
| 15 | Arbitrary nesting? | YES with cycle guard | layer_is_ancestor |
| 16 | Depth limit? | NONE SPECIFIED → **AMBIGUOUS** [INFERENCE: keep unbounded + cycle guard, already done] | |
| 17 | active_layer when folder deleted? | sanitize_indices clamps; DeleteLayerGroup removes subtree | 1657, 2181 |
| 18 | Selection when folder deleted? | prune_selection_existence drops deleted node ids | 2197 |
| 19 | Undo/redo? | structural commands are History commands; cascade = one SetLayerFlags | command.rs |
| 20 | Persistence? | parent_id/kind/collapsed serde fields with defaults; old files load | model.rs serde attrs |

---

## 8. Layer types matrix

| Layer Type | Adobe | Kineora [BLUEPRINT] | Kineora [CODE] | Required now? | Status |
|---|---|---|---|---|---|
| Normal | yes | yes | `LayerKind::Normal` | YES | functional |
| Folder | yes | F-20-05 | `LayerKind::Folder` | YES | functional w/ bugs (§7,§28) |
| Mask / Masked | yes | NOT in blueprint | absent | NO | do not invent |
| Guide / Guided | yes | NOT in blueprint | absent | NO | do not invent |
| Motion/Classic/Shape tween layer | yes | Part 09 (tween is a span on a layer, not a separate kind) | `ClassicTween` map on Layer | span model exists | tween engine SYS-15 |
| Armature/IK | yes | NOT in blueprint | absent | NO | do not invent |
| Camera | yes (Advanced Layers) | SYS-25 future | absent | NO | do not invent |

**Conclusion:** only **Normal + Folder** are in scope. Do not add Adobe layer types.

---

## 9. Layer order + render order

- `Scene.layers` is documented `// bottom → top` [model.rs:405].
- `evaluate(doc, scene, frame)` iterates `scene_.layers` in vec order and collects items; earlier (lower index) = painted first = visually behind [eval.rs:354-360].
- **Render currently does NOT descend the folder tree or check ancestor visibility.** It skips a layer only if THAT layer's `!visible||locked` [eval.rs:278, 415, 477]. Consequences:
  - A child of a hidden folder still renders (BUG B-1).
  - Folder rows themselves render nothing (no keyframes) — fine.
  - Visual order among siblings follows vec order; when a layer is nested, its content still renders at its own vec position, not grouped under the folder. For a minimal product this is acceptable IF hidden/locked cascade is honored; tree-aware rendering is a UI/preview enhancement, but **hidden ancestor MUST hide child** regardless.

**Invariant:** TIMELINE ORDER (vec order) → RENDER ORDER; folder nesting is organizational and must not reorder siblings. A layer is rendered only if it and every ancestor are visible (and not locked for hit/select).

---

## 10. Active layer — correct invariant

**Invariant:** `active_layer` always points to a valid index; for any **drawable/frame/paste** operation the target must be a **visible, unlocked Normal layer**. Folders may be active for organizational actions (rename/reorder/delete/nest), but:
- draw / paste / duplicate-to-stage: blocked on folder (draw already; paste fixed 4099d7; **frame ops not yet**).
- F5/F6/F7/Clear/frame copy/cut/paste: must require Normal layer.
- If a folder is active and the user draws, the safest predictable behavior is **block + notify** (current draw behavior). Do NOT auto-select a child (not specified → would be invented).

When the active layer is deleted, `sanitize_indices` clamps to the last remaining index — that index may be a folder; subsequent draw then correctly blocks. A future nicety (not required) is to prefer the nearest Normal layer, but that is **[INFERENCE]** and needs a decision.

---

## 11. Layer selection (separate from stage selection)

- **Stage object selection** = SYS-14 (NodeIds, `selection:changed`), already implemented with full payload.
- **Timeline layer "selection"** = which layer row is active/selected. Currently represented by `active_layer: usize` (single). Blueprint/Adobe support shift/Ctrl multi-selection of layer rows, but Kineora [BLUEPRINT] does not explicitly require multi-layer selection.
- **Do not add multi-select** unless a spec requires it. Single active layer is the current contract; `layer:changed`/panel re-render follows from commands (panels re-read via document/active events).

---

## 12. Visibility / Lock / Outline — asymmetry

| Flag | Leaf toggle | Folder cascade | Drops selection | Render effect |
|---|---|---|---|---|
| visible | SetLayerVisible | **YES** SetLayerFlags | when hiding | hides content |
| locked | SetLayerLocked | **NO (BUG B-3)** | when locking | excludes from hit/select/Select-All |
| outline | SetLayerOutline | **YES** SetLayerFlags | no | strokes-only preview |

- [BLUEPRINT/Adobe] folder controls "affect contained layers". Therefore lock SHOULD cascade like visibility/outline. The current asymmetry is an implementation bug, not a spec decision. **Fix:** route folder lock through `cascade_flag(Locked)` exactly like visible/outline; keep the leaf command for non-folders.
- Mixed-state display (folder with some children hidden/locked) is a UI nicety; Kineora currently shows the folder's own flag. **AMBIGUOUS / not required now.**

---

## 13. Create / Delete / Move / Rename / Duplicate — feature detail

(One row each; all are undoable Commands unless noted.)

| Feature | UI/shortcut | Core fn | Command | Edge cases already handled | Edge cases / gaps |
|---|---|---|---|---|---|
| Create Layer | Timeline + button | create_layer | CreateLayer | inserts above active; becomes active; name unique | — |
| Create Folder | Timeline + button | create_folder | CreateLayer(folder) | above active; active; name unique | active becomes folder (seed of bugs) |
| Delete Layer | trash/Del? | delete_layer | DeleteLayer / DeleteLayerGroup | last layer blocked; folder deletes subtree; won't empty doc; prunes selection | BUG-D-001 (failing test reported by AI-D) must be checked |
| Rename | double-click row | rename_layer | RenameLayer | trim; empty no-op | — |
| Move/Nest | drag | set_layer_parent (+reorder) | SetLayerParent | non-folder parent blocked; cycle blocked | — |
| Duplicate | right-click | duplicate_layer | DuplicateLayer | deep node remap; new ids; Animate-style "… copy N" names; independent keyframes | **B-4: folder duplicate does not copy descendant layers** (only the folder row + its — empty — frames) |
| Reorder | drag up/down | reorder command | ReorderLayer | | must keep parent/children consistent (re-verify after B-4) |

---

## 14. Timeline / frame ownership

- Keyframes live in `Layer.keyframes` (Normal layers only). Folders have none.
- F5 (insert frame) extends a hold; F6 inserts a content keyframe (copies previous content); F7 inserts blank; Shift+F6 clears keyframe status. These exist in session.rs and dispatch `InsertKeyframe`/`InsertBlankKeyframe`/`ClearKeyframe` using `active_layer`.
- **BUG B-2:** none of F5/F6/F7/Clear check `is_folder()`. Running them on a folder inserts `Frame` records into a folder's `keyframes` map, contradicting the "folders have no frames" invariant and producing unreachable/confusing data. Fix: block folder target with a log + false (mirror draw/paste).
- Frame clipboard (copy/cut/paste/remove/reverse frames) is SYS-15; it must likewise require a Normal layer (verify in SYS-15 work).

---

## 15. Persistence

- serde: `kind`/`parent_id`/`collapsed` use `#[serde(default)]` so legacy files (pre-folders) load as Normal/root/expanded [model.rs:339-348].
- `formatVersion` is stamped by SYS-28; no migration needed for folder fields because defaults cover them.
- Required future tests (do not write in this research round):
  1. Create nested folders → save → load → identical parent_id/order/collapsed.
  2. Move layer into folder → save → load → hierarchy + render order identical.
  3. Duplicate layer → save → load → new node ids independent.
- `Document` next_id must keep monotonic across load (it is serialized).

---

## 16. Undo / redo (structural)

- All structural ops are Commands via History (bounded 100). Cascade (visibility/outline) is ONE SetLayerFlags entry, so undo restores all descendants atomically. Lock-cascade fix must follow the same.
- Delete folder = `DeleteLayerGroup` packed descending; undo restores the whole subtree and frames (the command stores removed layers; verify content restore in command.rs).
- `sanitize_indices` + `prune_selection_existence` run after delete; `seal_last_post_selection` records post-selection.
- View flags (visible/locked/outline) ARE undoable in Kineora (consistent with current code); [BLUEPRINT] generally treats some view toggles as session prefs, but Kineora's H-decisions made layer flags document/undoable — preserve current behavior (don't change ownership).
- Collapse is persisted and undoable.

---

## 17. UI / Timeline forensics (what exists vs Adobe)

Exists (TS): `LayersPanel` + timeline rows; eye/lock/outline columns; add/delete/duplicate; indentation by `layer_depth`; collapse chevron; active-row highlight; layer:changed events; folder batch Alt-click.
Missing vs a complete Timeline (do NOT treat all as required):
- drag-to-reorder/nest pointer interactions (verify current state; `set_layer_parent` exists but UI wiring may be partial),
- mixed-state folder indicators,
- layer-color swatch (outline_color exists in model + Properties),
- scene tabs (SYS-05 just added scene append; tab UI may be partial),
- frame selection / multi-frame ranges (SYS-15).

Only implement items that have a [BLUEPRINT]/spec source.

---

## 18. Rendering / engine

- `evaluate()` flattens scene layers in vec order. `hits_in_rect`/hit-test skip hidden/locked per-layer but **not ancestors**.
- Required correction after folder audit:
  - A layer is renderable/selectable only if itself visible AND every ancestor folder visible; for hit-test/Select-All also itself and ancestors unlocked.
  - Folders themselves never render (already true — empty keyframes).
- This is a small, contract-backed change in eval.rs (ancestor walk using `parent_id`), NOT a new rendering system.

---

## 19–27 are consolidated below (see §32 target architecture and §33 blueprint).

---

## 28. Bug inventory (DO NOT FIX IN THIS RESEARCH ROUND)

| ID | File / fn | Current behavior | Expected behavior | Source | Severity | Owner |
|---|---|---|---|---|---|---|
| **B-1** | eval.rs `evaluate`/`hits_in_rect` (278/415/477) | child of hidden folder still renders/hittable | ancestor visibility hides descendants | BLUEPRINT folder cascade; Part 20 | HIGH | SYS-15/render (or AI-B SYS-14 hit-test) |
| **B-2** | session.rs insert_keyframe/insert_blank_keyframe/clear_keyframe (271-330) | F5/F6/F7 allowed on folder → writes frames to a folder | block when active layer `is_folder()` (log + false), same as draw/paste | BLUEPRINT folders have no frames | HIGH | SYS-15 / SYS-16 |
| **B-3** | session.rs set_layer_locked (1759) | locking a folder locks only the folder row (which has no content) | cascade to descendants like visible/outline (cascade_flag Locked) | BLUEPRINT/Adobe folder controls cascade | MEDIUM | SYS-16 |
| **B-4** | session.rs duplicate_layer (1943) | duplicating a folder copies only the folder row, NOT its child layers (orphan hierarchy / misleading "duplicate") | duplicate the entire subtree (folders + layers + their frames/nodes) with new ids, preserving nesting | BLUEPRINT duplicate/Adobe | HIGH | SYS-16 |
| **B-5** | session.rs | active_layer can point at a folder for draw/paste/frame ops; only draw/paste block | all drawable/frame/paste ops require a Normal layer; central guard | BLUEPRINT active-layer target | MEDIUM | SYS-16/15 |
| **B-6** | (reported) | BUG-D-001: a pre-existing `edit_ops`/layers test fails on main | compile/test must pass | [TEST]/AI-D report | HIGH (build) | whoever owns SYS-16/SYS-03; verify with cargo |
| **B-7** | duplicate_layer | new copy uses `parent_id: src.parent_id`; if duplicating a child, the copy is also placed under the same parent at index+1 — likely intended, but ordering after group duplicate (B-4) must be re-verified | predictable sibling placement | [TEST] | LOW | SYS-16 |

Notes:
- B-1 and B-2 are **data-integrity / user-visible correctness** issues.
- B-4 risks silent data loss of hierarchy on duplicate.
- No orphan-node paste bug remains after AI-B `40999d7`.

---

## 29. Missing functionality (spec-backed, not yet done)

- Tree-aware render/hit visibility ancestor check (B-1).
- Folder lock cascade (B-3).
- Folder-aware frame-op guard (B-2).
- Deep folder duplicate (B-4).
- (Possibly) drag-reorder/nest UI completeness — verify before building.
Not missing-by-spec: mask/guide/camera/armature layer types, layer parenting/rigging, multi-layer selection.

---

## 30. Ambiguities (do not guess)

- **AMB-L1 Max folder nesting depth.** No numeric limit in Kineora. [INFERENCE] keep unbounded + existing cycle guard. Needs a decision if a limit is desired.
- **AMB-L2 Mixed folder flag display** (some descendants hidden/locked). Not specified; defer.
- **AMB-L3 Active layer after deleting the active folder.** Current clamp may land on another folder; whether to prefer nearest Normal is unspecified.
- **AMB-L4 Layer selection model** (single vs multi). Kineora currently single; multi-row selection is Adobe behavior not explicitly required.
- **AMB-L5 Collapse vs Stage visibility.** Adobe: collapse does not change visibility. Kineora code already treats collapse as UI-only (render ignores `collapsed`). Keep — but confirm in SYS-15 UI tests.

---

## 31. Cross-SYS ownership

| Concern | Owner | Layer system's relationship |
|---|---|---|
| undo/redo engine, History | SYS-03 | structural ops are Commands |
| selection engine/hit-test | SYS-14 | must honor ancestor visibility/lock (B-1) |
| timeline frames/tweens | SYS-15 | frames only on Normal layers (B-2) |
| layers/folders model+commands | **SYS-16** | primary owner |
| scenes/document | SYS-05/SYS-02 | each scene owns layers |
| rendering/eval | SYS-15/SYS-14 | tree-visible filter (B-1) |
| properties (outline color) | SYS-17 | reads layer.outline_color |
| view/zoom | SYS-04 | separate concern; layer flags stay SYS-16 |

INT rows must be added for B-1..B-4 when fixed (producer/consumer/payload unchanged; behavior only).

---

## 32. Target architecture (research conclusion)

```
Document
└── Scene (id, name)
    └── Timeline
        └── layers: Vec<Layer>   // flat, bottom→top; tree derived by parent_id
            ├── LayerKind::Normal { keyframes: BTreeMap<u32,Frame>, tweens, visible, locked, outline, outline_color, parent_id: None|Folder, collapsed:false }
            └── LayerKind::Folder { keyframes: EMPTY, tweens: EMPTY, visible, locked, outline, parent_id, collapsed }
```
Rules:
1. A layer belongs to exactly one scene. No cross-scene layers.
2. Only Normal layers own frames and are draw/paste/frame targets. Folders never do.
3. Folder hierarchy uses `parent_id` (organizational). It is independent of any future transform/rigging parenting (WISH W2; not now).
4. Nesting is arbitrary, cycle-free; no depth limit unless AMB-L1 is decided.
5. Render/selection order = vec order. A layer is active for render/select iff it and all ancestors are visible (and not locked, for selection).
6. Visible/locked/outline cascade from folder to descendants as one undoable command.
7. Deleting a folder deletes its subtree atomically; undo restores it.
8. Duplicating a folder duplicates the subtree with new ids, preserving structure.
9. `active_layer` is a valid index; drawable ops require a visible+unlocked Normal layer; otherwise block + notify (never auto-mutate selection without a spec).
10. Structural ops and flag toggles are undoable; collapse is persisted + undoable; clipboard is SESSION.

---

## 33. Implementation blueprint (ordered, derived — for the NEXT coding agents)

The order below is dependency-driven. Each item is independently shippable with tests. Do them in order; each maps to a P0/P1 fix above.

### P0 — correctness / data integrity
1. **B-2: Guard frame ops on folders.** In `session.rs` `insert_keyframe`/`insert_blank_keyframe`/`clear_keyframe` (and frame clipboard entry points when SYS-15 touches them), early-return with a log if `doc.layer(active_scene, active_layer).is_folder()`. Add Rust tests.
2. **B-1: Ancestor-visible/locked filter in render/hit-test.** Add a helper `layer_effective_visible(doc, scene, layer_index) -> bool` (walk parent_id) and use it in `evaluate`, `hits_in_rect`, and the selection prune (`prune_selection_by_layer_state` should also drop items whose **ancestor** is hidden/locked). Unit tests: hide folder → children absent from evaluate and from hit.
3. **B-3: Folder lock cascade.** Route `set_layer_locked` for folders through `cascade_flag(Locked)` (mirror visible/outline). Test: lock folder → descendants locked, one History entry, undo restores.
4. **B-4: Deep duplicate folder.** Extend `duplicate_layer`: if `src.is_folder()`, collect descendants (stable order), duplicate each layer (new LayerId, deep-copy frames/nodes like the existing leaf path), remap `parent_id` through the id map, insert copies adjacent to source. Test nested folder duplicate + independence + undo.
5. **B-6: Make the suite compile/pass.** Run `cargo test` (once toolchain exists); fix the BUG-D-001 failure; do not mask it.

### P1 — active target & UI safety
6. **B-5: Central drawable-target guard.** Add `fn editable_target_layer(&self) -> Option<usize>` returning the active layer only if it exists, is Normal, visible, unlocked. Use it in draw/paste/duplicate/frame paths so behavior is consistent and cannot regress.
7. Verify Timeline UI: add-layer/add-folder/delete/rename/duplicate buttons call the right session methods and refresh on `document:changed`/`layer:changed`; indentation uses `layer_depth`.

### P2 — tree interactions (spec-confirmed only)
8. Pointer drag to reorder/nest (if not already): on drop call `set_layer_parent` and reorder; block cycles/non-folder parents. Add tests for the command results; keep UI changes minimal.
9. Optional: outline-color swatch wiring if Properties already exposes it.

### Explicitly NOT in scope
Mask/guide/camera/armature layers; layer rigging/parenting; multi-row selection; new shortcuts; new events/payloads; any Adobe-only feature not in Kineora specs.

---

## 34. Exact files future coding agents will touch

- `animator/core/src/model.rs` — Layer/Scene structs (no structural change expected; possibly a helper for effective visibility).
- `animator/core/src/session.rs` — `create_*`, `delete_layer`, `duplicate_layer`, `set_layer_visible/locked/outline`, frame insert/clear, `active_layer` guards, `cascade_flag`, sanitize/prune.
- `animator/core/src/command.rs` / `edit_ops.rs` — `DuplicateLayer`/`DeleteLayerGroup`/`SetLayerFlags` changes for folder lock + deep duplicate; verify revert correctness.
- `animator/core/src/eval.rs` — ancestor-visibility filter in evaluate/hits.
- `animator/core/tests/layers.rs`, `edit_ops.rs`, `frames.rs`, new test modules — Rust tests.
- `animator/ui/src/components/LayersPanel.tsx` — UI verification (only after core works).
- `animator/ui/src/engine/client.ts` — only if new wasm bridges are needed (likely not; existing bridges cover layer methods).

---

## 35. Test matrix (future tests; not executed here)

Rust (native, `cargo test`):
- create folder above active; active index correct.
- nest layer under folder; unnest; cycle blocked; non-folder parent blocked.
- delete folder removes descendants; undo restores subtree + selection; last-layer blocked; would-empty blocked.
- hide folder → descendants effective-hidden; `evaluate` excludes them; hit-test excludes; Select-All excludes; undo restores.
- lock folder → descendants locked; one history entry; undo restores (B-3).
- F5/F6/F7/Clear on folder → blocked, no keyframes inserted, no command (B-2).
- duplicate folder → new subtree with remapped ids/node independence; parent/order preserved; undo (B-4).
- save/load nested hierarchy round-trip (hierarchy/order/collapse/flags identical).
- scene append does not share layers; switching scene clamps active layer.

TS/UI (vitest):
- LayersPanel renders folder indentation/collapse; buttons invoke session bridges.
- folder row lock/eye/outline trigger cascaded flags.
- active folder shows draw/paste blocked notifications.

Build: `cargo fmt --check`, `cargo clippy`, `cargo test`, `wasm-pack`/build-wasm, `tsc -b`, `vite build`, full vitest.
**In this research round: NONE executed (Rust toolchain absent; UI not run because no code changed). NOT TESTED — TOOLCHAIN/ENVIRONMENT.**

---

## 36. Acceptance criteria (when implemented)

- A hidden folder hides all descendants on stage and in hit-testing/Select-All.
- A locked folder locks descendants (one undo).
- No frame/draw/paste/duplicate-to-stage operation can target a folder; each blocks with a clear message.
- Duplicating a folder duplicates its whole subtree independently; undo/redo restores exactly.
- Nested hierarchy, order, collapse, and flags survive save/load.
- The Rust suite and UI suite both pass; no new dead/orphan data can be created through these paths.

---

## 37. "DO NOT INVENT" checklist

- Do NOT add mask/guide/mask/camera/armature/motion-tween layer KINDS.
- Do NOT add transform/rigging "layer parenting" (that is WISH W2, separate from folder parent_id).
- Do NOT add new keyboard shortcuts for layers without a spec.
- Do NOT add new bus events or payloads (existing `layer:changed`/`document:changed` suffice).
- Do NOT change `parent_id` semantics.
- Do NOT make collapse affect stage visibility.
- Do NOT auto-move the active layer to a child when a folder is selected (no spec).
- Do NOT introduce global layers across scenes.
- Do NOT treat Adobe behavior as required when [BLUEPRINT] is silent (tag AMB).
- Do NOT paper over BUG-D-001; fix the underlying compile/test failure.

---

## 38. Git / status

- Research-only: only this file was added. No product code changed.
- Starting HEAD: `5c11faa`; final origin at write time: `7ab803a` (pulled, fast-forward).
- Next coding agents should branch/fix from current origin/main and add INT rows for B-1..B-4.
