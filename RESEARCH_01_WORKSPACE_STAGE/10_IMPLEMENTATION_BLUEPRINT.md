# 10 — IMPLEMENTATION BLUEPRINT — Stage / Workspace — No Thinking Needed

> Is file ko padh ke seedha code likhna hai — file paths, types, functions, steps.

## 10.1 File Structure — What to Create / Modify

### NEW FILES

```
animator/ui/src/components/TimelinePanel.tsx — MERGED timeline+layers
animator/ui/src/components/EditBar.tsx — breadcrumb + zoom
animator/ui/src/components/PropertiesTabs.tsx — 4 tabs wrapper (or enhance PropertiesPanel)
animator/ui/src/render/guides.ts — Guide type + render + hit-test + snap
animator/ui/src/render/snapEngine.ts — snap logic (grid only Phase 1)
animator/ui/src/hooks/useSpacebarHand.ts — temporary hand hook
```

### MODIFY FILES

```
animator/ui/src/components/Stage.tsx — add spacebar hand, guide creation, snap, rulers hit-test
animator/ui/src/render/canvasRenderer.ts — add infiniteCanvas, guides render, snap hints
animator/ui/src/viewPrefs.ts — add infiniteCanvas, guides, showGuides, lockGuides, snap, layersColumnW, rowHeight
animator/ui/src/panelLayout.ts — add layersColumnW to PanelLayout
animator/ui/src/workspace.ts — add layersColumnW, rowHeight to prefs
animator/ui/src/components/MenuBar.tsx — add View submenu items
animator/ui/src/commands.ts — add view.* commands, tool.* commands
animator/ui/src/menus.ts — add menu definitions
animator/ui/src/shortcuts.ts — add shortcuts Ctrl+Shift+W, Ctrl+R, Ctrl+', Ctrl+;, H, Z, V, R, Space
animator/ui/src/App.tsx — replace LayersPanel+TimelineStrip with TimelinePanel, add EditBar
animator/ui/src/components/PropertiesPanel.tsx — add tabs Tool/Object/Frame/Doc, add opacity slider, x/y/w/h fields
```

### DEPRECATE (keep but not rendered)

```
animator/ui/src/components/LayersPanel.tsx — keep for ref, not used
animator/ui/src/components/TimelineStrip.tsx — keep for ref, not used
```

## 10.2 Types — Exact TS

### viewPrefs.ts — Enhanced

```ts
export interface Guide {
  id: string;
  orientation: 'h'|'v';
  position: number;
  color?: string;
  locked?: boolean;
}

export interface SnapFlags {
  objects: boolean;
  grid: boolean;
  guides: boolean;
  pixels: boolean;
  align: boolean;
}

export interface ViewPrefs {
  workArea: boolean;
  infiniteCanvas: boolean;
  rulers: boolean;
  grid: boolean;
  gridSize: number;
  showGuides: boolean;
  lockGuides: boolean;
  guides: Guide[];
  hideEdges: boolean;
  preview: 'full'|'outline';
  snap: SnapFlags;
  layersColumnW: number;
  rowHeight: 'short'|'medium'|'tall';
}

export const DEFAULT_VIEW_PREFS: ViewPrefs = {
  workArea: true,
  infiniteCanvas: false,
  rulers: false,
  grid: false,
  gridSize: 20,
  showGuides: true,
  lockGuides: false,
  guides: [],
  hideEdges: false,
  preview: 'full',
  snap: {objects:false, grid:false, guides:true, pixels:false, align:true},
  layersColumnW: 200,
  rowHeight: 'medium',
};
```

### guides.ts — NEW

```ts
export function renderGuides(ctx:CanvasRenderingContext2D, vp:Viewport, guides:Guide[], show:boolean, stageW:number, stageH:number, viewW:number, viewH:number)
export function hitTestGuides(guides:Guide[], docPt:Pt, vp:Viewport, tolerance:number): Guide|null
export function hitTestRuler(sx:number, sy:number, viewW:number, viewH:number): 'h'|'v'|null // 16px ruler area
```

### snapEngine.ts — NEW (Phase 1 grid only)

```ts
export interface SnapResult {x?:number, y?:number, hints:{x?:number,y?:number}[]}
export function snapToGrid(pt:Pt, gridSize:number): Pt
export function snapPoint(pt:Pt, prefs:ViewPrefs): SnapResult
```

### panelLayout.ts — Enhanced

