# SYS-04 H06 — UI → ENGINE CONNECTION MATRIX

## 0. Document Status

SPECIFICATION STATUS: **READY FOR IMPLEMENTATION** (matrix of specified items)  
IMPLEMENTATION STATUS: **PARTIAL**

---

## 1. Canonical chain (one row per SYS-04 control)

No orphans. DEFERRED rows stay in this matrix with status DEFERRED (FL-0010:
they are **not** approved-as-FUNCTIONAL).

| Control | commandId | UI | Engine | State write | Event | Persist | Undo | Status |
|---|---|---|---|---|---|---|---|---|
| Zoom In | `view.zoomIn` | menu / pal / key / wheel | Viewport.zoom *=? **AMB-S04-002** | SESSION viewport | re-read | no | no | READY except step |
| Zoom Out | `view.zoomOut` | menu / pal / key / wheel | Viewport.zoom | SESSION | re-read | no | no | READY except step |
| 100% | `view.zoom100` | menu / pal / Ctrl+1 | zoom=1 | SESSION | re-read | no | no | READY |
| Fit | `view.zoomFit` | menu / pal / Ctrl+0 | fit stage rect | SESSION | re-read | no | no | READY |
| Preview * | `view.preview(mode)` | radio submenu | render flags | PREFS | re-read | prefs | no | READY |
| Work Area | `view.workArea` | menu / Ctrl+Shift+W | pasteboard vis | PREFS | re-read | prefs | no | READY |
| Pasteboard color | `view.pasteboardColor` | menu | pref color | PREFS | re-read | prefs | no | **AMB-S04-005** |
| Rulers | `view.rulers` | menu / ctx / Ctrl+Shift+Alt+R | overlay | PREFS | re-read | prefs | no | READY |
| Grid | `view.grid` | menu / ctx / Ctrl+' | overlay | PREFS | re-read | prefs | no | READY (size AMB-S04-001) |
| Guides vis | `view.guides` | menu / ctx / Ctrl+; | overlay | PREFS vis + guide store AMB-S04-003 | re-read | AMB | no | READY vis; persist AMB |
| Lock Guides | `view.guides.lock` | Guides submenu | lock flag | AMB store | re-read | AMB | no | READY |
| Hide Edges | `view.hideEdges` | menu / Ctrl+Shift+E | overlay consume (SYS-14) | PREFS | re-read | prefs | no | READY |
| Shape Hints | `view.shapeHints` | menu / Ctrl+Alt+H | overlay consume (SYS-23) | PREFS | re-read | prefs | no | READY |
| Snap * | `view.snap(t)` | Snapping / Guides submenu | SnapEngine flags | PREFS | `snap:changed{mode}` | prefs | no | **AMB-S04-004** + DEFERRED until engine |
| Drag-from-ruler | (gesture → create guide) | ruler pointer | guide list +1 | AMB store | re-read | AMB | no | READY as gesture |
| Go To * | `control.*` | View ▸ Go To | SYS-09/15 | playhead SESSION | `playhead:moved` | no | no | **handoff** |

---

## 2. Consumer matrix

| Producer | Consumer | What is read |
|---|---|---|
| Viewport | SYS-14 renderer | zoom/pan/rotate-view |
| Preview flag | SYS-14 renderer | mode; export path ignores |
| Work Area / color | SYS-14 renderer | pasteboard chrome |
| Rulers/grid/guides | SYS-14 overlays | draw extras |
| Hide Edges | SYS-14 selection overlay | suppress highlight |
| Shape Hints flag | SYS-23 overlay | show markers |
| Snap flags | SnapEngine → SYS-13/14/22 | snap + hints |
| Snap flags | SYS-01 `st.snap` | via `snap:changed` |
| `settings.units` | H03 rulers | tick labels |

No panel reads another panel (REQ-SYS-006).

---

## 3. Forbidden edges

- SYS-04 → `document:changed` (never)
- SYS-04 → History.execute (never)
- SYS-04 → `persist::save` internals (never)
- SYS-04 writing `Layer.outline` (SYS-16)
- SYS-04 writing camera (SYS-25)
- SYS-04 implementing playhead (SYS-09/15)
- Second SnapEngine inside a tool (INV-VIEW-8)

---

*H06 done. Next: H07.*
