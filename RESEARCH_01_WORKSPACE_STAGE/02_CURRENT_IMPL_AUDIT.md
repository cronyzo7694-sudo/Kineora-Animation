# 02 — CURRENT IMPLEMENTATION AUDIT — Stage / Workspace

> Line-by-line audit of current Kineora code — kya hai, kya kami hai.

## 1. Files Involved

- `animator/ui/src/components/Stage.tsx` — 524 lines — main stage component
- `animator/ui/src/render/canvasRenderer.ts` — 355 lines — render logic
- `animator/ui/src/render/viewport.ts` — viewport math
- `animator/ui/src/components/LayersPanel.tsx` — layers alag panel
- `animator/ui/src/components/TimelineStrip.tsx` — timeline alag panel
- `animator/ui/src/components/PropertiesPanel.tsx` — properties
- `animator/ui/src/viewPrefs.ts` — view flags persistence
- `animator/ui/src/panelLayout.ts` — panel sizes
- `animator/ui/src/App.tsx` — 858 lines — shell

## 2. Stage.tsx Deep Audit

### Good Parts (keep)

- `vpRef` — viewport {zoom, panX, panY} — pure view state, doc ko touch nahi karta — Adobe jaisa
- `scheduleRedraw()` via RAF — dirty-region nahi par throttled redraw — ok for now
- `evaluate(playhead)` — Rust engine se RectItem[] — single source of truth
- `overlayFromStatus()` — selection box + handles from `status.selection_details` — overlay never exported — correct
- Gestures:
  - `panDragRef` — middle mouse (button 1) pan — Adobe me Hand tool + spacebar drag, hamare me middle mouse — acceptable
  - `selectGestureRef` + `previewDelta` — move preview — renderer-only, commit pe `moveSelection()` command — correct (no undo fragmentation)
  - `transformRef` + `pendingRef` — scale/rotate handles — live preview via pending map, commit pe `transformSelection()` one command — correct
  - `marqueeStartRef` + `marqueeRef` — marquee selection — `selectInRect()` — correct
  - `rectGestureRef` + `rectPreviewRef` — rect draw preview — commit pe `drawRect()` — correct
- `onWheel` — zoomAt with factor 1.1 — Adobe jaisa
- `onDoubleClick` — fitViewport — Adobe me double-click Hand tool fits, hamare me stage double-click fits — okay
- `onDrop` — Library drag-drop place/swap — Part 12 §12.2.11/12 — correct
- View prefs — `loadViewPrefs()` — workArea, hideEdges, grid, rulers, preview — from `viewPrefs.ts` — good
- Readouts — zoom, pan, stageW/H — status bar jaisa bottom left me — good

### Gaps / Bugs

1. **Pasteboard fixed** — `PASTEBOARD_COLOR = '#2b2b2b'` hardcoded. Adobe me toggle: View > Pasteboard + infinite canvas (pasteboard same as stage color). Hamare me `workArea` bool se gray hide hota hai par infinite canvas nahi — jab workArea OFF to pura background stage color se fill — Adobe me pasteboard same as stage color ka alag option hai.
2. **Rulers incomplete** — `drawRulers()` sirf numbers 50/100 step pe draw karta hai, drag se guide banana nahi, guide storage nahi, guide snap nahi.
3. **Grid basic** — `drawGrid()` 20px fixed grid, size pref se aata hai par grid snap nahi, grid color hardcoded rgba(120,120,120,0.45)
4. **No Hand tool** — spacebar-drag pan nahi, sirf middle mouse. Adobe me Hand (H) + spacebar temporary hand.
5. **No Zoom tool** — Z tool se drag zoom rect nahi.
6. **No Stage Rotate** — Adobe me R se stage view rotate hota hai (document rotate nahi).
7. **Edit bar missing** — breadcrumb Scene ▸ Symbol + Back button nahi, sirf zoom readout hai.
8. **Properties not tabbed** — Tool/Object/Frame/Doc tabs nahi, sab mixed.
9. **Stage border** — `STAGE_BORDER = '#6a6a6a'` — Adobe me black outline default, hamara gray okay but configurable nahi.
10. **No Outline preview** — `preview` flag hai par outline mode me fill transparent + stroke #888 — okay but UI toggle nahi.
11. **Background alpha** — `backgroundAlpha` support hai (good) par UI me nahi.
12. **No snap engine** — Snapping to objects/grid/guides/pixels nahi, sirf move.
13. **No selection filtering by locked/hidden layers** — `selectAt` me check hai par LayersPanel alag hone se UX kharab.

## 3. canvasRenderer.ts Audit

- `render()` order: pasteboard → stage → grid → items → marquee → previewRect → overlay → rulers — correct Adobe order (1-7 me se 1,2,3,7 cover)
- `renderContent()` / `rasterizeContent()` — export rasterizer — content-only, no overlay, no pasteboard border — correct, REQ-EXP-002
- `ColorPreview` — live preview — renderer-only, never leaks to export — correct
- `outline_color` support — layer outline mode — view aid only, export ignores — correct (F-20-01)
- `HANDLE_SIZE=7`, `HANDLE_HIT_RADIUS=8` — Adobe me 8px handle, hamara similar
- Missing: guides rendering, snap hints, onion skin ghosts, camera border, mask clipping (mask abhi nahi hai)

