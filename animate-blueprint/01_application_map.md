# PART 01 — COMPLETE APPLICATION MAP
### The full architecture of a professional 2D animation editor, mapped from Adobe Animate's documented capabilities — so a new, original application can be built from scratch.

---

## 1.0 The core mental model (read this first)

Adobe Animate (originally Macromedia Flash, later Flash Professional, branded "Animate CC" 2015–2019, now "Adobe Animate") is built on **four data pillars** that every other feature composes from:

| Pillar | Meaning | Where detailed |
|---|---|---|
| **Frame** | A single time-slot on a single layer. Can be a *keyframe* (stores content), a *static/held frame* (repeats the previous keyframe), a *blank keyframe* (empty but explicit), a *tween span* (interpolated), or *empty*. | Part 07, 08 |
| **Layer** | A horizontal strip of frames with a stacking order (top = frontmost on stage). Types: normal, folder, mask, masked, guide, motion-guide, pose (IK), camera, tween. | Part 20 |
| **Symbol** | A reusable, self-contained timeline (graphic / movie clip / button / font). Symbols are the unit of reuse and nesting. An **instance** is a placed copy. | Part 11 |
| **Tween** | A stored rule that interpolates values between keyframes (motion, classic, shape). | Part 09 |

A **document** = ordered list of **scenes**; each scene = a **main timeline** (layer stack × frames) + a **library** (all symbols/assets) shared document-wide.

Everything else — tools, panels, menus — is a *view or controller* over these four data types. If your data model gets these right (Part 33), every feature follows.

**Key structural insight for the new app:** an Adobe Animate document is a **tree of timelines**. The main timeline can contain instances of symbols; each symbol contains its own timeline; those can contain nested instances. Animation "plays" by recursively sampling the tree at time `t`. This one fact explains nested animation, graphic-vs-movie-clip sync, and the edit-bar breadcrumb. Our original app adopts this exact concept (it is a functional concept, not Adobe IP).

---

## 1.1 Application shell & window anatomy

A running instance is a **single-window, multi-panel** document editor.

### 1.1.1 Regions of the default "Essentials" workspace

| Region | Position | Contents | Live behavior |
|---|---|---|---|
| Menu bar | Top edge | File, Edit, View, Insert, Modify, Text, Commands, Control, Debug, Window, Help | Global, context-independent commands (1.2). |
| Stage | Center | The canvas + gray pasteboard around it | Shows the current frame of the current timeline (scene or symbol) with all visible layers composited. |
| Timeline panel | Bottom (docked) | Layer list + frame ruler + playhead + onion-skin controls | The "clock". Docking it bottom vs. elsewhere is a preference. |
| Tools panel | Left (docked) | Tool buttons, Tool Options, Color modifiers, View tools | Sets the active **tool mode** (1.3). |
| Properties panel | Right (docked) | Contextual inspector | Re-binds its controls to whatever is selected (1.4). |
| Library panel | Right/float | Symbol & asset database | Persistent across the document (Part 12). |
| Other panels | Dockable/floatable | Color, Swatches, Align, Transform, Info, Scene, Components, Actions, Output, Motion Editor, Frame Picker, Layer Depth, Brush Library, Movie Explorer, History | All reachable from Window menu; can be grouped into tab stacks or floated. |
| Edit bar | Above stage | Breadcrumb: `Scene ▸ symbol ▸ nested…` + Back button | Shows edit depth; Back = go up one level (exit symbol edit). |
| Status bar | Bottom | Current frame, fps, elapsed time, workspace switcher, zoom | Read-only status. |

### 1.1.2 Workspaces

- A **workspace** = a saved arrangement of which panels are visible, docked where, and at what size. Default: "Essentials". Users can save/customize ("New Workspace…", "Reset Workspace").
- Panels are **dockable**: drag a panel tab onto another panel's edge to stack; drag to center = tabs; drag out = floating window.
- The workspace system is purely a *UI state* — it never changes document data.

### 1.1.3 Multi-document

