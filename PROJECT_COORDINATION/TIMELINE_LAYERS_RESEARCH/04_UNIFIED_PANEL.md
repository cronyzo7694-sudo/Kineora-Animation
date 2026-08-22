# 04 — UNIFIED TIMELINE PANEL (target contract)

This is the **layout + identity** spec for the later coding turn.  
Authority: Blueprint 7.1.1 (layer row = left column of the timeline) + human order.  
Not an Adobe clone. Not a new data model.

---

## 1. One panel, four regions

```
┌──────────────────────────────── Timeline (bottom, existing dock) ─────────────┐
│ HEADER A  transport · F5/F6/F7 · zoom · loop · frame/time readout            │
│ HEADER B  frame clipboard · tween · ease · label                             │
├──────── chrome ────┬┬──────────────── frame grid ────────────────────────────┤
│ 👁 🔒 ▢  name  ✎   ││ ruler  1  5  10 …     [playhead]                      │
│ 👁 🔒 ▢  Folder ▾  ││  (no cells — folder row is chrome-only / empty strip) │
│   👁 🔒 ▢ Layer 2  ││  ·············●········                               │
│ 👁 🔒 ▢  Layer 1   ││  ●═══════□                                         │
└────────────────────┴┴────────────────────────────────────────────────────────┘
         ▲ splitter (nameW)     ▲ existing timeline height splitter (above panel)
```

- **HEADER A/B** = today’s TimelineStrip toolbars (move as-is).
- **chrome** = today’s LayersPanel **row contents** (eye/lock/outline/indent/collapse/name/indicators).
- **grid** = today’s TimelineStrip cells/dots/tweens/playhead.
- **splitter** = new, view pref `timelineNameW`.

Window ▸ Layers (`panel.show('layers')`) after unify:

- **AMB-TL-010** (do not guess in code): either  
  (a) Layers command **focuses/expands the chrome column** (same panel), or  
  (b) Layers remains a **optional duplicate** list (current dock) until SYS-01 docking exists.  
  **Recommendation (not a decision):** (a) — one list. Marked AMB until Leader/human says.

Until AMB-TL-010 is closed, coding agents **must not delete** `LayersPanel.tsx`. Unify can be built as `TimelinePanel` that **embeds** the chrome; hide the left dock only after the AMB is closed.

---

## 2. Invariants (locked)

| ID | Invariant |
|---|---|
| U-1 | One `LayerId` → exactly one display row (if not collapsed-away). |
| U-2 | Chrome cells and frame cells for that id share **one row box** (same `top` + `height`). |
| U-3 | One vertical scroll container wraps chrome+grid (or two scrollTops written from one handler — same value every frame). |
| U-4 | Horizontal scroll is **grid-only** (ruler + cells). Chrome does not move horizontally. |
| U-5 | Display order = reverse(engine vec) = front at top. Unchanged. |
| U-6 | Collapsed folder hides descendants in **both** chrome and grid. |
| U-7 | Folder row: chrome full; grid **empty** (no F5/F6/F7 target). Clicking folder cells does not insert frames. |
| U-8 | `active_layer` highlight spans **entire** row (chrome + grid). |
| U-9 | Click chrome name/flags = existing layer commands. Click grid cell = existing frame select (playhead does not move). Click ruler = playhead. |
| U-10 | No new bus events. |
| U-11 | No new layer kinds. |
| U-12 | Playhead is view state; duration derived. |
| U-13 | Ruler + playhead line live in the **grid column only**. They never paint under chrome names. |

---

## 3. Folder row in the grid

Blueprint: folders have no frames. [CODE] `Layer::new_folder` empty keyframes.

Unified grid for a folder row:

- paint a **dim empty strip** (no dots, no cells selectable), **or**
- paint nothing (transparent).

**AMB-TL-011:** which visual. Recommendation (not decision): dim strip so the row height still lines up (U-2). Either is legal; **do not** draw fake keyframe dots.

Pointer on folder grid: no-op + optional toast only if they use F5/F6/F7 with folder **active** (B-2).

---

## 4. Scroll / resize math

```
rowH        = 22   // until AMB-TL-003
nameW       = clamp(pref, 160, 360)   // [OUR DESIGN DECISION — 140 cannot fit eye+lock+outline+name]
            // 92 today is the stub name column; too narrow for flags
gridLeft    = nameW + splitterW(4–6)
rowTop(i)   = rulerH + i * rowH
```

`nameW` default: **200** (current LayersPanel default width) — **[INFERENCE / recommendation]**. AMB-TL-012 if a different default is wanted.

Splitter: same `ResizeHandle` as C-06 (Esc cancels). Persist `kineora.workspace.timelineNameW`.

---

## 5. What moves vs what stays

| Piece | Move? |
|---|---|
| LayersPanel flag columns + rename + folder chevron | **into chrome column** (reuse functions; do not rewrite engine) |
| LayersPanel header + / 📁 / ⧉ / 🗑 | **into HEADER A** (left side) |
| TimelineStrip name stub (`NAME_W` text) | **DELETE** after chrome exists (it is a duplicate) |
| TimelineStrip grid + ruler + playhead | stay |
| TimelineStrip header buttons | stay |
| Left-dock LayersPanel | stay until AMB-TL-010 |
| `setActiveLayer` / all session methods | **unchanged** |

---

## 6. Implementation shape (when coding starts)

Preferred (smallest diff):

```
components/timeline/
  TimelinePanel.tsx      // shell: headers + splitter + scroll
  TimelineChrome.tsx     // extracted from LayersPanel row renderer
  TimelineGrid.tsx       // extracted from TimelineStrip grid
  timelineRows.ts        // shared displayRows + ancestorCollapsed (ONE copy)
```

Or keep filenames and have `TimelineStrip` import chrome. Do **not** fork engine.

`ancestorCollapsed` today is **duplicated** in both files — unify **must** use one helper (`timelineRows.ts`).

---

## 7. Accessibility

- Chrome flags already have aria-labels — keep.
- Grid cells: existing testids `cell-{engineIndex}-{frame}`.
- Unified row: `role="row"` optional; **do not** invent a new keyboard grid unless Blueprint requires it (it does not). Existing shortcuts stay.
- Folder empty strip: `aria-hidden` on non-interactive grid.

---

## 8. What success looks like (manual)

1. Add two layers. Both names sit on the **same horizontal band** as their dots.
2. Scroll vertically: names and dots move together.
3. Collapse a folder: child **name and dots** disappear together.
4. Drag name|grid splitter: names wider, cells still map to the same frames.
5. Hide timeline (Ctrl+Alt+T): whole panel gone; Stage grows. Show: same sizes.
6. F6 on a Normal layer: dot appears on **that** row only.
7. F6 with folder active: blocked (after B-2), no new dot.
8. Ctrl+Z after F6: one step; row updates.
9. Left Layers dock (if still visible): still works; same engine; no second truth.