## 4. LayersPanel + TimelineStrip — Biggest Gap

**Current:**
- LayersPanel — left dock, 200px default, list of layers with eye/lock/outline/name — vertical only
- TimelineStrip — bottom dock, 156px default, frame ruler + playhead + keyframe dots — horizontal only
- Dono alag panels, alag resize handles, alag scroll

**Adobe:**
- Ek hi Timeline panel — left 30% layer list, right 70% frame grid, ek hi horizontal scroll, ek hi vertical scroll, divider drag se layer name width change

**Problem:**
- User ko do jagah dekhna padta hai — layer lock kiya to timeline me pata nahi, frame select kiya to layer panel me pata nahi
- Adobe me eye/lock click directly frame grid ke saamne hota hai — context clear
- Hamare me timeline me layer names duplicate (frontmost-first column) — confusion

**Solution needed:**
- Naya `TimelinePanel.tsx` — merged — left `LayersColumn` + right `FramesGrid` — single component, single scroll sync, divider 6px drag
- LayersPanel ko deprecate ya TimelinePanel ke andar embed

## 5. PropertiesPanel Audit

- Current: fill/stroke/background color, stroke-width, FPS/W/H — ColorField with local draft + onChange + commit on blur/Enter + Esc cancel — correct live preview pattern
- Missing:
  - 4 tabs: Tool/Object/Frame/Doc — abhi sab ek me
  - Doc tab me: Width/Height/Ruler units/FPS/Background — hamare me W/H + fps + background hai, ruler units nahi
  - Frame tab: frame label, tween type, ease — nahi
  - Object tab: x/y/w/h/rotation — hamare me selection_details se overlay me hai par numeric fields nahi
  - Opacity slider always visible — WISH W6 — nahi

## 6. viewPrefs.ts

- Stores: workArea, hideEdges, grid, gridSize, rulers, preview — localStorage — PREFS boundary — correct
- Missing: pasteboard color same as stage toggle, snap flags, guide lock, guide visibility

## 7. App.tsx Shell

- `panelLayout.ts` — `DEFAULT_LAYOUT` — layersW 200, propsW 240, timelineH 156, libraryH 160, debugH 200 — D-5 locked — good
- `distribute()` — sum-aware clamp — no panel zero — good
- `loadWorkspacePrefs()` — corrupt → auto-reset + toast — C-02 — good
- Missing: workspace save/switch UI — only reset — C-02 says save/switch bhi hona chahiye
- Status bar — sirf zoom/pan/stage readout — Adobe me 12 cells — hamare me 3 hi
- Edit bar — `editDepth` state hai par UI me breadcrumb nahi — `nav.back` dead stub tha, ab fixed?

## 8. Summary Gap Table

| Feature | Adobe | Kineora Current | Gap | Priority for 2D animation |
|---------|-------|-----------------|-----|---------------------------|
| Stage rect + bg | Yes | Yes | Minor — border color | P0 |
| Pasteboard gray + toggle | Yes Ctrl+Shift+W | Yes workArea bool | Medium — no infinite canvas option | P1 |
| Infinite canvas | Yes 2017+ | No | Medium | P2 |
| Zoom In/Out/100/Fit | Yes Ctrl+=/-/1/0 | Yes via commands | Minor — no Zoom tool | P0 |
| Pan Hand + Spacebar | Yes H + Space drag | Middle mouse only | Medium — need Space | P0 |
| Rulers + Guides | Yes drag from ruler | Rulers draw only | Major — guides missing | P1 |
| Grid + Snap | Yes configurable | Grid draw only, no snap | Major | P1 |
| Hide Edges | Yes Ctrl+Shift+E | Flag exists, UI toggle missing | Minor | P2 |
| Outline preview | Yes | Flag exists, UI missing | Minor | P2 |
| Layers+Timeline merged | Yes single panel | Separate panels | **CRITICAL** | P0 |
| Properties 4 tabs | Yes Tool/Object/Frame/Doc | Single mixed | **CRITICAL** | P0 |
| Edit bar breadcrumb | Yes | No | Major | P1 |
| Status bar 12 cells | Yes | 3 cells | Minor | P2 |
| Workspace save/switch | Yes | Reset only | Minor | P2 |

## 9. What to Keep, What to Rewrite

**Keep:**
- viewport math (zoomAt, panBy, fitViewport, screenToDoc, docToScreen)
- render order + export rasterizer isolation
- gesture pattern (preview → commit one command)
- viewPrefs localStorage pattern
- evaluate() single source

**Rewrite / New:**
- New `TimelinePanel` merged (Layers + Frames)
- New `EditBar` component
- New `PropertiesTabs` (4 tabs)
- Enhance `canvasRenderer` — guides, snap hints, infinite canvas option
- Enhance `Stage` — spacebar hand, zoom tool, guide creation
- Enhance `viewPrefs` — snap, guides storage

Next: 03_STAGE_DEFINITION.md — exact stage spec
