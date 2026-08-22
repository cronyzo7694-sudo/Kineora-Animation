# BUG FIX REPORT — registered defects B-1…B-8 + BUG-P-001

**Scope:** bug fixes ONLY. No new feature, no new command surface, no new UI,
no new bus event, no schema change. Every fix closes an already-registered bug
from `PROJECT_COORDINATION/LAYER_SYSTEM_FORENSIC_RESEARCH.md` §28 (and the copy
of that table in `TIMELINE_LAYERS_RESEARCH/06_GAPS_BUGS_AMBS.md` §B).

**Files touched:** `animator/core/src/eval.rs`, `animator/core/src/session.rs`,
`animator/core/src/command.rs`, `animator/core/tests/layers.rs`,
`animator/core/tests/properties.rs`, `animator/ui/src/engine/client.ts`,
`animator/ui/src/engine/client.frameClipboard.test.ts`,
`animator/ui/src/components/PropertiesPanel.tsx`,
`animator/ui/src/components/PropertiesPanel.test.tsx`, `docs/BUGS.md`.

---

## Adobe Animate verification (the authority used for every decision)

| Behavior | Adobe source (verbatim) |
|---|---|
| Folder controls cascade | "The layer controls in the timeline affect all layers within a folder. For example, locking a layer folder locks all layers within that folder." — *Create timeline layers with Animate*, helpx.adobe.com/animate/using/timeline-layers.html |
| Eye/lock/outline columns apply to folders too | "To hide a layer or folder, click in the Eye column… To lock a layer or folder, click in the lock column…" — same page |
| Folder duplicate keeps the structure | "When you copy and paste layers, the layer folder structure of copied layers is preserved… You can also duplicate layers by selecting layers and choosing Edit > Timeline > Duplicate Layers." — same page |
| A folder row has no frames of its own | "Copying frames from a layer folder: to select the entire folder, collapse the folder and click the folder name. Select Edit > Timeline > Copy Frames." (the frames come from the CONTAINED layers) — same page |

Nothing beyond these four statements was implemented. Anything Adobe does that
Kineora does not have yet (multi-layer selection, Copy/Paste Layers, mask/guide
layers, publishing hidden layers) was NOT added — those stay open items.

---

## B-1 — child of a hidden/locked folder ignored the folder

**Was:** render, hit-test, marquee, Select All and the edit guards looked only at
the clicked row's own `visible` / `locked` flags, so a layer inside a hidden
folder still drew on stage and could still be selected/edited.

**Now:** `eval::effective_layer_state(layers, layer)` walks the `parent_id`
chain (with the existing cycle guard) and returns the effective
`(visible, locked)`: visible only when the layer AND every ancestor folder is
visible; locked as soon as any ancestor folder is locked. It is used by
`collect_items` (stage/export flatten), `hits_in_rect`, `hit_layers`,
`Session::select_all`, `selected_editable`, `draw_rect`, `place_symbol`,
`paste_objects` and `prune_selection_by_layer_state`.

Unchanged on purpose: locked layers still RENDER (only selection/editing is
blocked), and outline mode is still a per-layer view aid.

## B-2 — F5 / F6 / F7 / Shift+F5 / Shift+F6 wrote frames into a folder row

**Was:** the frame ops only checked `locked`, so they inserted `Frame` records
into a folder's (always empty) `keyframes` map — data that can never render.

**Now:** one central guard `Session::active_layer_is_folder()` makes all five a
silent no-op (log + `false`, no command, no undo entry) — the same treatment
`draw_rect` / `paste_objects` already gave folders. Frame ops on a folder are
NOT forwarded to the child layers (that would be new behavior — not done).

## B-3 — locking a folder did not lock its layers

**Was:** `set_layer_visible` and `set_layer_outline` cascaded to descendants,
`set_layer_locked` did not (asymmetry flagged in the research doc).

**Now:** `set_layer_locked` routes folders through the existing
`cascade_flag(LayerFlagKind::Locked, …)` — one `SetLayerFlags` command, so it is
ONE undo step and undo restores every previous per-layer value exactly. No new
command type was introduced.

## B-4 — duplicating a folder dropped its contents

**Was:** `duplicate_layer` copied only the clicked row; duplicating a folder
produced an empty folder and left the children behind (silent loss of the
hierarchy).

**Now:** for a folder, the whole subtree (the folder row + every descendant, in
stack order) is deep-copied: fresh `LayerId` per row, fresh `NodeId` per content
node, `parent_id`s remapped onto the copied ancestors, names uniquified
Animate-style ("… copy", "… copy 2") against the document AND the batch. The
copies are inserted directly above the source and the whole thing is ONE undo
step. `DuplicateLayer.layer: Layer` became `DuplicateLayer.layers: Vec<Layer>`
(the struct is only constructed in `session.rs`).

