# 05 — WORKSPACE LAYOUT — Adobe-like Merged Timeline + Essentials

> Sabse important file — isme batana hai ki workspace kaisa dikhega, panels kaha honge, aur kaise layer+timeline ko ek karna hai.

## 5.1 Current Layout (Kineora)

```
+------------------+------------------+------------------+
| MenuBar          |                  | WorkspaceSwitcher|
+------------------+------------------+------------------+
| Tools  | Stage (center, flex:1)      | Properties | Library |
| 60px   |                             | 240px      | 160px   |
|        |                             |            |         |
+--------+-----------------------------+------------+---------+
| TimelineStrip (bottom, 156px, full width)                |
|  frame ruler + playhead + dots                           |
+----------------------------------------------------------+
| StatusBar (bottom, 24px) — zoom/pan/stage readout        |
+----------------------------------------------------------+
| LayersPanel (left dock, 200px) — separate! Problem!      |
+----------------------------------------------------------+
```

Problem: LayersPanel alag, TimelineStrip alag — user ko do jagah dekhna padta hai.

## 5.2 Adobe Essentials Layout

```
+----------------------------------------------------------+
| MenuBar + EditBar (breadcrumb + zoom)                    |
+------+--------------------------------+---------------+
|Tools | Stage (center)                 | Properties    |
|      |                                |  Tool/Object/ |
|      |                                |  Frame/Doc    |
|      |                                |  tabs         |
+------+--------------------------------+---------------+
| Timeline Panel (bottom, 180px) — MERGED                  |
| +----+----+----+--------------------------------+     |
| |Eye |Lock|Name| Frame Grid (1,5,10...) + playhead|     |
| | 👁 | 🔒 |Layer1 | ● ● ○ → etc               |     |
| |    |    |Layer2 | ● ○                      |     |
| +----+----+----+--------------------------------+     |
| | Onion | Center | Play | fps | time | Customize... |     |
+----------------------------------------------------------+
| Library (right dock tabbed with Properties)              |
+----------------------------------------------------------+
| StatusBar — frame, fps, elapsed, zoom, workspace         |
+----------------------------------------------------------+
```

Key: Timeline panel = one panel with left columns + right grid, single scroll.

## 5.3 New Target Layout for Kineora (Phase 1 — Minimal 2D Animation)

```
+----------------------------------------------------------+
| MenuBar                                                  |
+----------------------------------------------------------+
| EditBar — Breadcrumb Scene ▸ Symbol + Back + Zoom dropdown|
+------+--------------------------------+---------------+
|Tools | Stage (center, flex:1)       | Properties    |
| 60px |                                | Tabs:         |
|      |                                | [Tool][Object]|
|      |                                | [Frame][Doc]  |
|      |                                |               |
|      |                                | Content       |
+------+--------------------------------+---------------+
| TimelinePanel — MERGED — 200px height, resizable         |
|  Left: LayersColumn (200px resizable) | Right: FramesGrid|
|  Eye Lock Outline Name | 1 5 10 15 ... playhead       |
+----------------------------------------------------------+
| StatusBar — frame 1/60, fps 24, zoom 100%, pan, stage   |
+----------------------------------------------------------+
```

- Tools panel 60px fixed left
- Properties panel 240-520px right, tabbed
- TimelinePanel bottom 96px..60% viewport, resizable via 6px handle (already exists)
- LayersColumn width resizable via vertical divider 6px drag — min 140px max 480px
- FramesGrid horizontal scrollable, auto-extending (no cap)
- EditBar above stage, visible only when editDepth>0 or always with breadcrumb + zoom

## 5.4 TimelinePanel — Merged Component Spec

### File: `animator/ui/src/components/TimelinePanel.tsx` — NEW

```ts
interface TimelinePanelProps {
  engine: EngineStatus;
  playhead: number;
  tick: number;
  notify?: (msg:string)=>void;
  layout: PanelLayout; // for height
  onResize: (h:number)=>void;
}
```

Structure:

```tsx
<div className="timeline-panel" style={{height: layout.timelineH}}>
  <div className="timeline-toolbar">
    <button>Onion Skin</button>
    <button>Center Frame</button>
    <button>Play</button>
    <span>Frame {playhead}/{duration}</span>
    <button>Customize...</button>
  </div>
  <div className="timeline-body" style={{display:'flex', overflow:'hidden'}}>
    <LayersColumn /> // left
    <div className="divider" style={{width:6, cursor:'col-resize'}} /> // resizable
    <FramesGrid /> // right, horizontal scroll
  </div>
</div>
```

#### LayersColumn — Left 30%

