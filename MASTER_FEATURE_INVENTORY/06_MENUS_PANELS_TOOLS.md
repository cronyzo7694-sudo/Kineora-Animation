# §4–§9: MENU TREE · PANEL TREE · TOOL TREE · TIMELINE TREE · SYMBOL/LIBRARY TREE · PROPERTY TREE

---

## 4. MENU TREE  [Part 01 §1.2 · C-03]

### 4.1 File
New… (Ctrl+N) · New from Template · Open / Open Recent (Ctrl+O) · Open from Libraries (Ctrl+Shift+O) · Close / Close All (Ctrl+W) · Save (Ctrl+S) · Save As (Ctrl+Shift+S) · Save as Template · **Import ▸** (to Stage Ctrl+R / to Library Ctrl+I / Open External Library) · **Export ▸** (Image / Video / Animated GIF / Movie / PNG-Sequence; Ctrl+Shift+R) · Publish Settings (Ctrl+Shift+F12) · Publish (Shift+Alt+F12) · Publish Profiles · AIR Settings (legacy) · Print / Page Setup (Ctrl+P) · Exit (Ctrl+Q)

### 4.2 Edit
Undo (Ctrl+Z) · Redo (Ctrl+Shift+Z / Ctrl+Y) · **History** · Cut (Ctrl+X) · Copy (Ctrl+C) · Paste in Center (Ctrl+V) · Paste in Place (Ctrl+Shift+V) · Paste Special (Ctrl+Shift+Alt+V) · Duplicate (Ctrl+D) · Select All (Ctrl+A) · Deselect All (Ctrl+Shift+A) · Find and Replace (Ctrl+F) · **Timeline ▸** (Cut/Copy/Paste/Clear/Remove Frames · Select All Frames · Copy/Paste Motion · Reverse Frames) · **Edit Symbols / Edit Selected / Edit in Place / Edit All** (Ctrl+E) · Preferences (Ctrl+U) · Keyboard Shortcuts (Ctrl+Shift+Alt+K) · Toolbars