**Sub-bug found while fixing B-4:** `Document::alloc_layer_id()` derives
`max + 1` from the layers already in the document, so allocating several ids
before inserting them handed out the SAME id repeatedly. The batch now counts up
locally from `alloc_layer_id()`, keeping ids unique and stable.


## B-5 — `place_symbol` accepted a folder target

`draw_rect` and `paste_objects` already refused folders; dragging a symbol from
the Library onto the stage while a folder row was active did not. Same guard
added (log + `NodeId(0)`, no command).

## B-2 (full scope) — every frame op, not just F5/F6/F7

`12_AUDIT.md` §3 named `paste_frames` as the same hole (and
`convert_to_blank_keyframes` would have created blank keyframes on a folder).
The `layer_is_folder(layer)` guard now covers `move_keyframe`,
`duplicate_keyframe`, `copy/cut/paste/remove/reverse_frames`,
`set/remove_classic_tween`, `resize_span`, `duplicate_frames`,
`convert_to_keyframes`, `convert_to_blank_keyframes` and `set_frame_label`.
Frame ops are NOT forwarded to the folder's child layers — that would be new
behavior (Adobe does forward for Copy Frames on a collapsed folder; Kineora has
no multi-layer frame clipboard, so the honest result is a no-op, registered as
a gap, not silently invented).

## B-6 — reordering a folder stranded its children

`move_layer` moved only the folder row, so its children stayed behind in the
stack and the tree rendered broken. The folder's whole subtree now moves as one
block (relative order preserved, `parent_id`s untouched, one undo step). A drop
position inside the moved block is skipped in the direction of travel, so
"move up" steps over the folder's own children instead of refusing; when there
is nothing past the subtree the call is a clean no-op.
Adobe: folders hold layers "in much the same way you organize files on your
computer".

## B-8 / BUG-TOOL-011 — `copyFrames` emitted `document:changed`

Copying frames fills the session clipboard; it mutates nothing (H04 "copy is
not a mutation" — `copyObjects` already never emitted). The emit is dropped;
cut/paste still emit. The Paste button reads `clipboard_len` from the 120 ms
status poll, so it still enables right after a copy.

## BUG-P-001 — mixed selection containing a symbol instance

Verified before fixing: `apply_node_props` returns instances unchanged, so
there was NO data corruption — but the panel still rendered W/H for a multi
selection containing an instance and sent width/height patches for its id, so
the edit silently applied to the rects only. W/H are now hidden whenever any
selected object is an instance (identical to the existing single-instance
rule), and the commit filters instance ids. Instance W/H editing was NOT added
— that is AMB-P-004, still open.

---

## Tests added (`animator/core/tests/layers.rs`)

- `hidden_folder_hides_child_layer_content` (B-1: render + hit-test + marquee)
- `locked_folder_blocks_child_selection_but_still_renders` (B-1/B-3)
- `folder_lock_cascades_one_undo` (B-3, one history entry + undo restore)
- `frame_ops_are_blocked_on_a_folder` (B-2, no command recorded)
- `duplicate_folder_deep_copies_the_subtree` (B-4, nesting + independence + undo/redo)
- `reordering_a_folder_carries_its_children` + `a_folder_move_steps_over_its_own_subtree` (B-6)
- `properties.rs::set_node_props_on_a_symbol_instance_is_a_no_op` (BUG-P-001 engine proof)

## UI tests added (run and PASSING here — 790 total, was 786)

- `engine/client.frameClipboard.test.ts` — copy emits nothing, cut/paste still emit (B-8)
- `PropertiesPanel.test.tsx` — W/H hidden with an instance in the selection; W edit patch shape (BUG-P-001)

## VERIFICATION STATUS — READ THIS

`cargo` is NOT installed in the sandbox this batch ran in and
`static.rust-lang.org` / `crates.io` are unreachable from it, so **`cargo test`,
`cargo clippy` and `cargo fmt` could NOT be run here**. The changed files were
validated with a Rust grammar parse (tree-sitter-rust) — syntax clean — and
reviewed line by line, but the suite MUST be run on a machine with the toolchain
before this is marked ACCEPTED:

```
cd animator/core && cargo fmt && cargo clippy --all-targets -- -D warnings && cargo test
```

## Registered items intentionally NOT touched (feature gaps, not defects)

BUG-TOOL-001/002/004/005/006/009/010/014 (drill-in double-click, Shift/Alt
modifiers, edge reshape, dedicated transform mode, pivot/skew, tween-layer
guard UI), BUG-TOOL-007/008 (rect tool's hard-coded fill/stroke — needs the
Color system SYS-21), BUG-P-002 (context chip gains tool/frame modes only once
those modes exist), and the whole AMB-TL-* / AMB-P-* ambiguity register
("do not guess"). Fixing these means BUILDING missing features or guessing a
product decision, which is out of scope for a bug-fix pass.
