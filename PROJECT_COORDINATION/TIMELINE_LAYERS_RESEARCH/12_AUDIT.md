# 12 — PRE-CODE AUDIT (2026-08-23)

```
WHAT:     Re-read 00–11 against live animator/ code. No product code changed.
WHY:      Human: “usable UI chahiye — koi bug/miss to nahi?”
VERDICT:  Pack is GOOD ENOUGH to code IF the holes below are followed.
          It will NOT produce a usable Adobe-like timeline if Increment 1
          ships both left Layers dock AND bottom chrome at once.
```

---

## 1. Verdict (plain)

| Question | Answer |
|---|---|
| Research files complete for Timeline+Layers first wave? | **YES** (00–12) |
| Will following them blindly make a usable UI? | **Only if U-G7 + U-G8 are treated as ship rules** |
| Ready to invent missing Adobe bits? | **NO** — EMF/W1/camera still blocked |
| Code started? | **NO** |

The contract is sound: one row = name+flags+frames, no new LayerKind, no new bus events, onion = overlay. Engine already has F5/F6/F7/hold/tween. Unify is mostly **layout**, not a new animation engine.

---

## 2. Doc bugs found and **fixed this turn**

| ID | Where | Problem | Fix |
|---|---|---|---|
| **D-1** | `07` | Two sections named “Increment 2” (AMB-TL-010 vs onion) | Renumbered: Inc 2 = onion, Inc 3 = Layers-menu |
| **D-2** | `07` Inc 0 | B-5 (central folder target guard) missing from the numbered list | Added; also listed paste/cut/tween/place_symbol |
| **D-3** | `01` | Onion listed as “continue / out of unify” only | Clarified: specified in 08, coded **after** unify |
| **D-4** | `04` | Ruler/playhead could be drawn under chrome | **U-13** locked: ruler + playhead live in the **grid column only** |

---

## 3. Code facts the pack had right (re-verified)

| Claim | Evidence |
|---|---|
| Two UIs | `App.tsx` left `LayersPanel` + bottom `TimelineStrip` |
| `NAME_W = 92` stub | `TimelineStrip.tsx` |
| Layers default width 200, range 140–480 | `panelLayout.ts` |
| Timeline min 96 / default 156 | `TIMELINE_H_MIN`, `DEFAULT_LAYOUT.timelineH` |
| Folders empty keyframes | `Layer::new_folder` |
| Draw/object-paste block folders | `draw_rect` / `paste_objects` |
| F5/F6/F7 do **not** check `is_folder()` | `insert_keyframe` etc. — only `locked` |
| `paste_frames` same hole | locked only — **B-2 must include it** |
| `place_symbol` same hole | visible/locked only, not folder |
| Hidden folder children still `evaluate` | `collect_items` checks `layer.visible` only, not ancestors — **B-1** |
| Locked layers still render | `evaluate` → `skip_locked=false` |
| Locked skip hit-test | `hit_test` / `hits_in_rect` |
| Onion absent | no matches in `animator/` |
| `O` free | no `shortcut: 'O'` (Ctrl+O = Open) |
| Copy frames is not a command | `copy_frames` session clipboard only |
| Dirty is snapshot | `History.is_dirty` — copy does **not** dirty the file |

---

## 4. Real product bugs (code) — pack now names them

| ID | Bug | Usable-UI impact | When to fix |
|---|---|---|---|
| **B-1** | Hidden folder’s children still on Stage | “I hid the folder, art still there” | Inc 0 |
| **B-2** | F5/F6/F7/paste-frames/… on folder writes empty/orphan frames | Confusing dots / data junk | Inc 0 |
| **B-3** | Folder lock does not cascade | “I locked the folder, still edited a child” | Inc 0 |
| **B-4** | Duplicate folder skips children | Looks like data loss | Inc 0 |
| **B-5** | `active_layer` can be a folder | Draw/F6 feel broken | Inc 0 |
| **B-8** | `client.ts` `copyFrames` emits `document:changed` | Copy is not a mutation (H04). Does **not** flip dirty (snapshot). Can still make panels flicker / feel “something saved”. Same as TOOLS BUG-TOOL-011. | Inc 0 (one-line: do not `docChanged` on copy) |

---

## 5. Usability holes that would make the UI **not** “mast”

### U-G7 — two layer lists after unify (HIGH)

Increment 1 as first written: keep left `LayersPanel` (`DEFAULT_VISIBILITY.layers = true`) **and** put the same flags on the timeline.

Result: **worse** than today (duplicate names, two scrolls, two places to click).

**Ship rule (not a new product feature):**

- Do **not** delete `LayersPanel.tsx`.
- When Timeline chrome is live, **default the left Layers dock OFF** for new/reset workspaces (`DEFAULT_VISIBILITY.layers = false`).
- Window ▸ Layers still toggles the old dock (AMB-TL-010 stays open).
- Existing saved workspaces that already have `layers: true` will still show both — Reset Workspace / first-run get the single list.

This is a **default**, not deleting a command.

### U-G8 — `TIMELINE_H_MIN = 96` too short after unify (MED)

After Header A + Header B + ruler 20 + row 22 + padding, **96px clips the grid**. Default 156 already fits ~1 row. Unify adds nothing to header height if we **move** layer buttons into Header A (no third bar).

**Ship rule:** raise `TIMELINE_H_MIN` to **168** (2 headers + ruler + 1 row + chrome padding). Bump default `timelineH` to **200** so 2–3 layers show without dragging. C-08 “96” was paper for a thinner strip.

### U-G9 — chrome width 140 vs flags (LOW)

Eye + lock + outline + indent + collapse + name + pencil cannot fit in 140px. `nameW` min **160** (or 180). Default 200 is OK. Update 04 clamp 140→160.

### U-G10 — no frame/layer context menu (P1, not a pack error)

Blueprint 7.1.4 / 30: right-click frame / layer. Buttons cover P0. Usable without menus. Do not invent a menu in Inc 1.

### U-G11 — playhead vs cell-click (already correct)

Cell click does **not** move playhead. Ruler does. Keep. New users coming from Adobe may expect click-cell = jump — Blueprint already chose select-only (F-07-03 L.2). **Do not “fix” this.**

---

## 6. Will onion + unify feel like Animate?

**Unify + Inc 0:** yes for “I can see layers and frames as one score, hide/lock, F6, tween.”  
**Without onion:** FBF in-betweens are still guesswork. That’s why Inc 2 exists.  
**With onion P1:** usable FBF for rects. Brush/fill still missing (tools pack) — that’s **drawing quality**, not timeline.

Honest: this pack does **not** make a full Animate. It makes the **timeline usable** for the engine you already have.

---

## 7. What is still NOT ready (do not code)

- EMF (AMB-TL-020)  
- W1 cels  
- Camera / mask / guide layers  
- Scale spans with fps (closed: never)  
- Custom toolbar, loop range, Time Scrubber  

---

## 8. Coding agent pre-flight (print this first)

1. Read 04 invariants U-1…U-13 + this file §5.  
2. Inc 0 first (B-1…B-5 + B-8).  
3. Inc 1: one panel, U-G7 default hide left Layers, U-G8 min height, U-13 ruler in grid.  
4. No new events, no new LayerKind, no EMF.  
5. If stuck on an AMB → stop.

---

*Audit only. Product code still untouched.*
