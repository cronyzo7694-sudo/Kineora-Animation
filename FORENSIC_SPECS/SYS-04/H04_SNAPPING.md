# SYS-04 H04 — SNAPPING + SNAPENGINE

## 0. Document Status

SPECIFICATION STATUS: **REVISION REQUIRED** (AMB-S04-004 snap distance)  
IMPLEMENTATION STATUS: **NOT IMPLEMENTED** (current `view.snapping` is DEFERRED — evidence)

---

## 1. Scope

H04 owns snap **flags** and the **SnapEngine**. Consumers (SYS-13 tools,
SYS-14 stage gestures, SYS-22 transform) **call** the engine; they do not
implement a second snap.

---

## 2. Authority

| Source | Establishes |
|---|---|
| Part 01 §1.2.3 | Snapping → to Objects / Grid / Guides / Pixels; Snap Align |
| Part 01 §1.4.4 | Same list; Snap Align = dashed alignment hints; SnapEngine(point)→nearest + hint |
| Part 29 §29.9 | Snap to Objects = Ctrl+Shift+/ |
| C-05 / SYS-01 §27.1 | `st.snap`; `snap:changed{mode}` |
| SYS-01 D-9 | 3px/12px is **panel-drag** threshold — **not** snap distance |

---

## 3. Flags (PREFERENCES)

ONE commandId, five targets:

`view.snap(target)` where `target ∈ { objects, grid, guides, pixels, align }`.

| Target | Meaning | Shortcut | testId |
|---|---|---|---|
| `objects` | snap to other objects | Ctrl+Shift+/ | T-snap-objects |
| `grid` | snap to grid intersections (even if grid hidden? SOURCE SILENT) | — | T-snap-grid |
| `guides` | snap to ruler-guides (even if hidden? SOURCE SILENT) | also View ▸ Guides ▸ Snap to Guides | T-snap-guides |
| `pixels` | snap to whole document pixels | — | T-snap-pixels |
| `align` | Snap Align: dashed hints to other objects | — | T-snap-align |

Each target is an **independent boolean** (the table is a list of toggles, not
a radio). SOURCE DOES NOT ESTABLISH a master “Snapping” off that overrides
all. A master row in the current menu (`view.snapping`) is **evidence only**
and is **not** in the Blueprint list — do not promote it to spec.

**Hidden grid + snap-to-grid:** SOURCE DOES NOT ESTABLISH.  
**RECOMMENDATION — NOT AUTHORITATIVE:** snap-to-grid works even when the grid
overlay is hidden (snap ≠ visibility). Same for guides. Labelled recommendation.

---

## 4. SnapEngine contract

```
SnapEngine.snap(candidate: Point, ctx: SnapContext) → { point: Point, hints: Hint[] }
```

`SnapContext` includes: enabled flags, grid size (AMB-S04-001), guide
positions, object snap points (bounds/edges/centers — **which** object points
are SOURCE DOES NOT ESTABLISH beyond “to objects”), pixel grid, other-object
align edges (Snap Align).

- Pure: no document mutation.
- Used uniformly by move / transform / draw (§1.4.4).
- Distance / tolerance = **AMB-S04-004**. Without it, “nearest” is defined but
  “whether to snap or keep the raw point” is not. Implementation MUST NOT
  silently pick a radius and call it specified.
- If no flag is on, `snap` returns the candidate unchanged + no hints.
- Hints are TEMPORARY overlays (compositing §1.4.2 item 7 family — overlay,
  never export).

**Object snap points:** “to objects” is the entire specification. Which
features (edge, center, registration) are `[NOT SPECIFIED]`. Do not invent a
list. A minimal legal engine may snap to object AABB edges + center and
**must** record that choice as impl-evidence, not spec.

---

## 5. Events / status

On any flag change:

1. Persist prefs.
2. Emit `snap:changed{mode}` (SYS-01 §27.1). `mode` identifies the target
   that changed (string). Do not invent extra payload keys (FL-0030).
3. `st.snap` re-reads flags (never a hardcoded “snap off”).

No `document:changed`. No undo. No dirty.

---

## 6. Command table

| Control | commandId | Enabled | Action | Event | testId |
|---|---|---|---|---|---|
| Snap to Objects | `view.snap('objects')` | always (once engine exists) | toggle flag | `snap:changed` | T-snap-objects |
| Snap to Grid | `view.snap('grid')` | always | toggle | `snap:changed` | T-snap-grid |
| Snap to Guides | `view.snap('guides')` | always | toggle | `snap:changed` | T-snap-guides |
| Snap to Pixels | `view.snap('pixels')` | always | toggle | `snap:changed` | T-snap-pixels |
| Snap Align | `view.snap('align')` | always | toggle | `snap:changed` | T-snap-align |

Until SnapEngine exists, **all five** are DEFERRED (honest reason), not
FUNCTIONAL no-ops (FL-0005).

---

## 7. Edge cases

| # | Case | Expected | testId |
|---|---|---|---|
| 1 | All flags off | identity snap | T-snap-none |
| 2 | Snap does not dirty | dirty unchanged | T-snap-no-dirty |
| 3 | `st.snap` tracks flags | cell not a static string | T-snap-status |
| 4 | Draw and move use the same engine | one implementation | T-snap-shared |
| 5 | Export ignores snap hints | no hint lines in export | T-snap-not-export |

---

## 8. Ambiguity

| AMB | Status |
|---|---|
| AMB-S04-004 snap distance | **OPEN** — implementation-critical for SnapEngine |
| AMB-S04-001 grid size | consumed here; owned by H03 |

---

*H04 done. Next: H05.*