```ts
export interface PanelLayout {
  layersW: number; // legacy, keep 200
  propsW: number;
  timelineH: number;
  libraryH: number;
  debugH: number;
  layersColumnW: number; // NEW default 200
}
export const DEFAULT_LAYOUT: PanelLayout = {
  layersW: 200,
  propsW: 240,
  timelineH: 200, // increased from 156 for merged panel
  libraryH: 160,
  debugH: 200,
  layersColumnW: 200,
};
```

## 10.3 Stage.tsx — Changes

1. Import useSpacebarHand hook — on Space down, save prev tool, set tool=hand, on Space up restore
2. Import guides hit-test — in onMouseDown, check if hitTestRuler(sx,sy) → arm guide creation
3. Check hitTestGuides — if hit guide and not locked → arm guide move
4. In move/transform gestures, apply snapToGrid if snap.grid enabled
5. Add infiniteCanvas to RenderState
6. Add guides to RenderState
7. Keep existing gestures

## 10.4 TimelinePanel.tsx — NEW — Skeleton

```tsx
export function TimelinePanel({engine, playhead, tick, notify}:Props){
  const [layersColumnW, setLayersColumnW] = useState(loadViewPrefs().layersColumnW);
  const [rowHeight, setRowHeight] = useState(loadViewPrefs().rowHeight);
  const status = statusJson();
  const layers = status?.layers ?? [];
  const duration = status?.duration ?? 60;

  // resize divider
  const onDividerMouseDown = (e:React.MouseEvent)=>{
    const startX=e.clientX, startW=layersColumnW;
    const move=(ev:MouseEvent)=>{
      const newW = Math.min(480, Math.max(140, startW + (ev.clientX-startX)));
      setLayersColumnW(newW);
    };
    const up=()=>{
      saveViewPrefs({layersColumnW});
      window.removeEventListener('mousemove',move);
      window.removeEventListener('mouseup',up);
    };
    window.addEventListener('mousemove',move);
    window.addEventListener('mouseup',up);
  };

  return (
    <div style={{height: layout.timelineH, display:'flex', flexDirection:'column', background:'#1e1e1e', borderTop:'1px solid #333'}}>
      <div style={{display:'flex', height:28, alignItems:'center', padding:'0 8px', gap:8, borderBottom:'1px solid #333'}}>
        <button>🧅 Onion</button>
        <button>⦿ Center</button>
        <button>▶ Play</button>
        <span>Frame {playhead}/{duration}</span>
        <div style={{flex:1}}/>
        <button>☰</button>
      </div>
      <div style={{display:'flex', flex:1, overflow:'hidden'}}>
        {/* LayersColumn */}
        <div style={{width:layersColumnW, overflowY:'auto', borderRight:'1px solid #333'}}>
          <div style={{display:'flex', fontSize:11, color:'#888', padding:'4px 8px', borderBottom:'1px solid #333'}}>
            <span style={{width:24}}>👁</span><span style={{width:24}}>🔒</span><span style={{width:24}}>◻</span><span>Name</span>
          </div>
          {layers.map(l=>(
            <div key={l.id} style={{display:'flex', alignItems:'center', height: rowHeight==='short'?18:rowHeight==='tall'?32:24, padding:'0 8px', background: activeLayerId===l.id?'#333':'transparent'}}>
              <span onClick={()=>toggleVisibility(l.id)}>{l.visible?'👁':'🚫'}</span>
              <span onClick={()=>toggleLock(l.id)}>{l.locked?'🔒':'🔓'}</span>
              <span>{l.name}</span>
            </div>
          ))}
        </div>
        <div onMouseDown={onDividerMouseDown} style={{width:6, cursor:'col-resize', background:'#2a2a2a'}}/>
        {/* FramesGrid */}
        <div style={{flex:1, overflow:'auto', position:'relative'}}>
          {/* Ruler */}
          <div style={{height:20, display:'flex', borderBottom:'1px solid #333'}}>
            {Array.from({length: duration}, (_,i)=>(
              <div key={i} style={{width:12, fontSize:10, color:'#888', textAlign:'center'}}>{(i+1)%5===0?i+1:''}</div>
            ))}
          </div>
          {/* Cells */}
          {layers.map(l=>(
            <div key={l.id} style={{display:'flex', height: rowHeight==='short'?18:rowHeight==='tall'?32:24, borderBottom:'1px solid #222'}}>
              {Array.from({length: duration}, (_,f)=>(
                <div key={f} style={{width:12, borderRight:'1px solid #222', background: isKeyframe(l,f)?'#0a7cff':''}}/>
              ))}
            </div>
          ))}
          {/* Playhead */}
          <div style={{position:'absolute', left: playhead*12, top:0, bottom:0, width:1, background:'red'}}/>
        </div>
      </div>
    </div>
  );
}
```

