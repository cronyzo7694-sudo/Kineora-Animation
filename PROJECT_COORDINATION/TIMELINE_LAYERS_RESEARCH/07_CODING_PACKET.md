# 07 — CODING PACKET (do not execute in this research turn)

When the human says **code start** (after they are happy with this pack + any continue slices):

## Order (one increment at a time)

### Increment 0 — engine guards (can land without UI unify)

1. B-2 folder frame-op guard: `insert_keyframe` / `insert_blank_keyframe` / `clear_keyframe` / `insert_frame` / `delete_frame` **and** `paste_frames` / `cut_frames` / `remove_frames` / `reverse_frames` / `duplicate_frames` / `convert_*` / `set_classic_tween` / `resize_span` / `move_keyframe*` — plus `place_symbol` (same hole as draw).
2. B-1 ancestor visibility in `eval.rs` + `prune_selection_by_layer_state`.
3. B-3 folder lock cascade.
4. B-4 folder deep duplicate.
5. B-5 `editable_target_layer()` used by draw/paste/frame/place.
6. B-8 `copyFrames` must **not** emit `document:changed` (`client.ts`).

Tests: extend `animator/core/tests/layers.rs` + `frames.rs`.  
No UI required. Safest first code.

### Increment 1 — unify UI (no new engine)

1. Extract `timelineRows.ts` (`displayRows`, `ancestorCollapsed`).
2. `TimelinePanel`: headers + chrome + splitter + grid; shared vertical scroll.
3. Move LayersPanel **row renderer** into chrome (do not rewrite flag logic).
4. Remove TimelineStrip stub name column.
5. Persist `timelineNameW`.
6. Time readout `(playhead-1)/fps`.
7. Leave `LayersPanel.tsx` in the tree (AMB-TL-010). **Ship rule U-G7:** default `DEFAULT_VISIBILITY.layers = false` so the user sees **one** list. Window ▸ Layers still toggles the old dock.
8. **U-G8:** `TIMELINE_H_MIN` 96 → **168**; default `timelineH` 156 → **200**.
9. **U-G9:** chrome `nameW` min **160** (not 140).

Tests: port LayersPanel + TimelineStrip tests; add scroll-sync + splitter + folder-row-empty tests.

### Increment 2 — onion P1 (after unify; see `08_ONION_SKIN.md`)

View prefs + `O` / `Shift+O` + ruler markers + Stage ghost pass via extra `evaluate(f)`. No Rust. No export leak. No EMF.

### Increment 3 — AMB-TL-010 (only after human/Leader)

Redirect or retire Window ▸ Layers. Not required for first usable ship if U-G7 default-hide is in.

### Later (blocked or other SYS)

EMF (`09`, AMB-TL-020) · W1 cels (`11`) · camera layer · motion/shape tween · cross-layer frame drag.

---

## Files (increment 1)

| File | Role |
|---|---|
| `animator/ui/src/components/TimelineStrip.tsx` | split / wrap |
| `animator/ui/src/components/LayersPanel.tsx` | keep; share row helper |
| `animator/ui/src/App.tsx` | only if TimelineStrip API changes |
| `animator/ui/src/panelLayout.ts` | optional nameW default |
| `animator/ui/src/workspace.ts` | persist nameW |
| **Do not touch** | `command.rs` History, bus event set, `parent_id` meaning, SYS-02 file |

Increment 0 files: `session.rs`, `eval.rs`, `tests/layers.rs`, `tests/frames.rs`. Maybe `command.rs` only if DuplicateLayer needs a subtree payload.

---

## Tests required (increment 1)

- Happy: two layers, dots line up with names (testid y or row index).
- Collapse folder: child row count 0 in chrome **and** grid.
- Vertical scroll: both columns same `scrollTop` after wheel.
- Splitter Esc restores width; persist reload.
- Folder grid: no `kf-dot` on folder engineIndex.
- Existing Stage/frame/layer suites still green.
- No `document:changed` on scroll/splitter/zoom.

---

## Manual QA (user desktop)

See `04_UNIFIED_PANEL.md` §8.

---

## STOP conditions

If a coding agent hits AMB-TL-001…012 or AMB-L1…L5 → register, skip, do not invent.

If unify seems to need a new event or a new LayerKind → **wrong**. Stop.

---

## This file is not permission to code

Human: research continues until they say the pack is enough, then “code likho”.
