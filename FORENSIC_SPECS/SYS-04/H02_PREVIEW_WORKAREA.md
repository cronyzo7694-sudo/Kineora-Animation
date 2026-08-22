# SYS-04 H02 — PREVIEW MODES / WORK AREA / HIDE EDGES / SHAPE HINTS

## 0. Document Status

SPECIFICATION STATUS: **REVISION REQUIRED** (AMB-S04-005 pasteboard color UI)  
IMPLEMENTATION STATUS: **PARTIAL** (evidence in H08)

---

## 1. Scope

H02 owns Preview Mode (Full / Fast / Anti-alias / Outline), Work Area
show/hide, Pasteboard color, Hide Edges, and the **visibility flag** for
shape-tween hints.

H02 does **not** own: layer outline mode (SYS-16), selection overlay geometry
(SYS-14), shape-hint **data** (SYS-23), export raster (SYS-27).

---

## 2. Authority

| Source | Establishes |
|---|---|
| Part 01 §1.2.3 | Preview Mode submenu; Work Area + pasteboard color; Hide Edges Ctrl+Shift+E; Show Shape Hints Ctrl+Alt+H |
| Part 01 §1.4.2 | Overlays never part of export; compositing order |
| Part 01 §1.4.3 | Four modes + meaning |
| Part 29 §29.3 | Hide Edges = Ctrl+Shift+E |
| Part 29 §29.9 | Preview Mode = View menu (no extra key) |
| F-20-01 / SYS-16 | Layer outline = per-layer, distinct |

---

## 3. Preview modes

ONE commandId, four targets (INV-CMD-4):

`view.preview(mode)` where `mode ∈ { full, fast, antialias, outline }`.

| Mode | What changes | Use | Source |
|---|---|---|---|
| Full | Everything, anti-aliased, effects on | Final look | §1.4.3 |
| Fast | Simplifies/omits some effects (filters, advanced fills) | Responsive editing | §1.4.3 |
| Anti-alias | Smooth lines only | Line-art check | §1.4.3 |
| Outline | Path outlines only (no fills) | Find hidden shapes; low-end | §1.4.3 |

**Binding rules:**

- Exactly one mode is active (radio).
- Mode is PREFERENCES (H00 §5).
- Default mode: SOURCE DOES NOT ESTABLISH. **RECOMMENDATION — NOT AUTHORITATIVE:** `full` (the “final look” row). Not a separate AMB — picking Full as default is the only value the table names as the complete render; still labelled recommendation.
- **Export / Publish / Test Movie raster MUST use Full content** (INV-VIEW-4). Outline/Fast/AA never leak into SYS-27 output.
- Preview Outline ≠ `Layer.outline` (INV-VIEW-6). Both may be on: renderer MUST honor both as independent flags (layer outline is SYS-16; this mode is global).
- Fast “some effects”: the omitted set is **filters + advanced fills** as written. SOURCE DOES NOT ESTABLISH a longer omit-list. Do not invent extra omissions.

| Control | commandId | Trigger | Undo | Dirty | Event | testId |
|---|---|---|---|---|---|---|
| Full | `view.preview('full')` | View ▸ Preview Mode ▸ Full | no | no | none (re-read) | T-prev-full |
| Fast | `view.preview('fast')` | View ▸ Preview Mode ▸ Fast | no | no | none | T-prev-fast |
| Anti-alias | `view.preview('antialias')` | View ▸ Preview Mode ▸ Anti-alias | no | no | none | T-prev-aa |
| Outline | `view.preview('outline')` | View ▸ Preview Mode ▸ Outline | no | no | none | T-prev-outline |

---

## 4. Work Area (pasteboard)

| Control | commandId | Trigger | Action | testId |
|---|---|---|---|---|
| Show/Hide Work Area | `view.workArea` | Ctrl+Shift+W / menu / stage-ctx (if grouped) | toggle pasteboard visibility | T-workarea |
| Pasteboard color | `view.pasteboardColor` | View menu (“Pasteboard color”) | **AMB-S04-005** | T-pasteboard-color |

- When Work Area is **off**, the host shows the stage rectangle only (no gray surround). Art that exists in pasteboard space remains in the document; it is simply not framed by the surround. SOURCE DOES NOT ESTABLISH whether off also **clips** painting of pasteboard objects. §1.4.1 says pasteboard art is “authored but not rendered at export” — authoring visibility when the surround is hidden is silent. **RECOMMENDATION — NOT AUTHORITATIVE:** objects outside the stage still draw when Work Area is off (only the gray chrome hides). Do not treat clip-on-hide as required.
- Default ON/OFF = **AMB-S04-006**.
- Color default hex + picker UI = **AMB-S04-005**. The surround is “gray” (§1.4.1) — that word is the only color authority.

---

## 5. Hide Edges

| Control | commandId | Shortcut | Action | testId |
|---|---|---|---|---|
| Hide Edges | `view.hideEdges` | Ctrl+Shift+E | toggle: selection highlight suppressed | T-hide-edges |

- View pref (PREFERENCES). No undo. No dirty.
- SYS-14 **consumes** the flag: bounding boxes / handles / edge highlights hide.
- Selection **state** is unchanged (still a selection; Properties still bind).
- Transform handles: SOURCE DOES NOT ESTABLISH whether handles also hide.
  Part 29.3: “suppress selection highlight”. **RECOMMENDATION — NOT AUTHORITATIVE:** hide the highlight **and** handles (otherwise “edit without seeing selection” / W6 fails). Labelled recommendation only.
- W6 (always-visible Opacity) is SYS-17 — out of scope.

---

## 6. Show Shape Hints

| Control | commandId | Shortcut | Action | testId |
|---|---|---|---|---|
| Show Shape Hints | `view.shapeHints` | Ctrl+Alt+H (§1.2.3) | toggle visibility of hint markers | T-shape-hints |

- SYS-04 owns the **flag**.
- SYS-23 owns hint **data** (Add/Remove Shape Hint = Modify ▸ Shape — SYS-06 menu entry / SYS-23 engine).
- If no hints exist, the toggle is still FUNCTIONAL (flag persists; nothing to draw). This is **not** a dead control: the flag is real state.
- Default: SOURCE DOES NOT ESTABLISH.

---

## 7. Persistence / undo / dirty

All H02 flags = PREFERENCES. No History. No DIRTY. No `document:changed`.

---

## 8. Edge cases

| # | Case | Expected | testId |
|---|---|---|---|
| 1 | Outline preview then Export | export still filled/Full | T-prev-outline-export |
| 2 | Outline preview + layer outline | both flags independent | T-prev-vs-layer-outline |
| 3 | Hide Edges with a selection | Properties still show the selection | T-hide-edges-props |
| 4 | Work Area off | stage remains; export unchanged | T-workarea-export |
| 5 | Preview change mid-dirty doc | stays DIRTY | T-prev-no-dirty |

---

## 9. Ambiguity

| AMB | Status |
|---|---|
| AMB-S04-005 pasteboard color | **OPEN** |
| AMB-S04-006 default visibilities (includes workArea) | **OPEN** (non-blocking for the toggle) |

---

*H02 done. Next: H03.*