### 4.3 View
**Go To ▸** First/Previous/Next/Last (Home/Ctrl+←/Ctrl+→/End) · Zoom In (Ctrl+=) · Zoom Out (Ctrl+−) · Magnification · Fit in Window (Ctrl+0) · 100% (Ctrl+1) · **Preview Mode ▸** Full/Fast/Anti-alias/Outline · Work Area (Ctrl+Shift+W) · Pasteboard color · Rulers (Ctrl+Shift+Alt+R) · Grid (Ctrl+') · Guides (Ctrl+;) · **Snapping ▸** to Objects (Ctrl+Shift+/) / Grid / Guides / Pixels · Snap Align · Hide Edges (Ctrl+Shift+E) · Show Shape Hints (Ctrl+Alt+H)

### 4.4 Insert
New Symbol… (Ctrl+F8) · **Timeline ▸** Frame (F5) / Keyframe (F6) / Blank Keyframe (F7) · Motion Tween · Classic Tween · Shape Tween · Scene

### 4.5 Modify
Document… (Ctrl+J) · Convert to Symbol… (F8) · Break Apart (Ctrl+B) · **Bitmap ▸** Swap Bitmap / Trace Bitmap · **Symbol ▸** Swap Symbol / Duplicate Symbol · **Shape ▸** Convert Lines to Fills / Expand Fill / Soften Fill Edges / Smooth / Straighten / Optimize (Ctrl+Shift+Alt+C) / Add Shape Hint (Ctrl+Shift+H) / Remove All Hints · **Combine Objects ▸** Union / Intersect / Punch / Crop · **Timeline ▸** Layer Properties / Reverse Frames / Synchronize Symbols / Convert to Keyframes / Convert to Blank Keyframes / Distribute to Layers / Distribute to Keyframes · **Transform ▸** Free Transform / Distort / Envelope / Scale / Rotate and Skew / Scale and Rotate… (Ctrl+Alt+S) / Rotate 90° CW (Ctrl+Shift+9) / Rotate 90° CCW (Ctrl+Shift+7) / Flip Vertical / Flip Horizontal / Remove Transform · **Arrange ▸** Bring to Front (Ctrl+Shift+↑) / Bring Forward (Ctrl+↑) / Send Backward (Ctrl+↓) / Send to Back (Ctrl+Shift+↓) / Lock / Unlock All · Align (Ctrl+K) · Group (Ctrl+G) · Ungroup (Ctrl+Shift+G)

### 4.6 Text
Font · Size · Style (Bold/Italic) · Align (L/C/R/Justify) · Letter Spacing · Line Spacing · Embed Fonts · (legacy TLF Text)

### 4.7 Commands
Manage Saved Commands / Run Command · Copy Motion as XML / Export Motion XML / Import Motion XML (ours = JSON) · Convert AS3 to HTML5 Canvas · Run JSFL / scripting (ours = plugin/script API [W13])

### 4.8 Control
Play (Enter) · Rewind (Ctrl+Alt+R) · Go To End · Step Forward One Frame (`.`) · Step Backward (`,`) · Test Movie / Test Scene / Test HTML (Ctrl+Enter) · Mute Sounds · Loop Playback · Enable Live Preview · Enable Simple Buttons

### 4.9 Debug (legacy AS3) — breakpoints/step/watch. Historical; ours = built-in inspector (P2).

### 4.10 Window — every panel toggle + Workspaces submenu.

### 4.11 Help — docs, tutorials, shortcut viewer, about/version.

---

## 5. PANEL TREE  [Part 01 §1.3/§1.10–1.13 · C-06 · C-08..12]

Every panel declares: id/title/icon/defaultDock/min-max size/resizable edges/dock/float/collapse/close/reopen (Window + Cmd+K)/remembered size/app-prefs/mobile.

| Panel | Min size | Key controls |
|---|---|---|
| **Tools** | 44×N | tool buttons (4 sections) + Options area + Color chips |
| **Timeline** | min-h 96px, max 60% | layer rows + frame ruler + playhead + onion + transport |
| **Properties** | 240×320 | context chip + schema sections + swap/frame-picker/lip-sync/filter/ease/embed |
| **Library** | 240×320 | asset list + preview + search + new/delete/folders + use-count |
| **Color** | — | fill/stroke chips + swap/b&w/no-color + fill type + gradient stops + picker |
| **Swatches** | — | swatch grid + add + folders + import/export |
| **Align** | — | 6 align + 6 distribute + match-size + even-gap + stage/selection toggle |
| **Transform** | — | X/Y/W/H/Rotate/Skew + constrain + reset |
| **Info** | — | W/H/X/Y + RGB(A) + pointer position + reg/transform toggle |
| **Scene** | — | scene list + add/duplicate/delete/rename/reorder + tabs |
| **Components** | — | widget library (movie clip + param schema) [P2] |
| **Actions** | — | code editor + syntax coloring + code hints + find/replace + pinned scripts + Code Snippets (ours = behavior/event graph P1 + script layer P2) |
| **Output** | — | build/test/publish log + trace() (ours = build log panel) |
| **Motion Editor** | — | graph editor for tween curves + easing presets [W4] |
| **Frame Picker** | — | visual per-frame browser of a graphic symbol |
| **Layer Depth** | — | per-layer z-depth (camera parallax) |
| **Brush Library** | — | art/pattern brushes |
| **Movie Explorer** | — | hierarchical doc outline (layers/symbols/instances/actions) |
| **History** | — | undoable step list (jump to step) |

---

## 6. TOOL TREE  [Part 02 · C-13/15/23/24/27]

> 27-field schema per tool. Shortcut + Options in brackets.

```
TOOLS
├── SELECTION & TRANSFORM
│   ├── Selection (V)            [Magnet · Smooth · Straighten]
│   ├── Subselection (A)         [snap]
│   ├── Free Transform (Q)       [Scale · Rotate&Skew · Distort · Envelope]
│   ├── Gradient Transform (F)   [—]
│   ├── 3D Rotation (W)          [global/local]  LEGACY
│   ├── 3D Translation (G)       [global/local]  LEGACY
│   └── Lasso (L)                [Polygon Mode · Magic Wand Mode · Threshold 0–200 · Smoothing]
├── DRAWING
│   ├── Pen (P)                  [snap · Show Preview · magnet] + Add/Delete/Convert anchor sub-tools
│   ├── Text (T)                 [—]
│   ├── Line (N)                 [snap · drawing mode · length/angle HUD]
│   ├── Rectangle (R)            [corner radius · snap · drawing mode]
│   ├── Oval (O)                 [start/end angle · inner radius · close · snap · mode]
│   ├── Rectangle Primitive (R)  [radius (parametric)]
│   ├── Oval Primitive (O)       [angles/hole (parametric)]
│   └── PolyStar                 [Style Polygon|Star · Sides 3–32 · Star Point Size 0–1]
├── PAINTING
│   ├── Pencil (Shift+Y)         [Straighten · Smooth · Ink · smoothing slider · snap]
│   ├── Brush (B)                [5 modes · Size · Shape · Lock Fill · Pressure/Tilt]
│   ├── Paint Brush (Y)          [Stroke Style · Art/Pattern options · spacing · corners]
│   ├── Fluid Brush              LEGACY/REMOVED
│   ├── Eraser (E)               [5 modes · Shape round/square · Faucet · Size]
│   └── Width (U)                [width points · asymmetric · profiles]
├── UTILITY / VIEW / RIGGING / CAMERA
│   ├── Eyedropper (I)           [fill only · stroke only · both]
│   ├── Paint Bucket (K)         [Gap Size · Lock Fill]
│   ├── Ink Bottle (S)           [—]
│   ├── Hand (H)                 [—]
│   ├── Zoom (Z)                 [In/Out]
│   ├── Stage Rotate (Shift+H)   [reset]
│   ├── Time Scrubber (Shift+Alt+H) [—]
│   ├── Bone (M)                 [constraints via Properties]
│   ├── Bind (sub-tool)          [—]
│   ├── Camera (C)               [zoom/rotate sliders · reset]
│   └── Asset Warp               [Rigid · Flexible · Envelope · add/remove pin · reset]
└── (LEGACY: Deco (U) · Spray Brush)
```

---

## 7. TIMELINE TREE  [Part 07 · C-08 · REQ-TIM]

```
TIMELINE
├── LEFT — Layer list (columns L→R)
│   ├── 1 Visibility (eye)      [Alt=others · drag=multiple · Shift=transparent]
│   ├── 2 Lock (padlock)        [Alt=others]
│   ├── 3 Outline (square)      [Alt=others]
│   ├── 4 Name                  [dbl-click rename]
│   ├── 5 Type icon             [dbl-click = Layer Properties]
│   ├── 6 Attach-to-camera dot  [camera enabled]
│   └── 7 z-depth               [advanced layers]
├── RIGHT — Frame grid
│   ├── Frame ruler/header      [numbered · click=jump · drag=scrub · onion markers]
│   ├── Playhead                [red line+handle · drag=scrub · click=jump · dbl-click=column]
│   └── Frame cells             [solid dot · hollow dot · gray · white · hollow-rect · blue · blue+arrow · green · green+diamond · dashed · flag · "a"]
├── BOTTOM — Onion + transport
│   ├── Onion Skin (O) · Onion Outlines (Shift+O) · Edit Multiple (Alt+O) · Modify Markers · markers · tint · opacity
│   ├── Center Frame · Loop playback · Mute
│   └── Status readout         [frame · fps · elapsed]
├── LAYER OPS: + layer · + folder · delete · duplicate · reorder(drag) · rename · type · properties
├── FRAME OPS:
│   ├── Insert Frame (F5) · Insert Keyframe (F6) · Insert Blank Keyframe (F7)
│   ├── Delete Frame (Shift+F5) · Clear Keyframe (Shift+F6) · Remove Frames (gap)
│   ├── Copy/Cut/Paste/Duplicate/Move Frames
│   ├── Reverse Frames · Extend/Shorten (span drag) · Convert to Keyframes/Blank
│   ├── Distribute to Layers/Keyframes · Synchronize Symbols
│   └── Tween: Motion · Classic · Shape · Insert Pose
└── TIMELINE MENU (hamburger): span-based selection toggle · row height · cell colors · onion defaults
```

---

## 8. SYMBOL / LIBRARY TREE  [Parts 11–12 · C-10/C-21]

```
SYMBOLS
├── TYPES: Graphic (parent-driven) · Movie Clip (independent clock) · Button (Up/Over/Down/Hit) · Font (niche, P3)
├── CONVERT TO SYMBOL (F8) — dialog: Name · Type · Registration (9-grid)
├── EDIT MODES: Symbol edit · Edit in Place · Edit in New Window · Edit Selected/All · breadcrumb · Back · Esc(1 level)/Ctrl+Enter(root)
├── GRAPHIC LOOP: Loop · Play Once · Single Frame · First frame · Frame Picker
├── INSTANCE PROPS: transform · color effect (none/brightness/tint/alpha/advanced) · filters (7 types) · loop · instance name
├── OPS: Swap Symbol · Duplicate Symbol · Break Apart (1 level) · registration edit
└── NESTING: graphic-sync vs clip-free · live nested-preview toggle

LIBRARY
├── ASSET LIST: rows (icon+name+kind+use-count) · linkage (legacy)
├── PREVIEW: symbol anim (scrub) · sound waveform+play · bitmap thumb · button clickable
├── SEARCH: substring (name+kind) · scope (all/folder)
├── BUTTONS: New Symbol (Ctrl+F8) · New Folder · Properties (i) · Delete (trash) · Sort/view
├── OPS: Import · Create · Rename · Duplicate · Delete (+unused-only) · Folders · Export asset · Reuse (drag→stage) · Swap (drag→instance) · Update instances · Open external library
└── STATES: empty · asset-selected · delete-in-use (confirm modal) · search-active · mobile grid
```

---

## 9. PROPERTY TREE  [Part 26 · C-09 · REQ-PRP]

```
PROPERTIES (context precedence: tool > selection > frame > document)
├── DOCUMENT: Width · Height · Ruler units · fps · Background(+alpha) · Auto-save · Platform · Publish profile · Title/description/author
├── SHAPE: X/Y (reg/transform toggle) · W/H (constrain) · Fill (chip+alpha+type+stops+bitmap+tile) · Stroke (chip+alpha+width+style+cap+join+miter+profile) · Fill rule · Corner radius / angles / sides
├── GROUP: X/Y/W/H · type badge · edit hint · Break Apart
├── INSTANCE: symbol name + Swap · instance type + name · Color effect · Blending · Filters · Loop (graphic) + Frame Picker · Tracking (button) · Lip Syncing (graphic+audio)
├── TEXT: type · content · family/size/color/alpha/bold/italic/underline · align · letter/line spacing · kern · AA · selectable · embed · border/max-chars · X/Y/W/H
├── FRAME/TWEEN: label (name/comment/anchor) · sound (asset/sync/loop/trim/effect) · actions · classic(ease/rotate/orient/snap/sync/scale) · shape(ease/blend/hints) · motion(ease/rotation/view-keys) · pose(type/bones)
├── CAMERA: X/Y/Z · Zoom% · Rotation° · tint · filters · reset each
├── AUDIO: asset · sync · loop · effect · trim · volume · envelope
├── BONE: length · rotation(min/max/enable) · translation(x/y) · speed · spring · Parent/Child/Next/Prev
├── WARP: mode · envelope · add/remove handle · reset · pin position
└── MIXED: X/Y/W/H only + "mixed" badge
```