- Multiple `.fla` documents can be open in tabs simultaneously (Window > arrange). Each has its own Library, timeline, and panels reflect the **active** document.
- *[WISH W12]* Users explicitly want multiple scenes open — our app supports **tabbed documents AND tabbed scenes** (Part 25).

### 1.1.4 Implementation notes (original app)

- Implement a **panel/dock manager** early: every panel = a component with `id`, `title`, `defaultDock`, `isVisible`, `floatingRect`, `size`. Persist workspace layout to user prefs (JSON), not to the project file.
- A single **event bus** (Part 32) carries `context:changed`, `selection:changed`, `timeline:changed`, `document:changed`, `tool:changed`. Panels subscribe and re-render. **No panel reads another panel directly.**
- Dark/light UI theme: colors are CSS variables/tokens; all panel CSS references tokens, never hard-coded colors.

---

## 1.2 Main menu — complete functional inventory

Every top-level menu, every command group. For each command: **what it does, what data changes, default shortcut (Part 29), mobile equivalent, implementation note.** This is the canonical list of global operations the app must expose.

### 1.2.1 File menu

| Command | Does | Data changed | Shortcut | Mobile equiv. | Implementation |
|---|---|---|---|---|---|
| New… | Create document (choose platform/type, size, fps, color — see 1.7). | New `Document` object | Ctrl+N | New-doc dialog | `Document.create(settings)` |
| New from Template | New doc from a template (banner sizes, character rigs, etc.). | New doc seeded from template | — | Template gallery | Template = preset JSON |
| Open / Open Recent | Load a project. | Replaces active doc (with save prompt) | Ctrl+O | File picker | Deserializer (Part 33) |
| Open from Libraries | Open a `.fla` as an asset library only (import symbols from it). | Adds external lib reference | Ctrl+Shift+O | — | Library linking |
| Close / Close All | Close active/all docs (prompt save). | Removes doc(s) | Ctrl+W | — | — |
| Save / Save As / Save as Template | Persist project. | Serializes doc to project file | Ctrl+S / Ctrl+Shift+S | Auto-save | Serializer (Part 33) |
| Import → Import to Stage / to Library / Open External Library | Bring assets in (Part 27). | Adds library assets + (stage) places instance | Ctrl+R / Ctrl+I | File picker | Importers (Part 27) |
| Export → Export Image / Video / Animated GIF / Movie / PNG-Sequence | Render output (Part 28). | Writes files | Ctrl+Shift+R | Share sheet | Exporters (Part 28) |
| Publish Settings / Publish / Publish Profiles / AIR Settings | Configure & run publish pipeline. | Writes target outputs | Ctrl+Shift+F12 / Shift+Alt+F12 | — | Publish engine |
| Print / Page Setup | Print frames. | — | Ctrl+P | — | Optional |
| Exit | Quit (prompt save). | — | Ctrl+Q | — | — |

### 1.2.2 Edit menu

| Command | Does | Data changed | Shortcut | Notes |
|---|---|---|---|---|
| Undo / Redo | Revert/reapply last operation. | Document state | Ctrl+Z / Ctrl+Shift+Z (Ctrl+Y) | Command-pattern history (Part 36). Every tool action is one undoable command. |
| Cut / Copy | Place selection (objects or frames) on clipboard. | Clipboard | Ctrl+X / Ctrl+C | Clipboard stores full object/frame JSON, not pixels. |
| Paste in Center / Paste in Place / Paste Special | Insert clipboard. Center = stage center; In Place = same coords; Special = options (format). | Adds content to current frame/layer | Ctrl+V / Ctrl+Shift+V / Ctrl+Shift+Alt+V | — |
| Duplicate | Copy+offset the selection. | Adds offset copy | Ctrl+D | — |
| Select All / Deselect All | Select everything on unlocked layers of current timeline / clear selection. | Selection state | Ctrl+A / Ctrl+Shift+A | — |
| Find and Replace | Search/replace text, fonts, colors, symbols, sounds across the doc. | Affected assets | Ctrl+F | — |
| Edit Symbols / Edit Selected / Edit in Place / Edit All | Enter symbol edit modes (Part 11). | Edit-mode state | Ctrl+E | Breadcrumb |
| Timeline submenu → | Cut/Copy/Paste/Clear/Remove Frames; Select All Frames; Copy/Paste Motion; Reverse Frames | Frame data (Part 07) | various | — |
| Preferences / Keyboard Shortcuts / Toolbars | Editor settings. | Prefs JSON | Ctrl+U / Ctrl+Shift+Alt+K | — |

