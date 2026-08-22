# BUG FIX REPORT — folder bugs B-1 / B-2 / B-3 / B-4 (engine only)

**Scope:** bug fixes ONLY. No new feature, no new command surface, no new UI,
no new bus event, no schema change. Every fix closes an already-registered bug
from `PROJECT_COORDINATION/LAYER_SYSTEM_FORENSIC_RESEARCH.md` §28 (and the copy
of that table in `TIMELINE_LAYERS_RESEARCH/06_GAPS_BUGS_AMBS.md` §B).

**Files touched (only these four):**
`animator/core/src/eval.rs`, `animator/core/src/session.rs`,
`animator/core/src/command.rs`, `animator/core/tests/layers.rs`.

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

---

## Tests added (`animator/core/tests/layers.rs`)

- `hidden_folder_hides_child_layer_content` (B-1: render + hit-test + marquee)
- `locked_folder_blocks_child_selection_but_still_renders` (B-1/B-3)
- `folder_lock_cascades_one_undo` (B-3, one history entry + undo restore)
- `frame_ops_are_blocked_on_a_folder` (B-2, no command recorded)
- `duplicate_folder_deep_copies_the_subtree` (B-4, nesting + independence + undo/redo)

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

## Known bug intentionally NOT touched (avoid collision with the other agent)

- **B-8** — `copyFrames` in `animator/ui/src/engine/client.ts` emits
  `document:changed` although copying is not a mutation. It lives in the UI
  layer where another agent is working; left alone on purpose.