This is skeleton — real implementation copies logic from TimelineStrip + LayersPanel.

## 10.5 EditBar.tsx — NEW

```tsx
export function EditBar({editDepth, breadcrumb, onBack, onJump, zoom, onZoomChange}){
  if(editDepth===0) return (
    <div style={{height:28, background:'#1e1e1e', display:'flex', alignItems:'center', padding:'0 8px', borderBottom:'1px solid #333'}}>
      <span>Scene 1</span>
      <div style={{flex:1}}/>
      <select value={zoom} onChange={e=>onZoomChange(e.target.value)}>
        <option>25%</option><option>50%</option><option>100%</option><option>200%</option><option>Fit</option>
      </select>
    </div>
  );
  return (
    <div style={{height:28, background:'#1e1e1e', display:'flex', alignItems:'center', padding:'0 8px', gap:8}}>
      <button onClick={onBack}>← Back</button>
      <span>{breadcrumb.join(' ▸ ')}</span>
    </div>
  );
}
```

## 10.6 Commands — Add in commands.ts

```ts
export const viewCommands = {
  'view.zoomIn': { label:'Zoom In', shortcut:'Ctrl+=', run: ()=>stageViewController.current?.zoomIn() },
  'view.zoomOut': { label:'Zoom Out', shortcut:'Ctrl+-', run: ()=>stageViewController.current?.zoomOut() },
  'view.zoom100': { label:'100%', shortcut:'Ctrl+1', run: ()=>stageViewController.current?.zoom100() },
  'view.zoomFit': { label:'Fit in Window', shortcut:'Ctrl+0', run: ()=>stageViewController.current?.zoomFit() },
  'view.toggleWorkArea': { label:'Pasteboard', shortcut:'Ctrl+Shift+W', run: ()=>{ const p=loadViewPrefs(); saveViewPrefs({workArea:!p.workArea}); notify(`Pasteboard ${!p.workArea?'shown':'hidden'}`); } },
  'view.toggleRulers': { label:'Rulers', shortcut:'Ctrl+R', run: ()=>{...} },
  // etc
};
```

## 10.7 Implementation Order — Step by Step

**Step 1 — ViewPrefs Enhance (1 hour)**
- Modify viewPrefs.ts — add infiniteCanvas, guides, snap, layersColumnW, rowHeight — DEFAULT — load/save — migration for old prefs (if missing fields, add defaults)
- Test: loadViewPrefs returns defaults, save persists

**Step 2 — CanvasRenderer Enhance (2 hours)**
- Add infiniteCanvas logic in render()
- Add renderGuides() — draw guides if showGuides
- Add snap hints rendering (dashed lines) — future
- Test: T-pasteboard-infinite, T-guides-render

**Step 3 — Guides Module (2 hours)**
- Create guides.ts — hit-test, render
- Test: hitTestGuides, hitTestRuler

**Step 4 — SnapEngine (1 hour)**
- Create snapEngine.ts — grid snap only Phase 1
- Test: snapToGrid

**Step 5 — Stage Enhance (2 hours)**
- Add spacebar hand hook — useSpacebarHand.ts
- Add ruler hit-test → guide creation
- Add guide hit-test → move/delete
- Add snap to move/transform
- Add infiniteCanvas to RenderState

**Step 6 — TimelinePanel Merged (4 hours) — CRITICAL**
- Create TimelinePanel.tsx — skeleton above + copy logic from existing TimelineStrip + LayersPanel
- LayersColumn: eye/lock/outline/name, double-click rename, drag reorder
- FramesGrid: ruler, playhead, cells, frame selection, F5/F6/F7
- Divider resize with persist
- Sync vertical scroll
- Replace in App.tsx — remove old panels from layout but keep files
- Test: merged render, resize, eye toggle, frame click

**Step 7 — EditBar (1 hour)**
- Create EditBar.tsx — breadcrumb + zoom dropdown
- Add to App.tsx above Stage
- Wire editDepth from App.tsx state

