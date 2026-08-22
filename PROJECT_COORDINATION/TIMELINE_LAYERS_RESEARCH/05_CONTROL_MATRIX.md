# 05 — CONTROL MATRIX (click → what happens)

Legend: **P0** = needed for unify / 2D. **P1** = after unify. **LATER** = other SYS. **NO** = do not build.  
**Exists** = already in code.

---

## Header / transport

| Control | Click / key | Writes | Undo | Exists | Priority |
|---|---|---|---|---|---|
| Play / Pause | Enter | playhead (tick) | no | YES (Control + STM) | P0 keep |
| Stop | Control menu | halt | no | YES | P0 keep |
| First / Last | ⏮ ⏭ Home End | playhead | no | YES | P0 keep |
| Center | ◎ | scrollLeft | no | YES | P0 keep |
| Step ±1 | . , | playhead | no | YES | P0 keep |
| Key hop | Alt+. Alt+, | playhead | no | YES | P0 keep |
| Loop | ⟳ | view flag | no | YES | P0 keep |
| Ruler zoom −/+ | buttons | view zoomIdx | no | YES | P0 keep |
| Frame readout | — | — | — | YES | P0 keep |
| Time readout | — | derived (f-1)/fps | — | **NO** | **P0 add** |
| Actual-fps meter | — | — | — | NO | NO (AMB-TL-002) |

---

## Frame ops

| Control | Click / key | Writes | Undo | Exists | Priority |
|---|---|---|---|---|---|
| Insert frame | F5 | later keys +1 | 1 cmd | YES | P0 keep |
| Keyframe | F6 | copy hold → key | 1 | YES | P0 keep |
| Blank | F7 | empty key | 1 | YES | P0 keep |
| Delete frame | Shift+F5 | shift left | 1 | YES | P0 keep |
| Clear key | Shift+F6 | drop key status | 1 | YES | P0 keep |
| Click cell | select frames | view | no | YES | P0 keep |
| Drag cells | range | view | no | YES | P0 keep |
| Ruler / handle | playhead | view | no | YES | P0 keep |
| Drag key dot | move span | 1 | YES | P0 keep |
| Alt-drag dot | dup key | 1 | YES | P0 keep |
| Drag span edge | exposure | 1 | YES | P0 keep |
| Copy/Cut/Paste/Reverse/Remove/Dup frames | buttons | clipboard / cmds | copy no; others 1 | YES | P0 keep |
| Convert keys / blanks | buttons | 1 | YES | P0 keep |
| Label | input | 1 | YES | P0 keep |
| Classic tween / remove / ease | ~ Tween | 1 | YES | P0 keep |
| Motion / Shape tween | — | — | DEFERRED | LATER |
| Distribute to layers | 7.4.13 | — | NO | LATER (Part 13) |
| Auto Keyframe chrome | Adobe | silent ensure_keyframe | — | LATER |
| Cross-layer frame drag | 7.4.9 | — | **NO UI** | P1 |
| Folder as F5/F6/F7 target | — | **must block** | — | **P0 fix B-2** |

---

## Layer chrome (must live on the unified row)

| Control | Click | Writes | Undo | Exists | Priority |
|---|---|---|---|---|---|
| Eye | click / Alt / drag-through | visible (+cascade folder) | 1 | YES in LayersPanel | P0 **move into row** |
| Lock | click / Alt / drag-through | locked | 1 | YES; folder cascade **missing B-3** | P0 move + **fix B-3** |
| Outline swatch | click / Alt / drag / dbl-color | outline / color | 1 | YES | P0 move |
| Name | click = active; dbl = rename | active (view) / name | rename 1 | YES both panels | P0 one chrome |
| Pencil / ⊘ | display | — | — | YES LayersPanel | P0 move |
| Hidden ✕ | display | — | — | both | P0 one |
| Collapse ▸▾ | folder | collapsed | 1 | YES | P0 move |
| Un-nest ↩ | click | parent_id | 1 | YES | P0 move |
| Indent | display depth | — | — | YES | P0 |
| Drag row | reorder / nest | order / parent | 1 | YES LayersPanel | P0 on chrome (not on grid) |
| ▲▼ | reorder | 1 | YES | P0 optional (drag is enough) |
| + layer | header | CreateLayer | 1 | YES | P0 header |
| 📁 folder | header | CreateLayer folder | 1 | YES | P0 header |
| ⧉ dup | header | DuplicateLayer | 1 | YES; folder B-4 | P0 header + **fix B-4** |
| 🗑 | header | Delete | 1 | YES | P0 header |
| Shift+eye opacity | Adobe / F-07-02 L.2 | — | NO | NO |
| Pin color underline | Adobe | — | NO | NO (AMB-TL-004) |
| Mask / Guide type | 20.3 | — | NO | NO |
| Attach-to-camera | 16 | — | NO | NO |
| Parenting view | W2 | — | NO | NO |
| Layer Properties dialog | 20 / F-07-02 E6 | only color exists | — | LATER (full dialog) |

---

## Pointer ownership (avoid double-fire)

| Pointer down on | Owner | Must not |
|---|---|---|
| Eye/lock/outline | chrome flag gesture | start row-reorder |
| Collapse / un-nest | chrome | activate? current: stopPropagation then toggle — KEEP |
| Name / empty chrome | activate layer | start marquee |
| Frame cell | grid select/range | move playhead |
| Key dot | sequence move | select-only if <3px |
| Span edge | resize | select |
| Ruler / playhead handle | scrub | select cells |
| Header buttons | commands | — |
| Splitter | resize nameW | scrub |

This is the same split LayersPanel already uses (`data-layer-col` blocks HTML5 drag). **Copy that rule** into the unified chrome.

---

## Keyboard (do not add new unless listed)

Already assigned (keep): F5 F6 F7 Shift+F5 Shift+F6 Enter Home End . , Alt+. Alt+, Ctrl+Alt+T (timeline panel), V/R/Q tools.

Do **not** bind: O onion, Space+T scrub, Alt+Shift+. page hop — until those features exist and AMBs close.
