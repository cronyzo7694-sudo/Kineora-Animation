# 06 — VIEWPORT — Zoom / Pan / Rulers / Grid / Guides / Snapping

## 6.1 Viewport — Already Good, Need Polish

Viewport {zoom, panX, panY} — session only, never in doc.

### Zoom

- **In:** Ctrl+= / Ctrl++ / Cmd+=, wheel up, Zoom tool drag up, button — factor *2 or *1.1 wheel — center at mouse or view center
- **Out:** Ctrl+- / Cmd+-, wheel down, Zoom tool Alt+drag — factor /2 or /1.1
- **100%:** Ctrl+1 / Cmd+1 — zoom=1, pan centered? Actually 100% should keep current pan? Adobe: 100% centers? Our impl: pan = (viewW-docW)/2, (viewH-docH)/2 — centers stage — good
- **Fit:** Ctrl+0 / Cmd+0 — fitViewport with 40px padding — good
- **Zoom limits:** 5%..1000% — clamp — prevent 0 or huge
- **Zoom tool (Z):** NEW — drag rect → zoom to rect, click → zoom in 2x, Alt+click → zoom out 2x — for Phase 1 minimal, can defer but spec here

### Pan

- **Hand tool (H):** drag → panBy(dx,dy)
- **Spacebar:** hold Space → temporary Hand — space down → hand cursor, drag → pan, space up → restore previous tool
- **Middle mouse:** button 1 drag → pan — already exists — keep
- **Scrollbars:** no — Adobe has no scrollbars for stage, only pan — keep

### Fit on Resize

- ResizeObserver on stage wrap → refit? Current: initial fit + refit on resize via ResizeObserver — good but should not refit every resize, only initial and when user clicks Fit — keep initial fit, but on window resize keep current zoom/pan? Decision: on wrap resize, keep zoom but adjust pan to keep stage visible? Simplest: keep current viewport, don't auto-fit on resize — only initial fit. Update: remove ResizeObserver auto-fit, only fit on mount and on Fit command.

## 6.2 Rulers

- **Toggle:** View > Rulers Ctrl+R — viewPrefs.rulers bool
- **Render:** top ruler horizontal (x), left ruler vertical (y) — 16px thick — bg #1a1a1a, tick #555, text #888 — already in canvasRenderer drawRulers — good
- **Step:** zoom>=1 → 50px step, else 100px — good
- **Zero:** at stage top-left (0,0) — doc coords — good
- **Future:** ruler units px/in/cm/mm — ruler text shows units — deferred
- **Guide creation:** drag from ruler → new guide — NEW — spec below

## 6.3 Grid

- **Toggle:** View > Grid Ctrl+' — viewPrefs.grid bool
- **Size:** viewPrefs.gridSize number default 20px — future configurable via dialog
- **Render:** drawGrid — lines behind artwork — color rgba(120,120,120,0.45) — good
- **Snap to grid:** future — SnapFlags.grid bool — when true, move/transform/draw snaps to nearest grid intersection
- **Grid as view aid:** never exported — already — good

## 6.4 Guides

### What are Guides?

- Non-printing lines — cyan/magenta — dragged from rulers — can be moved, locked, hidden, snapped to.
- **Storage:** Document? Or view? Adobe: guides are document objects? Actually guides are per-document, saved? In Animate, guides are saved with document? Yes — View > Guides > Lock/Clear. So guides should be part of document? But blueprint says guides are view overlays. Decision: For Phase 1, guides = view prefs (session) not persisted in doc — simpler. Later move to doc model if needed. Spec: store in viewPrefs.guides[] for now, with option to persist in doc later.

```ts
interface Guide {
  id: string; // uuid
  orientation: 'h' | 'v'; // horizontal y=constant, vertical x=constant
  position: number; // doc coord — x for v, y for h
  color?: string; // default #00ffff cyan
  locked?: boolean;
}
```