**Step 8 — Properties Tabs (2 hours)**
- Enhance PropertiesPanel — add tabs state — Tool/Object/Frame/Doc
- Tool tab: show active tool options (for now just tool name)
- Object tab: x/y/w/h/rotation/fill/stroke/opacity — numeric fields + ColorField
- Frame tab: label input, tween type (future)
- Doc tab: W/H/FPS/BG — existing fields move here
- Test: tab switch, numeric commit, color live preview

**Step 9 — Menu & Shortcuts (1 hour)**
- Add View submenu items in MenuBar
- Add commands in commands.ts
- Add shortcuts in shortcuts.ts — Ctrl+Shift+W, Ctrl+R, etc
- Test: shortcuts trigger

**Step 10 — Integration & Polish (2 hours)**
- App.tsx layout — Tools 60px, Stage flex:1, Properties 240px, TimelinePanel bottom 200px, EditBar top
- Status bar enhanced — frame, fps, zoom, saving
- Workspace prefs — layersColumnW, rowHeight persisted
- Manual test checklist from 03_STAGE_DEFINITION §3.14

Total estimated: 18 hours for full stage/workspace — Phase 1 minimal 2D animation ready.

## 10.8 Manual Test Checklist — After Implementation

| # | Action | Expect |
|---|--------|--------|
| 1 | Open app, no doc | Empty state with New/Open buttons |
| 2 | New doc 1920x1080 | Stage white, pasteboard gray #2b2b2b, border #6a6a6a |
| 3 | View > Pasteboard Ctrl+Shift+W | Gray toggles off, whole view stage bg |
| 4 | View > Infinite Canvas | Pasteboard same as stage bg — infinite feel |
| 5 | Zoom In Ctrl+= | Zoom *2 centered |
| 6 | Wheel up/down | Zoom 1.1 factor at pointer |
| 7 | Middle drag | Pan |
| 8 | Space hold drag | Pan (temp hand) |
| 9 | Double-click stage | Fit in Window |
| 10 | View > Rulers Ctrl+R | Rulers show top/left 16px |
| 11 | Drag from ruler | Guide created cyan line |
| 12 | Drag guide | Moves, snap? |
| 13 | Drag guide to ruler | Deletes |
| 14 | View > Grid Ctrl+' | Grid shows 20px |
| 15 | Draw rect on stage | Rect appears, selectable |
| 16 | Draw rect on pasteboard | Allowed, visible, export clipped |
| 17 | Move rect outside stage | Allowed, export clipped |
| 18 | TimelinePanel visible | Left layers, right frames, divider resizable |
| 19 | Eye click | Layer hides, not in export |
| 20 | Lock click | Layer locked, draw blocked toast |
| 21 | Double-click layer name | Inline rename, Enter commits |
| 22 | Drag layer row | Reorders, render order changes |
| 23 | Frame ruler click 10 | Playhead jumps to 10 |
| 24 | F6 at frame 10 | Keyframe dot appears |
| 25 | Properties tabs | Tool/Object/Frame/Doc tabs switch |
| 26 | Select rect, Object tab | x/y/w/h/fill/stroke/opacity editable |
| 27 | Change fill color drag | Live preview, no engine write during drag, commit on release one undo |
| 28 | Doc tab W/H change | Stage size changes, no content move |
| 29 | EditBar | Scene 1 shown, zoom dropdown works |
| 30 | Status bar | Frame 1/60, fps, zoom, pan, stage size |

## 10.9 What NOT to Do in This Phase

- No camera
- No onion skin
- No shape tween
- No brush tool
- No text tool
- No export beyond current SVG/PNG (already works)
- No layer parenting (future)
- No folder nesting (keep flat for Phase 1)
- No guide persistence in doc (view prefs only)

## 10.10 Next Research

After Stage complete, next research folders:

- RESEARCH_02_TOOLS — brushes, fill, eyedropper, etc
- RESEARCH_03_PROPERTIES — full properties system
- RESEARCH_04_TIMELINE — full timeline (old → Adobe-like with tween spans)
- RESEARCH_05_LAYERS — folders, masks, parenting
- RESEARCH_06_EXPORT — camera + export

But for now Stage is foundation.

---

## READY FOR CODING?

This blueprint has zero ambiguity — har file, har type, har interaction defined hai. Ab code likhna shuru kar sakte hain.

**Bol "continue" aur main agla research (TOOLS) shuru karunga, ya bol "code shuru kar" aur main TimelinePanel + EditBar + viewPrefs enhance code likhna shuru karunga isi workspace me.**

