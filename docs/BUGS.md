# Bug Reports — Kineora Animation

Protocol §12 format. Open bugs are listed here; closed bugs move to a `RESOLVED` section with their regression test.

## Open
<!-- Copy the template below per bug -->

## Template
```
BUG-ID:      BUG-001
Title:       <short>
Severity:    P0 app-unusable | P1 major-feature | P2 important | P3 minor
Environment: <OS, browser/shell, core commit>
Feature:     <module/feature id, e.g. Selection>
Repro:       <numbered steps>
Expected:    <what should happen>
Actual:      <what happens>
Likely layer: input | ui | command | state | data | engine | event | renderer | persistence
Root cause:  <filled after trace (protocol §14)>
Fix:         <correct-layer fix>
Regression:  <test id added>
Status:      OPEN | FIXED | BLOCKED
```

## Resolved
<!-- BUG-ID, fix commit, regression test id -->

### 2026-08-23 — folder / clipboard / properties defects (engine + UI)

Authority for every entry: the registered bug tables in
`PROJECT_COORDINATION/LAYER_SYSTEM_FORENSIC_RESEARCH.md` §28,
`PROJECT_COORDINATION/TIMELINE_LAYERS_RESEARCH/12_AUDIT.md` §4 and
`PROJECT_COORDINATION/PROPERTIES_SYSTEM_FORENSIC_RESEARCH.md` §30, each
cross-checked against Adobe Animate's documented behavior
(helpx.adobe.com/animate/using/timeline-layers.html — "the layer controls in
the timeline affect all layers within a folder…", "the layer folder structure
of copied layers is preserved", "copying frames from a layer folder").

| BUG-ID | Title | Layer | Fix | Regression test | Status |
|---|---|---|---|---|---|
| B-1 | Child of a hidden/locked folder still rendered, hit-tested and selectable | engine (`eval.rs`, `session.rs`) | `effective_layer_state()` walks the folder chain; used by render, hit-test, marquee, Select All, draw/paste/place guards, selection pruning | `layers.rs::hidden_folder_hides_child_layer_content`, `::locked_folder_blocks_child_selection_but_still_renders` | FIXED |
| B-2 | F5/F6/F7/Shift+F5/Shift+F6 + frame clipboard/tween/label ops wrote records onto a folder row | engine (`session.rs`) | central `layer_is_folder()` guard on every frame/tween op (no command, no undo entry) | `layers.rs::frame_ops_are_blocked_on_a_folder` | FIXED |
| B-3 | Locking a folder did not lock its layers (visible/outline did cascade) | engine (`session.rs`) | `set_layer_locked` routes folders through the existing `cascade_flag` — one undo step | `layers.rs::folder_lock_cascades_one_undo` | FIXED |
| B-4 | Duplicating a folder produced an empty folder (children lost) | engine (`session.rs`, `command.rs`) | whole-subtree deep copy with remapped `parent_id`s, one undo step; `DuplicateLayer.layers: Vec<Layer>` | `layers.rs::duplicate_folder_deep_copies_the_subtree` | FIXED |
| B-4b | `alloc_layer_id()` handed out the SAME id when several rows were allocated before insertion (found while fixing B-4) | engine (`session.rs`) | ids counted up locally from `alloc_layer_id()` | covered by `::duplicate_folder_deep_copies_the_subtree` | FIXED |
| B-5 | `place_symbol` accepted a folder as the active target (draw/paste already refused) | engine (`session.rs`) | folder guard added, same rule as draw/paste | (guard shares `layers.rs` folder suite) | FIXED |
| B-6 | Reordering a folder stranded its children in the stack | engine (`session.rs`) | the folder's whole subtree moves as one block; a drop inside the block steps over it | `layers.rs::reordering_a_folder_carries_its_children`, `::a_folder_move_steps_over_its_own_subtree` | FIXED |
| B-8 / BUG-TOOL-011 | `copyFrames` emitted `document:changed` although copying mutates nothing | ui (`engine/client.ts`) | emit dropped (matches `copyObjects`); paste/cut still emit | `engine/client.frameClipboard.test.ts` (2) | FIXED |
| BUG-P-001 | Mixed selection containing a symbol instance offered W/H and sent base-props patches for the instance | ui (`PropertiesPanel.tsx`) + engine verification | W/H hidden when any selected object is an instance; commit filters instance ids; engine proven to be a safe no-op | `PropertiesPanel.test.tsx` (2), `properties.rs::set_node_props_on_a_symbol_instance_is_a_no_op` | FIXED |

**Not fixed on purpose (feature gaps, not defects — they need product decisions
or absent subsystems):** BUG-TOOL-001/002/004/005/006/009/010/014 (drill-in,
Shift/Alt modifiers, edge reshape, dedicated transform mode, pivot/skew, tween
guard UI), BUG-TOOL-007/008 (rect tool uses a hard-coded fill/stroke — needs
the Color system, SYS-21), BUG-P-002 (context chip gains tool/frame modes only
after those modes exist), AMB-TL-* / AMB-P-* ambiguity register.

