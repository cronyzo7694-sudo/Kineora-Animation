# SYS-04 — VIEW SYSTEM — SCOPE + H-FILE DECOMPOSITION

> AI-A forensic scope determination (Leader orders 2026-08-22: SYS-04 View first).
> This file establishes WHAT SYS-04 is, its ownership firewall, and the H-file
> decomposition BEFORE any H-file is drafted.
>
> Authority: Blueprint > Phase 2 > Phase 2.5 > Phase 3 > approved decisions >
> SYS-01 (locked contracts) > Adobe (comparison only) > code (evidence only).

---

## 1. What SYS-04 IS (authoritative)

SYS-04 = **View system**. It owns the **View menu**, the **viewport transform**
(zoom / pan / rotate-view — never stored in the document), **preview modes**,
**work-area / pasteboard visibility**, **rulers / grid / ruler-guides**,
**snapping flags + SnapEngine**, **Hide Edges**, and **Show Shape Hints**
(visibility flag only).

**Authoritative sources:**

- Blueprint Part 01 §1.2.3 (View menu table)
- Blueprint Part 01 §1.4.1 (stage geometry; view transform ≠ camera; pasteboard)
- Blueprint Part 01 §1.4.3 (Preview Mode: Full / Fast / Anti-alias / Outline)
- Blueprint Part 01 §1.4.4 (grid, guides, rulers, snapping + SnapEngine)
- Blueprint Part 01 §1.17 (M1: pan Space/Hand; zoom Ctrl+=/- and **wheel**)
- Blueprint Part 29 §29.9 (View shortcuts)
- Blueprint Part 30 §30.1 (stage context: Grid / Guides / Rulers toggles)
- Blueprint Part 32 §32.1 (renderer consumes view state)
- Phase-2 **F-01-06** View menu · **F-01-17** Grid/Guides/Rulers/Snapping
- Phase-2.5 **C-03** View groups; **C-05** `st.snap`
- SYS-01 §18 (PREFERENCES / SESSION / TEMPORARY) · §27.1 `snap:changed` · §31 SYS-04 row
- Approved **D-3**: Ctrl+K = command palette (Align loses the dedicated key)

## 2. Ownership Firewall (binding — FL-0009 / FL-0016)

| Concern | OWNER | SYS-04 role |
|---|---|---|
| View menu chrome | SYS-01 | SYS-04 owns item **semantics** |
| Viewport transform (zoom/pan/rotate-view) | **SYS-04** | owns state; never DOCUMENT |
| Camera (animatable screen transform) | **SYS-25** | distinct — do not conflate (FL-0031) |
| Hand / Zoom / Stage Rotate **tools** | **SYS-13** | tools write SYS-04 view state via commands / controller |
| Wheel zoom on stage | SYS-04 semantics + SYS-14 host | same `view.zoomIn` / `view.zoomOut` commandIds |
| Preview modes | **SYS-04** | render flags; export ignores them (authoring view) |
| Work area show/hide + pasteboard color | **SYS-04** | view pref |
| Rulers / grid overlays | **SYS-04** | view overlays |
| Ruler-guide objects (create/move/lock/show) | **SYS-04** | view overlays — **not** Part 33 document entities |
| Layer type `guide` / motion-guide | **SYS-16** | different “guide” (FL-0031) |
| SnapEngine + snap flags | **SYS-04** | consumed by SYS-13/14/22 |
| `st.snap` cell | SYS-01 chrome | SYS-04 produces `snap:changed` |
| Hide Edges | **SYS-04** flag | SYS-14 overlay **consumes** (does not own the flag) |
| Shape-hint **markers** | **SYS-23** (tween) / SYS-20 | SYS-04 owns **visibility flag only** |
| Go To First/Prev/Next/Last | **SYS-09** / SYS-15 playhead | View-menu **ENTRY only** (handoff) |
| Ruler **units** (px/in/cm/mm) | SYS-02 / SYS-06 Document settings | SYS-04 **displays** `settings.units` |
| Selection highlight geometry | SYS-14 | Hide Edges suppresses it |

**Rule:** SYS-04 never implements hit-testing, playhead motion, camera keyframes,
layer outline-mode (SYS-16), or export rasterization. Cross-system = handoff.

## 3. What SYS-04 does NOT own

- Playhead / transport (SYS-09, SYS-15) — even though Go To lives in the View menu.
- Camera (SYS-25).
- Stage hit-test / selection engine (SYS-14).
- Tools as interaction modes (SYS-13).
- Document settings including ruler units and stage size (SYS-02 / SYS-06).
- Layer outline flag (SYS-16 `Layer.outline`) — distinct from Preview ▸ Outline.
- Export / publish rendering (SYS-27) — export uses Full content, not view flags.

## 4. H-File Decomposition (9 files)

| File | Responsibility |
|---|---|
| **H00** | View constitution: terminology, firewall, persistence, events, invariants |
| **H01** | Zoom / pan / rotate-view / Fit / 100% / wheel |
| **H02** | Preview modes, Work Area, pasteboard color, Hide Edges, Shape Hints flag |
| **H03** | Rulers, grid, ruler-guides (create/move/lock/show) |
| **H04** | Snapping flags + SnapEngine contract |
| **H05** | View menu + shortcuts + stage context entries + Go To handoff |
| **H06** | UI → engine connection matrix |
| **H07** | QA + manual acceptance |
| **H08** | Final reconciliation + current-impl evidence (not authority) |

## 5. H-File Dependency Graph

```
H00 (constitution)
 ├─▶ H01 (viewport)
 ├─▶ H02 (preview / work area / edges / hints)
 ├─▶ H03 (rulers / grid / guides)
 └─▶ H04 (snapping)
        └─▶ H05 (menu / shortcuts / handoffs) ─▶ H06 ─▶ H07 ─▶ H08
```

## 6. Source Map (verified this pass)

| Source | Establishes |
|---|---|
| Part 01 §1.2.3 | Command list + (summary) shortcuts |
| Part 01 §1.4.1 | Origin top-left +Y down; pasteboard not exported; view transform not in document; camera is separate |
| Part 01 §1.4.2 | Compositing: bg → grid/guides/rulers → layers → masks → onion → camera → selection overlays |
| Part 01 §1.4.3 | Four preview modes and their meaning |
| Part 01 §1.4.4 | Rulers Ctrl+R *in the summary table*; drag-ruler = guide; grid; snap targets; SnapEngine |
| Part 01 §1.17 | Wheel zoom + Space/Hand pan as M1 skeleton |
| Part 29 §29.9 | **Dedicated** shortcut table: rulers = Ctrl+Shift+Alt+R; Fit = Ctrl+0; 100% = Ctrl+1 |
| Part 29 §29.2 | Import to Stage = Ctrl+R (so §1.2.3 “Ctrl+R = rulers” cannot stand) |
| Part 30 §30.1 | Stage context toggles Grid / Guides / Rulers — same commandIds as the menu |
| Part 32 §32.1 | Renderer inputs: render tree + view state + selection overlay |
| Part 33 | **No** guides/grid/view-transform fields on the project — DOCUMENT must not grow them |
| F-01-06 / F-01-17 | Same inventory; no extra numeric defaults |
| C-03 | View groups; no extra behavior |
| D-3 | Ctrl+K is palette, not Align |

## 7. Anticipated Ambiguity Candidates (NOT pre-resolved here)

See H00 §12. Candidates: grid default size · zoom step · guide persistence store ·
snap distance · pasteboard default hex / color UI · default visibility of overlays.

---

*Scope + decomposition complete. Drafting H00 next.*