- Width: `layersColumnW` — default 200, min 140, max 480 — persisted in workspace prefs
- Columns:
  - Eye — visibility toggle — click → `toggleLayerVisibility(layerId)` command
  - Lock — lock toggle — click → `toggleLayerLock(layerId)`
  - Outline — outline toggle — click → `toggleLayerOutline(layerId)`
  - Name — layer name — double-click → inline edit → rename command
  - Type icon — folder/mask/guide etc — future
- Rows: one per layer, bottom→top = top is frontmost? Adobe: top = frontmost. Current Kineora: bottom→top? Need to check — keep bottom→top render but UI top→frontmost for Adobe parity — decide: UI top = frontmost (Adobe), render bottom→top still but reverse list in UI
- Row height: Short 18px, Medium 24px, Tall 32px — setting in hamburger menu — default Medium
- Selection: click row name → active layer — `setActiveLayer(layerId)` — no command, session state
- Drag: drag row up/down → reorder layers — `moveLayer(layerId, newIndex)` command
- Context menu: right-click row → Rename, Delete, Duplicate, Properties, Hide Others, Lock Others
- Folder: collapse/expand triangle, children indented, cascade eye/lock/outline

#### FramesGrid — Right 70%

- Horizontal scroll: overflow-x auto, vertical scroll synced with LayersColumn (single scroll container for vertical, but horizontal only for grid)
- Ruler: top row — frame numbers 1,5,10,15... — click number → playhead jump, drag ruler → scrub
- Playhead: red line + handle — draggable — `setPlayhead(frame)` — view state, no command
- Cells: layer × frame grid — each cell 12px wide? Current 12? Keep — solid dot keyframe, hollow blank, gray held span, blue classic tween span + ▶
- Selection: click cell → select frame(s) — frame range selection already exists in TimelineStrip — keep logic
- Frame ops: F5 insert frame, F6 insert keyframe, F7 blank, Shift+F5 delete, Shift+F6 clear — buttons + keyboard
- Onion skin markers: draggable range — future
- Customize toolbar: hamburger menu → Short/Medium/Tall, Preview, etc

#### Sync Scroll

- Vertical scroll: LayersColumn + FramesGrid share same scrollTop — use single scroll container wrapping both, or sync via onScroll
- Horizontal scroll: only FramesGrid scrolls, LayersColumn fixed

#### Resize Handles

- TimelinePanel height: existing 6px top edge drag — keep — min 96px max 60% viewport
- LayersColumn width: 6px vertical divider drag — live preview, min-clamp 140, max 480, Esc cancel — persist to prefs

### State

```ts
interface TimelinePanelState {
  layersColumnW: number; // persisted
  rowHeight: 'short'|'medium'|'tall'; // persisted
  selectedFrames: {layerId:number, frames:number[]}[]; // session
  activeLayerId: number; // session
}
```

### Events

- `layer:changed` → re-render LayersColumn
- `timeline:changed` → re-render FramesGrid
- `playhead:moved` → move playhead line
- `selection:changed` → highlight active layer

### Commands Used

- `toggleLayerVisibility`, `toggleLayerLock`, `toggleLayerOutline`, `renameLayer`, `deleteLayer`, `duplicateLayer`, `moveLayer`, `addLayer`, `setActiveLayer` (session)
- Frame commands: `insertFrame`, `insertKeyframe`, `insertBlankKeyframe`, `deleteFrame`, `clearKeyframe`, `copyFrames`, `pasteFrames`, etc — already exist

## 5.5 EditBar — New Component

File: `animator/ui/src/components/EditBar.tsx` — NEW

- Visible when editDepth>0 OR always with Scene name + zoom
- Content:
  - Back button ← — `edit.exitOneLevel()` — Esc also
  - Breadcrumb: `Scene 1 ▸ Symbol 1 ▸ nested` — click level → jump to that depth — `edit.exitToLevel(n)`
  - Zoom dropdown: 25%, 50%, 100%, 200%, Fit in Window — calls stageViewController
- Height: 28px
- Location: above Stage, below MenuBar
- Style: dark #1e1e1e, text #ccc

## 5.6 PropertiesPanel — 4 Tabs

Current PropertiesPanel mixed — need tabs.

File: `animator/ui/src/components/PropertiesPanel.tsx` — enhance

Tabs:
- **Tool** — active tool options — e.g., Rect tool fill/stroke — when no selection
- **Object** — selected object properties — x/y/w/h/rotation/fill/stroke/strokeWidth/opacity — when object selected
- **Frame** — selected frame properties — label, tween type, ease — when frame selected
- **Doc** — document properties — width/height/fps/background/ruler units — when nothing selected

Tab switching: click tab header — session state, no command

Each tab content:
- Tool: optionsSchema from active tool
- Object: getPropertySchema() from selected object type — already pattern — add x/y/w/h numeric fields + opacity slider (WISH W6)
- Frame: frame label input, tween type dropdown, ease slider
- Doc: width/height inputs (min 2), fps 1-120, background color, ruler units px/in/cm/mm (future)

