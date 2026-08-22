# 09 — STATE & EVENTS — Workspace / Stage

## 9.1 State Boundaries (4-boundary model from FOUNDATION_CONTRACT)

| Boundary | Location | Contents | Owner | Persist |
|----------|----------|----------|-------|---------|
| DOCUMENT | project JSON | StageDefinition (w/h/bg), layers, frames, symbols, guides? | SYS-02/14/16 | file |
| PREFERENCES | localStorage | workspace layout, viewPrefs (workArea, grid, rulers, guides, snap, rowHeight, layersColumnW), theme | SYS-01/04 | localStorage |
| SESSION | memory | selection, activeLayer, playhead, activeTool, editDepth, marquee, undo history, active tab, drag states | SYS-01/13/14/15 | memory |
| TEMPORARY | memory | viewport {zoom,pan}, previewDelta, pending transforms, marquee rect, guide drag preview | SYS-14 | memory |

## 9.2 Events — Canonical List for Stage/Workspace

| Event | Producer | Trigger | Payload | Consumers | UI Effect |
|-------|----------|---------|---------|-----------|-----------|
| document:changed | Command post-do | any doc mutation | {type, targets} | Stage, TimelinePanel, Properties, Library | re-render dirty |
| selection:changed | Session | selectAt etc | {prevTargets, targets, kind, commonType, bounds} | Properties, Info, Transform, Stage overlay, Status | re-render schema |
| selection:preview | Session | drag preview | {targets, bounds} | Stage overlay | live overlay |
| tool:changed | App | tool switch | {toolId} | Status, Tools panel, Properties Tool tab, Stage cursor | re-render |
| playhead:moved | Timeline | seek/scrub | {frame, scrubbing} | Stage (evaluate), Status | re-render stage |
| viewport:changed | Stage | zoom/pan | {zoom, panX, panY} | Status (zoom readout), Rulers | re-render? No doc, only view |
| viewPrefs:changed | viewPrefs | toggle workArea etc | {key, value} | Stage, TimelinePanel | re-render view |
| layer:changed | Command | layer op | {layerId, op} | LayersColumn, Stage | re-render |
| timeline:changed | Command | frame op | {type, layerId, frame} | FramesGrid, Stage | re-render |
| panel:changed | Panel manager | show/hide/resize | {id, change, ...} | Window menu, layout | re-layout |
| workspace:changed | Workspace | load/save/reset | {name, layout} | All panels | re-layout |
| activeDoc:changed | Shell | tab switch | {docId} | All panels | rebind to new doc |
| editMode:entered/exited | Symbol | enter/exit symbol edit | {depth} | EditBar, Stage dim, Breadcrumb | re-render |

## 9.3 Commands — For Stage/Workspace

