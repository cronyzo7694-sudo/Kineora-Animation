# 03 — STAGE DEFINITION — Exact Spec for Coding

> Is file me har cheez itni detail me hai ki code likhte time sochna na pade.

## 3.1 Stage Geometry — Canonical

```ts
interface StageDefinition {
  width: number;  // px, >=2, default 1920
  height: number; // px, >=2, default 1080
  background: string; // hex #RRGGBB, default #ffffff
  backgroundAlpha: number; // 0..1, default 1, <1 = pasteboard shows through
}
```

- **Origin (0,0) = top-left of stage.** Document coordinates = stage coordinates. All object x/y in Properties are in this space.
- **Bounds:** x in [0, width], y in [0, height] = inside stage. Outside = pasteboard.
- **Stage border:** authoring-only 1px stroke #6a6a6a (Adobe black, hamara gray okay, later configurable). Never exported. Drawn at `stage.x+0.5, stage.y+0.5, stage.w-1, stage.h-1` for crisp 1px.
- **Stage fill:** `background` + `backgroundAlpha` — when alpha <1, pasteboard visible through stage — export me bhi alpha.

## 3.2 Stage vs Document vs View

- **Document** stores StageDefinition + layers + symbols + library — persisted in JSON — boundary DOCUMENT
- **View** stores Viewport {zoom, panX, panY} — never persisted in doc, only session or prefs — boundary SESSION/TEMPORARY
- **Render** = `evaluate(doc, playhead)` → RectItem[] → `render(ctx, viewport, renderState)` → screen
- **Export** = `renderContent(ctx, identityViewport, contentState)` → no view transform, no overlay, no pasteboard border

**Rule:** View transform (zoom/pan) kabhi document ko mutate nahi karta. Sirf `vpRef` change.

## 3.3 Stage Component — File Location

```
animator/ui/src/components/Stage.tsx — keep, enhance
animator/ui/src/render/canvasRenderer.ts — keep, enhance
animator/ui/src/render/viewport.ts — keep
animator/ui/src/components/EditBar.tsx — NEW
```

## 3.4 Stage Props (React)

```ts
interface StageProps {
  engine: EngineStatus; // ok | loading | error
  tool: string; // 'select' | 'rect' | 'hand' | 'zoom' etc — from App.tsx tool state
  playhead: number; // current frame number 1..duration
  tick: number; // increment on document:changed to force re-render
  notify?: (msg:string)=>void; // toast
  colorPreview?: ColorPreview | null; // live preview from PropertiesPanel
  viewPrefs: ViewPrefs; // from viewPrefs.ts — workArea, grid, rulers etc
}
```

## 3.5 RenderState — Exact

```ts
interface RenderState {
  background: string;
  backgroundAlpha?: number;
  stageW: number;
  stageH: number;
  items: RectItemJson[]; // from evaluate(playhead)
  selectedIds?: number[];
  overlay?: { box: Pt[]; handles: [string,Pt][]; rotateHandle: Pt; center: Pt } | null;
  marquee?: {x,y,w,h} | null;
  previewDelta?: {x,y} | null;
  previewRect?: {x,y,w,h} | null;
  colorPreview?: ColorPreview | null;
  // View flags
  workArea: boolean; // View > Pasteboard — true = gray pasteboard visible
  infiniteCanvas: boolean; // NEW — pasteboard same as stage color — false = gray, true = stage color
  hideEdges: boolean; // View > Hide Edges — true = no selection overlay
  grid: boolean;
  gridSize: number; // px, default 20
  rulers: boolean;
  guides: Guide[]; // NEW — list of guides
  showGuides: boolean; // View > Guides > Show
  snap: SnapFlags; // NEW — snap toggles
  preview: 'full' | 'outline';
}
```

## 3.6 Viewport — Exact Math (already exists, keep)

```ts
interface Viewport {
  zoom: number; // 0.05 .. 10, default 1
  panX: number; // screen px
  panY: number; // screen px
}

function screenToDoc(vp:Viewport, sx:number, sy:number): Pt { return {x:(sx - vp.panX)/vp.zoom, y:(sy - vp.panY)/vp.zoom} }
function docToScreen(vp:Viewport, x:number, y:number): Pt { return {x:x*vp.zoom + vp.panX, y:y*vp.zoom + vp.panY} }
function docRectToScreen(vp:Viewport, r:DocRect): ScreenRect { ... }
function zoomAt(vp:Viewport, sx:number, sy:number, factor:number): Viewport { // zoom centered at screen point }
function panBy(vp:Viewport, dx:number, dy:number): Viewport
function fitViewport(docW:number, docH:number, viewW:number, viewH:number): Viewport { // with 40px padding }
```

**Zoom limits:** min 5% (0.05), max 1000% (10). Beyond clamp.

## 3.7 Stage Readouts (bottom-left overlay)

Current: `tool: select · zoom: 100% · pan: 0,0 · stage: 1920×1080`

Keep, plus add:
- `fps: 24` (from doc)
- `frame: 1/60` (playhead/duration)

## 3.8 Stage Empty State

When no document:
- Centered message: "No document — New (Ctrl+N) / Open (Ctrl+O)"
- Buttons: New, Open, Template Gallery
- Stage canvas hidden or shows placeholder grid

When engine not attached:
- Overlay: "Core not attached" + detail — already exists — keep

## 3.9 Stage Background Editing

- PropertiesPanel Doc tab me background color picker — already exists
- Live preview: `colorPreview.background` override — already exists — keep
- Commit: one command `kineora_set_document_settings({background})` — undoable — keep
- Alpha: future — backgroundAlpha slider 0..100% — when <100%, pasteboard shows through