### 1.2.3 View menu

| Command | Does | Data changed | Shortcut |
|---|---|---|---|
| Go To → First/Previous/Next/Last | Move playhead. | Playhead position | Home / Ctrl+← / Ctrl+→ / End |
| Zoom In / Zoom Out / Magnification / Fit in Window / 100% | Viewport scale (never content). | View state | Ctrl+= / Ctrl+- / Ctrl+1 |
| Preview Mode → Full / Fast / Anti-alias / Outline | Render-quality trade-off. Outline = path outlines only (fast). | Render flags | — |
| Work Area (pasteboard) show/hide; Pasteboard color | Show the gray surround. | View pref | Ctrl+Shift+W |
| Rulers / Grid / Guides | Show/hide rulers, grid, guides; edit/snap/lock guides. | View + guide objects | Ctrl+R / Ctrl+' / Ctrl+; |
| Snapping → to Objects / Grid / Guides / Pixels; Snap Align | Snap behavior toggles. | Snap flags | — |
| Hide Edges | Toggle selection highlight (edit without seeing selection). *[WISH W6]* | View pref | Ctrl+Shift+E |
| Show Shape Hints | Display shape-tween hint markers. | View flag | Ctrl+Alt+H |

### 1.2.4 Insert menu

| Command | Does | Data changed | Shortcut |
|---|---|---|---|
| New Symbol… | Create empty symbol, enter its timeline. | Adds symbol to library | Ctrl+F8 |
| Timeline → Frame / Keyframe / Blank Keyframe | Insert frame/keyframe/blank keyframe at playhead. | Frame data | F5 / F6 / F7 |
| Motion Tween | Apply motion tween to current selection. | Converts to tween span | — |
| Classic Tween / Shape Tween | Apply respective tween between keyframes. | Frame data | — |
| Scene | Append a new scene. | Scene list | — |

### 1.2.5 Modify menu

| Command | Does | Data changed | Shortcut |
|---|---|---|---|
| Document… | Doc settings (1.7). | Doc props | Ctrl+J |
| Convert to Symbol… | Wrap selection into a symbol (Part 11). | Library + instance | F8 |
| Break Apart | Split symbol/group/text into components; twice → shapes. | Object type | Ctrl+B |
| Bitmap → Swap Bitmap / Trace Bitmap | Replace a bitmap; vectorize it. | Bitmap asset | — |
| Symbol → Swap Symbol / Duplicate Symbol | Exchange/replicate symbol on instance. | Instance link | — |
| Shape → Convert Lines to Fills / Expand Fill / Soften Fill Edges / Smooth / Straighten / Optimize / Add Shape Hint / Remove All Hints | Vector geometry ops (Part 06). | Path/fill data | various |
| Combine Objects → Union / Intersect / Punch / Crop | Boolean ops on drawing objects (Part 06). | Path data | — |
| Timeline → Layer Properties / Reverse Frames / Synchronize Symbols / Convert to Keyframes / Convert to Blank Keyframes / Distribute to Layers | Layer & frame ops (Parts 07, 20). | Layer/frame data | — |
| Transform → Free Transform / Distort / Envelope / Scale / Rotate and Skew / Scale and Rotate… / Rotate 90 CW / Rotate 90 CCW / Flip Vertical / Flip Horizontal / Remove Transform | Transform ops (Part 04). | Transform props | Ctrl+Alt+S (numeric) |
| Arrange → Bring to Front / Bring Forward / Send Backward / Send to Back / Lock / Unlock All | Z-order + lock (Part 03). | Display list order | Ctrl+Shift+↑/↓ |
| Align → (launches align actions) | Alignment (Part 24). | Positions | Ctrl+K (panel) |
| Group / Ungroup | Group objects / dissolve group. | Group node | Ctrl+G / Ctrl+Shift+G |

