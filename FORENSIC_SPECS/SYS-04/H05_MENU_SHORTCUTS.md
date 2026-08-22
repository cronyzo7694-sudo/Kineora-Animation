# SYS-04 H05 — VIEW MENU + SHORTCUTS + CONTEXT + HANDOFFS

## 0. Document Status

SPECIFICATION STATUS: **READY FOR IMPLEMENTATION** (scope-limited: open AMBs
live in H01–H04; this file only maps specified items)  
IMPLEMENTATION STATUS: **PARTIAL** (see H08)

---

## 1. Scope

H05 maps the View menu, shortcuts, stage-context entries, and the Go To
**handoff**. It does not add commands that H00–H04 did not name.

---

## 2. View menu (canonical)

Order follows Part 01 §1.2.3 groups (C-03: Go-To · Zoom · Preview-Modes ·
Work-Area · Rulers/Grid/Guides · Snapping · Hide-Edges · Shape-Hints).

| Group | Item | commandId | Shortcut | Owner |
|---|---|---|---|---|
| Go To | First | `control.firstFrame` (or SYS-09 equivalent already registered) | Home | **SYS-09** handoff |
| Go To | Previous | `control.stepBackward` | Ctrl+← (§1.2.3) / `,` (Part 29.6 step) | **SYS-09** — see note |
| Go To | Next | `control.stepForward` | Ctrl+→ / `.` | **SYS-09** |
| Go To | Last | `control.lastFrame` | End | **SYS-09** |
| Zoom | Zoom In | `view.zoomIn` | Ctrl+= | SYS-04 |
| Zoom | Zoom Out | `view.zoomOut` | Ctrl+- | SYS-04 |
| Zoom | 100% | `view.zoom100` | Ctrl+1 | SYS-04 |
| Zoom | Fit in Window | `view.zoomFit` | Ctrl+0 | SYS-04 |
| Preview | Full | `view.preview('full')` | — | SYS-04 |
| Preview | Fast | `view.preview('fast')` | — | SYS-04 |
| Preview | Anti-alias | `view.preview('antialias')` | — | SYS-04 |
| Preview | Outline | `view.preview('outline')` | — | SYS-04 |
| Work Area | Show Work Area | `view.workArea` | Ctrl+Shift+W | SYS-04 |
| Work Area | Pasteboard color | `view.pasteboardColor` | — | SYS-04 (AMB-S04-005) |
| Overlays | Rulers | `view.rulers` | Ctrl+Shift+Alt+R | SYS-04 |
| Overlays | Grid | `view.grid` | Ctrl+' | SYS-04 |
| Guides | Show Guides | `view.guides` | Ctrl+; | SYS-04 |
| Guides | Lock Guides | `view.guides.lock` | — | SYS-04 |
| Guides | Snap to Guides | `view.snap('guides')` | — | SYS-04 (same ID as Snapping) |
| Snapping | to Objects | `view.snap('objects')` | Ctrl+Shift+/ | SYS-04 |
| Snapping | to Grid | `view.snap('grid')` | — | SYS-04 |
| Snapping | to Guides | `view.snap('guides')` | — | SYS-04 |
| Snapping | to Pixels | `view.snap('pixels')` | — | SYS-04 |
| Snapping | Snap Align | `view.snap('align')` | — | SYS-04 |
| — | Hide Edges | `view.hideEdges` | Ctrl+Shift+E | SYS-04 |
| — | Show Shape Hints | `view.shapeHints` | Ctrl+Alt+H | SYS-04 |

**Go To shortcut note (not an AMB):** §1.2.3 lists Home / Ctrl+← / Ctrl+→ / End.
Part 29.6 lists Home / End for first/last and `.` / `,` for step one frame.
Ctrl+← / Ctrl+→ also appear in Part 29.10 as **text kerning**.  
Resolution (FL-0033, same-source + FL-0031):

- Playhead first/last = Home / End (both tables agree).
- Playhead step = Part 29.6 `.` / `,` (dedicated playback table).
- Ctrl+← / Ctrl+→ in the §1.2.3 summary **lose** to Part 29.10 when a text
  edit context is focused; when not in text-edit, SOURCE DOES NOT ESTABLISH
  whether they also step the playhead. **Do not implement Ctrl+←/→ as playhead
  step** until SYS-09/SYS-07 reconcile — registering a **handoff**, not a
  SYS-04 decision. SYS-04 only lists the menu entries.

**Not in this menu (do not add):**

- Align panel (Ctrl+K) — **D-3** palette wins; Align is SYS-06 / Window.
- Show/Hide Timeline / Library — Window menu (SYS-01/11), even though Part
  29.9 lists them under the View *shortcut* heading.
- Camera controls — SYS-25.
- A master “Snapping” toggle that is not in §1.2.3.

---

## 3. Stage context menu (Part 30 §30.1)

| Item | commandId |
|---|---|
| Grid | `view.grid` |
| Guides | `view.guides` |
| Rulers | `view.rulers` |

Paste / Paste in Place / Select All = SYS-03 (not H05).

---

## 4. Palette / shortcuts

Every SYS-04 commandId is palette-visible (C-03). Shortcuts above are the
defaults; rebound by SYS-08 (handoff). Bind-time conflict → SYS-08 warning
(C-32). SYS-04 does not own the editor.

---

## 5. Cross-system handoffs (complete)

| Entry | Owner | SYS-04 duty |
|---|---|---|
| Go To * | SYS-09 / SYS-15 | menu row only |
| Hand / Zoom / Stage Rotate tools | SYS-13 | write H01 viewport |
| Wheel on canvas | SYS-14 host | invoke `view.zoomIn` / `Out` |
| Hide Edges rendering | SYS-14 overlay | read flag |
| Layer outline | SYS-16 | independent of `view.preview('outline')` |
| Shape hint data | SYS-23 | H02 flag only |
| Ruler units | SYS-02/06 | H03 reads `settings.units` |
| `st.snap` | SYS-01 | consume `snap:changed` |
| Export | SYS-27 | ignore view flags (INV-VIEW-4) |
| Camera | SYS-25 | do not compose into Viewport |

---

## 6. Counting (FL-0020)

Mechanically from §2 (SYS-04-owned rows only, Go To excluded):

- commandIds: `view.zoomIn`, `view.zoomOut`, `view.zoom100`, `view.zoomFit`,
  `view.preview`, `view.workArea`, `view.pasteboardColor`, `view.rulers`,
  `view.grid`, `view.guides`, `view.guides.lock`, `view.hideEdges`,
  `view.shapeHints`, `view.snap` = **14**
- controls (menu rows SYS-04): 4 zoom + 4 preview + 2 work area + 2
  rulers/grid + 3 guides-submenu + 5 snap + hide edges + shape hints = **23**
- `view.snap('guides')` is one commandId appearing twice (Guides submenu +
  Snapping) — counted once as a command, twice as a control (same as SYS-03
  paste targets).

---

*H05 done. Next: H06.*
