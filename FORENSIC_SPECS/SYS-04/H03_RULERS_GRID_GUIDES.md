# SYS-04 H03 — RULERS / GRID / RULER-GUIDES

## 0. Document Status

SPECIFICATION STATUS: **REVISION REQUIRED** (AMB-S04-001 size, AMB-S04-003 persist, AMB-S04-006 defaults)  
IMPLEMENTATION STATUS: **PARTIAL** (rulers/grid visibility exist as evidence; guides DEFERRED in current code)

---

## 1. Scope

H03 owns:

- Ruler visibility + reading `settings.units`
- Grid visibility + cell size (**AMB-S04-001**)
- Ruler-guide **objects**: create (drag from ruler), move, lock, show/hide

H03 does **not** own: layer type `guide` (SYS-16), Snap-to-Guides flag (H04),
document units field (SYS-02/06).

---

## 2. Authority

| Source | Establishes |
|---|---|
| Part 01 §1.2.3 | Rulers / Grid / Guides; “edit/snap/lock guides”; shortcuts in the **summary** table |
| Part 01 §1.4.4 | Rulers; drag from ruler = guide (cyan/magenta, non-printing); grid configurable; Snap to Guides |
| Part 01 §1.7 | Ruler units = document setting |
| Part 29 §29.9 | Rulers = **Ctrl+Shift+Alt+R**; Grid = Ctrl+'; Guides = Ctrl+; |
| Part 30 §30.1 | Stage context: Grid / Guides / Rulers — same commandIds |
| Part 33 | **No** guides array — DOCUMENT forbidden |
| F-01-17 | Same inventory |

---

## 3. Rulers

| Control | commandId | Shortcut | Action | testId |
|---|---|---|---|---|
| Show/Hide Rulers | `view.rulers` | Ctrl+Shift+Alt+R (H00 resolution) | toggle edge rulers | T-rulers |

- Units = `settings.units` (`px` / `in` / `cm` / `mm`) — read-only here.
- Origin of the ruler scale = stage origin (0,0) top-left (§1.4.1), **after**
  the view transform (rulers track zoom/pan). SOURCE DOES NOT ESTABLISH
  rotate-view vs ruler orientation. **RECOMMENDATION — NOT AUTHORITATIVE:**
  rulers stay axis-aligned in **view** space (do not invent rotated ticks).
- Default visibility = AMB-S04-006.
- No undo / no dirty.

---

## 4. Grid

| Control | commandId | Shortcut | Action | testId |
|---|---|---|---|---|
| Show/Hide Grid | `view.grid` | Ctrl+' | toggle cell grid | T-grid |

- Overlay only (compositing §1.4.2 item 2). Not exported.
- Cell size = **AMB-S04-001** (no number in corpus). “Configurable” is stated;
  the **UI to configure** size is SOURCE DOES NOT ESTABLISH. Do **not** invent
  a Grid dialog. Until a decision, the size is a pref key with an unresolved
  default; a hidden pref is allowed; a visible editor is `[NOT SPECIFIED]`.
- Color/style of grid lines: SOURCE DOES NOT ESTABLISH. Do not invent.
- Default visibility = AMB-S04-006.

---

## 5. Ruler-guides

### 5.1 Data (view overlay — not ENT-*)

A guide is `{ axis: 'x' | 'y', position: number, locked: boolean }`.

- `x` guide = vertical line at document `x = position`
- `y` guide = horizontal line at document `y = position`
- Color: “cyan/magenta” (§1.4.4). SOURCE DOES NOT ESTABLISH which axis is
  which color. **RECOMMENDATION — NOT AUTHORITATIVE:** vertical = cyan,
  horizontal = magenta. Either pairing is legal.
- Non-printing: never exported (INV-VIEW-3/4).

Persistence of `{axis,position,locked}[]` = **AMB-S04-003**.
DOCUMENT is **forbidden** (Part 33). Options: SESSION (lost on restart) or
PREFERENCES. Do not pick one in a normative field.

### 5.2 Create

- **Drag from a visible ruler** onto the stage/pasteboard (§1.4.4).
- Requires rulers **visible** (cannot drag a hidden ruler).
- Not a document Command. No dirty. No undo (H00 §6) unless AMB-S04-003 is
  later decided as DOCUMENT — which is currently forbidden.
- Drop position = the document coordinate under the pointer.

### 5.3 Move / edit

- Drag an existing unlocked guide. This is the “edit” in “edit/snap/lock”
  (§1.2.3). No separate Edit Guides dialog is specified — do not invent one.
- Locked guides cannot move.

### 5.4 Commands

| Control | commandId | Shortcut | Action | testId |
|---|---|---|---|---|
| Show/Hide Guides | `view.guides` | Ctrl+; | toggle visibility of existing guides | T-guides-vis |
| Lock Guides | `view.guides.lock` | View ▸ Guides ▸ Lock Guides (§1.4.4 / §1.2.3 “lock”) | toggle lock on **all** current guides | T-guides-lock |

Snap to Guides = `view.snap('guides')` (H04), also named under View ▸ Guides
(§1.4.4). Same commandId — not a second command (INV-CMD-4).

**Show-toggle vs empty set:** if create-from-ruler is not yet implemented,
`view.guides` MUST be DEFERRED (dead-toggle ban / FL-0005). Once create
exists, the toggle is FUNCTIONAL even when the set is empty (flag is real).

**Clear All Guides / Delete one guide via menu:** SOURCE DOES NOT ESTABLISH.
Do not add. Dragging a guide back onto the ruler is `[ADOBE — NOT IN BLUEPRINT]`.
Deleting a guide is therefore **unspecified**. Registered:

> **SOURCE DOES NOT ESTABLISH** a delete-guide gesture. Implementation MUST
> NOT invent one. A locked-empty set can only be hidden, not cleared, until
> a decision. This is a **research gap**, not a silent feature.

That gap is **implementation-critical** for “edit” completeness but does not
block show/lock/create. It is listed as AMB-S04-003’s sibling note, not a
seventh AMB — delete is simply out of scope until specified.

---

## 6. Context menu

Part 30 §30.1: stage context includes **Grid / Guides / Rulers** toggles.
They MUST invoke `view.grid` / `view.guides` / `view.rulers` (same IDs).

---

## 7. Edge cases

| # | Case | Expected | testId |
|---|---|---|---|
| 1 | Rulers off → cannot create a guide | no drag source | T-guide-need-rulers |
| 2 | Lock on → drag ignored | position unchanged | T-guides-lock |
| 3 | Guides hidden → still exist | show again at same positions (within persist AMB) | T-guides-hide-keep |
| 4 | Grid/rulers/guides not in project JSON | save/reload file has no guide/grid keys | T-guides-not-in-doc |
| 5 | Layer type guide unchanged | SYS-16 layer type independent | T-guides-not-layer-type |
| 6 | Units change (Modify ▸ Document) | ruler ticks re-read units; guide **positions** stay in px document space | T-rulers-units |

---

## 8. Ambiguity

| AMB | Status |
|---|---|
| AMB-S04-001 grid default size | **OPEN** |
| AMB-S04-003 guide persist store | **OPEN** |
| AMB-S04-006 default vis | **OPEN** |

---

*H03 done. Next: H04.*