### 1.2.6 Text menu

| Command | Does | Data changed |
|---|---|---|
| Font / Size / Style | Set font family, size, bold/italic. | Text style |
| Align | Text alignment (L/C/R/justify). | Text style |
| Letter Spacing / Line Spacing | Tracking / leading. | Text style |
| Embed Fonts | Register glyphs for runtime (dynamic text). | Font embed set |
| (legacy) TLF Text | Text Layout Framework options (deprecated). | — |

*(Full text system: Part 22.)*

### 1.2.7 Commands menu

| Command | Does | Notes |
|---|---|---|
| Manage Saved Commands / Run Command | Replay recorded command sequences (macros). | Macro = ordered command list. |
| Copy Motion as XML / Export Motion XML / Import Motion XML | Move a classic-tween's property curves as XML (motion presets). | Our app: export/import motion as JSON (Part 09). |
| Convert AS3 to HTML5 Canvas document | Doc-type migration (JSFL utility). | Our app: doc-conversion command. |
| Run JSFL / scripting | Run scripts over the document. | *[WISH W13]* Our app: a plugin/script API. |

### 1.2.8 Control menu (playback & test)

| Command | Does | Shortcut |
|---|---|---|
| Play | Play the timeline from playhead (loops per pref). | Enter |
| Rewind / Go To End | Playhead to frame 1 / last. | Ctrl+Alt+R |
| Step Forward One Frame / Backward | Nudge playhead. | `.` / `,` |
| Test Movie / Test Scene / Test (HTML) | Export + run in a player/window. | Ctrl+Enter |
| Mute Sounds / Loop Playback | Playback toggles. | — |
| Enable Live Preview / Enable Simple Buttons | Preview interactive states on stage. | — |

### 1.2.9 Debug menu (legacy, ActionScript-only)

- Breakpoints, step in/out/over, variable & watch panels, debug movie. **Historical only.** Our app ships a built-in **inspector/debugger** for its own scripting layer (P2).

### 1.2.10 Window menu

- Toggles every panel + "Workspaces" submenu. This is just panel visibility management (1.1.2).

### 1.2.11 Help menu

- Documentation, tutorials, keyboard shortcuts viewer, about, updates, (Adobe) account. Our app: local docs + shortcut reference + version/about.

---

## 1.3 Tools panel — full inventory

The Tools panel is **the heart of editing**. A *tool* in Animate is not a button — it is a **stateful interaction mode**: selecting a tool changes (a) the cursor, (b) what pointer events do, (c) the Options area, (d) some Properties-panel content.

### 1.3.1 The four sections

| Section | What lives there | Example |
|---|---|---|
| **Tools** (select + draw) | Selection, Subselection, Free Transform (+Gradient Transform, 3D legacy), Lasso (+Polygon/Magic Wand), Pen (+anchor sub-tools), Text, Line, Rectangle (+Oval, PolyStar, Primitives), Pencil, Brush, Paint Brush, Eraser, Width, Eyedropper, Paint Bucket, Ink Bottle, Bone (+Bind), Asset Warp, Camera, (legacy: Deco, Spray) | — |
| **View** | Hand, Zoom, Stage Rotate, Time Scrubber | — |
| **Colors** | Stroke chip, Fill chip, swap button, black&white, no-color | Clicking a chip opens Color picker (Part 23); default fill/stroke for new shapes. |
| **Options** | Contextual modifiers for the active tool | Magnet (snap) for Selection; Brush modes for Brush; Eraser modes; Free-Transform sub-modes; Gap-size for Bucket; etc. |

### 1.3.2 Tool = state machine (implementation concept)

Every tool implements a uniform interface:

```
interface Tool {
  id: string;            // 'selection' | 'pen' | ...
  cursor(): Cursor;      // computed from hover target + modifiers
  onPointerDown(e): void;  // begin gesture
  onPointerMove(e): void;  // live feedback (no commit)
  onPointerUp(e): void;    // commit -> emits a Command (undoable)
  onKeyDown/Up(e): void;   // modifiers (Shift constrain, Alt center...)
  optionsSchema: Option[]; // renders the Options area
  canTarget(hit: HitTestResult): boolean; // what it may act on
}
```

- A **gesture** = down→move(s)→up. On `up`, the tool produces one **Command** (e.g. `DrawPath`, `MoveSelection`, `AddBone`). Undo = inverse command. (Part 36.)
- This interface is the single abstraction that makes desktop+mobile (Part 31) share logic: only the *event source* (mouse vs touch vs stylus) differs.

### 1.3.3 Tools with 27-field deep specs

See Part 02. Inventory only here: **Selection, Subselection, Free Transform, Gradient Transform, 3D Rotation (legacy), 3D Translation (legacy), Lasso/Polygon/Magic Wand, Pen (+Add/Delete/Convert anchor), Text, Line, Rectangle, Oval, Rectangle Primitive, Oval Primitive, PolyStar, Pencil, Brush, Paint Brush, Fluid Brush (removed), Eraser, Width, Eyedropper, Paint Bucket, Ink Bottle, Bone, Bind, Camera, Asset Warp, Hand, Zoom, Stage Rotate, Time Scrubber, Deco (legacy), Spray Brush (legacy).**

---

## 1.4 Stage — the canvas

### 1.4.1 Geometry & coordinates

- The **stage** is a rectangle `width × height` px (doc settings, 1.7). It is the published frame — exactly what export renders.
- **Origin (0,0) = top-left of the stage.** +X → right, +Y → **down**. All object x/y positions, in the Properties panel, are in this space (registration or transform point per Part 04).
- The **pasteboard/work area** surrounds the stage (gray). Art placed there is authored but **not rendered at export**. It is a staging area for entrances/exits. (Hide via View > Work Area.)
- **View transform** (zoom/pan/rotate-view) is applied on top and never stored in the document. The **camera** (Part 16) is a *separate, animatable* screen transform stored in the document.

### 1.4.2 What the stage renders (compositing order)

1. Stage background color (doc setting).
2. Grid (optional), guides (optional), rulers.
3. **Layer contents, bottom layer → top layer.** Within a layer: the frame at the playhead. Within a frame: display-list order (back→front), groups/symbols recurse.
4. Mask clipping (Part 21) applied per mask/masked pair.
5. Onion-skin ghosts (Part 15) — under/over the current frame.
6. Camera transform (Part 16) — screen-space pan/zoom/rotate; z-depth parallax for advanced layers.
7. **Selection overlays** — bounding boxes, transform handles, anchor/handle dots, bone/armature glyphs, warp pins, snapping hints. (These are *overlay* objects, never part of export.)

### 1.4.3 Rendering modes (View > Preview Mode)

| Mode | What changes | Use |
|---|---|---|
| Full | Everything, anti-aliased, effects on | Final look |
| Fast | Simplifies/omits some effects (filters, advanced fills) | Responsive editing |
| Anti-alias | Smooth lines only | Line-art check |
| Outline | Renders only path outlines (no fills) | Find hidden shapes, low-end machines |

### 1.4.4 Grid, guides, rulers, snapping