Live preview: color fields use ColorField pattern — local draft + onChange preview + commit on blur/Enter + Esc cancel — one command

## 5.7 Tools Panel — Minimal for 2D Animation

For Phase 1 minimal 2D animation, need:

- Selection (V) — select, move, transform
- Subselection (A) — future — direct anchor edit
- Free Transform (Q) — scale/rotate
- Hand (H) — pan
- Zoom (Z) — zoom rect
- Rectangle (R) — draw rect — already
- Oval (O) — draw oval — new
- Line (L) — draw line — new
- Pencil (Y) — free draw — future
- Brush (B) — paint — future
- Text (T) — text — future
- Eyedropper (I) — pick color — future
- Paint Bucket (K) — fill — future

For now: Selection + Rect + Hand + Zoom — minimal to animate.

Options area: below tools, shows active tool modifiers — e.g., Selection: Snap magnet toggle

Colors area: Stroke chip, Fill chip, swap, B/W, no-color — already in Properties but should also be in Tools bottom — duplicate for Adobe parity — future

## 5.8 Menu Bar — Minimal

File: `animator/ui/src/components/MenuBar.tsx` — enhance

Menus:
- File: New (Ctrl+N), Open (Ctrl+O), Save (Ctrl+S), Save As, Export (Ctrl+Shift+R), Close (Ctrl+W)
- Edit: Undo (Ctrl+Z), Redo (Ctrl+Shift+Z), Cut/Copy/Paste, Select All, Deselect All, Preferences
- View: Zoom In/Out/100/Fit (Ctrl+=/-/1/0), Pasteboard (Ctrl+Shift+W), Rulers (Ctrl+R), Grid (Ctrl+'), Guides (Ctrl+;), Hide Edges (Ctrl+Shift+E), Preview Full/Outline
- Insert: New Symbol (Ctrl+F8), Frame (F5), Keyframe (F6), Blank Keyframe (F7)
- Modify: Convert to Symbol (F8), Break Apart (Ctrl+B), Arrange, Transform, Group/Ungroup
- Control: Play (Enter), Rewind (Home), Go To End (End), Loop Playback
- Window: Tools, Timeline (Ctrl+Alt+T), Properties (F4), Library (Ctrl+L), Reset Workspace
- Help: Shortcuts, About

## 5.9 Status Bar — Enhanced

Current: zoom/pan/stage readout

New: 12 cells (C-05) but minimal for Phase 1:

- Active tool — e.g., "Selection"
- Selection — e.g., "1 object selected" or "No selection"
- Active layer — e.g., "Layer 1"
- Active frame — e.g., "Frame 1/60" — click → GoToFrame dialog
- FPS — e.g., "24 fps"
- Zoom — e.g., "100%" — click → zoom dropdown
- Workspace — e.g., "Essentials" — click → switcher
- Saving status — "Saved" / "Saving..." / "● Dirty"

## 5.10 Workspace Persistence — Exact

```ts
interface WorkspacePrefs {
  active: string; // e.g., "essentials"
  workspaces: Record<string, {
    layout: PanelLayout; // layersW, propsW, timelineH, libraryH, debugH, layersColumnW
    visibility: Record<string,boolean>; // panel id → visible
    collapsed: Record<string,boolean>;
    rowHeight: 'short'|'medium'|'tall';
  }>;
}

interface PanelLayout {
  layersW: number; // deprecated after merge, but keep for compat
  propsW: number;
  timelineH: number;
  libraryH: number;
  debugH: number;
  layersColumnW: number; // NEW
}
```

- Store in localStorage key `kineora_workspace_prefs` — already `workspace.ts`
- Corrupt → auto-reset + toast — already
- Reset Workspace → restore DEFAULT_LAYOUT — already

## 5.11 Implementation Steps for Merged Timeline

1. Create `TimelinePanel.tsx` — copy logic from `TimelineStrip.tsx` + `LayersPanel.tsx`
2. LayersColumn subcomponent — eye/lock/outline/name, double-click rename, drag reorder
3. FramesGrid subcomponent — ruler, playhead, cells, frame selection, F5/F6/F7
4. Divider drag — 6px, live preview, min/max, Esc cancel, persist
5. Sync vertical scroll
6. Replace `TimelineStrip` + `LayersPanel` in `App.tsx` with `TimelinePanel`
7. Keep old files for reference but not rendered
8. Update `panelLayout.ts` — add layersColumnW
9. Update `workspace.ts` — add rowHeight
10. Tests: T-timeline-merged-render, T-layers-column-resize, T-layer-visibility-toggle, T-frame-cell-click

Next: 06_VIEWPORT.md — zoom/pan/rulers/grid/guides