| CommandId | Owner | Type | Input | State Mutation | Undo | Event |
|-----------|-------|------|-------|----------------|------|-------|
| view.zoomIn | SYS-04 | VIEW | {center?} | viewport.zoom*=2 | none (P2) | viewport:changed |
| view.zoomOut | SYS-04 | VIEW | | zoom/=2 | none | viewport:changed |
| view.zoom100 | SYS-04 | VIEW | | zoom=1, pan centered | none | viewport:changed |
| view.zoomFit | SYS-04 | VIEW | | fitViewport | none | viewport:changed |
| view.pan | SYS-04 | VIEW | {dx,dy} | panX+=dx, panY+=dy | none | viewport:changed |
| view.toggleWorkArea | SYS-04 | PREF | | workArea=!workArea | P2 | viewPrefs:changed |
| view.toggleInfiniteCanvas | SYS-04 | PREF | | infiniteCanvas=! | P2 | viewPrefs:changed |
| view.toggleRulers | SYS-04 | PREF | | rulers=! | P2 | viewPrefs:changed |
| view.toggleGrid | SYS-04 | PREF | | grid=! | P2 | viewPrefs:changed |
| view.toggleGuides | SYS-04 | PREF | | showGuides=! | P2 | viewPrefs:changed |
| view.lockGuides | SYS-04 | PREF | | lockGuides=! | P2 | viewPrefs:changed |
| view.clearGuides | SYS-04 | PREF | | guides=[] | P2 | viewPrefs:changed |
| view.addGuide | SYS-04 | PREF | {guide} | guides.push | P2 | viewPrefs:changed |
| view.moveGuide | SYS-04 | PREF | {id, pos} | guide.pos | P2 | viewPrefs:changed |
| view.deleteGuide | SYS-04 | PREF | {id} | guides filtered | P2 | viewPrefs:changed |
| view.hideEdges | SYS-04 | PREF | | hideEdges=! | P2 | viewPrefs:changed |
| tool.select | SYS-13 | SESSION | | activeTool='select' | none | tool:changed |
| tool.rect | SYS-13 | SESSION | | activeTool='rect' | none | tool:changed |
| tool.hand | SYS-13 | SESSION | | activeTool='hand' | none | tool:changed |
| tool.zoom | SYS-13 | SESSION | | activeTool='zoom' | none | tool:changed |
| edit.selectAt | SYS-03 | SESSION | {x,y} | selection=[id] | none | selection:changed |
| edit.selectToggleAt | SYS-03 | SESSION | {x,y} | toggle in selection | none | selection:changed |
| edit.selectInRect | SYS-03 | SESSION | {x1,y1,x2,y2} | selection=hit | none | selection:changed |
| edit.selectAll | SYS-03 | SESSION | | selection=all | none | selection:changed |
| edit.moveSelection | SYS-03 | DOCUMENT | {dx,dy} | nodes x/y += | DOCUMENT | document:changed |
| edit.transformSelection | SYS-03 | DOCUMENT | {transforms} | nodes transform | DOCUMENT | document:changed |
| edit.drawRect | SYS-20 | DOCUMENT | {x,y,w,h,fill} | new node | DOCUMENT | document:changed |
| layer.toggleVisibility | SYS-16 | DOCUMENT | {layerId} | layer.visible | DOCUMENT | layer:changed + document:changed |
| layer.toggleLock | SYS-16 | DOCUMENT | {layerId} | layer.locked | DOCUMENT | layer:changed + document:changed |
| layer.rename | SYS-16 | DOCUMENT | {layerId, name} | layer.name | DOCUMENT | layer:changed |
| layer.move | SYS-16 | DOCUMENT | {layerId, newIndex} | layers order | DOCUMENT | layer:changed |
| doc.setSettings | SYS-02 | DOCUMENT | {w,h,bg,fps} | doc settings | DOCUMENT | document:changed |

## 9.4 State Machines

### STM-TOOL

- States: INACTIVE, ACTIVE(toolId)
- Triggers: selectTool(toolId)
- Transitions: INACTIVE→ACTIVE, ACTIVE→ACTIVE (tool switch)
- Side-effect: emit tool:changed, update cursor

### STM-VIEW (new)

- States: IDLE, PANNING, ZOOMING, DRAGGING_GUIDE
- Triggers: startPan, endPan, startZoom, endZoom, etc
- Used for viewport gestures — not full STM but concept

### STM-DIRTY (existing)

- States: CLEAN, DIRTY
- Trigger: document:changed → DIRTY, save → CLEAN
- Protects against arbitrary clear — DIRTY→CLEAN without write forbidden

## 9.5 Event Flow Example — Move Object

```
User mousedown on selected rect
  → Stage detects hit on selected → arm MoveGesture
User mousemove 10px
  → past threshold → dragging=true → previewDelta={x:10,y:10} → scheduleRedraw → render() draws rect translated — no engine write
  → bus.emit('selection:preview')? Actually preview is local, no bus — just re-render
User mouseup
  → moveSelection(10,10) → kineora_move_selection → Command Move → apply() → doc.nodes[id].x+=10 → History push → bus.emit('document:changed',{type:'move',targets:[id]}) → bus.emit('selection:changed'? No, selection same) → Stage re-renders via tick, Properties re-renders x/y, Timeline unchanged
  → STM-DIRTY: CLEAN→DIRTY
```

## 9.6 Persistence Details

- viewPrefs: localStorage key `kineora_view_prefs` — JSON {workArea, infiniteCanvas, rulers, grid, gridSize, showGuides, lockGuides, guides[], hideEdges, preview, snap{}}
- workspace: localStorage key `kineora_workspace_prefs` — JSON {active, workspaces{layout, visibility, collapsed, layersColumnW, rowHeight}}
- Corrupt → auto-reset + toast — already implemented
- Version: add `version:1` field — future migrate

## 9.7 Error Handling

- Viewport zoom out of bounds → clamp 0.05..10
- Guide position NaN → ignore, toast "invalid guide position"
- Move blocked by locked layer → toast "draw blocked: active layer is locked or hidden" — already
- Engine not attached → Stage shows "Core not attached" overlay — already
- Workspace prefs corrupt → auto-reset — already

Next: 10_IMPLEMENTATION_BLUEPRINT.md — final coding spec