- **Rulers** (Ctrl+R) show px/inches along edges; drag from ruler = create a **guide** (a non-printing cyan/magenta line). Guides can be moved, locked, snapped to (View > Guides > Snap to Guides).
- **Grid** (Ctrl+') = configurable cell grid; snap to grid.
- **Snapping** (View > Snapping): to objects, grid, guides, pixels; **Snap Align** shows dashed alignment hints to other objects.
- Implementation: guides/grid are `view` overlays; snapping is a `SnapEngine` that, given a candidate point, returns the nearest snap point + a visual hint line. Used by move/transform/draw tools uniformly.

---

## 1.5 Timeline — overview map

*(Full control-by-control spec: Part 07. Keyframe semantics: Part 08. This section is the map.)*

The timeline is **one panel** with two halves:

### Left half — layer list (columns)

| Column | Control | Behavior |
|---|---|---|
| 1 | Show/hide (eye) | Toggle layer visibility for authoring & (unless excluded) export. Hidden layers still exist. |
| 2 | Lock (padlock) | Prevents selection/editing of that layer's contents. Locked content is skipped by Select All. |
| 3 | Outline (colored square) | Toggle: render this layer as outlines only. |
| 4 | Name | Double-click to rename. |
| 5 | Type/status icons | folder, mask, guide, tween, pose, camera, audio, etc. |
| 6 | (camera) attach dot | Attach layer to camera (Part 16). |
| 7 | (advanced layers) z-depth | Layer depth for parallax (Part 16). |

### Right half — frame grid

| Element | Behavior |
|---|---|
| Frame ruler / header | Numbered frames (1, 5, 10, 15…). Click-drag selects frames? (click sets playhead). |
| Playhead | Red line + handle. The "now". Drag to scrub; click a frame number to jump. |
| Frame cells | layer × frame grid. Visual language (Part 07.4): solid dot = keyframe w/ content; hollow dot = blank keyframe; hollow rect = end of a held span; arrow = classic/shape tween; diamond = tween property keyframe / IK pose; colored spans = tween types (blue motion, light-green shape, green IK pose, blue w/ arrow classic). |
| Onion-skin buttons | Onion Skin, Onion Outlines, Edit Multiple Frames, Modify Markers (Part 15). |
| Center frame / Play / status | Jump to playhead, play, frame/fps/elapsed readout. |

### Timeline actions (full list → Part 07.6)

Insert Frame (F5), Insert Keyframe (F6), Insert Blank Keyframe (F7), Delete Frame (Shift+F5), Clear Keyframe (Shift+F6), Copy/Paste/Cut/Clear/Remove Frames, Duplicate, Move (drag), Reverse Frames, Convert to Keyframes/Blank Keyframes, Distribute to Layers, layer ops (add/delete/folder/mask/guide), tween ops (Motion/Classic/Shape/IK pose insert).

---

## 1.6 Properties panel — the contextual inspector

The Properties panel **re-binds** to the current context. This is the most important UX pattern to copy. Context precedence (roughly):

1. Active **tool** options (when a tool is selected and nothing is selected on stage).
2. **Selection on stage** (shape / drawing object / group / instance / text / multiple / camera / bone).
3. **Selected frame(s)** in the timeline.
4. **Document** (when nothing selected).

Because it re-binds, one panel replaces dozens of modal dialogs. Implementation: each selectable object type exposes a **`getPropertySchema()`** (a list of `{id, label, type, value, set, validate}`); the panel renders that schema. (Full schema inventory: Part 26.)

*[WISH W6]* Animate hides opacity/alpha inside Color Effect dropdown — our panel shows an **always-visible Opacity slider** for any object that supports alpha.

---

## 1.7 Document settings (Modify > Document, Ctrl+J)

| Setting | Meaning | Typical values |
|---|---|---|
| Width / Height | Stage size in px | 1920×1080, 1280×720, 550×400 (legacy banner) |
| Ruler units | px / in / cm / mm | px |
| Frame rate (fps) | Timeline speed; **defines the frame grid**: time = frame / fps | 24 (film), 25 (PAL), 30 (broadcast), 60 (web) |
| Background color | Stage fill | #FFFFFF |
| Platform / doc type | Determines publish pipeline & available features | HTML5 Canvas, WebGL glTF, ActionScript 3.0 (legacy), AIR (legacy) |
| Advanced | Auto-save interval, stroke/fill defaults, etc. | — |

**fps is load-bearing**: audio sync (Part 17), lip-sync (Part 18), tween sampling, and export all convert frames↔seconds via fps. Changing fps mid-project rescales *timing* (frames stay, seconds change) — our app must decide & document this (default: keep frames, recompute durations).

---

## 1.8 Library panel — overview

*(Full spec: Part 12.)* The Library is the document's **asset database**: every symbol (graphic/movie clip/button/font), imported bitmap, imported sound/video, and component. Capabilities: folders, sort, search, preview thumbnail/waveform, duplicate/rename/delete, linkage (legacy AS3), swap-from-library, import/export assets. Because symbols are the reuse unit, the Library is effectively the project's **asset graph root**.

---

## 1.9 Scene panel — overview

*(Full spec: Part 25.)* A document = ordered **scenes**; each scene = its own main timeline. Scene panel: add / duplicate / delete / reorder / rename. Playback plays scenes in order. Scene-level camera and audio live on that scene's timeline.

---

## 1.10 Color & Swatches — overview

*(Full spec: Part 23.)*

- **Color panel**: fill/stroke selector; type = solid / **linear gradient** / **radial gradient** / **bitmap fill**; color space RGB/HSB + hex; **Alpha (A)**; gradient stop editor (add/remove stops, set color+alpha+position). Also a brightness selector.
- **Swatches panel**: saved chips; add current color, delete, organize in folders, import/export `.ase`-style sets, large default palette.

---

## 1.11 Align / Transform / Info panels — overview

- **Align** (Ctrl+K): align selection to stage or to selection bounds — left/center/right, top/middle/bottom, distribute H/V, match size, space evenly (Part 24).
- **Transform**: numeric X/Y, W/H (% or px), constrain proportions, rotate, skew, 3D (legacy) (Part 04).
- **Info**: live readout of selection W/H/X/Y (+ registration/transform point toggle), pointer RGB/alpha, pointer position. Read-only; used for precision while drawing/width-editing.

---

## 1.12 Components / Actions / Output panels — overview

- **Components**: drag-drop prebuilt widgets (legacy AS3 UI: Button, CheckBox, ComboBox, ScrollPane…; HTML5: video, custom). Each = a movie clip + a parameter schema. Our equivalent: a **widget library** (reusable symbol + property schema) (P2).
- **Actions**: code editor attached to frames/objects (ActionScript legacy; JavaScript for HTML5/WebGL). Features: code pane, syntax coloring, code hints, find/replace, pinned scripts, **Code Snippets** (library of common scripts). Our equivalent: a **behavior/event graph** (P1) + optional script layer (P2).
- **Output**: console log of compile/test/publish messages, errors, `trace()` output. Our equivalent: **build log panel**.

---

## 1.13 Asset & utility panels — overview

| Panel | Purpose | Our equivalent |
|---|---|---|
| **Motion Editor** (legacy) | Graph editor for classic-tween curves + easing presets. | *[WISH W4]* A first-class **graph editor** for all tween properties (Part 09). |
| **Frame Picker** | Visual per-frame browser of a graphic symbol; pick which symbol-frame an instance shows. Core to lip-sync. | Frame Picker panel (Part 18). |
| **Layer Depth** | z-depth per layer for camera parallax. | Layer depth column/panel (Part 16). |
| **Brush Library** | Browse/import art & pattern brushes. | Brush library (Part 05). |
| **Movie Explorer** | Hierarchical outline of the whole doc (layers, symbols, instances, actions). | Document outline panel. |
| **History** | List of undoable steps; jump to a step. | History panel bound to undo stack (Part 36). |
| **CC Libraries** | Cloud asset sharing (Adobe service). | **Not needed** (our app is local-first; optional sync later). |

---

## 1.14 Import / Export systems — overview

*(Full: Parts 27, 28.)*

- **Import**: bitmaps (PNG/JPEG/GIF/PSD/AI via rasterization), vector (SVG/AI), audio (MP3/WAV/AIFF), video (FLV/MP4 — converted/embedded), symbol libraries (open `.fla` as library), sprite sheets. Each imported asset lands in the Library; "to Stage" additionally places an instance at the current frame.
- **Export/Publish**: images (PNG/JPEG/SVG), animated GIF, video (MOV/MP4), PNG/JPEG sequences, sprite sheets, and platform targets: HTML5 Canvas (JS library + textures), WebGL/glTF, SWF/AS3 (legacy), AIR (legacy), OAM (legacy widget). Per-format options: size, fps, compression, transparency, audio bitrate, loop, quality (Part 28).

---

## 1.15 End-to-end character/animation workflow

The canonical pipeline all subsystems must support (each step references its part):

1. **Artwork** — draw/import character parts as separate pieces (head, torso, arms, legs, eyes, brows, mouth) (Parts 05, 27).
2. **Symbolize** — each part → symbol; assemble rig by nesting (Part 11).
3. **Pivots** — move each symbol's transform point to its joint (Part 04).
4. **Rig** — bones/IK chain (Part 14) or Asset Warp pins (Part 02) or cut-out parenting (Part 20).
5. **Animate** — poses on keyframes; motion/classic tweens; easing (Parts 07–09).
6. **In-between** — frame-by-frame accents with onion skin where tweens look wrong (Part 15).
7. **Facial** — blink cycles, eye direction, expressions as nested graphic symbols via Frame Picker (Part 19).
8. **Lip sync** — auto viseme assignment from audio + manual correction (Part 18).
9. **Audio + camera** — voice (Stream) + music (Event); camera moves with z-depth parallax (Parts 16, 17).
10. **Publish** (Part 28).

---

## 1.16 State & event flow (how the app ticks)

A single user action propagates like this — this is the **contract** every module must honor:

```
User clicks a shape with Selection tool
  → SelectionTool.onPointerDown → hit-test (Part 03) → selection = shape
  → bus.emit('selection:changed', {targets:[shape]})
     ├─ Properties panel re-renders → shape property schema (fill/stroke/w/h/x/y…)
     ├─ Info panel re-renders → live numbers
     ├─ Transform panel re-renders → numeric transform fields
     └─ Stage overlay re-renders → bounding box + handles
User drags
  → SelectionTool.onPointerMove → preview (translate object)
  → onPointerUp → MoveCommand.execute() → document.layer[L].frame[F].content.update(shape.x/y)
  → command pushed to undo stack (Part 36)
  → bus.emit('document:changed', {type:'move', targets:[shape]})
     └─ Timeline/stage/properties re-render (dirty-region only)
```

**Rules:**
1. **Single source of truth** = the document model (Part 33). Panels are projections.
2. **All mutations go through Commands** (undoable). No panel writes to the model directly.
3. **Dirty-region rendering**: only changed layers/objects re-render; keep a render cache per layer (Part 32).
4. **Playback sampling**: on each frame tick, the Timeline engine asks the document model to `evaluate(time)` → produces a render tree → renderer draws. Same path as authoring, so WYSIWYG.

---

## 1.17 BUILD CHECKPOINT M1

Before moving to Part 02, the app skeleton must be able to:

- [ ] Create/open/save a document (JSON) with width/height/fps/background.
- [ ] Show a stage (canvas) with correct aspect and background color.
- [ ] Show a **Tools panel** whose buttons switch an active-tool state (even if tools do nothing yet).
- [ ] Show an **empty Timeline** (layer list + frame ruler + playhead at 1) that can at least scroll and display "Layer 1".
- [ ] Show a **Properties panel** that re-binds when context changes (document ↔ tool ↔ selection) — even if schemas are stubs.
- [ ] Pan (spacebar-drag / Hand) and zoom (Ctrl+=/-, wheel) the viewport without altering the document.
- [ ] A functioning **event bus** and **undo stack** (command pattern) with at least `New/Open/Save/Undo/Redo`.
- [ ] A **panel/dock manager** that can show/hide/float the above panels and persists layout to prefs.

*Passing M1 means you have a stable editor shell. Parts 02–06 fill the drawing brain; Parts 07–10 make it animate.*