## 3.10 Stage Size Editing

- PropertiesPanel Doc tab me W/H inputs — already exists
- Behavior: change W/H → document settings command → evaluate → render → export size changes — no content move, upper-left fixed — Adobe behavior
- Toast: "document settings updated" — keep
- Future: Scale Content with Stage checkbox — when true, all content scaled proportionally — deferred for now (P2)

## 3.11 Stage Border & Pasteboard Colors — Constants

```ts
PASTEBOARD_COLOR = '#2b2b2b' // gray surround
PASTEBOARD_COLOR_INFINITE = stage background when infiniteCanvas=true
STAGE_BORDER = '#6a6a6a' // 1px authoring border
GRID_COLOR = 'rgba(120,120,120,0.45)'
RULER_BG = '#1a1a1a'
RULER_TICK = '#555'
RULER_TEXT = '#888'
SELECTION_STROKE = '#0a7cff'
HANDLE_SIZE = 7
HANDLE_HIT_RADIUS = 8 // screen px
```

## 3.12 Stage Context Menu (right-click)

| Item | When | Command | Shortcut |
|------|------|---------|----------|
| Cut | selection exists | edit.cut | Ctrl+X |
| Copy | selection exists | edit.copy | Ctrl+C |
| Paste in Place | clipboard has objects | edit.pasteInPlace | Ctrl+Shift+V |
| Paste in Center | clipboard has objects | edit.pasteCenter | Ctrl+V |
| Delete | selection exists | edit.delete | Del |
| Select All | always | edit.selectAll | Ctrl+A |
| Deselect All | selection exists | edit.deselectAll | Ctrl+Shift+A |
| Arrange → Bring to Front etc | selection exists | arrange.* | Ctrl+Shift+↑/↓ |
| Properties | always | panel.show('properties') | F4 |

Right-click on empty pasteboard: same but Cut/Copy/Delete disabled.

## 3.13 Stage Keyboard — When Stage Focused

| Key | Action | Command |
|-----|--------|---------|
| Del/Backspace | Delete selection | edit.delete |
| Ctrl+A | Select all on active layer unlocked | edit.selectAll |
| Ctrl+Shift+A | Deselect all | edit.deselectAll |
| Esc | Clear selection, or exit transform drag, or exit edit mode (precedence tree) | — |
| Spacebar hold | Temporary Hand tool — pan | view.hand (temp) |
| H | Hand tool | tool.hand |
| V | Selection tool | tool.select |
| R | Rectangle tool | tool.rect |
| Z | Zoom tool | tool.zoom |
| Ctrl+Z / Ctrl+Shift+Z | Undo/Redo | — |
| Arrow keys | Nudge selection 1px, Shift+arrow 10px | move.nudge |

## 3.14 Stage Mouse — Detailed State Machine

**State: Idle, no drag**

- MouseMove: update cursor based on hit-test — if over handle → handle cursor, if over selected object → move cursor, if over empty → default
- MouseDown left:
  - If over handle → enter TransformGesture (scale/rotate)
  - Else if Shift → toggle selection at point
  - Else if hit object → select it + arm MoveGesture
  - Else → arm MarqueeGesture
- MouseDown middle → arm PanGesture
- MouseDown right → show context menu
- Wheel → zoomAt 1.1 factor centered at pointer
- Double-click → fitViewport (or edit symbol if double-click instance — future)

**State: MoveGesture dragging**

- MouseMove: if past drag threshold (3px desktop, 12px touch) → dragging=true, previewDelta = screenDeltaToDoc, scheduleRedraw
- MouseUp: if dragging and delta !=0 → moveSelection(dx,dy) one command, else if not dragging → already selected (no-op)
- Esc / blur / pointercancel → cancel → clear preview

**State: TransformGesture**

- MouseMove: compute scaleFactors or rotationDelta, update pending map, scheduleRedraw
- MouseUp: commit transformSelection(pending)
- Esc → cancel

**State: MarqueeGesture**

- MouseMove: normalizeRect(start, current) → marqueeRef, scheduleRedraw
- MouseUp: if marquee w/h >=1 → selectInRect, else → clear selection (click on empty)
- Esc → cancel

**State: Rect Draw**

- MouseDown when tool=rect → arm RectGesture
- MouseMove past threshold → dragging, previewRect = normalizeRect
- MouseUp: if validRect → drawRect(x,y,w,h, fill)

**State: PanGesture**

- MouseMove: panBy(dx,dy)
- MouseUp: end pan

## 3.15 Stage + Document Settings — Command Wiring

- `drawRect` → `kineora_draw_rect` → Command DrawRect → document:changed → bus → re-render
- `moveSelection` → `kineora_move_selection` → Command Move → document:changed
- `transformSelection` → `kineora_transform_selection` → Command TransformSelection
- `selectAt` / `selectToggleAt` / `selectInRect` → session selection, no command, event selection:changed
- `placeSymbol` / `swapInstance` → symbol commands

All mutations go through MOD-COMMAND — no direct doc write.

## 3.16 Tests for Stage (to be written)

- T-stage-render-order — pasteboard, stage, grid, items, overlay, rulers
- T-stage-zoom-limits — min 5% max 1000%
- T-stage-pan — middle mouse + spacebar drag
- T-stage-fit — double-click fits
- T-stage-move-preview — no engine write during drag
- T-stage-transform-preview — pending map
- T-stage-marquee — selectInRect
- T-stage-empty-click-clears
- T-stage-export-isolation — renderContent has no overlay/pasteboard border
- T-stage-background-alpha — alpha <1 shows pasteboard through

Next: 04_PASTEBOARD.md