- **Show/hide:** View > Guides > Show Guides Ctrl+; — viewPrefs.showGuides bool
- **Lock:** View > Guides > Lock Guides Ctrl+Alt+; — when locked, guides cannot be moved
- **Clear:** View > Guides > Clear Guides — removes all
- **Create:** drag from ruler — mousedown on ruler area (16px) → arm guide drag — preview line → mouseup → add guide at position
- **Move:** drag existing guide — hit-test guide line (8px tolerance) → drag → update position
- **Delete:** drag guide back to ruler area → delete, or select guide + Del
- **Render:** in canvasRenderer after grid, before items — lines across stage + pasteboard? Adobe: guides extend across pasteboard. Render as 1px dashed cyan line.
- **Snap to guides:** SnapFlags.guides bool — when true, moving objects snaps to guides

### Implementation Steps Guides

1. Add Guide type to viewPrefs.ts
2. Add guides: Guide[], showGuides, lockGuides to ViewPrefs
3. Update canvasRenderer render() to draw guides if showGuides
4. Update Stage.tsx — hit-test rulers area (top 16px and left 16px) — on mousedown start guide creation
5. Hit-test guides — screen distance <8px
6. Commands: addGuide, moveGuide, deleteGuide, clearGuides — view prefs, no doc command, but undo? View state undo = P2 (workspace view) — no doc undo — simple: no undo for guides for Phase 1
7. Menu items: View > Guides submenu

## 6.5 Snapping

### SnapFlags

```ts
interface SnapFlags {
  objects: boolean; // snap to other objects edges/centers
  grid: boolean;
  guides: boolean;
  pixels: boolean; // snap to pixel boundaries
  align: boolean; // Snap Align — dashed hints to other objects
}
```

- **Toggle:** View > Snapping submenu — each toggle — persisted in viewPrefs
- **Snap Align:** View > Snapping > Snap Align — shows dashed alignment hints when moving object near other objects — e.g., left edge aligns, center aligns
- **Implementation:** SnapEngine — given candidate point, returns nearest snap point + hint lines

```ts
interface SnapResult {
  x?: number; // snapped x
  y?: number; // snapped y
  hints: {x?: number, y?: number, type:'object'|'grid'|'guide'}[];
}

function snapPoint(pt:Pt, flags:SnapFlags, context:{objects:RectItem[], gridSize:number, guides:Guide[], zoom:number}): SnapResult
```

- **Usage:** in Stage.tsx move/transform/draw gestures — before commit, snap the position
- **Visual hints:** draw dashed lines for snap align — in overlay — e.g., vertical dashed line at aligned x
- **For Phase 1 minimal:** implement grid snap only — simplest — objects/guides/pixels deferred to P2

## 6.6 Preview Modes

- **Full:** default — everything anti-aliased
- **Outline:** View > Preview Mode > Outline — items rendered as outlines only — already flag preview='outline' — in render() base fill transparent stroke #888 — good
- **Fast/Anti-alias:** deferred — for now only Full/Outline

## 6.7 Hide Edges

- **Toggle:** View > Hide Edges Ctrl+Shift+E — viewPrefs.hideEdges bool — when true, selection overlay hidden — so user can edit without seeing highlight — WISH W6 — already flag exists — need UI toggle

## 6.8 Work Area / Pasteboard (from 04)

- Already covered — View > Pasteboard Ctrl+Shift+W

## 6.9 Tests for Viewport

- T-viewport-zoom-in-out — Ctrl+=/- changes zoom *2 /2
- T-viewport-zoom-wheel — wheel up/down 1.1 factor
- T-viewport-pan-hand — Hand drag pans
- T-viewport-pan-space — Space hold temporary hand
- T-viewport-fit — Ctrl+0 fits with padding
- T-viewport-rulers-toggle — Ctrl+R shows/hides rulers
- T-viewport-grid-toggle — Ctrl+' grid
- T-viewport-guides-create — drag from ruler creates guide
- T-viewport-guides-move — drag guide moves
- T-viewport-snap-grid — move with grid snap enabled snaps to grid

Next: 07_INTERACTIONS.md — full state machine
