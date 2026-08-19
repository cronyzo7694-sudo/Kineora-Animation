# ADOBE ANIMATE → ORIGINAL 2D ANIMATION EDITOR — COMPLETE FUNCTIONAL BLUEPRINT

> **One complete structured file** — the merged master of all 36 parts. Written in English for direct consumption by an AI coding agent. Builds an **original** (non-Adobe) professional 2D animation editor, cross-platform (Windows / macOS / **Linux** / browser / tablet).

> Primary source: official Adobe Animate documentation (current 2023–2026 generation). No Adobe icon, brand, artwork, or pixel-identical UI is reproduced — only functionality and workflow.

---

<!-- ===== FILE: 00_README_roadmap.md ===== -->

# ANIMATE-BLUEPRINT — Master Index & Build Roadmap
### 36-file functional blueprint to build an original, professional 2D animation editor (Adobe Animate-class, but better in key areas). Every file is written to be consumed independently by an AI coding agent.

---

## How to use this folder

- Files are numbered `01`–`36`. Read them **in order** — each part assumes the previous parts' concepts.
- Each part ends with a **BUILD CHECKPOINT** — a list of things that must work before moving on. When all 36 checkpoints pass, you have a working editor.
- Language: **English** (technical). UI terminology in the final app should be your own — this document describes *functionality*, not Adobe's branding.
- Research base: official Adobe Animate documentation (helpx.adobe.com), current 2023–2026 docs, plus community/Reddit feature requests. Version differences (Animate CC vs current Animate; Flash legacy) are noted inline.

## The 6 build milestones

| Milestone | Files | What the app can do |
|---|---|---|
| **M1 — Static editor** | 01–06 | Open a document, draw vectors/shapes, select, transform, save. A drawing editor. |
| **M2 — Motion editor** | 07–10, 20–21, 23–24 | Timeline, keyframes, motion/classic/shape tweens, motion paths, layers, masks, color, align. Animation works. |
| **M3 — Reusable content** | 11–12, 22, 27–28 | Symbols, instances, library, text, import, export/publish. Assets + output. |
| **M4 — Character tools** | 13–19 | Rigging, bones/IK, asset warp, frame-by-frame + onion skin, camera, audio, lip-sync, facial animation. |
| **M5 — Power & polish** | 25–26, 29–31 | Scenes, properties panel, shortcuts, context menus, mobile/touch translation. |
| **M6 — Engineering spec** | 32–36 | Module architecture, data model (JSON), UI button spec, priorities, final notes. |

## File index

| # | File | Content |
|---|---|---|
| 00 | `00_README_roadmap.md` | This file — index, milestones, wishlist. |
| 01 | `01_application_map.md` | Complete application architecture & map. |
| 02 | `02_tools.md` | Every tool, 27-field spec. |
| 03 | `03_selection_system.md` | Selection, subselection, marquee, locking. |
| 04 | `04_transform_system.md` | Move/scale/rotate/skew/free/distort + numeric. |
| 05 | `05_drawing_system.md` | Pen/pencil/brush/line/shape tools + stroke/fill. |
| 06 | `06_shape_system.md` | Primitive/raw/merge/booleans + data model. |
| 07 | `07_timeline.md` | Every timeline control & action. |
| 08 | `08_keyframe_system.md` | Keyframe types, storage, interpolation. |
| 09 | `09_tweening.md` | Motion/classic/shape tween + easing. |
| 10 | `10_motion_path.md` | Paths, béziers, orientation, guides. |
| 11 | `11_symbol_system.md` | Symbols, instances, nesting, edit modes. |
| 12 | `12_library.md` | Asset database & reuse. |
| 13 | `13_character_animation.md` | Character pipeline end-to-end. |
| 14 | `14_bone_ik.md` | Bones, armatures, IK, constraints. |
| 15 | `15_frame_by_frame.md` | Traditional animation + onion skin. |
| 16 | `16_camera.md` | Camera layer, zoom/rotate/pan, depth. |
| 17 | `17_audio.md` | Import, sync modes, loops, export. |
| 18 | `18_lip_sync.md` | Visemes, auto lip-sync, frame picker. |
| 19 | `19_facial_animation.md` | Eyes/brows/mouth/head systems. |
| 20 | `20_layers.md` | Layer ops, folders, parenting, depth. |
| 21 | `21_masks.md` | Mask/masked, animated masks, alpha. |
| 22 | `22_text.md` | Text tool, static/dynamic/input, fonts. |
| 23 | `23_color.md` | Fill/stroke, gradients, swatches. |
| 24 | `24_align_distribute.md` | Align/distribute/spacing. |
| 25 | `25_scenes.md` | Scenes, ordering, navigation. |
| 26 | `26_properties_panel.md` | Contextual inspector for every type. |
| 27 | `27_import.md` | Import categories & asset handling. |
| 28 | `28_export_publish.md` | Export/publish options. |
| 29 | `29_shortcuts.md` | Complete keyboard reference. |
| 30 | `30_context_menus.md` | Right-click menus everywhere. |
| 31 | `31_mobile_translation.md` | Desktop ↔ touch mapping. |
| 32 | `32_architecture.md` | Original module architecture. |
| 33 | `33_data_model.md` | JSON schemas. |
| 34 | `34_ui_button_spec.md` | Master button table. |
| 35 | `35_priorities.md` | P0–P3 + build order. |
| 36 | `36_final_notes.md` | Cross-cutting rules, glossary, checks. |

## Community wishlist (what our app does BETTER than Adobe Animate)

Sourced from r/adobeanimate, r/animation, r/ToonBoomHarmony, and related threads (2020–2026). These are *requirements baked into every part*, tagged `[WISH]` where they apply.

| # | Wish | Source signal | Our solution (where) |
|---|---|---|---|
| W1 | **Cel/drawing-reuse workflow** — duplicate a frame and edit it; want the option to make drawings reusable assets, not always independent copies | r/animation: "no cel based workflow… duplicate a frame and make changes, only that frame changes" | "Drawing" asset type + exposure (Parts 08, 15, 33) |
| W2 | **Bone/IK that doesn't break** on copy/paste, scaling children, or re-parenting | r/adobeanimate rant (j76i2n) | Rig engine with local-space math + stable IDs (Parts 14, 32) |
| W3 | **Asset Warp without flicker/disappear** when tweened or duplicated | r/adobeanimate rant | Warp mesh keyed as data, no symbol-link bugs (Part 02, 33) |
| W4 | **AE-style graph editor**: clear keyframes, multi-select, edit many at once, visible motion path, per-property curves | r/animation Harmony-vs-AE thread | Motion Editor module (Parts 09, 32) |
| W5 | **Free brush size** (slider), better stroke smoothing, no angular stroke artifacts | r/animation (2016) | Brush engine with slider + smoothing pipeline (Part 05) |
| W6 | **Simple opacity slider**; **toggle auto-select**; **eyedropper that doesn't paint on hover** | r/adobeanimate "WHY IS IT SO HARD" | UX defaults (Parts 02, 22, 26, 34) |
| W7 | **Standalone + offline**, cross-platform (Win/Mac/Linux/Chromebook), no subscription | multiple threads | Desktop + web builds (Parts 31, 32, 35) |
| W8 | **Keep Flash-style shortcuts & symbol workflow**, enhance it | "same shortcuts and workflow… enhancing symbol workflow" | Part 29 shortcuts + Part 11 symbols |
| W9 | **AI in-betweening** to generate tween frames | "AI machine generation to expand upon the in-between capabilities" | Optional interpolation assistant (Parts 09, 35) |
| W10 | **Bitmap/raster pencil** for traditional feel | "Adding bitmap pencil would take this to the next level" | Raster engine + bitmap pencil (Parts 05, 32) |
| W11 | **Autosave + crash recovery / versioning** | Harmony crash rants | Project serializer + autosave (Parts 32, 33, 36) |
| W12 | **Multiple scenes open** at once | "wish I could have multiple scenes open like in Animate" | Scene panel + tabbed scenes (Part 25) |
| W13 | **Extensibility / open ecosystem** | "open ecosystem / extensibility" | Plugin/script API (Parts 14/32 notes) |

---

*Continue to `01_application_map.md`.*

---

<!-- ===== FILE: 01_application_map.md ===== -->

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

---

<!-- ===== FILE: 02a_tools_selection_transform.md ===== -->

# PART 02a — EVERY TOOL: SELECTION & TRANSFORM TOOLS
### Deep 27-field specification. This file covers: Selection, Subselection, Free Transform, Gradient Transform, 3D Rotation (legacy), 3D Translation (legacy), Lasso (+Polygon, +Magic Wand).

> **How to read this file.** Every tool uses the identical 27-field schema below. Read a tool top-to-bottom and you have everything needed to implement it: what it does, how the user drives it (mouse + touch + keyboard), what data it writes into the document model (field names reference Part 33 JSON), and what can go wrong. Implementation guidance targets a **cross-platform engine** (Desktop = Windows/macOS/Linux; Mobile = Android/iOS/tablets; Web = same codebase). Every tool is a `Tool` implementing the interface from Part 01 §1.3.2.

### THE 27-FIELD SCHEMA (template)

```
TOOL NAME:
 1. Official name
 2. Purpose
 3. Location
 4. Icon conceptual description (original app draws its own glyph — never Adobe's art)
 5. Shortcut
 6. Mouse interaction
 7. Touch interaction
 8. Selection behavior
 9. Drag behavior
10. Double-click behavior
11. Right-click/context behavior
12. Tool Options (Options area of the Tools panel)
13. Properties affected (which document-model fields change)
14. What objects it can modify
15. What objects it cannot modify
16. Timeline interaction
17. Keyframe interaction
18. Vector interaction
19. Bitmap interaction
20. Symbol interaction
21. Shape interaction
22. Common mistakes
23. Professional use
24. Example animation workflow
25. Equivalent functionality needed in our application
26. Mobile implementation
27. Desktop implementation
```

Plus, where it matters, two extra blocks per tool:
- **EVENT SEQUENCE** — the exact pointer/keyboard event chain and what happens at each phase.
- **MODIFIER MATRIX** — a table of modifier keys (Shift / Alt-Option / Ctrl-Cmd / Space) and their effect during that tool.
- **UNDO GRANULARITY** — what a single Undo step reverts.
- **MODEL WRITES** — the exact JSON paths (Part 33) this tool mutates.

---

## T2A.1 — SELECTION TOOL

**1. Official name:** Selection tool.
**2. Purpose:** Select entire objects (raw shapes, drawing objects, groups, symbol instances, text blocks, bitmaps) and move them; also *reshape* raw vector paths by dragging their edges/corners; and drill into groups/symbols by double-click. This is the default, always-available tool.
**3. Location:** Tools panel, first button (top-left).
**4. Icon conceptual description:** a solid black filled arrow cursor pointing up-left (standard pointer). Our app draws its own arrow glyph; do not copy Adobe's exact pixel art.
**5. Shortcut:** `V`. (Temporarily: holding `V` while another tool is active switches to Selection for as long as held; `Ctrl` on Windows / `Cmd` on macOS does the same for some tools.)

**6. Mouse interaction:**
- **Click (press+release without movement):** hit-test at pointer → select the top-most selectable object at that point (see hit-test rules, Part 03). Replaces current selection. Clicking empty space (stage/pasteboard) clears selection.
- **Click on a vector edge/curve:** if the click lands within `edgeHitRadius` (≈4 px) of a raw-shape path, the tool enters **edge-reshape** mode instead of selecting the whole shape.
- **Drag (press, move ≥3 px, release):** two cases:
  - (a) pressed **on an object** → move the selection (or the single object under the cursor) by the pointer delta. Emits a `MoveCommand` on release.
  - (b) pressed **on empty space** → **marquee**: draw a rectangle; on release select every object intersecting the rectangle (or touching it, if Contact-Sensitive Selection is on — see field 8).
- **Drag on a raw-shape edge:** live re-shape of that segment (field 18).
**7. Touch interaction:**
- **Tap:** select under finger (hit-test uses a finger-sized tolerance ≈ 20–24 px).
- **Drag:** if started on an object → move it (finger offset not shown under finger — see Part 31 for the offset-loupe); if started on empty → marquee select.
- **Edge-reshape with a finger** is error-prone: our app enables it only when a "Node/Reshape mode" toggle is on, otherwise a finger drag always moves/marquees.
- **Two-finger drag:** reserved for canvas pan (never object move). Pinch = zoom (app-level).
**8. Selection behavior:**
- Click = single select (deselects others). `Shift`+click = **toggle** membership (add if absent, remove if present).
- Drag-marquee = rectangular select. Two preferences matter:
  - **Contact-Sensitive Selection ON** → any object merely *touched* by the marquee is selected.
  - **Contact-Sensitive Selection OFF** → only objects fully *enclosed* are selected.
- Double-click = drill into group/drawing-object/symbol (field 10).
- `Ctrl+A` Select All = everything on **unlocked, visible layers of the current timeline** (does not select locked/hidden layers, or other scenes).
- Selecting a **part of a merge shape** (fill only, or stroke only) is possible — see Part 03 for fill/stroke-only selection; the fill and stroke of a raw shape are separate selectable sub-objects.
- A selection can be **mixed** (multiple object types); then Properties shows only common properties (x, y, w, h).
**9. Drag behavior:**
- Moving a selection translates all its members by the same delta. **Snapping** applies (if enabled): snap to object edges/centers, grid, guides, pixels — a dashed snap line is drawn as feedback.
- Dragging a raw-shape **corner** moves that anchor; dragging an **edge** bulges the segment; modifier `Alt/Option` on a corner adds a curve handle; `Ctrl/Cmd` temporarily converts selection-to-move even if you started on a point.
**10. Double-click behavior:**
- On a **group or drawing object** → enter edit-in-place (drill one level; the breadcrumb updates; other objects dim).
- On a **symbol instance** → enter symbol edit-in-place (Part 11).
- On a **raw shape's fill** → select fill + its stroke together.
- On a **connected line** → select the entire connected line chain.
- On a **text block** → enter text-edit (caret).
- On a **bitmap** → select it and show transform box (older behavior: opens bitmap editor — our app: select only).
**11. Right-click/context behavior:** opens the object context menu (Part 30): Cut, Copy, Paste, Select All, Deselect, Convert to Symbol (F8), Break Apart, Edit (in place), Swap Symbol, Arrange, Transform, Export PNG, etc. On empty stage: paste, paste-in-place, document settings, etc.
**12. Tool Options (Options area):**
- **Magnet (snap to objects)** — toggle: moving/reshaping snaps to nearby objects' edges, centers, anchor points.
- **Smooth / Straighten** — buttons applied to a *selected raw shape*: simplify curves (Smooth) or straighten near-straight segments (Straighten). These modify geometry immediately.
**13. Properties affected (model writes):**
- On move: `node.transform.x`, `node.transform.y` (Part 33 `Transform`).
- On reshape: `shape.path` (anchor/control-point array).
- Selection itself: transient UI state (not persisted), but selection drives which object's properties the Properties panel shows (Part 26).
**14. What it can modify:** raw shapes (merge shapes) incl. their fill and stroke sub-objects; drawing objects; groups (as a unit — reshape requires entering the group); symbol instances (move only); text blocks; bitmaps (move/select); connected line chains.
**15. What it cannot modify:**
- Content on **locked** layers (click selects nothing; marquee skips them).
- Content on **hidden** layers.
- The *inside* of a group/symbol without double-clicking into it.
- Anchor-level curve handles of a path (that is Subselection, T2A.2) — the Selection tool can move corners/edges but not pull individual Bézier handles.
**16. Timeline interaction:**
- Selecting/moving does not change frames by itself.
- Moving an object **while the current frame is a keyframe** edits that keyframe's stored value.
- Moving an object **while the current frame is a held/static frame** (not a keyframe) → Animate auto-inserts a keyframe at the playhead (or edits the span's first keyframe). **Our app's rule (explicit):** moving content on a non-keyframe auto-converts that frame to a keyframe and warns the user with a status toast.
- (Legacy) **Auto-Keyframe mode** inserts keyframes automatically while scrubbing — deprecated; our app offers a toggle with the same semantics (P2).
**17. Keyframe interaction:**
- A move on a frame that belongs to a **motion tween span** creates/updates a **position property keyframe** at the playhead (Part 09). x and y are independent per-property keyframes.
- A move on a **classic tween** intermediate frame → Animate inserts a keyframe there and the classic tween re-interpolates through it.
**18. Vector interaction (edge/curve reshaping):**
- Hovering a path edge shows a small arc or right-angle cursor (arc = can bend curve; angle = can move corner).
- **Drag an edge:** the segment between its two anchors is re-fit as a curve through the dragged point (quadratic/cubic). If the edge was straight, dragging bulges it into a curve; if curved, dragging moves the apex.
- **Drag a corner:** the anchor moves; adjacent segments follow. `Alt/Option`+drag corner → pulls a one-sided tangent out of a corner (converts corner→curve locally).
- **Drag an end-anchor of an open path:** moves that endpoint.
- All reshape writes go into `shape.path`; smoothing may reduce point count.
**19. Bitmap interaction:** select/move bitmap instances; double-click selects; no pixel editing. Bitmaps are moved as rectangles; they cannot be "reshaped" by edge-drag.
**20. Symbol interaction:** click selects the **instance** (not the symbol definition); move changes instance transform only; double-click enters edit-in-place; right-click → Edit / Swap Symbol / Break Apart.
**21. Shape interaction:**
- In **merge-shape mode** (Part 06), selecting part of a shape (a fill or a stroke) and dragging it **cuts** that part away from the rest — the classic Flash "select + drag splits a shape" behavior. (This surprises users; our app makes it a documented, discoverable behavior with a one-time tooltip.)
- In **object-drawing mode**, the drawing object is atomic: click selects the whole object.
**22. Common mistakes:**
- Thinking drag = move when it actually drew a marquee (pressed empty space by 1 px).
- Accidentally reshaping a vector edge when intending to move the object (fix: drag from the object's fill, not its outline).
- Selecting a fill but not its stroke, moving it, and leaving a "ghost" stroke behind.
- Forgetting that locked layers block selection.
**23. Professional use:** primary placement & nudging; quick curve cleanup (drag edges to round/sharpen silhouettes); previewing rig motion by dragging a limb before bones are added; marquee + Shift to build complex selections.
**24. Example animation workflow:** draw an arm with Brush → double-click to select fill+stroke → `F8` convert to symbol → drag to shoulder position → keyframe at frame 1. Later: select arm, drag down at frame 10 → Animate auto-keys → tween between frames 1 and 10.
**25. Equivalent functionality in our app:** a `SelectionTool` that (a) hit-tests via the Scene Graph's spatial index, (b) manages selection state with Shift-toggle and marquee modes, (c) emits `MoveCommand`, `ReshapeCommand` on release, (d) snaps via the shared SnapEngine, (e) drives the Properties/Info/Transform panels through `selection:changed` events. Nothing about this is Adobe-specific — it is generic editor behavior.
**26. Mobile implementation:** tap = select; drag-on-object = move with finger-offset loupe; drag-on-empty = marquee; long-press = context menu; edge-reshape gated behind a "Reshape" mode toggle; multi-select via a "Select" mode where each tap toggles membership (Shift not available). Snap feedback = dashed lines.
**27. Desktop implementation:** pointer hit-testing against an R-tree/quadtree of object bounds; marquee via screen-space rect ∩ bounds (with optional precise path intersection for Contact-Sensitive OFF); Shift/Alt/Ctrl modifier handling; edge reshape using the Vector Engine's path editor.

**EVENT SEQUENCE (move a shape):**
```
pointerdown (on shape)  → hit-test → select shape (unless shift → toggle) → store grab offset
pointermove (≥3px)     → preview: shape.transform.x/y += delta (no commit)
                          → SnapEngine returns nearest snap → apply + draw hint line
pointerup               → commit MoveCommand { target, from, to } → push undo
                          → emit 'document:changed'
```
**MODIFIER MATRIX:**
| Modifier | During drag | During click | During marquee |
|---|---|---|---|
| Shift | constrain move to 45°/axis (if enabled) | toggle selection | add to selection |
| Alt/Option | duplicate-drag (drag a copy) | — | — |
| Ctrl/Cmd | temporarily force move-mode over reshape | temporarily activate Selection | — |
| Space (held) | pan viewport | — | — |

**UNDO GRANULARITY:** one `MoveCommand` per drag gesture (press→release). Reshape = one `ReshapeCommand` per edge-drag gesture (undo restores previous path). Smooth/Straighten = one command each.
**MODEL WRITES:** `layers[i].frames[j].content[k].transform.{x,y}` for moves; `…content[k].shape.path` for reshapes.

---

## T2A.2 — SUBSELECTION TOOL

**1. Official name:** Subselection tool.
**2. Purpose:** Edit vector paths at the **anchor-point level**: move anchors, pull Bézier handles, convert corner↔smooth points; also reshape **motion paths** on motion tweens (Part 10); also move bone ends of an IK shape (Part 14).
**3. Location:** Tools panel, second button (often a flyout with Selection).
**4. Icon conceptual description:** a hollow/white arrow (outline arrow) — signals "sub-object" precision vs the solid Selection arrow.
**5. Shortcut:** `A`.

**6. Mouse interaction:**
- **Click a path:** reveals its anchors as small squares (selected anchor = filled square; unselected = hollow).
- **Click an anchor:** select it; if it is a curve point, its two tangent handles appear (dots on short lines).
- **Drag an anchor:** move it; adjacent segments re-compute.
- **Drag a tangent handle:** change that tangent's direction/length (both sides stay mirrored for a smooth point unless it was split). `Shift` snaps handle to 45° increments; `Alt/Option` breaks the mirror (creates independent handles → corner behavior on that side).
- **`Alt/Option`+click an anchor:** toggle corner ↔ smooth point.
- **Click empty / press Escape:** deselect anchors.
**7. Touch interaction:** tap path → anchors appear (enlarged); drag anchor/handle with finger-offset loupe; long-press anchor → corner/smooth toggle + delete; two-finger = pan/pinch zoom.
**8. Selection behavior:** operates on **anchors and handles**, not whole objects. Shift+click adds anchors to selection; marquee (drag on empty) selects anchors inside the rectangle only. A selected object shows its anchor cloud; nothing else on stage is selected.
**9. Drag behavior:**
- Anchor drag: re-fits the two adjacent segments (and any attached fills).
- Handle drag: modifies the cubic/quadratic control point; the curve re-renders live.
- On a **motion path** (tween): dragging the path reshapes the motion; dragging a **keyframe vertex** on the path moves that keyframe's position value (Part 10).
**10. Double-click behavior:** on a motion path → edit tween path; on an anchor → (legacy) cycles point type. Our app: double-click anchor toggles corner↔smooth.
**11. Right-click/context behavior:** Add Anchor, Delete Anchor, Convert to Smooth/Corner, Reset tangent; on a motion path: add keyframe vertex, reset path.
**12. Tool Options:** none beyond snapping toggles (path/anchor display is always on while active).
**13. Properties affected:** `shape.path` anchor list (positions, handle vectors, point types); for motion paths: the tween's `position` property curve (Part 09/10).
**14. What it can modify:** any vector path — raw shape outlines (strokes and fill boundaries), drawing-object paths, motion-tween motion paths, IK shape contours (move bone end within the shape).
**15. What it cannot modify:** bitmaps; text (unbroken); symbol-instance *transforms*; merge-shape fills as a whole (only their outline paths); a motion path when the span has been converted to keyframes.
**16. Timeline interaction:** editing a motion path adds/updates **position property keyframes** at the edited vertices (Part 10). Editing static artwork edits the current keyframe.
**17. Keyframe interaction:** on a motion tween, path edits modify position keyframes; in an IK pose layer, path edits are **blocked when multiple poses exist** (documented Animate limitation) — our app instead edits only the current pose and warns.
**18. Vector interaction:** the core vector editor. Supports: select single/multiple anchors, move, add/delete anchors, convert point type, pull handles, `Shift` 45° snap, `Alt` split handles. Also "drag to lasso anchors".
**19. Bitmap interaction:** none (bitmaps have no vector path).
**20. Symbol interaction:** none directly — used *inside* symbol-edit mode to fix the symbol's artwork; changes propagate to all instances.
**21. Shape interaction:** edit the outline contour of merge shapes and drawing objects; changing the outline re-fills the interior automatically (fill follows path).
**22. Common mistakes:** pulling the wrong handle; accidentally converting a smooth point to corner (breaks curve continuity); editing the motion path when intending to move the object; not realizing IK shapes lock path editing once posed.
**23. Professional use:** precise logo/character cleanup; finessing motion paths; adjusting IK shape contours; splitting/merging tangents for sharp-vs-smooth corners.
**24. Example workflow:** draw a head outline with Pen → `A` → smooth the jaw by dragging handles → convert the chin to a corner → `F8` to symbol. Later: a motion tween's path curves too wide → `A` → drag path keyframe vertices to tighten.
**25. Equivalent in our app:** a `PathEditTool` over the Vector Engine's path model: selection of anchors/handles, transforms of handles, point-type toggles, and motion-path editing when the hovered path belongs to a tween. Must support **undo per drag** and re-render the path (and its fill) live.
**26. Mobile implementation:** anchor/handle editing is impossible without precision → our app shows a **magnified loupe** (fixed 2–3× zoom bubble offset above the finger) when a handle is grabbed; long-press menu for add/delete/convert; numeric fallback panel for handle angle/length.
**27. Desktop implementation:** full Bézier editing with on-screen readout (angle/length of dragged handle); `Shift` axis snap; `Alt` handle split; marquee anchor selection.

**EVENT SEQUENCE (move a handle):**
```
pointerdown on handle → hit-test anchors → select anchor (shift=add) → grab handle offset
pointermove           → recompute path from new handle vector (live, throttled 60fps)
pointerup             → commit PathEditCommand { path, before, after } → undo push
```
**MODIFIER MATRIX:**
| Modifier | Effect |
|---|---|
| Shift | snap handle to 45°; snap anchor move to axes |
| Alt/Option | split mirrored handles (drag one side) / toggle point type on click |
| Ctrl/Cmd | temporarily switch to Selection tool |

**UNDO GRANULARITY:** one `PathEditCommand` per handle/anchor drag gesture. Add/delete/convert = separate commands.
**MODEL WRITES:** `shape.path` (anchors + handles + pointTypes); for motion path: `tween.properties.position.keyframes[]`.

---

## T2A.3 — FREE TRANSFORM TOOL

**1. Official name:** Free Transform tool.
**2. Purpose:** Move, rotate, scale, skew a selection using on-object handles; on **raw shapes only**, also **Distort** (move corners independently) and **Envelope** (deform via a mesh). Also relocates the **transform point (pivot)**.
**3. Location:** Tools panel (flyout with Gradient Transform).
**4. Icon conceptual description:** a square bounding box with corner handles around a shape (concept); our app draws its own.
**5. Shortcut:** `Q`.

**6. Mouse interaction:** hover over a selected object to see the transform box. Cursor changes by zone (field 9). Drag a zone to transform. The white circle **transform point** can be dragged anywhere (sets pivot).
**7. Touch interaction:** handles enlarged to ≥44 px touch targets; one-finger drag = move; two-finger pinch = scale; two-finger twist = rotate; long-press a corner = rotate mode; numeric fallback in Transform panel for precision.
**8. Selection behavior:** operates on the current selection. Single object → its own box. Multiple objects → one shared box around the union (transforms all; Distort/Envelope apply only if **all** members are raw shapes). A new box + transform point appear; the previous transform state is shown (box reflects current scale/rotation/skew).
**9. Drag behavior (zones):**
| Zone | Cursor | Drag does |
|---|---|---|
| Inside box (not on pivot) | move | translate |
| Corner handle | diagonal resize | scale (both axes) |
| Corner handle + just **outside** the corner | rotate arc | rotate around pivot |
| Edge midpoint | left-right / up-down | scale one axis |
| Edge midpoint + `Shift` (or a skew modifier) | skew arrows | skew along that axis |
| Transform point (white circle) | move pivot | relocate pivot |
| `Alt/Option`+corner rotate | rotate | rotate around the **opposite** corner |
**10. Double-click behavior:** double-click the transform point → **re-center it** to the selection's center; (legacy) double-click empty → exit transform mode.
**11. Right-click/context behavior:** Rotate 90° CW/CCW, Scale and Rotate… (numeric dialog), Flip Vertical/Horizontal, Remove Transform (reset), Distort toggle, Envelope toggle.
**12. Tool Options (Options area):** four sub-modes: **Scale**, **Rotate & Skew**, **Distort**, **Envelope**. Distort/Envelope only activate for raw-shape selections.
**13. Properties affected:** `transform.{x,y,scaleX,scaleY,rotation,skewX,skewY}` and `transform.pivot` (Part 33); under Distort/Envelope: `shape.path` vertices.
**14. What it can modify:** raw shapes (all modes incl. distort/envelope), drawing objects, groups, symbol instances, text blocks, bitmaps (move/rotate/scale/skew only).
**15. What it cannot modify:** **Distort/Envelope on symbols, bitmaps, video, sound, gradients, text** — Animate explicitly excludes these; only raw shapes distort. (Workaround: Break Apart text/symbol, or use Asset Warp tool.) Locked layers. Locked objects.
**16. Timeline interaction:** transforming while a keyframe is current records into that keyframe; Auto-Keyframe (legacy) can insert keys while scrubbing (P2 in our app).
**17. Keyframe interaction:** on a **motion tween span**, transforms create **independent per-property keyframes** (x, y, scaleX, scaleY, rotation, skewX, skewY each have their own keyframes — see Part 09). On classic tweens, a transform on an in-between frame inserts a keyframe.
**18. Vector interaction:** scale/rotate re-compute the path matrix; **Distort** moves the 4 corner vertices independently (perspective-ish quad); **Envelope** shows a mesh of points + tangent handles; dragging any mesh point warps the shape (paths re-fit to the deformed mesh).
**19. Bitmap interaction:** move/rotate/scale/skew only — no distort/envelope; use Asset Warp for pixel deformation.
**20. Symbol interaction:** transforms the instance; the pivot = instance **transform point** (distinct from the symbol's registration point — Part 11 explains both). Rotation happens around the pivot.
**21. Shape interaction:** merge shapes and drawing objects fully supported; envelope on raw fills/strokes.
**22. Common mistakes:** distort on a symbol is silently ignored → user thinks it's broken; skewing when meaning to scale (grabbed edge instead of corner); pivot left at a weird place → rotation swings wildly; envelope mesh edited then shape "explodes" if points cross.
**23. Professional use:** posing cut-out parts (rotate around joints); flipping walk-cycle limbs; scaling heads for squash-and-stretch; setting pivots **before** adding bones.
**24. Example workflow:** select arm symbol → `Q` → drag pivot to the shoulder joint → rotate arm up → keyframe at frame 1 → rotate down at frame 10 → motion tween (rotation property animates).
**25. Equivalent in our app:** a `TransformTool` that renders a bounding box + handle hit-zones; maps gestures to transform matrix ops; writes into the `Transform` component on the node; supports pivot editing; Distort/Envelope delegate to the Vector Engine's mesh deformer. Emits `TransformCommand` per gesture.
**26. Mobile implementation:** large handles; snap rotation to 15°; pivot drag via offset-loupe; two-finger pinch/rotate; numeric Transform panel as the precision path; distort/envelope via a "Warp mode" with drag points + on-screen magnification.
**27. Desktop implementation:** 8-handle box + rotation zone (outside corners) + pivot drag; full modifier support; live numeric readout; envelope mesh editing with tangent handles.

**EVENT SEQUENCE (rotate):**
```
pointerdown in rotate-zone → set mode=rotate; record pivot (transform point) in stage coords
pointermove               → compute angle = atan2(pointer-pivot) - grabAngle
                            → preview node.rotation = startRotation + angle
                            → Shift snaps to 15°/45°
pointerup                 → commit TransformCommand { node, before:{rotation}, after:{rotation} }
```
**MODIFIER MATRIX:**
| Modifier | Effect |
|---|---|
| Shift | proportional scale; rotate in 45° steps; skew on axis |
| Alt/Option | rotate around opposite corner; scale from center |
| Ctrl/Cmd | temporarily activate Selection |

**UNDO GRANULARITY:** one `TransformCommand` per gesture (stores before/after of all changed transform fields).
**MODEL WRITES:** `node.transform.{x,y,scaleX,scaleY,rotation,skewX,skewY,pivot}`; distort/envelope → `node.shape.path`.

---

## T2A.4 — GRADIENT TRANSFORM TOOL

**1. Official name:** Gradient Transform tool.
**2. Purpose:** Edit the transform of a **gradient or bitmap fill** applied to a shape: move center, scale/stretch, rotate, adjust focal point (radial), and tile/scale bitmap fills — without changing the shape geometry.
**3. Location:** Tools panel (flyout with Free Transform).
**4. Icon conceptual description:** a square with a diagonal gradient and a small rotation handle (concept).
**5. Shortcut:** `F`.

**6. Mouse interaction:** click a shape with a gradient/bitmap fill → its fill handles appear (center circle, bounding ring/square, rotate handle, focal point for radial). Drag each handle per field 9. Click another shape to switch.
**7. Touch interaction:** tap shape to reveal handles; drag handles (enlarged); two-finger twist to rotate the gradient; numeric gradient controls in the Color panel as fallback.
**8. Selection behavior:** requires a selected (or clicked) shape whose **fill style** is linear/radial gradient or bitmap. Only fill handles show; no object bounding box.
**9. Drag behavior (handles):**
| Handle | Drag does |
|---|---|
| Center | move gradient center |
| Square handle (edge) | scale/stretch the gradient along that axis |
| Circle handle (rotate) | rotate the gradient |
| Focal point (radial) | skew the transition toward one side |
| Bitmap-fill corner | scale/tile the bitmap pattern |
**10. Double-click behavior:** n/a.
**11. Right-click/context behavior:** reset gradient, convert to solid, open Color panel.
**12. Tool Options:** none (handles are contextual).
**13. Properties affected:** the fill style's **gradient transform matrix** (center, scaleX/Y, rotation, focal) — stored per fill style in `shape.fills[i].style.transform` (Part 33).
**14. What it can modify:** linear-gradient fills, radial-gradient fills, bitmap fills inside raw shapes and drawing objects.
**15. What it cannot modify:** solid fills; strokes; symbol instances; text (unbroken); anything whose fill isn't gradient/bitmap.
**16. Timeline interaction:** editing in a keyframe records into that keyframe; on static frames → auto-key (same rule as T2A.1 field 16).
**17. Keyframe interaction:** the gradient transform is part of the shape's fill style → participates in **shape tween** interpolation between keyframes (gradient rotates/scales morph smoothly).
**18. Vector interaction:** modifies fill style data only, never path geometry.
**19. Bitmap interaction:** bitmap *fills* only (a bitmap used as a fill pattern); not placed bitmap instances.
**20. Symbol interaction:** n/a directly (edit inside symbol mode).
**21. Shape interaction:** merge shapes + drawing objects.
**22. Common mistakes:** clicking a stroke or a solid fill (no handles appear); confusing focal point with center (radial gradients); expecting it to rotate the shape (it rotates the gradient only).
**23. Professional use:** lighting (radial highlight off-center = lit sphere), sky gradients, fake 3D shading, tiling a texture inside a shape.
**24. Example workflow:** fill a ball with radial gradient → `F` → drag center up-left, drag focal point to fake a light source → ball looks 3D → shape-tween the gradient later for a moving light.
**25. Equivalent in our app:** a `FillTransformTool` that exposes the fill's local transform matrix via handles; stores as `fillStyle.transform`; renders a live preview by re-rasterizing the fill. Delegates gradient math to the Color/Render engine (Part 32).
**26. Mobile implementation:** drag handles with snap; the Color panel provides numeric center/rotation/scale; two-finger twist = rotate gradient.
**27. Desktop implementation:** direct-manipulation handles + live preview; `Shift` snaps rotation to 45°; `Alt` resets.

**EVENT SEQUENCE (rotate gradient):**
```
pointerdown on rotate handle → mode=rotateFill
pointermove → gradient.transform.rotation += delta → re-render fill live
pointerup → commit FillTransformCommand
```
**UNDO GRANULARITY:** one `FillTransformCommand` per handle-drag.
**MODEL WRITES:** `shape.fills[i].style.transform.{center, scaleX, scaleY, rotation, focal}`.

---

## T2A.5 — 3D ROTATION TOOL (LEGACY)

**1. Official name:** 3D Rotation tool.
**2. Purpose:** (Legacy — ActionScript 3.0 documents only) Rotate **movie-clip instances** in simulated 3D around x/y/z axes for a 2.5D effect.
**3. Location:** Tools panel flyout (legacy).
**4. Icon conceptual description:** a circle with three 3D axis arrows (concept).
**5. Shortcut:** `W`.
**6. Mouse interaction:** hover a movie clip → 3D axis rings appear; drag a ring = rotate around that axis; drag center = free rotation; crosshair overlay shows the axes.
**7. Touch interaction:** two-finger twist = z rotation; drag axis rings for x/y; numeric panel for exact values.
**8. Selection behavior:** requires a movie-clip instance; no effect on other types.
**9. Drag behavior:** per-axis ring rotation; the instance re-projects (2.5D) live.
**10. Double-click behavior:** reset rotation (legacy).
**11. Right-click/context behavior:** reset 3D, switch global/local axes.
**12. Tool Options:** global vs local axis toggle (iconized).
**13. Properties affected:** `instance.rotationX/rotationY/rotationZ`.
**14. What it can modify:** movie-clip instances only.
**15. What it cannot modify:** shapes, groups, text, graphic/button symbols, HTML5/WebGL documents (unsupported outside AS3).
**16–17. Timeline/keyframe:** 3D values are per-keyframe; tweenable as property keyframes (rotationX/Y/Z animate independently).
**22. Common mistakes:** using it in HTML5 Canvas documents (unsupported — Animate silently doesn't offer it); confusing 3D rotation with the 2D rotation property.
**25. Equivalent in our app:** **not** a separate tool. Our app provides a **2.5D transform component** (`rotateX`, `rotateY` with perspective) on any node + camera z-depth parallax (Part 16). This covers the real use case (fake 3D) with a cleaner model.
**26–27. Mobile/desktop:** gesture-based 3D gizmo (mobile) / axis rings (desktop), only if the 2.5D component is enabled.

---

## T2A.6 — 3D TRANSLATION TOOL (LEGACY)

**1. Official name:** 3D Translation tool.
**2. Purpose:** (Legacy AS3) Move movie-clip instances along x/y/z in simulated 3D.
**3. Location:** Tools panel flyout (legacy).
**4. Icon conceptual description:** 3D axis arrows with a translate handle (concept).
**5. Shortcut:** `G`.
**6–11. Interactions:** drag an axis arrow = move along that axis; drag center = free move; touch: axis handles; double-click/context = reset; global/local toggle.
**13. Properties affected:** `instance.x/y/z`.
**14. What it can modify:** movie clips (legacy AS3).
**15. What it cannot modify:** everything else; non-AS3 docs.
**25. Equivalent in our app:** z-depth property on nodes/layers + camera (Part 16). No dedicated tool.

---

## T2A.7 — LASSO TOOL (+ POLYGON MODE, + MAGIC WAND)

**1. Official name:** Lasso tool; sub-modes: **Polygon Mode** and **Magic Wand**.
**2. Purpose:** Freeform-area selection (irregular outline); Polygon Mode selects via straight segments; Magic Wand selects same/similar-colored regions of a **broken-apart bitmap**.
**3. Location:** Tools panel (flyout).
**4. Icon conceptual description:** a lasso rope loop (concept); Polygon = lasso with straight edges; Wand = a wand with sparkle.
**5. Shortcut:** `L` (modes chosen in the Options area or the flyout).

**6. Mouse interaction:**
- **Lasso:** press and drag to trace a freeform loop; release closes the loop (straight line back to start); everything inside (and intersecting, if contact-sensitive) is selected.
- **Polygon Mode:** click to drop a vertex; click successive vertices; **double-click** to close.
- **Magic Wand:** single click on a color region; selects the contiguous area of same/similar color (within threshold).
**7. Touch interaction:** finger-drag traces the loop; Polygon Mode = tap per vertex, double-tap to close; Wand = tap a color. Threshold via a slider in Options.
**8. Selection behavior:** selects **raw-shape area** inside the loop (partial shape selection — only the enclosed pixels/regions of merge shapes) or **bitmap pixel regions** (after Break Apart) for the Wand. Symbols/groups/text are only selectable whole (the loop must fully enclose them; they cannot be partially lassoed). Shift = add to selection.
**9. Drag behavior:** freehand trace path; preview line follows pointer.
**10. Double-click behavior:** closes a Polygon Mode selection.
**11. Right-click/context behavior:** invert selection, select similar color, exit lasso mode.
**12. Tool Options:** Polygon Mode toggle; Magic Wand Mode toggle; **Magic Wand Threshold** (0–255; higher = more colors match) and **Smoothing** (pixels/rough/normal/smooth) for the Wand.
**13. Properties affected:** selection mask (which shape regions / bitmap pixels are selected) — transient; a subsequent move/cut/edit writes to the model.
**14. What it can modify:** raw merge shapes (partial area), broken-apart bitmaps (Wand region).
**15. What it cannot modify:** intact symbols/instances/text (only whole-object selection); groups; un-broken bitmaps (Wand does nothing until Break Apart).
**16–17. Timeline/keyframe:** selection is transient; the follow-up action (move/delete/fill) edits the current keyframe.
**18. Vector interaction:** partial-shape selection then move = **cut** that region away (merge model); then fill = paint region; delete = remove region (splits strokes).
**19. Bitmap interaction:** Wand = flood-fill selection by color similarity (connected-component + threshold); delete = transparent holes; move = cut region into a new bitmap.
**20. Symbol interaction:** whole-instance selection only when fully enclosed.
**21. Shape interaction:** partial region selection of merge shapes.
**22. Common mistakes:** forgetting to Break Apart a bitmap before Magic Wand (nothing happens); partial shape selection then deleting leaves stray stroke segments; threshold too low/high for the Wand.
**23. Professional use:** cutting texture regions; organic silhouette selection; cleaning scanned art (wand-select background → delete).
**24. Example workflow:** import a scanned drawing → Break Apart → Magic Wand (threshold ~30) click the white background → Delete → clean line art remains → trace/vectorize.
**25. Equivalent in our app:** a `LassoTool` with three modes over the Raster/Vector engines: freeform (polygonize the pointer path, then region-select by winding/point-in-polygon), polygon (same with click vertices), magic wand (BFS flood-fill on the raster buffer with per-channel threshold). Selection is a **mask** applied on the next command.
**26. Mobile implementation:** finger-drag lasso; tap-per-vertex polygon (double-tap closes); wand = tap; threshold slider always visible in Options; selection mask highlighted with marching-ants.
**27. Desktop implementation:** pointer path → polygon → scanline point-in-polygon for vector; flood-fill for raster.

**EVENT SEQUENCE (wand):**
```
pointerdown on bitmap → mode=wand → BFS flood-fill from pixel (threshold) → region mask
pointerup → selection = region mask (no model write yet)
next action (delete/fill/move) → command writes to model
```
**UNDO GRANULARITY:** the *follow-up* command (e.g., DeleteRegion) is the undo unit; the selection itself is not undoable.
**MODEL WRITES:** depends on follow-up: `shape.path` (region cut), bitmap pixel buffer (delete), etc.

---

## 02a BUILD CHECKPOINT

After implementing these 7 tools, the editor must be able to:

- [ ] Click-select any object; Shift-toggle; marquee-select (both contact-sensitive modes).
- [ ] Move a selection with snapping; undo/redo each move.
- [ ] Reshape a vector edge/corner with the Selection tool; undo restores the path.
- [ ] Edit anchors + Bézier handles with Subselection; toggle corner↔smooth; split handles with Alt.
- [ ] Free-transform: move/rotate/scale/skew + relocate the pivot; numeric readout.
- [ ] Distort/Envelope raw shapes (only raw shapes).
- [ ] Transform a gradient's center/rotation/focal and a bitmap fill's tiling.
- [ ] Lasso freeform + polygon selection; Magic-Wand color selection on a broken-apart bitmap.
- [ ] All of the above through **touch** (tap/drag/pinch/twist/long-press) with the mobile mappings specified.
- [ ] Cross-platform: identical behavior on Windows/macOS/Linux desktop and on tablets (pointer events unified — Part 31).

*Next: `02b_tools_drawing.md` — Pen (+anchor sub-tools), Text, Line, Rectangle, Oval, Rectangle/Oval Primitives, PolyStar.*

---

<!-- ===== FILE: 02b_tools_drawing.md ===== -->

# PART 02b — EVERY TOOL: DRAWING TOOLS (GEOMETRIC & PATH)
### Deep 27-field specification. This file covers: Pen (+ Add/Delete/Convert Anchor sub-tools), Text, Line, Rectangle, Oval, Rectangle Primitive, Oval Primitive, PolyStar.

> Same 27-field schema as `02a_tools_selection_transform.md`. Drawing tools share a common "**draw gesture**" contract: `down → (anchor or drag) → up → commit a DrawCommand that inserts a path/parametric shape into the current layer+frame`. Every drawing tool must honor: (1) the current **stroke** and **fill** style (Part 23), (2) the current **drawing mode** (merged vs object drawing — Part 06), (3) the current **frame/keyframe** target (Part 07/08), (4) **snapping** (grid/guides/objects/pixels), and (5) layer **lock/visibility** (Part 20). Details below assume you've read Part 01 §1.3.2 (Tool interface).

---

## T2B.1 — PEN TOOL (+ ADD / DELETE / CONVERT ANCHOR SUB-TOOLS)

**1. Official name:** Pen tool; sub-tools: Add Anchor Point tool, Delete Anchor Point tool, Convert Anchor Point tool.
**2. Purpose:** Draw precise Bézier paths by placing anchors. Click = straight/corner anchor; click-drag = curve anchor (drags out tangent handles). The sub-tools edit an existing path's anchor topology (add/delete) and point type (corner↔smooth). This is the precision path authoring tool (vs Pencil's freehand).
**3. Location:** Tools panel (flyout holds the 3 sub-tools).
**4. Icon conceptual description:** a fountain-pen nib (concept); sub-tools: pen with a "+", pen with a "−", pen with a caret/corner (concept).
**5. Shortcut:** `P`.

**6. Mouse interaction:**
- **Click (no drag):** place a **corner anchor**. A preview segment (rubber-band) connects the previous anchor to the cursor.
- **Click-drag:** place a **curve anchor** — dragging pulls the tangent handles; the outgoing handle follows the pointer, the incoming handle mirrors it (smooth point).
- **Click on the starting anchor:** close the path (fills it if a fill is set).
- **Hover an existing path:** cursor switches to Add-anchor (pen +) on a segment, Delete-anchor (pen −) over an anchor, Convert (caret) over an anchor with Alt/Option held.
- **Continue an open path:** click its end anchor to append.
**7. Touch interaction:** tap = corner anchor; tap-drag = curve anchor (finger-offset loupe shows the handles); double-tap on start anchor = close path; long-press anchor = add/delete/convert menu; two-finger = pan/zoom.
**8. Selection behavior:** none on existing objects — the Pen owns the path being built. When the path closes/completes, it becomes selected (so Properties shows its fill/stroke).
**9. Drag behavior:** dragging from a placed anchor defines the tangent **direction and length** of the outgoing handle (mirrored incoming handle for smooth points). A live curve preview bends toward the pointer.
**10. Double-click behavior:** double-click on the last anchor ends the path (open path, unfilled center if it's a filled-looking open path — fill only applies to enclosed regions at render).
**11. Right-click/context behavior:** close path, end path, cancel path, convert point (on existing anchors).
**12. Tool Options:** snap toggle; "Show Preview" (rubber-band + live curve preview — always on in our app); (option) magnet = snap anchors to grid/guides/objects.
**13. Properties affected:** creates/modifies `shape.path` (anchor positions, handle vectors, point types, closed flag). Fill/stroke styles come from the current Color settings (Part 23).
**14. What it can modify:** creates new vector paths; sub-tools edit **any** path (raw shape outline, drawing object path, mask shape).
**15. What it cannot modify:** bitmaps, text (unbroken), symbol instances (their transform), group internals without entering the group.
**16. Timeline interaction:** drawing adds content to the **current frame** of the **active layer**:
- active frame is a **keyframe** → content adds into it (merge) or a new drawing object is created (object mode).
- active frame is **blank keyframe** → you draw fresh into it.
- active frame is **empty/held** → our app auto-inserts a keyframe then draws (Animate behavior for drawing is to draw into the nearest keyframe/auto-key; we make it explicit with a toast).
- active layer is a **tween layer** → drawing is blocked (Animate: "you cannot draw in a tween layer"); our app shows a clear error + suggests a new layer.
- active layer is **locked/hidden** → blocked with reason.
**17. Keyframe interaction:** the path is stored in the current keyframe's content array. If you draw on a **motion-tween span** frame, Animate disallows; our app warns and creates a blank keyframe only if you confirm (to avoid corrupting tween spans).
**18. Vector interaction:** the core precision editor: corner anchors (two independent tangents), smooth anchors (mirrored tangents), closed vs open paths, per-anchor add/delete/convert. `Shift` while dragging a handle snaps to 45°. `Alt/Option` while dragging a handle **splits** the mirror (creates a corner). `Alt/Option`+click an anchor converts its type.
**19. Bitmap interaction:** none.
**20. Symbol interaction:** none directly (use inside symbol edit).
**21. Shape interaction:** raw shape = merge behavior; object mode = creates a Drawing Object. Closing a path with a fill set fills the enclosed area.
**22. Common mistakes:** not closing the path → fill doesn't appear; wrong handle direction → S-curves instead of C-curves; forgetting the Convert sub-tool exists and struggling to change a corner to a curve; drawing on a locked layer and seeing "nothing".
**23. Professional use:** clean character silhouettes; precise logo curves; motion-guide paths (Part 10); custom mask shapes (Part 21); cut-out rig shapes.
**24. Example workflow:** `P` → trace a head profile with 6 anchors (mix of corners and curves) → close the path → set fill skin color, stroke dark → `F8` convert to symbol.
**25. Equivalent in our app:** a `PenTool` writing anchors into the Vector Engine's path model, with live rubber-band + curve preview; the three sub-tools are **modifier states** (like modern editors: hold Alt = convert, hover+drag to add/delete) **and** standalone modes for touch. Emits one `DrawPathCommand` on completion (undoable in one step).
**26. Mobile implementation:** anchor placement with a magnified loupe; tap-drag for handles with offset; double-tap to close; long-press for anchor ops; an "undo last anchor" button (Backspace equivalent) always visible.
**27. Desktop implementation:** classic pen + rubber-band + snap; HUD showing segment length/angle; Esc cancels the in-progress path.

**EVENT SEQUENCE (draw a 3-anchor closed path):**
```
pointerdown (click)  → add anchor[0]
pointermove          → rubber-band preview from anchor[0] to cursor
pointerdown (click)  → add anchor[1] (straight segment committed)
pointerdown (drag)   → add anchor[2] as curve; drag defines handles (live curve preview)
pointerdown on anchor[0] → close path → commit DrawPathCommand { path, style }
```
**MODIFIER MATRIX:**
| Modifier | Effect |
|---|---|
| Shift | snap handle/segment to 45° |
| Alt/Option | split handles (corner) while dragging; convert point type on click |
| Ctrl/Cmd | temporarily activate Selection |

**UNDO GRANULARITY:** the whole path = one `DrawPathCommand` (undo removes the entire path). Sub-tool edits = one `PathEditCommand` each.
**MODEL WRITES:** `layers[i].frames[f].content.push({type:'shape'|'drawingObject', shape:{path, fills[], strokes[]}})`. Merged vs object mode changes the node type (Part 06/33).

---

## T2B.2 — TEXT TOOL

**1. Official name:** Text tool.
**2. Purpose:** Create and edit text. Three behavior types: **Static** (authored display text, rasterized/outlined at export), **Dynamic** (runtime-updatable text, e.g. score, captions), **Input** (user-editable fields, e.g. forms). (TLF = legacy Text Layout Framework, deprecated — documented only as history.)
**3. Location:** Tools panel.
**4. Icon conceptual description:** a letter "T" (concept).
**5. Shortcut:** `T`.

**6. Mouse interaction:**
- **Click on empty stage:** create **point text** (auto-width: box grows with content; no wrap).
- **Drag a rectangle:** create **fixed-width text** (box constrains width; text wraps).
- **Click inside an existing text block:** enter text-edit (caret + character selection with drag).
**7. Touch interaction:** tap = place point text; drag = fixed-width box; tap existing text = edit with the **system keyboard**; text-selection handles (like OS text editing) for select/copy/cut.
**8. Selection behavior:** a text block is a single selectable object. While in text-edit, the tool selects *characters* (caret + range), not the object. Exit edit (click empty / Esc / switch tool) returns to object selection.
**9. Drag behavior:** drag = size the fixed-width box (re-wraps text); drag from inside (edit mode) = select characters.
**10. Double-click behavior:** double-click a text block → enter character editing at that point.
**11. Right-click/context behavior:** cut/copy/paste text, font/size/color, align, convert to movie clip, Break Apart (characters → separate blocks; again → vector shapes), export text as PNG.
**12. Tool Options:** none in the Options area (all settings live in Properties — Part 26 text schema).
**13. Properties affected (model writes):** `textNode.text` (string), `textNode.style` { fontFamily, fontSize, color, bold, italic, align, letterSpacing, lineSpacing, underline… }, `textNode.box` { width, height, autoSize }, `textNode.type` (static/dynamic/input), `textNode.embedFonts` (glyph set), `textNode.antiAlias`, `textNode.selectable` (input), plus the shared `transform`.
**14. What it can modify:** creates/edits text blocks.
**15. What it cannot modify:** raw shapes, bitmaps, symbol instances — unless text is **broken apart** (Break Apart once = each character its own text block; twice = characters become vector shapes).
**16. Timeline interaction:** text lives on a frame/keyframe; draw-on-locked/tween-layer rules identical to T2B.1 field 16.
**17. Keyframe interaction:** text content is keyframable. **Motion tween** on text: Animate auto-wraps the text in a symbol (tweening text directly requires it). **Classic tween** needs text converted to a symbol first. **Shape tween** needs text broken apart to shapes. Our app enforces these with clear prompts instead of silent wraps.
**18. Vector interaction:** only after Break Apart×2 (text → vector outlines); then editable with Subselection/Pen.
**19. Bitmap interaction:** none (text is vector/glyph based).
**20. Symbol interaction:** text can be converted to a symbol (F8) or wrapped by motion tween; text inside symbols edits in symbol mode.
**21. Shape interaction:** break-apart text behaves as shapes (merge/object rules apply).
**22. Common mistakes:** expecting a shape tween on un-broken text; forgetting to **embed fonts** for dynamic text (runtime falls back to a system font, layout shifts); point vs box text confusion (auto-width vs wrap); anti-alias setting causing blurry small text.
**23. Professional use:** titles, lower-thirds, dynamic scoreboards/counters, input forms in interactive pieces, captions; break-apart for logo treatments.
**24. Example workflow:** `T` → type "TITLE" → set font/size/color in Properties → `F8` movie clip → keyframe fade-in (alpha 0→100 motion tween).
**25. Equivalent in our app:** a `TextTool` + **Text Engine** (Part 32): text nodes in the scene graph; glyph rendering via canvas `fillText` (web) / Skia/DirectWrite (desktop) / glyph atlas (export); a text style schema; runtime binding for dynamic text (bind `textNode.text` to a variable); font embedding list. Nothing Adobe-specific.
**26. Mobile implementation:** tap + system keyboard (IME-aware); drag handles for box sizing; font/size via panel; long-press for cut/copy/paste menu; text selection via native selection overlay.
**27. Desktop implementation:** inline editing with caret, IME support, double-click word select, rich text metrics (baseline, leading, tracking), spell-check optional.

**EVENT SEQUENCE (create point text):**
```
pointerdown on empty → create text node at point (autoSize=width)
→ enter edit mode; system IME opens (mobile)
typing → textNode.text += char (undo coalesced per word/session)
pointerdown outside / Esc / tool switch → exit edit → commit TextCommand
```
**UNDO GRANULARITY:** text typing is coalesced (one undo per typing session or word); a single `TextCommand` stores before/after string + style.
**MODEL WRITES:** `layers[i].frames[f].content.push({type:'text', text, style, box, textType, embedFonts})`.

---

## T2B.3 — LINE TOOL

**1. Official name:** Line tool.
**2. Purpose:** Draw a straight **stroke** between two points (no fill).
**3. Location:** Tools panel.
**4. Icon conceptual description:** a diagonal straight line (concept).
**5. Shortcut:** `N`.

**6. Mouse interaction:** press = start point; drag = rubber-band preview; release = commit. `Shift` constrains to 45° increments. (Press+drag then release all happen in one gesture.)
**7. Touch interaction:** finger drag; a "constrain" toggle (or auto-snap) replaces Shift; length/angle readout HUD for precision.
**8. Selection behavior:** the new stroke becomes selected on commit.
**9. Drag behavior:** rubber-band preview line.
**10. Double-click behavior:** n/a.
**11. Right-click/context behavior:** cancel stroke (Esc also cancels mid-drag).
**12. Tool Options:** snap (magnet); drawing mode (merged vs object); (option) show length/angle HUD.
**13. Properties affected:** creates a stroke path: `shape.strokes[0]` (or a stroke-only shape in object mode) with current stroke style { color, thickness, cap, join, style }.
**14. What it can modify:** creates strokes only.
**15. What it cannot modify:** fills; existing objects.
**16–17. Timeline/keyframe:** same draw-target rules as T2B.1 field 16/17.
**18. Vector interaction:** the line is a 2-anchor path; editable afterward with Selection/Subselection/Width tools.
**19. Bitmap interaction:** none.
**20. Symbol interaction:** none (convert after).
**21. Shape interaction:** merged mode → the line merges/splits other shapes it crosses (Part 06); object mode → independent object.
**22. Common mistakes:** wrong stroke thickness/color set earlier (check Color controls first); not holding Shift → off-axis line; expecting a fill.
**23. Professional use:** guidelines, speed lines, panel borders, horizon lines, technical edges.
**24. Example workflow:** `N` → set stroke 2px black → draw horizon with Shift → snap to grid.
**25. Equivalent in our app:** a `LineTool` = Pen with exactly 2 anchors, no curves, stroke-only. Reuses the stroke style system.
**26. Mobile implementation:** drag + snap; numeric length/angle entry for precision; constrain toggle.
**27. Desktop implementation:** Shift-snap to 45°; live length/angle HUD; snap to grid/guides/objects.

**EVENT SEQUENCE:**
```
pointerdown → record start (snapped)
pointermove  → preview line start→cursor (shift-snapped)
pointerup    → commit DrawPathCommand { path:[start,end], stroke:style }
```
**MODEL WRITES:** a stroke-only shape in the current frame.

---

## T2B.4 — RECTANGLE TOOL

**1. Official name:** Rectangle tool.
**2. Purpose:** Draw rectangles (with optional rounded corners) as raw merge shapes or drawing objects, with fill + stroke.
**3. Location:** Tools panel.
**4. Icon conceptual description:** a square/rectangle outline (concept).
**5. Shortcut:** `R`.

**6. Mouse interaction:** drag corner-to-corner. Modifiers: `Shift` = square; `Alt/Option` = draw from center; `Shift+Alt` = centered square. Release commits.
**7. Touch interaction:** drag between two corners; snap to grid; numeric W/H entry for precision.
**8. Selection behavior:** the new shape becomes selected on commit.
**9. Drag behavior:** rubber-band rectangle preview.
**10. Double-click behavior:** (legacy) opens Rectangle Settings (corner radius). Our app: the corner-radius control is always in Options/Properties, no modal.
**11. Right-click/context behavior:** cancel.
**12. Tool Options:** corner radius (0 = square, >0 = rounded, in px); snap; drawing mode.
**13. Properties affected:** creates a rect path (4 corners, optional rounded) + fill/stroke styles.
**14. What it can modify:** creates rectangles.
**15. What it cannot modify:** existing shapes.
**16–17. Timeline/keyframe:** standard draw-target rules.
**18. Vector interaction:** the rect is a 4-anchor closed path (or rounded with arcs); editable afterward.
**19. Bitmap interaction:** none.
**20. Symbol interaction:** none (convert after).
**21. Shape interaction:** merged mode merges/splits; object mode = atomic drawing object.
**22. Common mistakes:** drawing rounded when intending square (radius not reset); forgetting Shift → not square; expecting it to draw a perfect square without modifier.
**23. Professional use:** panels, UI boxes, backgrounds, mattes, color fields.
**24. Example workflow:** `R` → drag a backdrop → set fill → Arrange → Send to Back.
**25. Equivalent in our app:** `RectTool` emitting a `RectNode` (x, y, w, h, cornerRadius) — parametric until edited/broken; renderer tessellates to path on demand.
**26. Mobile implementation:** drag + numeric W/H + radius slider; snap.
**27. Desktop implementation:** Shift/Alt modifiers; live W/H HUD; radius via Options or a corner drag handle.

**MODEL WRITES:** `layers[i].frames[f].content.push({type:'rect', x, y, w, h, cornerRadius, fill, stroke})` (or baked path in merge mode — see Part 06).

---

## T2B.5 — OVAL TOOL

**1. Official name:** Oval tool.
**2. Purpose:** Draw circles/ellipses with fill + stroke.
**3. Location:** Tools panel.
**4. Icon conceptual description:** an ellipse outline (concept).
**5. Shortcut:** `O`.

**6. Mouse interaction:** drag a bounding box; `Shift` = circle; `Alt/Option` = from center; `Shift+Alt` = centered circle.
**7. Touch interaction:** drag; snap; numeric diameter entry.
**8. Selection behavior:** new shape selected on commit.
**9. Drag behavior:** rubber-band ellipse preview.
**10. Double-click behavior:** (legacy) Oval Settings: start/end angle + inner radius (donut/arc). Our app: these are always-visible Options (arc sweep + donut hole).
**11. Right-click/context behavior:** cancel.
**12. Tool Options:** start angle, end angle (arc/pie), inner radius (donut), close path toggle; snap; drawing mode.
**13. Properties affected:** ellipse path (arc segments) + fill/stroke.
**14. What it can modify:** creates ellipses.
**15. What it cannot modify:** existing shapes.
**16–17. Timeline/keyframe:** standard.
**22. Common mistakes:** forgetting Shift → ellipse not circle; donut settings left over from last time.
**23. Professional use:** heads, eyes, wheels, buttons, rings.
**24. Example workflow:** `O` → Shift-drag a circle → set radial gradient fill → Gradient Transform to light it.
**25. Equivalent in our app:** `EllipseTool` emitting an `EllipseNode` (cx, cy, rx, ry, startAngle, endAngle, innerRadius) — parametric until edited.
**26–27. Mobile/desktop:** as Rectangle; arc/donut via Options.

---

## T2B.6 — RECTANGLE PRIMITIVE TOOL / T2B.7 — OVAL PRIMITIVE TOOL

**1. Official name:** Rectangle Primitive tool; Oval Primitive tool.
**2. Purpose:** Draw rectangles/ovals whose parameters stay **editable after creation** — a "procedural/parametric" shape instead of a baked path. Change corner radius, start/end angles, inner radius later without redrawing.
**3. Location:** Tools panel flyout (with Rectangle/Oval).
**4. Icon conceptual description:** square/ellipse with a small handle dot (concept).
**5. Shortcut:** `R` / `O` (shared flyout).

**6. Mouse interaction:** same drag as Rectangle/Oval. After creation, dragging the **dot handle** on the shape adjusts its parameters live (radius / angles / hole).
**7. Touch interaction:** drag to create; drag handle dot to adjust parameters; numeric panel.
**8. Selection behavior:** selecting a primitive shows its **parameter handles** (dots) instead of raw-path anchors.
**9. Drag behavior:** handle drag = non-destructive parameter edit.
**10. Double-click behavior:** n/a.
**11. Right-click/context behavior:** convert to drawing object / break apart (bakes the path, losing parametric edit).
**12. Tool Options:** same numeric params as Rectangle/Oval (radius; start/end angle; inner radius) + snap + drawing mode.
**13. Properties affected:** `primitiveNode.params` { w, h, cornerRadius } or { cx, cy, rx, ry, startAngle, endAngle, innerRadius }. Properties panel shows these params until the shape is baked.
**14. What it can modify:** creates parametric primitives.
**15. What it cannot modify:** once broken apart / converted, it is a raw path (no more params).
**22. Common mistakes:** breaking apart too early and losing the ability to tweak radius; not noticing it's still parametric (Subselection won't show normal anchors until baked).
**23. Professional use:** UI elements you may resize/re-round later; placeholders whose proportions change during layout.
**24. Example workflow:** draw a rounded-rect button as a Primitive → later drag the dot to increase roundness → then bake to path for final edit.
**25. Equivalent in our app:** `RectPrimitiveNode` / `EllipsePrimitiveNode` storing parameters; rendered by tessellation; "bake to path" converts to a plain shape node. This is a small, high-value feature.
**26–27. Mobile/desktop:** drag + handle dot + numeric params.

---

## T2B.8 — POLYSTAR TOOL (POLYGON / STAR)

**1. Official name:** PolyStar tool.
**2. Purpose:** Draw regular polygons (3–32 sides) and stars (configurable point count + spike depth).
**3. Location:** Tools panel flyout (with Rectangle/Oval).
**4. Icon conceptual description:** a polygon outline (concept).
**5. Shortcut:** none by default (assignable).
**6. Mouse interaction:** drag a bounding box; the polygon/star is generated from current params.
**7. Touch interaction:** drag; params via Options.
**8–11. Interactions:** standard draw; Options dialog (or panel) sets: **Style** = Polygon | Star; **Number of Sides/Points** (3–32); **Star Point Size** (0–1; 0 = max spike depth, 1 = degenerate to polygon).
**12. Tool Options:** as above + snap + drawing mode.
**13. Properties affected:** parametric polygon/star record (or baked path).
**14. What it can modify:** creates polygons/stars.
**15. What it cannot modify:** existing shapes.
**22. Common mistakes:** wrong star-point size → skinny spikes or flat shape; forgetting sides count.
**23. Professional use:** starbursts, badges, gear teeth, decorative shapes.
**24. Example workflow:** PolyStar → 5 sides → drag → yellow fill → convert to symbol → rotate slowly (motion tween).
**25. Equivalent in our app:** `PolyTool` producing a parametric polygon/star node.
**26–27. Mobile/desktop:** drag + numeric panel.

---

## 02b BUILD CHECKPOINT

- [ ] Pen tool draws open/closed Bézier paths (corners + curves), with add/delete/convert anchor editing.
- [ ] Text tool: point + box text; static/dynamic/input types; font/size/color/align/spacing; break-apart ×2 to shapes.
- [ ] Line / Rectangle / Oval / PolyStar create shapes honoring current fill+stroke, merged vs object mode, and snapping.
- [ ] Primitives stay parametric (radius/angles/hole editable) until baked.
- [ ] Every draw tool: correct behavior on locked/hidden/tween layers; auto-keyframe rule on non-keyframe frames; undo = one command per drawn object.
- [ ] All tools work on desktop and touch with the specified equivalents.

*Next: `02c_tools_painting.md` — Pencil, Brush, Paint Brush (art/pattern), Fluid Brush (legacy), Eraser, Width.*

---

<!-- ===== FILE: 02c_tools_painting.md ===== -->

# PART 02c — EVERY TOOL: PAINTING & STROKE TOOLS
### Deep 27-field specification. This file covers: Pencil, Brush, Paint Brush (art/pattern), Fluid Brush (legacy), Eraser, Width.

> Same 27-field schema as `02a`. Painting tools share a **freehand-stroke contract**: `down → move(s) → up` produces a **stroke** (Pencil = stroke path; Brush = filled brush-stamp path; Paint Brush = pattern-on-path; Eraser = boolean subtraction). All must support **pressure** and **tilt** (stylus) and a **smoothing pipeline** — the single most-requested improvement from animators *[WISH W5]*: no preset-only sizes, a **free size slider**, and smooth strokes without angular artifacts.

### Stroke capture & smoothing (shared foundation)

Every freehand tool runs the same input pipeline (Part 32 Vector Engine):

```
pointermove events (60–240 Hz)
  → downsample/resample points to ~0.5–2 px spacing
  → apply smoothing:
      - Ramer–Douglas–Peucker (removes collinear noise)
      - moving-average / one-euro filter (jitter removal)
      - optional "straighten" (recognize near-straight runs → snap)
  → attach per-point attributes: pressure, tilt, velocity (for width)
  → build a variable-width stroke skeleton
  → commit on pointerup as one DrawCommand
```

The **smoothing amount** is a per-tool setting (0–100) exposed as a slider — this satisfies *[WISH W5]*. The pipeline is identical on desktop (mouse/stylus) and mobile (finger/stylus): only pressure/tilt sources differ.

---

## T2C.1 — PENCIL TOOL

**1. Official name:** Pencil tool.
**2. Purpose:** Freehand drawing of **strokes** (line-art) with automatic straightening/smoothing assist.
**3. Location:** Tools panel.
**4. Icon conceptual description:** a pencil (concept).
**5. Shortcut:** `Shift+Y` (current Animate); `Y` in older versions. (Our app: `P` is Pen, so keep Pencil distinct — see Part 29.)

**6. Mouse interaction:** press-drag to draw; release ends the stroke. No pressure (mouse) → constant width; stylus → variable width.
**7. Touch interaction:** finger/stylus drag; finger input gets stronger smoothing (jitter); stylus gets pressure→width.
**8. Selection behavior:** the new stroke becomes selected on commit.
**9. Drag behavior:** freehand path with live preview.
**10. Double-click behavior:** n/a.
**11. Right-click/context behavior:** convert to fill, edit points, apply stroke style.
**12. Tool Options:** drawing mode (merged/object) + **three assist modes**:
- **Straighten** — recognize near-straight/near-arc runs; snap them to straight lines & circular arcs (good for loose technical drawing).
- **Smooth** — simplify wobble into clean smooth curves (default for most line art).
- **Ink** — keep the raw path with minimal processing (faithful to hand).
Plus: smoothing strength slider (our app), snap toggle.
**13. Properties affected:** creates a stroke path with current stroke style { color, thickness, cap, join, style, widthProfile }.
**14. What it can modify:** creates strokes.
**15. What it cannot modify:** fills; existing objects.
**16–17. Timeline/keyframe:** standard draw-target rules (02b T2B.1 fields 16–17).
**18. Vector interaction:** the stroke is a path; editable afterward (Subselection/Width/Selection reshape).
**19. Bitmap interaction:** none.
**20. Symbol interaction:** none (convert after).
**21. Shape interaction:** merged mode merges with other strokes/shapes; object mode isolates.
**22. Common mistakes:** expecting a fill; wrong assist mode (Ink looks wobbly, Straighten looks stiff); stroke thickness set wrong beforehand.
**23. Professional use:** rough sketching, hand-drawn animation lines, gestural drawings.
**24. Example workflow:** Pencil + Ink → sketch a key pose loosely → refine with Subselection → ink clean pass with Smooth.
**25. Equivalent in our app:** `PencilTool` = freehand stroke tool with the 3 assist modes mapping to smoothing-strength presets + straighten recognizer. Reuses the shared smoothing pipeline.
**26. Mobile implementation:** finger smoothing always on (heavy); stylus pressure/tilt; the 3 modes as a segmented control; "undo last stroke" via two-finger tap or a floating button.
**27. Desktop implementation:** high-frequency pointer sampling → smoothing → path commit; live preview; Shift = straighten constrain.

**MODIFIER MATRIX:** Shift = force straight segments (line mode). Alt = temporarily Eyedropper (sample color). Space = pan.
**UNDO GRANULARITY:** one `DrawPathCommand` per stroke.
**MODEL WRITES:** `layers[i].frames[f].content.push({type:'shape', shape:{strokes:[{path, style, widthProfile}]}})`.

---

## T2C.2 — BRUSH TOOL

**1. Official name:** Brush tool.
**2. Purpose:** Paint freehand **fills** (solid blobs/strokes of fill color) with variable size, shape, pressure/tilt, and 5 **paint modes** that constrain where paint lands. Unlike Pencil (strokes), the Brush paints *fill* geometry.
**3. Location:** Tools panel.
**4. Icon conceptual description:** a paintbrush (concept).
**5. Shortcut:** `B`.

**6. Mouse interaction:** drag paints. Stylus pressure/tilt vary width/angle. Single click = a stamp (round cap) of the brush size.
**7. Touch interaction:** finger drag paints (constant size unless stylus); stylus → pressure/tilt.
**8. Selection behavior:** new painted fill selected on commit.
**9. Drag behavior:** continuous paint = a trail of stamps merged into one fill region.
**10. Double-click behavior:** n/a.
**11. Right-click/context behavior:** convert to outline, break apart.
**12. Tool Options:**
- **Brush Mode** (the 5 paint modes):
  1. **Paint Normal** — paint over everything (default).
  2. **Paint Fills** — paint fills only; strokes are left untouched (safe coloring over line art).
  3. **Paint Behind** — paint behind existing content on the same layer (like a background pass; does not cover existing art).
  4. **Paint Selection** — paint only within the currently selected fill's area (masked to selection).
  5. **Paint Inside** — paint only within the region where the stroke started (coloring inside lines without spilling).
- **Brush Size** — free slider (px) *[WISH W5]*.
- **Brush Shape** — round / flat / angled (dab profile).
- **Lock Fill** — keep gradient/bitmap fill continuity across strokes (shared gradient space).
- **Pressure / Tilt** toggles (visible when a stylus/tablet is connected).
**13. Properties affected:** creates fill geometry with current fill style (solid/gradient/bitmap); Lock Fill shares one gradient matrix across strokes.
**14. What it can modify:** creates fills; in Paint Selection/Inside, modifies constrained regions.
**15. What it cannot modify:** strokes (in Fills modes); locked layers; symbols/groups/text/bitmaps (not broken apart).
**16–17. Timeline/keyframe:** standard draw-target rules.
**18. Vector interaction:** the painted trail is a fill outline (closed region); can be reshaped later; Paint Inside/Fills use the existing shapes as implicit clip masks.
**19. Bitmap interaction:** a bitmap can be used as the **fill** (Lock Fill tiles it).
**20. Symbol interaction:** none (edit inside symbol mode).
**21. Shape interaction:** merge-mode fills merge with overlapping same-color fills; Paint Behind/Inside/Selection are mask-constrained painting.
**22. Common mistakes:** Paint Inside started outside the region → nothing paints; mode left on "Paint Behind" and later strokes vanish under art; forgetting Lock Fill → gradient restarts each stroke.
**23. Professional use:** cel shading, coloring line art (Paint Fills/Inside), soft background washes (Paint Behind), texture painting (bitmap fill).
**24. Example workflow:** ink line art → Brush + **Paint Fills** → color the character without touching the ink strokes.
**25. Equivalent in our app:** a `BrushTool` with the 5 modes implemented as **clip masks** over the shape stack (Part 06); pressure→width; Lock Fill = shared gradient coordinate space; size = free slider. Stamps are tessellated as round-cap polygons merged into the fill.
**26. Mobile implementation:** size slider always visible; modes as segmented control; pressure/tilt via stylus API; finger smoothing; two-finger tap = undo stroke.
**27. Desktop implementation:** stamp-based stroke tessellation (round caps) along the pointer path; stylus pressure/tilt; live preview.

**EVENT SEQUENCE:**
```
pointerdown → begin fill trail (respect mode's mask: selection/inside region captured at down)
pointermove  → append stamps (pressure→width) → live preview
pointerup    → commit DrawFillCommand { path, fillStyle, lockFill }
```
**UNDO GRANULARITY:** one `DrawFillCommand` per stroke.
**MODEL WRITES:** `layers[i].frames[f].content.push({type:'shape', shape:{fills:[{path, style, lockFillMatrix}]}})`.

---

## T2C.3 — PAINT BRUSH TOOL (ART / PATTERN BRUSHES)

**1. Official name:** Paint Brush tool.
**2. Purpose:** Draw stroke-based **Art Brush** and **Pattern Brush** strokes — a piece of brush artwork **stretched (Art)** or **tiled (Pattern)** along the drawn path (Illustrator-style brushes). Added in Animate 2018+; **distinct from the legacy Brush (T2C.2)** which paints plain fills.
**3. Location:** Tools panel.
**4. Icon conceptual description:** a brush with a stylized pattern swatch beside it (concept).
**5. Shortcut:** `Y` (current releases).
**6. Mouse interaction:** drag draws; pressure/tilt modulate width (stylus).
**7. Touch interaction:** drag; stylus pressure/tilt.
**8. Selection behavior:** new stroke selected.
**9. Drag behavior:** paints the brush pattern along the path live.
**10. Double-click behavior:** n/a.
**11. Right-click/context behavior:** convert lines to fills, edit stroke style, remove brush.
**12. Tool Options:** drawing mode (object drawing is recommended/default — heavy vector data); **Stroke Style dropdown** (all brushes in the doc + Brush Library); **Edit Stroke Style** → Art/Pattern brush options:
- Art Brush: name; **Scale Proportionately** / **Stretch to Fit Stroke Length** / **Stretch Between Guides** (head/tail unstretched); overlap handling.
- Pattern Brush: **Stretch to fit / Add space to fit / Approximate path**; **Flip** H/V; **Spacing** (gap between tiles); **At corners** = Center / Flank / Slice / Overlap (corner tile generation).
**13. Properties affected:** stroke style = a **brush definition** (referenced artwork + mapping rules); width; variable width profile.
**14. What it can modify:** creates brush strokes; applies brush style to existing paths.
**15. What it cannot modify:** bitmaps directly (brush artwork can contain bitmaps though).
**16–17. Timeline/keyframe:** standard; brush strokes tween as strokes (shape-tweenable).
**18. Vector interaction:** the stroke spine is a path; the pattern is mapped onto it at render time (stretch/tile).
**19. Bitmap interaction:** brush artwork may include raster content (rendered as part of the brush).
**20. Symbol interaction:** none.
**21. Shape interaction:** object-drawing default → each stroke independent (avoids expensive merging).
**22. Common mistakes:** heavy vector brushes slow playback (use object mode; convert lines to fills only when necessary); confusing with the plain Brush.
**23. Professional use:** textured ink lines, consistent calligraphy, decorative strokes, hair/rope strands.
**24. Example workflow:** select an Art Brush → draw hair strands → convert lines to fills for a stylized painted look.
**25. Equivalent in our app:** a `BrushStrokeNode` referencing a **brush asset** (vector pattern + mapping rules: stretch/tile/guides/spacing/corners) + path + width profile; the renderer tessellates the pattern along the spine (GPU-friendly: precompute tiled geometry, instance along path). Brushes live in the Library (Part 12) and a Brush Library panel.
**26. Mobile implementation:** pressure-aware; brush picker panel (thumbnails); spacing/flip controls in panel.
**27. Desktop implementation:** GPU tessellation of pattern along the spine; caching of tessellated geometry; live preview while drawing.

**MODEL WRITES:** `layers[i].frames[f].content.push({type:'brushStroke', brushAssetId, path, widthProfile})`.

---

## T2C.4 — FLUID BRUSH TOOL (LEGACY — REMOVED)

**1. Official name:** Fluid Brush tool (CS5.5-era; removed in later releases).
**2. Purpose:** Paint with a fluid, pressure-responsive "ink" brush with adjustable size, ink length/volume, and smoothness.
**3. Location:** (historical) Tools panel.
**4. Icon conceptual description:** brush with a droplet (concept).
**5. Shortcut:** (legacy) `Shift+B`.
**12. Tool Options:** size; ink volume/length; smoothness.
**22. Common mistakes:** — (feature removed).
**25. Equivalent in our app:** **do not ship a separate tool.** Fold "fluid" behavior into the Brush tool as a **smoothing + taper + ink-flow** setting (P2). Documented here only for completeness so the blueprint covers every historical tool.

---

## T2C.5 — ERASER TOOL

**1. Official name:** Eraser tool.
**2. Purpose:** Erase strokes and fills by painting a deletion mask; 5 modes limit what is erased; a **Faucet** option deletes an entire fill or stroke segment in one click.
**3. Location:** Tools panel.
**4. Icon conceptual description:** an eraser (concept).
**5. Shortcut:** `E`.

**6. Mouse interaction:** drag erases under the cursor; single click = one eraser stamp.
**7. Touch interaction:** finger drag erases; pressure → eraser size; stylus supported.
**8. Selection behavior:** none.
**9. Drag behavior:** continuous erase along the path.
**10. Double-click behavior:** (legacy) double-click the Eraser tool clears **everything on the stage** (all unlocked layers' current frames). Our app: a "Clear Stage" button with confirmation instead of a hidden double-click.
**11. Right-click/context behavior:** n/a.
**12. Tool Options:**
- **Eraser Mode:** **Erase Normal** (everything), **Erase Fills**, **Erase Lines**, **Erase Selected Fills** (only inside the selected fill), **Erase Inside** (only the region where the drag started).
- **Eraser Shape:** round / square.
- **Faucet:** click = delete an entire fill or connected stroke segment.
- **Size** (slider, *[WISH W5]*).
**13. Properties affected:** removes/trims path & fill geometry; **splits strokes** at the erase boundary (a stroke crossed by the eraser becomes two segments).
**14. What it can modify:** raw shapes (merge shapes): strokes, fills.
**15. What it cannot modify:** symbols, groups, text, bitmaps (must break apart first); locked layers.
**16–17. Timeline/keyframe:** edits current frame/keyframe; erasing on a non-keyframe auto-keys.
**18. Vector interaction:** erasing = **boolean subtraction** applied to path/fill outlines; the eraser's circular stamp is subtracted from the shape's geometry (Part 06 boolean ops).
**19. Bitmap interaction:** none (not broken apart).
**20. Symbol interaction:** none (edit inside).
**21. Shape interaction:** mode masks constrain subtraction (fills-only / lines-only / inside / selection).
**22. Common mistakes:** erasing symbols (no effect — break apart first); Erase Inside started on the wrong region; faucet accidentally deleting a whole fill.
**23. Professional use:** cel cleanup, cutting holes, splitting line art, removing stray marks.
**24. Example workflow:** Eraser + **Erase Lines** → remove stray ink strokes without harming painted fills.
**25. Equivalent in our app:** `EraserTool` = boolean subtraction (vector) or alpha-mask clear (raster layer); Faucet = delete-connected-component hit; modes = mask constraints. Erase is implemented as a series of circular stamps unioned, then subtracted from shape outlines.
**26. Mobile implementation:** finger erase with size slider; faucet via long-press; undo per stroke.
**27. Desktop implementation:** stamp-based boolean ops with path splitting at boundaries.

**EVENT SEQUENCE:**
```
pointerdown → capture mode mask (selected fill / inside region)
pointermove  → subtract eraser stamps from shape geometry (live preview)
pointerup    → commit EraseCommand { shapes[], removedRegions }
```
**UNDO GRANULARITY:** one `EraseCommand` per erase stroke.
**MODEL WRITES:** updates `shape.path` / `shape.fills[]` / `shape.strokes[]` (split/removed).

---

## T2C.6 — WIDTH TOOL

**1. Official name:** Width tool.
**2. Purpose:** Add **variable width** to a stroke by dragging **width points** along it; save/reuse **width profiles**; asymmetric width via one-sided drag.
**3. Location:** Tools panel.
**4. Icon conceptual description:** a line with a bulge/width point and handles (concept).
**5. Shortcut:** `U`.

**6. Mouse interaction:** hover a stroke → width points appear; drag a point to widen/narrow (symmetric); drag a point along the stroke to move it; `Alt/Option`+drag one side of a handle = asymmetric width.
**7. Touch interaction:** drag width handles (enlarged); pinch to adjust symmetric width; numeric width entry in Info panel.
**8. Selection behavior:** operates on the **hovered/active stroke only** (for multiple strokes, only the active one edits).
**9. Drag behavior:** symmetric width by default; asymmetric with Alt; movement constrained between neighboring width points.
**10. Double-click behavior:** n/a.
**11. Right-click/context behavior:** delete width point, reset width, save profile.
**12. Tool Options:** none beyond handles; width profiles saved in Properties (Part 26).
**13. Properties affected:** per-point stroke width values → a **width profile** `stroke.widthProfile = [{t, wL, wR}]`; saved profiles go to a profile list.
**14. What it can modify:** strokes (variable width).
**15. What it cannot modify:** fills, bitmaps, text; only one stroke at a time.
**16–17. Timeline/keyframe:** width data is per-stroke; **shape-tweenable** (variable-width strokes shape-tween; width profiles also tween).
**18. Vector interaction:** the renderer offsets the stroke outline by the interpolated width at each point (left/right independently for asymmetry).
**19. Bitmap interaction:** none.
**20. Symbol interaction:** none (edit inside).
**21. Shape interaction:** works on raw strokes and drawing-object strokes.
**22. Common mistakes:** editing the wrong stroke (only active stroke edits); width points constrained by neighbors (can't push past an adjacent point); forgetting to save the profile for reuse.
**23. Professional use:** tapered hair/limb outlines, calligraphy, anime-style line weight variation.
**24. Example workflow:** draw a leg outline → `U` → widen at the knee, taper at the ankle → save profile → apply the same profile to the other leg.
**25. Equivalent in our app:** stroke `widthProfile` array on the stroke; `WidthTool` edits it via handles; the Vector Engine's stroke outline generator consumes it; profiles are Library-reusable assets.
**26. Mobile implementation:** width handle drag; asymmetric via two-handle loupe; numeric width input.
**27. Desktop implementation:** per-point width gizmo + profile save/apply; live re-render.

**MODEL WRITES:** `shape.strokes[i].widthProfile`.

---

## 02c BUILD CHECKPOINT

- [ ] Freehand pipeline: resample + smooth + straighten + pressure/tilt attributes, with a smoothing slider.
- [ ] Pencil with 3 assist modes (Straighten/Smooth/Ink).
- [ ] Brush with 5 paint modes + free size slider + Lock Fill + pressure/tilt.
- [ ] Paint Brush with Art/Pattern mapping (stretch/tile/guides/spacing/corner tiles) from a brush library.
- [ ] Eraser with 5 modes + Faucet + stroke splitting; undo per stroke.
- [ ] Width tool: per-point width + asymmetric handles + saved profiles.
- [ ] Touch equivalents for all; stylus pressure/tilt on both desktop and tablet.

*Next: `02d_tools_utility.md` — Eyedropper, Paint Bucket, Ink Bottle, Hand, Zoom, Stage Rotate, Time Scrubber, Bone, Bind, Camera, Asset Warp, Deco/Spray (legacy).*

---

<!-- ===== FILE: 02d_tools_utility.md ===== -->

# PART 02d — EVERY TOOL: UTILITY, VIEW, RIGGING & CAMERA TOOLS
### Deep 27-field specification. This file covers: Eyedropper, Paint Bucket, Ink Bottle, Hand, Zoom, Stage Rotate, Time Scrubber, Bone, Bind, Camera, Asset Warp, Deco (legacy), Spray Brush (legacy).

> Same 27-field schema as `02a`. Rigging tools (Bone, Bind, Asset Warp) are expanded in Parts 14 & 02-AW notes; the Camera tool is expanded in Part 16. Here each gets its full 27 fields; the later parts dive into the engine math (IK solving, mesh deformation, camera matrix).

---

## T2D.1 — EYEDROPPER TOOL

**1. Official name:** Eyedropper tool.
**2. Purpose:** Sample a **fill or stroke style** (solid color, gradient, or bitmap fill) from an object so it can be applied elsewhere; combined with Paint Bucket / Ink Bottle it copies styles between objects.
**3. Location:** Tools panel.
**4. Icon conceptual description:** an eyedropper (concept).
**5. Shortcut:** `I`.

**6. Mouse interaction:** click a fill → samples the fill style into the current fill; click a stroke → samples the stroke style into the current stroke. (Legacy flow: after sampling, the tool auto-switches to Paint Bucket/Ink Bottle to apply. *[WISH W6]* Our app: sampling **never** applies/paints on hover or click — it only copies to the style clipboard; a separate explicit action applies. This fixes Animate's "eyedropper paints your whole layer on hover" complaint.)
**7. Touch interaction:** tap to sample → a floating **style chip** appears → tap a target object to apply (or drag chip onto target).
**8. Selection behavior:** none.
**9. Drag behavior:** n/a.
**10. Double-click behavior:** n/a.
**11. Right-click/context behavior:** "Apply sampled style to selection" / "Paste fill style" / "Paste stroke style".
**12. Tool Options:** sample fill only / sample stroke only / sample both (mode toggle).
**13. Properties affected:** the current fill/stroke style in the Color controls (and a **style clipboard** {fill, stroke} in our app).
**14. What it can modify:** copies styles.
**15. What it cannot modify:** geometry.
**16–17. Timeline/keyframe:** none (style copy only).
**22. Common mistakes:** sampling a stroke when meaning to sample a fill; expecting the clicked object itself to change (it doesn't); (Animate) accidentally painting the layer on hover.
**23. Professional use:** matching colors across a scene; copying a complex gradient from one shape to many.
**24. Example workflow:** `I` → click a shaded ball (samples its radial gradient) → select other balls → "Apply fill style" → all match.
**25. Equivalent in our app:** `EyedropperTool` reading the style under the pointer + a **style clipboard** + explicit apply. Also a "Copy/Paste Style" command (works on selection, no tool needed).
**26. Mobile implementation:** tap sample → style chip → tap target to apply; long-press chip for fill/stroke/both options.
**27. Desktop implementation:** hover preview (color under cursor) + click sample + apply via modifier (Alt-click = apply to target).

---

## T2D.2 — PAINT BUCKET TOOL

**1. Official name:** Paint Bucket tool (fills enclosed areas).
**2. Purpose:** Fill an enclosed region with the current fill (solid/gradient/bitmap); a **gap tolerance** lets it fill near-closed shapes.
**3. Location:** Tools panel.
**4. Icon conceptual description:** a tipping paint bucket (concept).
**5. Shortcut:** `K`.

**6. Mouse interaction:** click inside a closed region to fill it.
**7. Touch interaction:** tap a region to fill.
**8. Selection behavior:** none.
**9. Drag behavior:** n/a.
**10. Double-click behavior:** n/a.
**11. Right-click/context behavior:** n/a.
**12. Tool Options:** **Gap Size** — Don't Close Gaps / Close Small / Close Medium / Close Large (how big a gap in the outline the fill can bridge); **Lock Fill** (gradient continuity across fills).
**13. Properties affected:** region's fill style.
**14. What it can modify:** enclosed fill regions of raw shapes.
**15. What it cannot modify:** strokes; symbols/groups/text/bitmaps (not broken apart).
**16–17. Timeline/keyframe:** edits current frame/keyframe (auto-key on static frames).
**18. Vector interaction:** flood-fill over vector regions using winding/even-odd rules; gap tolerance = morphological close on the outline before filling.
**19. Bitmap interaction:** none (bitmap *fill* style is applied to a vector region).
**20. Symbol interaction:** none.
**21. Shape interaction:** merge shapes & drawing objects.
**22. Common mistakes:** region not closed → nothing fills (raise gap tolerance); gradient appearing shifted (Lock Fill off).
**23. Professional use:** flat coloring, quick base colors, filling traced line art.
**24. Example workflow:** trace a character → Paint Bucket (Close Small Gaps) → click each region to drop flat colors.
**25. Equivalent in our app:** `BucketTool` = flood-fill over vector regions + gap tolerance (dilate/close the outline) + Lock Fill (shared gradient matrix). Reuses the fill style system.
**26. Mobile implementation:** tap-to-fill; gap tolerance slider; long-press to pick fill from a palette.
**27. Desktop implementation:** flood fill + gap tolerance; Live Preview highlight of the region under cursor before clicking.

---

## T2D.3 — INK BOTTLE TOOL

**1. Official name:** Ink Bottle tool.
**2. Purpose:** Apply a **stroke** (color/width/style) to an existing shape's outline — the stroke counterpart of the Paint Bucket.
**3. Location:** Tools panel.
**4. Icon conceptual description:** an ink bottle with a nib (concept).
**5. Shortcut:** `S`.

**6. Mouse interaction:** click a shape → applies the current stroke style to its outline.
**7. Touch interaction:** tap a shape → apply stroke.
**8. Selection behavior:** none.
**9. Drag behavior:** n/a.
**10. Double-click behavior:** n/a.
**11. Right-click/context behavior:** n/a.
**12. Tool Options:** none.
**13. Properties affected:** stroke style/width of the clicked outline.
**14. What it can modify:** outlines of raw shapes (add or restyle a stroke).
**15. What it cannot modify:** fills (only outline); symbols/text/bitmaps.
**22. Common mistakes:** confusing with Paint Bucket (stroke vs fill); clicking the fill instead of the outline edge.
**23. Professional use:** adding outlines to fills, re-inking, consistent stroke restyling.
**24. Example workflow:** draw a fill-only shape → Ink Bottle → click it → gets a 2px dark outline.
**25. Equivalent in our app:** `InkBottleTool` = set-stroke-style on hovered shape outline.
**26–27. Mobile/desktop:** tap/click to apply; hover preview.

---

## T2D.4 — HAND TOOL

**1. Official name:** Hand tool.
**2. Purpose:** Pan the viewport (scroll the canvas) — never moves content.
**3. Location:** Tools panel (View section).
**4. Icon conceptual description:** a hand (concept).
**5. Shortcut:** `H` (Spacebar = temporary Hand from any tool).
**6. Mouse interaction:** drag to pan; release stops.
**7. Touch interaction:** two-finger drag pans (app convention); edge rubber-band.
**8–11. Selection/drag/double/context:** n/a (view-only).
**12. Tool Options:** none.
**13. Properties affected:** viewport scroll offset only (view state, not document).
**16–17. Timeline/keyframe:** none.
**22. Common mistakes:** thinking Hand moves objects.
**25. Equivalent in our app:** viewport pan via camera offset; spacebar-drag universal; inertia pan optional.
**26. Mobile implementation:** two-finger pan; pinch zoom; double-tap to fit.
**27. Desktop implementation:** pointer capture + delta pan; spacebar temporary mode.

---

## T2D.5 — ZOOM TOOL

**1. Official name:** Zoom tool.
**2. Purpose:** Zoom the viewport in/out (view-only).
**3. Location:** Tools panel (View section).
**4. Icon conceptual description:** a magnifying glass (concept).
**5. Shortcut:** `Z` (global: Ctrl+= in / Ctrl+- out / Ctrl+1 = 100%).
**6. Mouse interaction:** click = zoom in a step; `Alt/Option`+click = zoom out; drag = zoom to the marquee rectangle.
**7. Touch interaction:** pinch to zoom; double-tap to toggle zoom in/out.
**8–11. Selection/drag/double/context:** n/a.
**12. Tool Options:** Zoom In / Zoom Out toggle.
**13. Properties affected:** viewport zoom only.
**16–17. Timeline/keyframe:** none.
**22. Common mistakes:** confusing view zoom with object scale, and with **camera zoom** (Part 16 — camera is animatable and affects export; view zoom is neither).
**25. Equivalent in our app:** viewport scale (screen transform), independent of the camera layer transform.
**26. Mobile implementation:** pinch + double-tap.
**27. Desktop implementation:** wheel+Ctrl zoom; marquee zoom.

---

## T2D.6 — STAGE ROTATE TOOL

**1. Official name:** Stage Rotate tool (recent addition).
**2. Purpose:** Rotate the **view** of the stage (like turning a drawing desk) — a transient authoring rotation, not an animation property.
**3. Location:** Tools panel (View flyout).
**4. Icon conceptual description:** a rotating-frame icon (concept).
**5. Shortcut:** `Shift+H`.
**6. Mouse interaction:** drag to rotate the view around the viewport center.
**7. Touch interaction:** two-finger twist.
**12. Tool Options:** reset rotation (snap back to 0°).
**13. Properties affected:** view rotation only.
**25. Equivalent in our app:** a "rotate canvas" view feature (very useful on tablets); not persisted to the document.
**26–27. Mobile/desktop:** twist gesture / drag.

---

## T2D.7 — TIME SCRUBBER TOOL

**1. Official name:** Time Scrubber tool (recent addition).
**2. Purpose:** Scrub the playhead by dragging **anywhere on the stage** (horizontal drag = time), instead of grabbing the timeline.
**3. Location:** Tools panel (View flyout).
**4. Icon conceptual description:** a clock-with-scrub-arrow icon (concept).
**5. Shortcut:** `Shift+Alt+H`.
**6. Mouse interaction:** horizontal drag scrubs time; vertical drag (optional) scales scrub sensitivity.
**7. Touch interaction:** one-finger horizontal drag scrubs (great for reviewing on tablets).
**13. Properties affected:** playhead position (view/transport state).
**25. Equivalent in our app:** a scrub gesture/button; also scrubbing the stage edge. Low priority (P2).

---

## T2D.8 — BONE TOOL

*(Engine math & constraints: Part 14. Full 27 fields here.)*

**1. Official name:** Bone tool.
**2. Purpose:** Create **inverse-kinematics armatures**: (a) chain **symbol instances** into a jointed skeleton, or (b) carve bones **inside a raw shape** (IK shape). Then **pose** the armature by dragging bones, and animate poses on a **pose layer**.
**3. Location:** Tools panel.
**4. Icon conceptual description:** a small bone / jointed stick-figure glyph (concept).
**5. Shortcut:** `M`.

**6. Mouse interaction:**
- **Add bones to symbols:** click the first instance to set the **root**; then click-drag from the parent joint to the next instance to add a child bone; repeat to chain (shoulder→elbow→wrist).
- **Add bones to a shape:** select the whole shape; with the Bone tool, click-drag inside the shape to carve the first bone; drag from the previous bone's tail to carve the next.
- **Pose:** drag a bone → the IK solver moves the chain; drag the end bone (e.g. hand) → whole chain follows.
**7. Touch interaction:** drag from joint to joint to add bones; drag a bone to pose; long-press a joint for constraint options.
**8. Selection behavior:** clicking a bone selects it; Shift+click = multi-select bones; **double-click a bone = select all bones in the armature**; clicking a pose-layer frame selects the whole armature.
**9. Drag behavior:** adding = drag out a new bone; posing = drag a bone (IK solver updates downstream joints).
**10. Double-click behavior:** select whole armature.
**11. Right-click/context behavior:** Insert Pose, Remove Bone, Remove Armature, Add Spring, rotation/translation constraints.
**12. Tool Options:** none in Options area; per-bone settings live in Properties (Part 26 bone schema).
**13. Properties affected:** bone graph {parent, child, length, angle}; per-bone **rotation constraint** (min/max °), **translation constraint** (x/y enable), **joint speed**, **spring** (strength/damping); the armature **pose** (all joint angles/positions); pose layer type.
**14. What it can modify:** symbol instances (chained into armature) or a raw shape (carved armature, IK shape); pose layers.
**15. What it cannot modify:** non-instance art without conversion; a too-complex shape (Animate prompts to convert to a movie clip first); **one armature per pose layer**; armatures cannot mix with drawing on the same layer.
**16. Timeline interaction:** creates a **pose layer** (green). **Insert Pose** (right-click frame) records the current armature configuration as a pose; frames **between poses are auto-interpolated** (bone angles/positions tween).
**17. Keyframe interaction:** each pose = a pose keyframe (diamond). Bone angle/translation tween between poses. Two armature types in Properties: **Author-time** (tweened in the timeline) vs **Runtime** (manipulated by script at runtime — legacy AS3).
**18. Vector interaction (IK shapes):** bones deform the shape via **control-point binding** (each bone pulls nearby contour points); adding bones to a shape restricts later editing (no scale/skew, no new strokes, no in-place edit).
**19. Bitmap interaction:** symbols containing bitmaps can be boned (the bitmap deforms via the symbol's transform).
**20. Symbol interaction:** chains instances; moving a bone moves linked instances; `Alt/Option`+drag moves **one** instance alone (bones stretch to follow).
**21. Shape interaction:** carve bones inside a shape; the **Bind tool (T2D.9)** controls point-to-bone weighting.
**22. Common mistakes:** boning an overly complex shape (Animate forces movie-clip conversion); forgetting constraints → joints bend backward (elbow hyperextension); editing shape control points after rigging breaks the IK shape; trying to use bones with classic tweens (Animate's bone tool requires modern motion tweens) — *[WISH W2]* our rig engine is tween-agnostic.
**23. Professional use:** arm/leg rigs, tails, tentacles, mechanical linkages, puppet rigs.
**24. Example workflow:** place shoulder→elbow→wrist instances on stage → Bone: click shoulder, drag to elbow, drag to wrist → select elbow bone → set rotation constraint (−10°..130°) → frame 1: Insert Pose → frame 20: drag the hand → Insert Pose → bones tween between poses.
**25. Equivalent in our app:** a `BoneTool` writing into the **Rig/IK Engine** (Part 32): a bone graph (nodes + joints with local transforms), **2-bone analytic + CCD/FABRIK** solvers, per-joint constraints, pose keyframes on a **rig layer**. *[WISH W2]* All bone math is in **local space** with stable bone IDs, so copy/paste, scaling children, and re-parenting cannot corrupt poses (this is the bug class Animate users complain about — we design it out).
**26. Mobile implementation:** drag-to-add bones; pose by dragging with constraint snapping; numeric constraint panel; magnified joint loupe.
**27. Desktop implementation:** same + constraint visual arcs (min/max angle wedges drawn at joints).

**MODEL WRITES (Part 33):**
```
layers[i].type = 'rigLayer'
layers[i].armature = {
  bones: [ {id, parentId, length, rotation, minRot, maxRot, xEnabled, yEnabled, jointSpeed, spring} ],
  bindings: [ {boneId, targetNodeId} | {boneId, controlPoints[]} ]
}
layers[i].frames[f] = { type:'pose', pose: { boneStates: [{boneId, rotation, translation}] } }
```

---

## T2D.9 — BIND TOOL

**1. Official name:** Bind tool (Bone-tool sub-tool).
**2. Purpose:** Edit which shape control points each bone influences (**weighting**) for IK shapes — so the shape distorts correctly when bones move.
**3. Location:** Tools panel (Bone flyout).
**4. Icon conceptual description:** a bone with linked dots (concept).
**5. Shortcut:** none (sub-tool).
**6. Mouse interaction:** click a bone → its bound points highlight (yellow); **Shift+click** a point = add it to the selected bone; **Ctrl/Option+click** a highlighted point = remove it; click a point → its bound bones highlight.
**7. Touch interaction:** tap-select points/bones; toggle binding.
**8. Selection behavior:** point/bone binding selection (squares = single-bone points, triangles = multi-bone points).
**9. Drag behavior:** Shift+drag = lasso-add multiple points to a bone.
**10. Double-click behavior:** n/a.
**11. Right-click/context behavior:** clear binding.
**12. Tool Options:** none.
**13. Properties affected:** the point→bone binding map (`armature.bindings`).
**14. What it can modify:** IK shape control points.
**15. What it cannot modify:** symbol-instance armatures (they move whole instances, no per-point binding).
**22. Common mistakes:** forgetting to bind → default nearest-bone weighting distorts badly at joints.
**23. Professional use:** fixing joint deformation (e.g., elbow pinch) by re-weighting contour points.
**25. Equivalent in our app:** weight-painting / point-binding mode on the rig engine; heat-map visualization.
**26–27. Mobile/desktop:** tap-to-bind; paint weights with a brush.

---

## T2D.10 — CAMERA TOOL

*(Camera model & depth: Part 16. Full 27 fields here.)*

**1. Official name:** Camera tool.
**2. Purpose:** Enable a **virtual camera** over the stage: **pan** (drag), **zoom** (Shift-drag / slider), **rotate** (Ctrl/Cmd-drag / slider); animate camera via keyframes; apply camera **tint/color effects**.
**3. Location:** Tools panel.
**4. Icon conceptual description:** a video camera (concept).
**5. Shortcut:** `C`.

**6. Mouse interaction:** drag = pan; `Shift`+drag = zoom; `Ctrl/Cmd`+drag = rotate. On-screen zoom/rotate slider + reset buttons also available.
**7. Touch interaction:** one-finger pan; pinch zoom; two-finger twist rotate.
**8. Selection behavior:** selecting the Camera tool activates the camera layer; a camera outline/overlay appears over the stage.
**9. Drag behavior:** maps to pan/zoom/rotate by modifier.
**10. Double-click behavior:** n/a.
**11. Right-click/context behavior:** reset camera, attach/detach layers, create camera tween.
**12. Tool Options:** on-screen zoom/rotate slider + reset per property.
**13. Properties affected:** `camera.transform` { x, y, z, zoom, rotation } + camera color effects (tint, filters).
**14. What it can modify:** the camera (framing of all layers).
**15. What it cannot modify:** layer content (attached layers move **with** the camera — they're pinned, not modified).
**16. Timeline interaction:** creates a **Camera layer**. Keyframes on it store camera states; classic/motion tween between camera keyframes animates the camera.
**17. Keyframe interaction:** camera keyframes hold position/zoom/rotation; interpolated between keys (easing applies).
**18–21. Vector/bitmap/symbol/shape:** the camera transforms the **composited output** of all layers (plus per-layer z-depth parallax with Advanced Layers).
**22. Common mistakes:** confusing camera zoom with viewport zoom; forgetting to **attach** HUD/caption layers (they'll drift with the camera); camera rotate around wrong center.
**23. Professional use:** cinematic push-ins, pans, shake, parallax (Layer Depth panel).
**24. Example workflow:** add Camera → frame 1 keyframe (wide) → frame 100 keyframe (zoom 200% + pan) → classic tween → ease-out.
**25. Equivalent in our app:** a `CameraNode` in the scene graph holding a screen-space transform + a camera layer timeline (Part 16); layer depth → per-layer parallax scale.
**26. Mobile implementation:** gestures map to pan/zoom/rotate; joystick alternative.
**27. Desktop implementation:** modifier-drag + numeric panel + on-screen slider.

**MODEL WRITES (Part 33):** `camera = { x, y, z, zoom, rotation, tint, filters }`; `layers[cameraLayer].frames[f] = { type:'keyframe', camera:{...} }`.

---

## T2D.11 — ASSET WARP TOOL

*(Deformation math: Part 02-AW note below + Part 32 WarpEngine.)*

**1. Official name:** Asset Warp tool (added Animate 19.0).
**2. Purpose:** Deform shapes, drawing objects, and **bitmaps** using a mesh of **warp handles/pins** ("puppet warp"); animate the deformation by keyframing the pins.
**3. Location:** Tools panel.
**4. Icon conceptual description:** a shape with warp pins/handles (concept).
**5. Shortcut:** none by default (assignable).
**6. Mouse interaction:** click on a shape/drawing-object/bitmap to **add a warp handle**; drag handles to deform; hover shows affordance cursors (add vs move).
**7. Touch interaction:** tap to add a pin; drag a pin to warp.
**8. Selection behavior:** warp handles (small circles) selected individually; the object becomes a "warped asset".
**9. Drag behavior:** drag pin = local deformation (rigid or flexible per mode).
**10. Double-click behavior:** (with Selection) double-click a warped shape → edit its **base shape** (vector only; changes propagate to warped instances).
**11. Right-click/context behavior:** add/remove handle, reset warp, rigid/flexible toggle, envelope mode.
**12. Tool Options:** warp mode (**rigid** = stiff, articulated; **flexible** = soft deformation), **envelope**, handle add/delete.
**13. Properties affected:** `warp.handles[]` (positions), mesh triangle list, base-shape link.
**14. What it can modify:** shapes, drawing objects, bitmaps (all grouped into a warped asset when the first handle is added).
**15. What it cannot modify:** symbol instances directly (warp the art inside, or warp then convert).
**16. Timeline interaction:** warped assets animate by keyframing handles; on inserting a keyframe, handles are **copied from the previous keyframe**.
**17. Keyframe interaction:** handle positions are per-keyframe and tweenable (the mesh interpolates between keyframes). *[WISH W3]* Our implementation stores warp as **pure per-keyframe data** (pin positions + derived mesh), eliminating Animate's flicker/loss bugs on duplicate/symbol-link.
**18. Vector interaction:** mesh over a base vector shape; the base shape remains editable.
**19. Bitmap interaction:** mesh over bitmap (deforms pixels).
**20. Symbol interaction:** n/a directly.
**22. Common mistakes:** too few pins → wobble; mixing rigid/flexible unintentionally; expecting symbol-level warp.
**23. Professional use:** flag waves, cloth, hair, breathing bodies, simple full-body puppets without a cut-out rig.
**24. Example workflow:** import a flag PNG → Asset Warp → pin corners + midpoints → drag to ripple → keyframe → loop.
**25. Equivalent in our app:** a `WarpMeshNode` (triangle mesh + pins; **MLS / as-rigid-as-possible** deformation) keyframable per pin; rigid/flexible modes; vector + raster sources.
**26. Mobile implementation:** pin drag with loupe; add/remove pin via long-press; two-finger = pan/zoom.
**27. Desktop implementation:** mesh solve on GPU/worker; per-pin keyframe curves in the graph editor.

**MODEL WRITES (Part 33):**
```
layers[i].frames[f].content.push({
  type:'warpAsset', sourceNodeId, baseShapeId|null,
  warp: { mode:'rigid'|'flexible', pins:[{x,y}], mesh:{verts:[], triangles:[]} }
})
```

---

## T2D.12 — DECO TOOL (LEGACY) & T2D.13 — SPRAY BRUSH TOOL (LEGACY)

**1. Official name:** Deco tool; Spray Brush tool (legacy CS-era; removed).
**2. Purpose:** Deco — procedural pattern/symmetry brushes (Vine Fill, Grid Fill, Symmetry Brush, Tree, Flame, particle systems) for decoration; Spray Brush — spray **symbol instances** randomly (scatter).
**3. Location:** (historical) Tools panel.
**5. Shortcut:** `U` (legacy; now the Width tool).
**12. Tool Options:** Deco: pattern type (Vine/Grid/Symmetry/…), the symbol to stamp, density/rotation/scale/color. Spray: symbol, scatter count, scale/rotation randomness.
**22. Common mistakes:** — (removed).
**23. Professional use:** procedural foliage, repeating decorations, particle scatter.
**25. Equivalent in our app:** optional **generator brushes** (symmetry, particle, vine) as a plugin module; **P3 priority**. Documented for completeness only.

---

## 02d BUILD CHECKPOINT

- [ ] Eyedropper samples fill/stroke (incl. gradients/bitmap fills) to a style clipboard; apply is explicit (no hover-paint bug).
- [ ] Paint Bucket flood-fills regions with gap tolerance + Lock Fill.
- [ ] Ink Bottle applies strokes to outlines.
- [ ] Hand/Zoom/Stage Rotate/Time Scrubber: view-only, no document mutation.
- [ ] Bone tool builds symbol armatures AND IK shapes; poses recorded as pose keyframes; constraints enforced; Bind tool edits point weighting.
- [ ] Camera tool: pan/zoom/rotate + camera layer + keyframable camera + attach layers.
- [ ] Asset Warp: pins + mesh on vector & raster; rigid/flexible; keyframeable pins.
- [ ] Touch equivalents for all rigging/camera tools.

*This completes Part 02 (every tool). Next: `03_selection_system.md`.*

---

<!-- ===== FILE: 03_selection_system.md ===== -->

# PART 03 — SELECTION SYSTEM
### The complete selection model: how anything on the stage gets selected, what changes per object type, and how to implement it. This is the foundation every tool, panel, and command builds on.

---

## 3.0 Why selection is the spine of the editor

Nearly every editing action is: **select something → inspect it (Properties/Info/Transform) → act on it (move, transform, delete, style, tween, rig)**. Selection is therefore not a feature bolted on — it is a **first-class data structure** in the editor core. Getting it right means:

- Tools (Part 02) only *produce* selections and *consume* the current selection.
- Panels (Part 26) render themselves from the selection's **type + property schema**.
- Commands (Part 36) store *which nodes they touched* so undo/redo can restore selection.
- Rendering draws a **selection overlay** (bounding box, handles, anchors) that is never part of export.

### The two layers of selection

| Layer | Meaning | Persisted? |
|---|---|---|
| **Selection state (UI)** | Which node(s)/sub-parts are currently selected | Transient — not saved in the document; restored only for convenience on undo |
| **Document model** | The actual nodes, paths, transforms | Persisted (Part 33) |

The selection state holds **references (IDs)** to model objects, never copies. Mutating a selected object mutates the model; the selection simply points at it.

### Selection data structure (original app)

```jsonc
{
  "selection": {
    "kind": "objects",            // 'objects' | 'anchors' | 'frames' | 'bones' | 'warpPins' | 'camera' | 'none'
    "mode": "normal",             // 'normal' | 'subselection' (anchor-level)
    "targets": [
      { "nodeId": "n123" },                     // whole node selected
      { "nodeId": "n456", "subPath": "fills[0]" },   // sub-object (a fill/stroke of a raw shape)
      { "nodeId": "n789", "anchorIndex": 3 }    // anchor-level (Subselection tool)
    ],
    "anchorIds": [],              // when kind==='anchors'
    "bounds": { "x": 0, "y": 0, "w": 0, "h": 0 },   // union bounding box (computed, cached)
    "commonType": "shape"         // computed: the common ancestor type for Properties panel
  }
}
```

Rules:
- `targets` may mix node types (mixed selection) — then only **common** properties are shown.
- Sub-object selections (fill-only / stroke-only) are modeled as `nodeId + subPath` so the model isn't split prematurely; a subsequent move/cut performs the split (Part 06).
- Anchor selection (`kind:'anchors'`) is produced by the Subselection tool and consumed by the path editor.

---

## 3.1 Selection tool vs Subselection tool — two selection modes

| | **Selection (V)** | **Subselection (A)** |
|---|---|---|
| Selects | Whole objects + (in merge mode) fill/stroke sub-objects | Anchors + Bézier handles of a path |
| Visual | Bounding box + transform handles | Anchor dots + tangent handles |
| Produces | `kind:'objects'` | `kind:'anchors'` |
| Used for | Move/transform/arrange/style | Path editing (Part 05/06), motion-path editing (Part 10) |

Both modes coexist: switching tools keeps the *underlying* object selected but changes what's emphasized (Animate keeps the object selected; our app shows the same — selecting an object with `A` shows its anchors).

---

## 3.2 Hit-testing (how a click becomes a selection)

Hit-testing answers: **"what is under the pointer at (x, y)?"** It runs top-down through the render order.

### 3.2.1 Hit-test order (render order = front-to-back)

1. **Overlays** (handles, anchors, bones, warp pins, camera widget) — these win first (you can grab a handle).
2. **Top-most layer** → **front-most object** → recurse into groups/symbols (edit depth).
3. Locked/hidden layers are skipped (3.7).
4. Empty hit → stage background (clears selection).

### 3.2.2 Hit-test algorithm

```
function hitTest(point, doc, view):
  for layer in visibleLayersTopToBottom:          # skip hidden & locked
    for node in layer.frame(playhead).content backToFront:
      r = hitTestNode(node, point)
      if r: return r
  return null   # empty stage

function hitTestNode(node, point):
  case node.type:
    shape / drawingObject:  point-in-path (winding rule) → {nodeId} else edge-hit (within 4px) → {nodeId, subPath:stroke}
    group:                  recurse children (front→back)
    symbolInstance:         point in instance bounds → {nodeId}
    text:                   point in text box → {nodeId}
    bitmap:                 point in bitmap rect (alpha>0 if precise) → {nodeId}
    brushStroke/warpAsset:  point in stroke outline / mesh → {nodeId}
```

Implementation notes:
- Maintain a **spatial index** (quadtree / R-tree) per layer for O(log n) hit-tests; rebuild on content change (dirty-flag).
- **Edge hit radius** = 4 px (desktop) / 24 px (touch) — configurable. This is what lets the Selection tool grab a curve edge to reshape.
- **Pixel-accurate bitmaps:** hit-test against the bitmap's alpha channel when "precise" is on (P2); rectangle otherwise.
- **Winding rule:** non-zero vs even-odd — a filled self-intersecting path selects consistently with how it renders (Part 06).

---

## 3.3 Selection operations (every way to select)

### 3.3.1 Click selection
- Click = select the **single top-most** hit object; deselects everything else.
- Click empty = **deselect all**.
- Clicking a **sub-object** of a raw shape (fill vs stroke) selects just that sub-part (3.4).

### 3.3.2 Shift selection (add/remove — "toggle")
- `Shift`+click an unselected object → **add** to selection.
- `Shift`+click a selected object → **remove** from selection.
- Result may be a **mixed selection** (multiple types).

### 3.3.3 Marquee (drag) selection
- Drag on empty space = draw a selection rectangle.
- Two behaviors (user preference, *[WISH W6]* exposed clearly):
  - **Contact-sensitive ON** (Animate default): any object **touched** by the marquee is selected.
  - **Contact-sensitive OFF**: only objects **fully enclosed** are selected.
- Marquee respects locked/hidden layers (skipped).
- Marquee over raw shapes: selects the fill **regions** intersected (partial shape selection) — a distinctive merge-model behavior (3.4).

### 3.3.4 Lasso selection
- Freeform equivalent of marquee (T2A.7): the traced polygon selects everything inside (point-in-polygon), or intersecting if contact-sensitive.

### 3.3.5 Select All / Deselect All
- `Ctrl+A`: select everything on **unlocked, visible** layers of the **current timeline** (not other scenes, not hidden/locked layers).
- `Ctrl+Shift+A`: deselect all.

### 3.3.6 Select by timeline
- Clicking a **frame** (keyframe) can select that frame's content on stage (Animate: click a frame to select its contents on the stage). Our app: clicking a keyframe **also selects its content** when a "select frame content" toggle is on (default off — Animate's default is on for keyframes; we make it explicit).

### 3.3.7 Select by layer
- **Layer selection** (3.6) is separate: clicking a layer row selects the *layer* (for rename/delete/reorder), not its content. `Ctrl+A`-style "select all on layer" is available via right-click → Select All on Layer.

### 3.3.8 Selection memory / reselect
- `Ctrl+Shift+D` is taken by Duplicate; reselect-last-selection is a P2 nicety: store the last non-empty selection and restore it (useful after an accidental deselect).

---

## 3.4 Per-object-type selection behavior (exactly what changes)

This is the heart of Part 03. When each type is selected, the **overlay**, the **Properties schema**, and the **editable operations** change.

### 3.4.1 Raw shape (merge shape) — fill vs stroke sub-objects

- A raw shape is **two selectable sub-objects**: the **fill** and the **stroke(s)**, even though they're one shape in the model.
- **Click fill** → fill selected (shows a dotted/speckled fill highlight). Moving it **cuts** it away from the shape (merge-model split).
- **Click stroke** → that stroke selected. Moving it splits/moves the stroke.
- **Double-click fill** → fill + stroke both selected (the whole shape).
- **Double-click a stroke** → selects the whole **connected stroke chain**.
- **Marquee** selects intersected regions (partial shape) — moving a partially-selected shape cuts that region.
- Selected-shape overlay: **dotted stipple pattern** (concept: highlight the fill with a translucent color + dot texture; our app draws its own pattern), stroke highlighted in its color.
- Properties schema: fill color/style, stroke color/thickness/style, width profile, x/y/w/h.

> **Model note:** fill/stroke sub-selection does NOT split the shape in the model immediately. The split happens on the first *move/cut/delete* command. This preserves undo granularity and keeps the model clean.

### 3.4.2 Drawing object (object-drawing mode)

- Atomic: click selects the **whole object** (fill+stroke together). No sub-object selection.
- Overlay: bounding box + transform handles (Free Transform).
- Double-click → **edit in place** (drill into the object; other content dims; breadcrumb updates).
- Properties schema: x/y/w/h + (in edit) fill/stroke.

### 3.4.3 Group

- Atomic: click selects the group; children are NOT individually selectable from the top level.
- Overlay: bounding box + handles.
- Double-click → edit-in-place (drill into the group; its children become selectable).
- Properties: x/y/w/h; note "Group" type.
- Break Apart (Ctrl+B) dissolves the group into its children.

### 3.4.4 Symbol instance (graphic / movie clip / button)

- Click selects the **instance** (a *reference* to the symbol definition, not the definition itself).
- Overlay: bounding box + transform handles + the **transform point (pivot)** as a white circle.
- Double-click → **edit the symbol in place** (other content dims; you edit the *definition*, which updates all instances — Part 11).
- Properties schema: instance type, swap symbol, color effect (brightness/tint/alpha/advanced), loop settings (graphic: loop/play-once/single-frame + first frame — via Frame Picker), filters (drop shadow/blur/glow), x/y/w/h.
- **Instance ≠ symbol:** editing the instance transform never touches the symbol; editing the symbol updates every instance.
- Break Apart (Ctrl+B): detaches the instance into raw content (a copy of the symbol's art on this frame); further break-apart of that copy to raw shapes.

### 3.4.5 Text block

- Click selects the text block (bounding box).
- Double-click / click-inside → **text-edit mode** (character selection, caret).
- Properties schema: text string, font, size, color, bold/italic, align, letter/line spacing, static/dynamic/input, embed, anti-alias, selectable (Part 22).

### 3.4.6 Bitmap

- Click selects the bitmap (bounding box, no reshape).
- Properties: bitmap swap/replace, x/y/w/h, (if broken apart) edit pixels.
- Broken-apart bitmap supports region selection (Lasso/Magic Wand).

### 3.4.7 Bone (inside an armature)

- Selecting a bone shows it highlighted (red) + its **bound points** (yellow) when the Bind tool is active.
- Shift+click = multi-select bones; double-click = whole armature.
- Properties: bone length/angle, rotation constraint, translation constraint, joint speed, spring.
- Selecting a pose-layer frame selects the whole armature (Part 14).

### 3.4.8 Warp pins (Asset Warp)

- Selecting a warped asset shows its pins; clicking a pin selects it (draggable). Properties: pin position, warp mode.

### 3.4.9 Camera

- Selecting the camera (via Camera tool / camera layer) shows the camera outline + zoom/rotate widget; Properties: camera x/y/z/zoom/rotation/tint.

### 3.4.10 Multiple / mixed selection

- Multiple objects → one **union bounding box**; Properties shows only common fields (x/y/w/h).
- Mixed types (e.g. shape + instance) → common fields only; type-specific sections hidden.
- The union bounding box is computed from each member's transformed bounds (cache per change).

### 3.4.11 Nothing selected

- Properties shows **document** properties (stage size, fps, background) — the "document context" (Part 26).

---

## 3.5 Selection visual feedback (overlay system)

The overlay is a **render pass on top of the stage**, drawn from selection state, never exported.

| Element | When shown | Concept |
|---|---|---|
| **Selection outline** | Object selected | 1–2 px outline in the highlight color around the object's path/bounds. |
| **Dotted fill highlight** | Raw-shape fill selected | Translucent fill + dot texture over the fill region. |
| **Bounding box** | Object/group/instance/bitmap/text selected | Thin rectangle (union box for multi-select). Color is user-configurable (Animate allows custom bounding-box colors — we do too). |
| **Transform handles** | Free Transform active (Part 04) | 8 handles + rotation zone + pivot. |
| **Anchor dots / tangent handles** | Subselection active | Squares for anchors (filled = selected), dots + lines for handles. |
| **Bone glyphs / bind points** | Armature selected | Bone lines + joint circles; bound points (squares/triangles). |
| **Warp pins** | Warp asset selected | Small circles at pins. |
| **Camera outline** | Camera active | Stage-border camera rectangle + zoom/rotate slider. |
| **Hide Edges** (`Ctrl+Shift+E`) | toggle | Suppresses ALL highlights so you can edit without visual clutter *[WISH W6]*. |

Implementation: one `SelectionOverlayRenderer` reading `selection` + the render tree; drawn last; skipped in export and in thumbnails.

---

## 3.6 Layer selection vs content selection

- Clicking a **layer row** (timeline) selects the **layer** (for rename/reorder/delete/lock/etc.), NOT its stage content. Layer selection is a timeline-panel state.
- The **active layer** (the one you draw into) is indicated by a highlight + pencil icon. Only one layer is active at a time; selecting a frame on a layer makes it active.
- Layer **lock/hide/outline** affect content selection (3.7) but not layer-row selection.

---

## 3.7 Locked & hidden object behavior (rules)

| State | Selection | Editing | Select All | Notes |
|---|---|---|---|---|
| **Locked layer** | Content cannot be selected (hit-test skips it) | Cannot be edited | Skipped | Lock icon in timeline; unlock to select. |
| **Hidden layer** | Not selectable, not rendered on stage | Skipped | Skipped | Content still exists; export may include if "export hidden" off (default excludes). |
| **Outline mode layer** | Selectable normally | Editable | Included | Rendered as outlines only (view aid). |
| **Locked object** (Arrange > Lock) | Cannot select until unlocked | Blocked | Skipped | Per-object lock independent of layer lock. |
| **Hidden object** | n/a (Animate has no per-object hide; our app adds it — P2) | — | — | Optional. |

- **Guides are never selectable** (they're view objects).
- **Mask/masked layers** (Part 21): masked content is selectable normally; the mask shape itself is selectable as a shape on the mask layer.

---

## 3.8 Selection outline vs bounding box vs handles vs anchor point

Precise definitions (these four are commonly confused):

| Term | Meaning | Who shows it |
|---|---|---|
| **Selection outline** | The object's own path/stroke highlighted (follows the true shape). | Selection tool, any selected raw shape/stroke. |
| **Bounding box** | Axis-aligned rectangle around the object(s) (the *outer* box). | Selection + Free Transform. Rotated objects: the box shows the **rotated** bounds (or the unrotated + rotation, per Animate's "show rotated box" behavior). |
| **Transform handles** | Interactive squares/circles on the bounding box (scale/rotate/skew/move) + pivot circle. | Free Transform only. |
| **Anchor point** | A vertex of a vector path (selected via Subselection). | Subselection tool. |

Also distinguish two "centers" (Part 04/11):
- **Registration point** — the (0,0) of a symbol's own coordinate space (defined when the symbol is made). The `x/y` position of an instance refers to where this point lands.
- **Transform point (pivot)** — the movable point around which rotation/scale happen. Independent of the registration point.
- **Selection center** — the computed center of the bounding box (used by Align/Transform-panel "center" and by "re-center pivot").

---

## 3.9 Selection events (what the rest of the app listens to)

```
selection:changed  { prevTargets, targets, kind, commonType, bounds }
```

Subscribed by: Properties panel (re-render schema), Info panel (numbers), Transform panel (numeric fields), Stage overlay (redraw), Actions panel (show target scripts), context-menu builder (which menu items are enabled).

Rules:
- Emit **once per user gesture** (not per pointer move) to avoid re-render storms. During a drag, use a `selection:preview` throttled event if live previews are needed.
- Selection changes are **not** undoable commands (they're view state), BUT undo/redo **restore** the selection that existed when the command ran (store `prevSelection` in each command — Part 36).

---

## 3.10 Selection + timeline/keyframe interaction

- Selection is **frame-scoped**: selecting an object selects it on the **current frame** of its layer. Scrub the playhead → the selection may no longer exist there (Animate keeps the selection if the object persists; our rule: selection persists **while the selected node still exists at the new frame**; otherwise it clears and shows a toast).
- Selecting an object on a **tween span**: you're selecting the tween's **target object**; property edits become property keyframes (Part 09).
- Selecting a **keyframe's content** by clicking the keyframe in the timeline (3.3.6).

---

## 3.11 Mobile translation of selection (Part 31 preview)

| Desktop | Mobile |
|---|---|
| Click | Tap (24 px tolerance) |
| Shift+click (toggle) | "Select mode" toggle — each tap toggles membership; or long-press = add to selection |
| Marquee | Drag on empty (two-finger drag = pan, so marquee = one-finger drag on empty) |
| Lasso | One-finger freehand lasso (a mode) |
| Subselection anchors | Tap path → anchors; drag with loupe; long-press = anchor menu |
| Deselect all | Tap empty space |
| Right-click menu | Long-press |

---

## 3.12 BUILD CHECKPOINT M1 (selection slice)

- [ ] Hit-testing with spatial index; correct front-to-back order; edge hit-radius.
- [ ] Click / Shift-toggle / marquee (both contact-sensitive modes) / lasso / select-all / deselect.
- [ ] Per-type selection behavior implemented for: raw shape (fill/stroke sub-objects), drawing object, group, symbol instance, text, bitmap, bone, warp pins, camera, mixed.
- [ ] Locked/hidden layer and locked-object rules enforced everywhere (hit-test, marquee, select-all).
- [ ] Selection overlay renderer (outline, dotted fill, bounding box, anchors, handles, bones, pins, camera) with Hide Edges toggle.
- [ ] Layer selection distinct from content selection; active-layer tracking.
- [ ] `selection:changed` event wired to Properties/Info/Transform/overlay; no panel reads another directly.
- [ ] Selection persists/clears correctly across playhead scrubbing.
- [ ] All of the above on touch (tap/long-press/select-mode) and desktop.

*Next: `04_transform_system.md` — Move/Scale/Rotate/Skew/Free/Distort/Envelope + numeric + pivot/registration, with the Input→calculation→result→stored-property→keyframe pipeline for every operation.*

---

<!-- ===== FILE: 04_transform_system.md ===== -->

# PART 04 — TRANSFORM SYSTEM
### Move, Scale, Rotate, Skew, Free Transform, Distort, Envelope, pivots, numeric transforms, copy/reset/flip. For every operation: Input → calculation/concept → visible result → stored property → animation behavior → keyframe behavior.

---

## 4.0 The transform model (foundation)

Every placeable object carries a **Transform** component (Part 33). This single structure is what all tools, the Transform panel, tweens, and the renderer read/write:

```jsonc
"transform": {
  "x": 0, "y": 0,                 // position (stage coords of the object's origin)
  "scaleX": 1, "scaleY": 1,       // scale factors (1 = 100%)
  "rotation": 0,                  // degrees, clockwise (Y-down space), around pivot
  "skewX": 0, "skewY": 0,         // degrees of shear
  "pivotX": 0, "pivotY": 0        // pivot (transform point) in the object's LOCAL space
}
```

### 4.0.1 The transform matrix (concept)

The final placement of an object = a **2D affine transform** composed in a fixed order:

```
M = Translate(x, y) · Rotate(skewY) · Skew(skewX) · Scale(scaleX, scaleY) · Translate(-pivot)
```

(Conceptually; the app can use any equivalent decomposition. Animate's order is: scale → skew → rotate, around the transform point, then translate. The renderer applies `M` to the object's local geometry; `pivot` is where rotation/scale are centered.)

**Store the decomposed values, not the raw matrix** — because x, y, scale, rotation, skew, pivot are what users edit in panels and what tweens interpolate. The matrix is a cached derivative.

### 4.0.2 Transform spaces

| Space | Meaning |
|---|---|
| **Stage space** | Absolute coordinates of the scene (0,0 = stage top-left). |
| **Object/local space** | The object's own coordinates (symbols: centered on their registration point). |
| **Parent space** | A group/symbol's coordinate space for its children (nesting — Part 11). |
| **Screen space** | Stage space after view zoom/pan + camera (Part 16). |

Tools operate in **stage space** and write decomposed values in the object's **parent space**. The pivot is stored in **local space**.

---

## 4.1 MOVE

| Pipeline | Detail |
|---|---|
| **Input** | Drag selected object(s) with Selection tool (or arrow keys, or Transform panel X/Y, or Info panel). |
| **Calculation** | `delta = pointerNow - pointerStart` (snapped via SnapEngine). New position = `startPosition + delta`. |
| **Visible result** | Object translates; snap hint lines appear; Info panel live-updates X/Y. |
| **Stored property** | `transform.x`, `transform.y`. |
| **Animation behavior** | On a motion tween span, move creates/updates **position property keyframes** (x and y are independent keys — Part 09). On classic tween, a move on an in-between frame inserts a keyframe. |
| **Keyframe behavior** | Move on a keyframe = edits that keyframe. Move on a static/held frame = auto-converts to keyframe (Part 07 rule). |

Modifiers: `Shift` = constrain to axis/45°; `Alt`+drag = **duplicate-move** (drag a copy); arrow keys = 1 px nudge (Shift+arrow = 10 px).

---

## 4.2 SCALE

| Pipeline | Detail |
|---|---|
| **Input** | Drag a corner handle (both axes) or an edge handle (one axis); or Transform panel W/H (% or px); or numeric Scale & Rotate dialog. |
| **Calculation** | `scaleX = (pointer.x - pivot.x) / (startHandle.x - pivot.x)` (ratio of distances from pivot). Shift = constrain to proportional (scaleX = scaleY). Alt = scale about the opposite corner instead of the pivot. |
| **Visible result** | Object grows/shrinks around the pivot (or opposite corner). Info panel shows live W/H. |
| **Stored property** | `transform.scaleX`, `transform.scaleY` (and derived `width = baseW × scaleX`). |
| **Animation behavior** | On motion tweens, scaleX/scaleY are **separate property keyframes** (you can key X and Y at different frames). Classic tween: scale interpolates linearly between keyframes. |
| **Keyframe behavior** | Scale at playhead → property keyframe for scaleX/scaleY (motion) or classic keyframe. |

Notes:
- **Negative scale** = flip (scaleX = -1 mirrors horizontally). Animate allows it; our app too (document it).
- **Squash & stretch** = non-uniform scale over time — the classic animation technique; supported natively (scaleX ≠ scaleY).
- Scale is **multiplicative** around the pivot; chaining keyframes multiplies, which is why "Remove Transform" (4.9) exists to flatten.

---

## 4.3 ROTATE

| Pipeline | Detail |
|---|---|
| **Input** | Drag just outside a corner handle (rotation zone); or Transform panel rotation field; or Rotate 90° CW/CCW; or numeric dialog. |
| **Calculation** | `angle = atan2(pointer - pivot) - atan2(startHandle - pivot)`; `rotation = startRotation + degrees(angle)`. Shift = snap to 45° (or 15° per pref). Alt = rotate around the **opposite corner**. |
| **Visible result** | Object rotates around the **transform point (pivot)**. |
| **Stored property** | `transform.rotation` (degrees, clockwise in Y-down space). |
| **Animation behavior** | Motion tween: `rotation` is its own property keyframe (with orientation options — Part 09: CW/CCW, times-rotations). Classic tween: rotation interpolates linearly (shortest path by default; you can force full spins). |
| **Keyframe behavior** | Rotation at playhead → rotation property keyframe / classic keyframe. |

**Key concept — pivot decides everything:** rotation looks wrong 90% of the time because the pivot isn't on the joint. The workflow "drag pivot to joint → rotate" is the single most important transform habit (Parts 11/13/14 reinforce).

---

## 4.4 SKEW

| Pipeline | Detail |
|---|---|
| **Input** | Drag an edge midpoint with the skew modifier (Shift+edge-drag in Free Transform's Rotate&Skew mode); or Transform panel skew fields. |
| **Calculation** | Shear by the ratio of pointer displacement to object size: `skewX = degrees(atan(dx / height))` (approx). |
| **Visible result** | The object shears — vertical edges tilt (skewX) or horizontal edges tilt (skewY); a rectangle becomes a parallelogram. |
| **Stored property** | `transform.skewX`, `transform.skewY` (degrees). |
| **Animation behavior** | Motion tween: skewX/skewY are independent property keyframes. Classic: linear interpolation. |
| **Keyframe behavior** | Same as scale/rotate. |

Note: Animate keeps **skew separate from rotation** — rotating a skewed object is different from skewing a rotated object. Preserve both values independently in the model.

---

## 4.5 FREE TRANSFORM (combined)

Free Transform (Q) = move + scale + rotate + skew in one tool, with **modes** (Scale / Rotate & Skew / Distort / Envelope). The per-handle zone mapping and modifier matrix are in T2A.3 (Part 02a). Here: the semantic rules.

- **One gesture = one TransformCommand** storing the before/after of *all* changed fields (undo restores the whole gesture).
- **Combining** transforms in one drag (e.g. rotate while scaling) is allowed; the tool decomposes the pointer delta into the appropriate fields.
- **Distort & Envelope are shape-only** (see 4.6) — on symbols/bitmaps/text they're disabled (Animate silently ignores; our app grays them out and shows a tooltip).

---

## 4.6 DISTORT & ENVELOPE (perspective-like deformation)

Animate has **no true perspective transform tool**; its approximations are **Distort** and **Envelope**, and both work **only on raw shapes**.

### 4.6.1 Distort

| Pipeline | Detail |
|---|---|
| **Input** | Free Transform → Distort mode; drag any of the 4 **corner handles** independently. |
| **Calculation** | Each corner moves freely → the shape is mapped into the new **quadrilateral** (bilinear/projective remap of the path vertices). |
| **Visible result** | A rectangle can become a non-parallel trapezoid — a cheap "perspective" fake (e.g., a card turning). |
| **Stored property** | The **path vertices** are re-mapped (the transform is **baked into geometry** — there is no persistent "distort" field). |
| **Animation behavior** | Because it bakes geometry, distort is **not tweenable as a transform** — it changes the shape, so it participates in **shape tweens** (Part 09) between differently-distorted keyframes. |
| **Keyframe behavior** | The distorted geometry is stored in the current keyframe's shape path. |

### 4.6.2 Envelope

| Pipeline | Detail |
|---|---|
| **Input** | Free Transform → Envelope mode; a **mesh** of points + tangent handles appears over the shape; drag any mesh point or tangent. |
| **Calculation** | The shape's vertices are re-fitted to the deformed mesh (catmull-rom / Bézier mesh interpolation). More control than Distort (interior points, curved edges). |
| **Visible result** | Smooth, organic warps (bulges, bends) — like a cheap puppet/mesh warp. |
| **Stored property** | Baked into path geometry. |
| **Animation behavior** | Shape-tween between envelope poses. |

**Modern note:** Animate's **Asset Warp tool** (T2D.11) supersedes Envelope for most deformation (it keeps a keyframable mesh + pins, and works on bitmaps). Our app ships **Asset Warp as the primary deformation tool** (P1) and Distort/Envelope as shape-baking operations (P2).

---

## 4.7 REGISTRATION POINT vs PIVOT (TRANSFORM POINT) vs TRANSFORM CENTER

Three distinct "centers" — the #1 source of confusion in symbol animation. Definitions and rules:

| Term | What it is | Where stored | What uses it |
|---|---|---|---|
| **Registration point** | The (0,0) of a **symbol's** local coordinate space. Set when the symbol is created (the 9-point grid in Convert-to-Symbol / New-Symbol dialog). | Symbol definition (Part 11/33). | The **instance's x/y** = where the registration point lands on stage. Moving artwork relative to the crosshair in symbol-edit moves the registration point. |
| **Transform point (pivot)** | The movable point around which an **instance's** rotation/scale happen. Draggable (white circle). Default = the instance's center. | `transform.pivotX/Y` (per instance). | Rotation/scale/skew. Distinct from registration point. |
| **Transform center** | The computed **center of the bounding box** (selection center). | Derived (not stored). | Align panel "center", Transform-panel "re-center", pivot reset, rotate-around-center defaults. |

**Why it matters:** you set the **registration point** once (so the part's origin is its joint, e.g. shoulder); you move the **pivot** per-instance to change *where it rotates* (e.g. temporarily rotate around the elbow). In rigs (Part 13/14) both are typically placed at the joint.

**Re-center pivot:** double-click the pivot → it snaps to the transform center. (T2A.3 field 10.)

---

## 4.8 NUMERIC TRANSFORM

Precision transform without dragging — via the **Transform panel** (and Info panel for position/size).

| Field | Meaning | Behavior |
|---|---|---|
| X / Y | Position (of registration point or pivot — toggle which) | Enter + Enter = apply |
| W / H | Width/height in % or px (constrain-proportions chain link) | Applies scale |
| Rotate | Degrees | Apply |
| Skew X / Skew Y | Degrees | Apply |
| 3D (legacy) | rotationX/Y/Z, z | Legacy only |

Also **Modify > Transform > Scale and Rotate…** (`Ctrl+Alt+S`) — a modal dialog for exact scale % + rotation.

Rules:
- Numeric entry **commits** on Enter/blur → one `TransformCommand`.
- Live-typing preview optional (P2); default is commit-on-enter (matches Animate).
- The panel **reflects the selection** in real time (subscribes to `selection:changed`).

---

## 4.9 COPY TRANSFORM / RESET (REMOVE) TRANSFORM

| Operation | Does | Stored result |
|---|---|---|
| **Copy transform** | (Animate: copy/paste motion properties; our app adds: "Copy Transform" + "Paste Transform" — copies the whole transform component between objects) | Paste writes x/y/scale/rotation/skew/pivot to targets. |
| **Reset / Remove Transform** (`Ctrl+Shift+Z` in Animate; Modify > Transform > Remove Transform) | Sets scale=1, rotation=0, skew=0 **without moving the object** (bakes current geometry into the path so the object looks unchanged, but its transform is identity). | Path re-baked; transform reset to identity. |

**Why "Remove Transform" exists:** after repeated scale/rotate keyframes, the transform accumulates (scale 1.3 × 1.2 × …). Flattening resets the matrix to identity and re-computes the path to look identical — important for predictable tweening and export. Our app implements it as a **flatten operation** (P1).

---

## 4.10 FLIP HORIZONTAL / VERTICAL

| Pipeline | Detail |
|---|---|
| **Input** | Modify > Transform > Flip Horizontal / Flip Vertical (or right-click → Transform). |
| **Calculation** | Mirror across the object's **center** (transform center) axis. Implemented as `scaleX = -scaleX` (horizontal) / `scaleY = -scaleY` (vertical) — but Animate flips around the center, not the pivot; our app mirrors around the center to match expectation, and offers "flip around pivot" as an option. |
| **Visible result** | Mirrored object (e.g., a walk-cycle leg that was drawn facing left now faces right). |
| **Stored property** | `transform.scaleX/Y` negated (or path mirrored if you choose to bake). |
| **Animation behavior** | As a scale property, it's tweenable (scaleX 1→-1 animates a flip). |
| **Keyframe behavior** | Same as scale. |

**Walk-cycle trick:** draw one leg, then flip a duplicate for the other leg — standard cut-out workflow (Part 13).

---

## 4.11 Transform + animation/keyframe summary table

| Operation | Stored property | Motion tween keyframes | Classic tween | Shape tween |
|---|---|---|---|---|
| Move | x, y | x-key, y-key (independent) | position key | position (move shape) |
| Scale | scaleX, scaleY | scaleX-key, scaleY-key | linear interp | — (scale via shape) |
| Rotate | rotation | rotation-key (CW/CCW/loops) | linear interp | — |
| Skew | skewX, skewY | skewX-key, skewY-key | linear interp | — |
| Pivot move | pivotX/Y | **not tweenable** (pivot is static per span in practice) | not tweened | — |
| Distort/Envelope | baked path | — (changes geometry) | — | yes (morph) |
| Flip | scaleX/Y negated | scale-key | linear | — |
| Remove transform | flattened path + identity | — | — | — |

**Rule for our app:** motion-tween property keyframes are **per-property and independent** (Part 09) — this is the modern Animate model and it is strictly better than classic tween's single-value keyframes. Implement per-property keys; classic tween is a compatibility mode.

---

## 4.12 Mobile translation

| Desktop | Mobile |
|---|---|
| Drag handle to scale | Pinch (two-finger) or corner handle drag |
| Drag outside corner to rotate | Two-finger twist, or long-press corner → rotate mode |
| Drag edge + Shift to skew | Skew handle in a dedicated "Transform mode" panel |
| Move pivot (white circle) | Drag pivot with finger-offset loupe |
| Numeric transform | Transform panel fields (keyboard/number pad) |
| Shift constraints | "Constrain" toggle / snap |
| Alt (from center/opposite) | Two-finger gesture or a modifier button |

---

## 4.13 BUILD CHECKPOINT M1 (transform slice)

- [ ] `Transform` component implemented with the exact fields (x,y,scaleX,scaleY,rotation,skewX,skewY,pivot) + cached matrix.
- [ ] Move/scale/rotate/skew via Free Transform with the handle-zone mapping + modifier matrix (Part 02a T2A.3).
- [ ] Pivot dragging + re-center (double-click) + registration-point concept implemented (Part 11 completes it).
- [ ] Distort (4-corner) + Envelope (mesh) on raw shapes, baking into path geometry; disabled on non-shapes with a tooltip.
- [ ] Numeric transform panel (X/Y/W/H/Rotate/Skew) two-way binding; Scale & Rotate dialog.
- [ ] Copy/Paste transform; Remove-transform flatten.
- [ ] Flip H/V around center.
- [ ] Undo = one TransformCommand per gesture.
- [ ] All on touch + desktop.

*Next: `05_drawing_system.md` — Pen/Pencil/Brush/Paint Brush/Line/Rectangle/Oval/Polygon/Paint Bucket/Ink/Eraser/Eyedropper: stroke creation, fill creation, thickness, style, color, opacity, smoothing, curves, corners, caps, joins, editing, converting, breaking apart, grouping — with practical vector-geometry behavior.*

---

<!-- ===== FILE: 05_drawing_system.md ===== -->

# PART 05 — DRAWING SYSTEM
### The complete stroke/fill model and every drawing tool's behavior across 15 dimensions (stroke creation, fill creation, thickness, style, color, opacity, smoothing, curves, corners, caps, joins, editing, converting, breaking apart, grouping) — plus practical vector-geometry behavior.

---

## 5.0 The two primitive drawing artifacts: STROKE and FILL

Everything drawn is either a **stroke** (an open or closed **path** with width + style) or a **fill** (a **closed region** with a fill style). Animate's shapes are *both*: a closed path can carry a fill (inside) and a stroke (along the outline) simultaneously.

```jsonc
// shape node (Part 33)
{
  "type": "shape",
  "path": { "anchors": [...], "closed": true },
  "fills":  [ { "region": [anchorIndices...], "style": {...} } ],
  "strokes":[ { "path": {...}, "style": {...}, "widthProfile": [...] } ]
}
```

Key facts:
- A **path** = ordered anchors (each = position + 1 or 2 Bézier handles) + `closed` flag.
- A **fill** = a set of closed sub-paths (regions) + a **fill style** (solid / linear gradient / radial gradient / bitmap).
- A **stroke** = its own path + a **stroke style** (color, thickness, cap, join, dash, width profile).
- Fill and stroke are **independent** sub-objects (selectable/movable separately in merge mode — Part 03.4.1).

---

## 5.1 Stroke model (the 15 dimensions, defined once)

These apply to every tool that makes or edits strokes. Defined here; referenced per-tool below.

### 5.1.1 Stroke creation
A stroke is created when a tool emits a **path with a stroke style** (Pencil, Pen, Line, Rectangle, Oval, PolyStar, Paint Brush). An existing **fill-only** shape gets a stroke via the **Ink Bottle tool** (adds stroke to the outline) or by setting a stroke color and drawing.

### 5.1.2 Fill creation
A fill is created when a tool emits a **closed path with a fill style** (Rectangle, Oval, PolyStar, Pen-closed, Brush). An existing closed stroke gets a fill via the **Paint Bucket tool** (fills the enclosed region).

### 5.1.3 Stroke thickness (width)
- A stroke has a **base width** in px (1 = hairline-ish; 0.25–200 practical). Stored per stroke style.
- A **variable width profile** (Width tool, Part 02c T2C.6) overrides base width with per-point left/right widths: `widthProfile = [{t, wL, wR}]` (t = normalized distance along path).
- Rendering: offset the path centerline by `wL` (left) and `wR` (right) at each point → fill the resulting outline. **This is how the renderer must implement strokes: as outline polygons, not line primitives** (so variable width, caps, joins, and scaling all work uniformly).

### 5.1.4 Stroke style
- **Solid** (uniform color+width) — default.
- **Dashed/dotted** — pattern of dash/gap along the path (dash array). Custom dash patterns supported.
- **Art Brush / Pattern Brush** (Paint Brush, Part 02c T2C.3) — artwork stretched/tiled along the path.
- **Ragged/stipple/hatched** (Animate's preset stroke styles) — our app ships solid/dash/brush as core; ragged/stipple as P3 presets.

### 5.1.5 Color
- Stroke color = flat color or gradient? **Animate: strokes are flat-colored only** (no gradient strokes natively); gradient strokes are approximated by converting to fills. Our app: keep strokes flat (P0) + optional gradient strokes via "convert to fill" (P2) to match Animate and stay simple.
- Color is set from the **Color controls** (stroke chip) before drawing, or via Properties after selecting a stroke.

### 5.1.6 Opacity (alpha)
- Every color (fill or stroke) carries an **alpha** (0–100%). Animate nests it inside color; *[WISH W6]* our app exposes alpha as a **top-level slider** next to the color chip.
- Instance-level alpha (symbol color effect) is separate from fill/stroke alpha (Part 11).

### 5.1.7 Smoothing
- Freehand tools (Pencil/Brush/Paint Brush) run the shared **smoothing pipeline** (Part 02c §"Stroke capture & smoothing"): resample → RDP + moving-average → optional straighten. Smoothing strength = per-tool slider.
- Pencil's three modes map to strength: Ink = ~0, Smooth = mid, Straighten = mid + straight-line recognition.
- Geometric tools (Pen/Line/Rect/Oval/PolyStar) need **no smoothing** (they're exact).

### 5.1.8 Curves
- Paths store **quadratic or cubic Bézier** segments. Our engine: cubic (two handles per anchor) as the canonical form; importers convert quadratics.
- Curve anchors: **smooth** (mirrored handles) vs **corner** (independent handles) — set by Pen drag vs click, or converted with the Convert-anchor sub-tool.

### 5.1.9 Corners
- A **corner** = a corner anchor (two independent tangents) or a mitre join between straight segments. Radiused corners come from Rectangle/Oval primitives (corner-radius param) or by converting a corner anchor to a smooth curve.

### 5.1.10 Caps (stroke ends)
- **Round** (default, semicircle), **Square** (extends half-width past the end), **None/Butt** (ends exactly at the path end).
- Visible only on open strokes. Stored per stroke style.

### 5.1.11 Joins (stroke corners)
- **Round** (arc at corners), **Miter** (sharp corner, with miter-limit), **Bevel** (flat cut corner).
- Stored per stroke style. Miter limit = max ratio before falling back to bevel (prevents long spikes at acute angles).

### 5.1.12 Editing
- Strokes/paths edit with: Selection (edge/corner reshape), Subselection (anchors/handles), Pen sub-tools (add/delete/convert), Width (variable width), Ink Bottle (restyle), Eraser (subtract).

### 5.1.13 Converting
- **Convert Lines to Fills** (Modify > Shape): turns a stroke into a **fill outline** (the stroke's outline polygon becomes a fill). After this it behaves as a fill (can get gradient fills, be deformed, etc.) and **loses path-editing**.
- **Convert Fill to Outline / Stroke**: our app adds the inverse (P2).
- **Trace Bitmap**: vectorizes a bitmap into shapes (Part 27).

### 5.1.14 Breaking apart
- **Break Apart (Ctrl+B)** hierarchy: **Symbol instance / group → raw content** (one level); **text → characters → shapes** (two levels); **bitmap → pixel-fill bitmap** (editable region). Break-apart is the universal "flatten one level" command (Part 06 details the levels).

### 5.1.15 Grouping
- **Group (Ctrl+G)** wraps selected objects in a **Group** node (atomic selection + shared transform). **Ungroup (Ctrl+Shift+G)** dissolves. Groups are the lightweight alternative to symbols (no library entry, no reuse).

---

## 5.2 Per-tool drawing behavior (the 15 dimensions mapped)

Legend: ● = creates/uses this; ◐ = partial/indirect; — = not applicable.

| Dimension | Pen | Pencil | Brush | Paint Brush | Line | Rect/Oval/Poly | Paint Bucket | Ink Bottle | Eraser | Eyedropper |
|---|---|---|---|---|---|---|---|---|---|---|
| Stroke creation | ● | ● | — | ● | ● | ● | — | ● (adds to fill) | — | — |
| Fill creation | ● (closed) | — | ● | — | — | ● | ● (fills region) | — | — | — |
| Thickness | style | style | size (fill) | style+profile | style | style | — | style | size | — |
| Style | solid | solid/dash | fill | art/pattern | solid | solid | fill | solid | — | copies |
| Color | stroke | stroke | fill | brush | stroke | both | fill | stroke | — | samples |
| Opacity | alpha | alpha | alpha | alpha | alpha | alpha | alpha | alpha | — | alpha |
| Smoothing | exact | ● | ● | ● | exact | exact | — | — | — | — |
| Curves | ● (manual) | ◐ (auto) | ◐ (auto) | ◐ (auto) | — | ◐ (arcs) | — | — | — | — |
| Corners | ● | ◐ | ◐ | ◐ | — | ● (radius) | — | — | — | — |
| Caps | style | style | round | style | style | — | — | style | — | — |
| Joins | style | style | — | style | — | style | — | style | — | — |
| Editing | path | path | fill outline | stroke path | path | parametric/path | region | style | boolean | style |
| Converting | to fill | to fill | to outline | to fill | to fill | bake | — | — | — | — |
| Breaking apart | n/a | n/a | n/a | n/a | n/a | bake → path | n/a | n/a | n/a | n/a |
| Grouping | — | — | — | — | — | — | — | — | — | — |

---

## 5.3 Practical vector-geometry behavior (what the engine must get right)

### 5.3.1 Fill rules (winding vs even-odd)
- A closed path's interior is decided by a **fill rule**. Self-intersecting paths (a star drawn with one crossing stroke) fill differently under **non-zero winding** vs **even-odd**. Animate uses non-zero by default. Our app: make it a per-shape property (default non-zero), rendered consistently by canvas `fill('nonzero'|'evenodd')`.

### 5.3.2 Merge model vs object model (CRITICAL)
This is the single most distinctive Flash/Animate behavior — and the most confusing. Two drawing modes (Part 06 full detail):

- **Merged drawing (raw shapes):** when two same-color raw shapes **overlap on the same layer**, they **merge** into one shape. A different-color shape on top **cuts a hole** in the one below (the "cookie-cutter" behavior). Selecting and moving a part **splits** it off. Erasing splits strokes. This is powerful but surprising.
- **Object drawing:** every drawn object is **atomic** — overlaps don't merge/cut; each is independently movable. (Default for Paint Brush because brush strokes are heavy.)

**Our app must implement BOTH modes**, with the mode as a toggle in the tool Options + a per-shape type in the model (`shape` vs `drawingObject`). New users get object mode by default (safer); Animate pros get merge mode (they expect it). *[WISH]* This dual model is what "clone Animate exactly" means — do not skip merge mode.

### 5.3.3 Stroke rendering & scaling
- Strokes render as **outline polygons** (5.1.3) so they scale correctly (thickness scales with the object unless "non-scaling stroke" is set — our app adds a per-stroke `nonScaling` flag, P2).
- **Hairline** (1px) strokes at small export sizes can shimmer; anti-aliasing settings matter (Part 28).

### 5.3.4 Stroke-to-fill and fill-to-stroke symmetry
- Stroke → Fill (convert lines to fills): outline polygon becomes fill; path editing lost.
- Fill → Stroke (ink bottle): fill's outline gets a stroke; fill stays.
- Both are lossy in one direction (geometry type changes) — document this in tooltips.

### 5.3.5 Opacity & compositing
- Fill/stroke alpha composites with **normal blending** within the shape; overlapping same-color shapes with alpha < 100% **do not** double-darken in Animate's merge model (the merged fill is one region). Our renderer must merge same-style fills before rasterizing to avoid the classic "two 50% shapes = darker overlap" bug.

### 5.3.6 Snapping during drawing
- All geometric + freehand tools snap to grid/guides/objects/pixels via the SnapEngine (Part 01 §1.4.4). Pen anchors snap; Line endpoints snap; Rect/Oval corners snap. Snap feedback = dashed line + snapped cursor.

### 5.3.7 Pressure/tilt → width/opacity
- Stylus pressure maps to **width** (Pencil/Paint Brush/Brush) or **opacity** (Brush option). Tilt maps to **angle** of a flat brush dab. Stored as per-point width in the width profile. Finger input (no pressure) = constant width + heavier smoothing.

---

## 5.4 Drawing-mode toggle & the draw-target contract (recap)

Every drawing tool must honor, at pointer-down time:

1. **Active layer**: locked? hidden? tween layer? (drawing blocked with reason — Part 02b T2B.1 field 16).
2. **Active frame**: keyframe / blank keyframe / held / empty → draw into it, auto-keying where the rule requires.
3. **Drawing mode**: merged vs object.
4. **Current fill + stroke style** (from Color controls) + tool options (size, shape, smoothing, assist mode).
5. **Snapping** flags.

One **DrawCommand** per completed shape/stroke (undo granularity).

---

## 5.5 BUILD CHECKPOINT M1 (drawing slice)

- [ ] Path model (anchors + handles + closed) with fill & stroke sub-objects; fill rules (nonzero/even-odd).
- [ ] Stroke model: base width + width profile + cap (round/square/butt) + join (round/miter/bevel + miter-limit) + dash + art/pattern brush styles.
- [ ] Stroke rendering as outline polygons (correct scaling).
- [ ] Merge mode (same-color merge, cut-hole, split-on-move) AND object mode, with a per-tool toggle.
- [ ] Fill/stroke opacity; no double-darkening on same-style overlap.
- [ ] Convert lines→fills; ink-bottle (fill→stroke); break-apart hierarchy; group/ungroup.
- [ ] All 12 tools of this part functional on desktop + touch with the 15-dimension behavior above.

*Next: `06_shape_system.md` — primitives, drawing objects, raw shapes, merge, shape editing, handles, conversion, break apart, combine/union/cut/intersect/erase, fill/stroke behavior, and the exact shape data representation for the new app.*

---

<!-- ===== FILE: 06_shape_system.md ===== -->

# PART 06 — SHAPE SYSTEM
### Primitives, drawing objects, raw (merge) shapes, shape editing, handles, conversion, break apart, boolean combine (union/intersect/cut/punch), erase, fill/stroke behavior — and the exact shape data representation for the new application.

---

## 6.0 The shape taxonomy (every kind of "shape" in the model)

A 2D animation editor has **four distinct kinds of shape-ish objects**. Confusing them causes most merge/edit bugs. Define them once, in the model:

| Kind | Model type | Atomic? | Editable how | Reuse? |
|---|---|---|---|---|
| **Raw shape (merge shape)** | `shape` | No — fill & stroke are separate sub-objects; overlapping shapes merge/cut | Directly on stage (Selection/Subselection/tools) | No |
| **Drawing object** | `drawingObject` | Yes | Directly on stage; double-click to edit in place | No |
| **Primitive (parametric)** | `rectPrimitive` / `ellipsePrimitive` / `polyStar` | Yes | Parametric (radius/angles/hole) until baked | No |
| **Group** | `group` | Yes | Double-click to edit in place | No |
| *(contrast)* **Symbol instance** | `symbolInstance` | Yes (instance) | Edit definition (updates all) | **Yes** (Part 11) |

The first four are "shapes" (Part 06). The symbol instance is Part 11 — but note the pipeline: **shape → convert to symbol** is the most common transition in the app.

---

## 6.1 Raw shapes & the merge model (the Animate signature behavior)

### 6.1.1 What a raw shape is
A raw shape = a collection of **fills** and **strokes** on one layer/frame, stored as geometry. It is **not** a single atomic object: its fill and strokes are selectable and movable **independently** (Part 03.4.1).

### 6.1.2 The merge rules (exactly)
When raw shapes on the **same layer, same frame** interact:

1. **Same-color fill overlap → MERGE.** Two overlapping blue fills become one blue fill (the union boundary).
2. **Different-color fill on top → CUT (cookie-cutter).** The top shape **punches a hole** in the one below where they overlap. Move the top away → the hole remains.
3. **Stroke crossing a fill → splits the fill** into separate regions at the stroke line.
4. **Same-color stroke overlap → merge** into a connected line network.
5. **Move a selected part → SPLIT.** Selecting a fill region (or part of one) and dragging it **cuts it out** of the shape and takes it along.
6. **Delete a part → hole.** Deleting a selected region removes it, leaving the rest.

### 6.1.3 Why it exists & when to use it
The merge model makes **cel-style painting fast**: draw overlapping outlines, drop fills, erase overdraw — the geometry "sculpts" itself. It's also why Animate pros do clean line art: draw with the **Brush (Paint Fills/Inside)** or use **object mode** to avoid accidental cuts.

### 6.1.4 Data representation of a merge interaction
A raw shape is stored as **one shape node** containing multiple fills/strokes; overlap is resolved **geometrically at edit time**, not by keeping separate nodes:

```
merge(a, b):  // same layer+frame, both raw shapes
  for each fill in b:
    for each fill in a with equal style:  union(region_a, region_b)
    else:                                 subtract(region_a, region_b)  // cut
  for each stroke: split at intersections with other strokes/fills
```

Implementation: the **Boolean geometry engine** (Part 32) computes unions/intersections/subtractions of paths (via polygon clipping). This is the most algorithmically heavy part of the vector engine — budget real engineering for it (it underpins merge mode, eraser, combine-objects, and paint modes).

---

## 6.2 Drawing objects (object-drawing mode)

- Toggle **Object Drawing** in tool Options → each drawn thing becomes a **drawing object** (atomic, own transform, no merge/cut).
- Overlaps **do not** interact — objects stack in the display list (front-to-back).
- Editing: double-click → **edit in place** (breadcrumb + dimming); or right-click → Break Apart to convert to a raw shape.
- Drawing objects can be **combined** via booleans (6.5).

### Why two modes? (design rule for our app)
- **Object mode** = safe default for new users and for heavy art (no accidental destruction).
- **Merge mode** = power mode for Animate-pros doing painted/inked work.
- Both produce shapes; the mode is a **node type + tool toggle**, not two different editors.

---

## 6.3 Primitive shapes (parametric)

- **Rectangle/Oval Primitives** and **PolyStar** store **parameters**, not baked paths (Part 02b T2B.6–8):

```jsonc
{ "type":"rectPrimitive", "x":0,"y":0,"w":200,"h":100,"cornerRadius":12, "fill":{...},"stroke":{...} }
{ "type":"ellipsePrimitive","cx":0,"cy":0,"rx":100,"ry":50,"startAngle":0,"endAngle":360,"innerRadius":0, ... }
{ "type":"polyStar","cx":0,"cy":0,"sides":5,"isStar":true,"starPointSize":0.5,"radius":100, ... }
```

- While parametric: edited via **parameter handles** (dot on the shape) + Properties fields; Subselection shows no anchors.
- **Bake** (Break Apart / Convert to drawing object) → becomes a plain path (loses params, gains full path editing).

### Data representation rule
Store primitives as **nodes with a `params` object** and render by tessellation. Baking replaces the node with a `shape` node. This is cheap and preserves editability — a clear win over always-baking.

---

## 6.4 Shape editing & shape handles

### 6.4.1 Levels of editing
| Level | Tool | Edits |
|---|---|---|
| Whole shape | Selection | Move; edge/corner reshape (drag path edges) |
| Anchor/handle | Subselection | Anchor positions, Bézier handles, point type |
| Topology | Pen sub-tools | Add/delete anchors |
| Width | Width tool | Variable width profile |
| Style | Eyedropper/Bucket/Ink Bottle/Properties | Fill/stroke styles |
| Region | Lasso + move/delete/fill | Partial-shape cut/fill |

### 6.4.2 Shape handles (visual)
- **Anchors**: squares (filled = selected, hollow = unselected).
- **Tangent handles**: dots on short lines from a selected curve anchor.
- **Primitive parameter handles**: dots (corner radius / arc endpoints / inner-radius hole).
- **Width handles**: bars perpendicular to the stroke at width points.
- **Gradient/fill handles**: center/scale/rotate/focal (Gradient Transform).

### 6.4.3 Smooth / Straighten / Optimize
- **Smooth** — iterative path simplification (remove near-collinear anchors, soften curves).
- **Straighten** — recognize near-straight runs and snap them to lines; near-arc runs to arcs.
- **Optimize Curves** (`Ctrl+Shift+Alt+C`) — reduce anchor count by an angle-threshold tolerance; fewer anchors = smaller files (matters for export).
- All are geometry commands on the selected shape; undoable; run through the smoothing pipeline (Part 05 §5.1.7).

---

## 6.5 Combine objects — boolean operations

Animate's **Modify > Combine Objects** works on **drawing objects** (and raw shapes in newer versions):

| Operation | Result | Implemented as |
|---|---|---|
| **Union** | Merge overlapping objects into one (keeps the top object's style) | path union |
| **Intersect** | Keep only the overlap region | path intersection |
| **Punch** | Subtract the top from the bottom (like the cookie-cutter) | path subtraction |
| **Crop** | Keep only the region of the bottom that overlaps the top | inverse of punch (clip) |

```jsonc
// command
{ "op":"combine", "mode":"union|intersect|punch|crop", "targets":[...], "result": nodeId }
```

Rules:
- The **top-most** object is the "active" one (provides the style / the punch shape); the result replaces the operands (or keeps them if "keep originals" is set — our app adds this option).
- Works on raw shapes too in our app (Animate historically required drawing objects; we support both by operating on the shape geometry).
- This is the same Boolean engine as merge mode (6.1.4) — one engine, two entry points.

---

## 6.6 Erase (as shape subtraction)

The Eraser tool (Part 02c T2C.5) is **boolean subtraction** with a moving stamp:

```
eraseStroke(stamps, shape, mode):
  for stamp in stamps:
    shape.fills/strokes = subtract(shape, stamp)   # mode masks: fills-only / lines-only / inside / selection
  split strokes at erase boundaries (a crossed stroke → two strokes)
```

- **Faucet** = delete the connected component (fill) or stroke segment under the click (flood-find + delete).
- Undo = one `EraseCommand` per erase stroke.

---

## 6.7 Fill behavior & stroke behavior (the complete rules)

### 6.7.1 Fill behavior
- A fill lives **inside a closed path** (or a region of overlapping paths, per the fill rule).
- Fill styles: **solid**, **linear gradient**, **radial gradient**, **bitmap** (Part 23).
- **Gradient/bitmap fills carry a transform** (center, scale, rotation, focal) — edited by Gradient Transform, stored in the style (Part 02a T2A.4).
- **Lock Fill** (Brush/Bucket): consecutive strokes/fills share one gradient space (the gradient continues across them).
- **Gap tolerance** (Bucket): a fill can bridge small gaps in the outline (morphological close before fill).
- Fill of a **self-intersecting** path follows the fill rule (5.3.1).

### 6.7.2 Stroke behavior
- A stroke follows a path (open or closed) with base width + optional width profile.
- Caps/joins apply (5.1.10–11).
- **Strokes are flat-colored** in Animate (no gradient strokes); gradient strokes = convert to fill.
- Strokes **split** at intersections with other strokes/fills (merge model) and under the eraser.
- **Convert Lines to Fills** turns the stroke outline into a fill (5.1.13).

---

## 6.8 Shape conversion & break-apart hierarchy (complete map)

```
symbol instance ──Break Apart──▶ raw content (copy of symbol art on this frame)
group ────────────Break Apart──▶ its children (one level)
text block ───────Break Apart──▶ per-character text blocks ──Break Apart──▶ vector shapes
bitmap ───────────Break Apart──▶ bitmap-fill region (editable/lasso-able)
drawing object ───Break Apart──▶ raw shape (merge model)
primitive ────────Break Apart──▶ baked path (then raw shape)
raw shape ──(nothing below)──▶ already raw
```

**Conversion commands (Modify > Shape / Modify > Combine):**
- Convert Lines to Fills; Expand Fill (grow/shrink fill by N px); Soften Fill Edges (feathered edge → banded alpha); Trace Bitmap (raster→vector).
- Our app implements expand/soften as P2 (morphological ops).

---

## 6.9 THE SHAPE DATA MODEL (the exact representation for the new app)

This is the specification another AI can implement directly (full schemas in Part 33). A **shape node**:

```jsonc
{
  "id": "n123",
  "type": "shape",                     // 'shape' | 'drawingObject' | 'rectPrimitive' | 'ellipsePrimitive' | 'polyStar' | 'group'
  "transform": { "x":0,"y":0,"scaleX":1,"scaleY":1,"rotation":0,"skewX":0,"skewY":0,"pivotX":0,"pivotY":0 },
  "fillRule": "nonzero",               // 'nonzero' | 'evenodd'

  // one path + fills + strokes for raw shapes / drawing objects:
  "path": {
    "anchors": [ { "x":0,"y":0,"h1x":-10,"h1y":0,"h2x":10,"h2y":0,"smooth":true }, ... ],
    "closed": true
  },
  "fills": [
    { "region": [0,1,2,3],             // anchor index loop(s) defining the region
      "style": {
        "type": "solid|linearGradient|radialGradient|bitmap",
        "color": "#3fa9f5", "alpha": 1,
        "stops": [ { "offset":0, "color":"#ff0000", "alpha":1 }, ... ],   // gradients
        "transform": { "centerX":0,"centerY":0,"scaleX":1,"scaleY":1,"rotation":0,"focal":0 },
        "bitmapAssetId": null          // bitmap fill
      } }
  ],
  "strokes": [
    { "path": { ... }, "closed": false,
      "style": {
        "color":"#000000", "alpha":1, "width":2,
        "cap":"round|square|butt", "join":"round|miter|bevel", "miterLimit":4,
        "dash":[4,2] | null,
        "brushAssetId": null           // art/pattern brush
      },
      "widthProfile": [ { "t":0, "wL":2, "wR":2 }, ... ] }
  ],

  // parametric primitives:
  "params": { "w":200,"h":100,"cornerRadius":12 } | null,

  // group:
  "children": [ "n124", "n125" ] | null
}
```

### Design rules (why this shape)
1. **One node per shape** (fills+strokes co-located) — matches Animate's merge model and keeps the display list flat.
2. **Regions reference anchors by index** — a fill can span a subset of anchors (e.g. a "donut" uses two loops: outer + inner, opposite winding). Keep `region` as an array of **loops**, each an anchor-index cycle.
3. **Styles are separate from geometry** — style changes never re-tessellate geometry; geometry changes never re-parse styles.
4. **Primitives are nodes with `params`** — bake on demand.
5. **Group is a node with children** — groups are just containers with a transform.
6. **Everything is a node** — the renderer and hit-tester walk one uniform tree (Part 32 Scene Graph).

---

## 6.10 BUILD CHECKPOINT — MILESTONE M1 COMPLETE

With Parts 01–06, the editor is a **working static drawing tool**. Verify:

- [ ] Create a document; draw every primitive (pen/pencil/brush/line/rect/oval/polystar) as raw shapes AND drawing objects AND primitives.
- [ ] Merge model works: same-color union, different-color cut, split-on-move, erase-splits-strokes.
- [ ] Object mode: atomic, no interaction; edit-in-place drill.
- [ ] Booleans: union/intersect/punch/crop on shapes.
- [ ] Break-apart hierarchy for symbol/group/text/bitmap/primitive.
- [ ] Fill styles (solid/linear/radial/bitmap) with gradient transform; stroke styles (width/cap/join/dash/profile).
- [ ] Smooth/straighten/optimize; convert-lines-to-fills; ink bottle; paint bucket with gap tolerance.
- [ ] Shape data model matches §6.9; save/load round-trips exactly.
- [ ] Selection + transform (Parts 03–04) operate correctly on every shape kind.

*M2 begins: `07_timeline.md` — every timeline control, frame type, layer control, and timeline action in full detail.*

---

<!-- ===== FILE: 07_timeline.md ===== -->

# PART 07 — TIMELINE
### The complete timeline specification: every component, every frame type, every layer control, every timeline action — control-by-control, with what changes in the model and how it interacts with keyframes, audio, symbols, and rigging.

---

## 7.0 What the timeline IS (the clock + the score)

The timeline is **two things at once**:

1. **A clock** — it maps a **playhead position** (frame number) to a moment in time (`t = frame / fps`) and evaluates every layer's content at that moment.
2. **A score** — it is an **editable 2D grid** of `layer × frame` where each cell holds a piece of frame data. The user *composes* animation by editing this grid; playback just *reads* it.

Everything in this part is about the grid: its components, its cell types, its controls, and its actions. Keyframe *semantics* (what data lives in a keyframe, how interpolation works) are Part 08; tween *span* behavior is Part 09.

### The core data structure

```jsonc
// A timeline (main timeline or a symbol's timeline)
"timeline": {
  "layers": [ Layer, ... ],          // bottom→top (render order = index order, 0 = back)
  "duration": 120,                    // computed: max frame extent across layers
  "playhead": 0                       // current frame (view state, not saved)
}

// A layer
{
  "id":"L1", "name":"arm", "type":"normal",   // normal|folder|mask|masked|guide|motionGuide|pose|tween|camera|audio
  "visible": true, "locked": false, "outline": false,
  "parentId": null,                  // for folders/nesting
  "zDepth": 0,                        // camera parallax depth (Part 16)
  "attachedToCamera": false,
  "frames": [ Frame, ... ]            // sparse — only keyframes + span markers stored (7.3)
}
```

---

## 7.1 Timeline components (control-by-control)

### 7.1.1 Layer row (left column list)
Each layer = one horizontal row. Clicking a row **selects the layer** (for rename/reorder/delete/properties). Double-click the name = rename. The **active layer** (pencil icon) is where new drawings go. Layer rows show, left→right:

| Control | Icon concept | Click does | Data changed |
|---|---|---|---|
| **Visibility (eye)** | open/closed eye | toggle show/hide | `layer.visible` |
| **Lock (padlock)** | padlock | toggle lock | `layer.locked` |
| **Outline (colored square)** | filled/hollow square | toggle outline render | `layer.outline` |
| **Name** | text | rename (dbl-click) | `layer.name` |
| **Type icon** | (varies) | opens layer menu | — |
| **Attach-to-camera dot** | chain link | pin layer to camera | `layer.attachedToCamera` |

*(Full layer semantics: Part 20. Mask/guide/pose/camera/audio layer types: Parts 21/14/16/17.)*

### 7.1.2 Frame numbers (header ruler)
- A horizontal ruler showing frame numbers (1, 5, 10, 15, …). 
- **Click a number** = jump the playhead to that frame.
- **Drag in the header** = scrub (with audio, if scrubbing enabled — Part 17).
- Current-frame indicator: a red outline/box around the current frame number.

### 7.1.3 Playhead
- A red vertical line + top handle spanning the frame grid. **It is the "now".**
- **Drag the handle** = scrub; **click a frame cell** = jump.
- The playhead is **view state** (not saved), but it drives: what the stage shows, what frame commands target, what properties panel shows for frames.

### 7.1.4 Frame cells (the grid)
- Each `layer × frame` cell shows that frame's **visual language** (7.4). Click selects the frame(s); right-click opens the frame context menu (Part 30); drag moves/copies spans.

### 7.1.5 Onion-skin & playback controls (bottom row)
- **Onion Skin** toggle, **Onion Outlines**, **Edit Multiple Frames**, **Modify Markers** (Part 15).
- **Center Frame** (jump to playhead), **Loop playback**, **Mute**, transport (go-to-first / play / go-to-last).
- **Status readout**: current frame, fps, elapsed time.

---

## 7.2 Frame types (every kind of cell — exact meaning)

| Cell | Visual (concept) | Meaning | Stored data |
|---|---|---|---|
| **Keyframe (with content)** | solid black dot | An explicit frame holding content; content is authored here. | `{type:'keyframe', content:[...]}` |
| **Blank keyframe** | hollow dot | An explicit **empty** keyframe (content intentionally empty — breaks the hold). | `{type:'blankKeyframe'}` |
| **Static / held frame** | gray cell (span of the keyframe) | Not stored — it *repeats* the previous keyframe's content. | (derived — nothing stored) |
| **Empty frame** | white cell | No content on this layer at this frame. | (derived) |
| **Frame span** | gray bar ending in a hollow rectangle | The run of static frames a keyframe holds across. | (derived; extent = next keyframe − 1) |
| **Motion tween span** | blue bar, black dot start, black diamond keys | Interpolated symbol/text tween (Part 09). | `{type:'tween', tween:{kind:'motion', targetId, properties:{...}}}` |
| **Classic tween span** | blue bar + arrow | Legacy tween between two keyframes. | `{type:'classicTween'}` (span between keyframes) |
| **Shape tween span** | light-green bar + arrow | Morph tween between two keyframes. | `{type:'shapeTween'}` |
| **IK pose span** | green bar, diamond poses | Bone armature poses. | `{type:'pose', pose:{...}}` (Part 14) |
| **Frame with action** | cell with small "a" | Frame carries a script/behavior. | `{type:'keyframe', actions:[...]}` |
| **Frame with label** | cell with red flag | Named frame (goto targets). | `{type:'keyframe', label:'walk_01'}` |

**Critical concept — sparse storage:** only **keyframes** (and tween/pose span markers) are stored. Static/empty frames are **derived** by "hold until next keyframe" semantics. The model never stores 120 identical frames. This is what makes the file small and the editor fast.

---

## 7.3 Exposure, holds, and frame spans (the "hold" rule)

- **Exposure** = how many frames a keyframe's content is *visible* for = the run of frames until the next keyframe (exclusive).
- The **hold rule**: a layer at frame `f` shows the content of the **nearest keyframe at or before `f`**. A keyframe "holds" until the next keyframe replaces it.
- **Frame span** = `[keyframe, nextKeyframe - 1]`. The last cell of a span shows a hollow rectangle ("end of hold").
- **Blank keyframe** = an explicit empty hold (e.g., the character disappears at frame 20 by inserting a blank keyframe there).

**Example:** frame 1 = keyframe (drawing), frame 10 = keyframe (different drawing). Frames 1–9 show drawing 1; frame 10+ show drawing 2. Stored: just frames 1 and 10.

---

## 7.4 Timeline action reference (every possible action)

Each action: **trigger → model change → visible result → undo unit**.

### 7.4.1 Insert Frame (F5)
- **Trigger:** select frame(s) → Insert Frame (F5).
- **Model change:** extends the span of the previous keyframe by one frame (inserts a static frame after the keyframe; shifts later frames right).
- **Visible result:** the keyframe's content holds for one more frame (animation stretches).
- **Undo:** one `InsertFramesCommand` (span index range).

### 7.4.2 Insert Keyframe (F6)
- **Model change:** converts the current frame to a keyframe **copying the previous keyframe's content** (content is duplicated → you can now edit it independently at this frame).
- **Visible result:** a new dot; content identical to before until you edit.
- **This is the #1 animation action** — "copy the previous frame and make a new key pose."
- **Undo:** one command.

### 7.4.3 Insert Blank Keyframe (F7)
- **Model change:** converts the current frame to an **empty** keyframe (no content — breaks the hold).
- **Visible result:** a hollow dot; content disappears from here until the next keyframe.
- **Undo:** one command.

### 7.4.4 Delete Frame (Shift+F5)
- **Model change:** removes the frame(s); content after shifts left.
- **Undo:** one command (range).

### 7.4.5 Clear Keyframe (Shift+F6)
- **Model change:** removes the keyframe **status** (the frame reverts to a static/held frame), but **does not delete the frame** — the content collapses into the previous keyframe's hold.
- **Difference from Delete:** Clear Keyframe keeps the timeline length; Delete Frame shortens it.

### 7.4.6 Remove Frames (vs Delete)
- **Delete Frames** removes frames and shifts the rest left (timeline shortens).
- **Remove Frames** deletes the frames **and leaves a gap** (subsequent frames stay put). Our app exposes both with distinct names + tooltips.

### 7.4.7 Copy / Cut / Paste Frames
- **Copy Frames** — copies a frame range (incl. keyframes, tweens, labels) to a clipboard.
- **Paste Frames** — pastes at the playhead (overwriting or inserting per option). Paste **frames** (not just content) is how you move whole animation chunks.
- **Undo:** one command.

### 7.4.8 Duplicate Frames
- Copy + insert immediately after (or at selection). No clipboard.

### 7.4.9 Move Frames (drag)
- Drag a frame/span to another position or layer. If the target has a keyframe, prompt overwrite/insert.
- **Undo:** one `MoveFramesCommand` (from/to).

### 7.4.10 Reverse Frames
- Reverse the **order** of the selected keyframes (e.g., a walk-cycle reverses). Content plays backwards.
- Applies to keyframes within the selection; tweens re-interpolate.

### 7.4.11 Extend / Shorten Frame (span drag)
- Drag the **last frame** of a span (or the span edge) to extend/shorten the hold. Our app also supports **duration-drag** on any span edge.

### 7.4.12 Convert to Keyframes / Blank Keyframes
- **Convert to Keyframes** — every frame in the selection becomes a keyframe (e.g., bake a tween into per-frame keys — needed before frame-by-frame editing).
- **Convert to Blank Keyframes** — same but empty.

### 7.4.13 Distribute to Layers
- Takes each selected object (or each group of selected content) and moves it to its **own new layer** — used to split a character into parts (Part 13 step 2). Auto-names layers.

### 7.4.14 Synchronize Symbols (legacy)
- Aligns the internal timelines of graphic-symbol instances to the main timeline (so nested loops line up). Our app: a "sync nested loops" command (P2).

### 7.4.15 Tween actions (spans)
- **Create Motion Tween** — converts the selection (symbol/text) + its layer into a tween span (Part 09).
- **Create Classic Tween** / **Create Shape Tween** — between two keyframes (Part 09).
- **Insert Pose** — on a pose layer (Part 14).

---

## 7.5 Layer controls & hierarchy (timeline-side)

- **Add layer** (+), **Add folder**, **Delete layer**, **Duplicate layer**.
- **Reorder** (drag up/down) — changes render order (top = front).
- **Rename** (double-click).
- **Folder** — a container row; layers inside can be **collapsed/expanded** (triangle); folders group + can be locked/hidden as one.
- **Layer parenting** — a layer can be parented to another (indent + line), so it inherits the parent's transform/visibility *[WISH W2]* (our app: parenting via a `parentId` link; moves propagate in local space so copy/paste can't corrupt — Part 20).
- **Layer type** — set via right-click → Properties (normal/mask/masked/guide/pose/camera/audio/tween/folder). Type changes what the layer stores and how it renders (Parts 16/17/20/21).
- **Layer properties dialog** — name, type, outline color, layer height (timeline row size), visibility.

---

## 7.6 How the timeline interacts with everything else

### With keyframes (Part 08)
The timeline *stores* keyframes; keyframes *carry* the data. Editing a frame cell = editing the keyframe at that cell. The playhead selects *which* keyframe is "current" for stage edits.

### With audio (Part 17)
Audio lives on an **audio layer** as a **waveform drawn across frames**. The waveform's horizontal extent = the sound's duration at current fps. Dragging the waveform moves its start frame; keyframing Start/Stop uses the Sync menu (Event/Start/Stop/Stream). **Scrubbing** the playhead plays stream audio at the scrub position (when scrub-audio is on).

### With symbols (Part 11)
The main timeline can hold **instances** of symbols. A **graphic symbol instance** shows one of its internal frames (loop/play-once/single-frame + first-frame via Frame Picker) — so the main timeline "drives" graphic-symbol animation by frame number. A **movie clip** plays independently of the main timeline. This is why "timeline = clock" matters: main-timeline frame → graphic-instance frame mapping is deterministic.

### With rigging (Part 14)
Pose layers store **poses** (armature configurations) as diamonds; the timeline interpolates between them. Bones are per-pose-layer; moving a bone writes into the current pose keyframe.

### On mobile (Part 31)
- Scrub = drag on the playhead or on the stage (Time Scrubber).
- Frame ops = long-press frame → action menu (insert/delete/copy/paste/clear).
- Layer ops = long-press layer row → menu.
- Pinch on the ruler = zoom the frame ruler (see more frames); two-finger scroll = pan the frame grid.

---

## 7.7 BUILD CHECKPOINT M2 (timeline slice)

- [ ] Layer list with visibility/lock/outline/name/type; add/delete/rename/reorder/folder; active-layer tracking.
- [ ] Frame ruler + playhead (click-to-jump, drag-to-scrub).
- [ ] Sparse frame storage with the hold rule (keyframes + derived static frames).
- [ ] All frame types rendered with distinct visuals (keyframe/blank/tween/pose/label/action/held).
- [ ] All 15+ timeline actions working with correct undo granularity (insert/delete/clear/remove/copy/paste/move/duplicate/reverse/extend/shorten/convert/distribute).
- [ ] Tween-span creation (motion/classic/shape) wired (full behavior in Part 09).
- [ ] Audio waveform display + scrub (full behavior in Part 17).
- [ ] Touch: scrub, long-press frame/layer menus, ruler pinch-zoom.

*Next: `08_keyframe_system.md` — what data each keyframe type stores, what changes visually/internally, interpolation, and what happens on move/delete/duplicate — beginner-to-technical.*

---

<!-- ===== FILE: 08_keyframe_system.md ===== -->

# PART 08 — KEYFRAME SYSTEM
### Keyframes from beginner to technical: what data each keyframe stores, what changes visually vs internally, how interpolation works, and what happens on move/delete/duplicate — for every keyframe type.

---

## 8.0 Keyframes for a beginner (60-second model)

A keyframe is a **snapshot you author**; everything between keyframes is **computed** by the app.

- You draw a ball at **frame 1** (a keyframe).
- You move the ball at **frame 10** (another keyframe).
- Frames 2–9 are **not authored** — the app **interpolates** the ball's position between the two.

That's it. A keyframe = "here is the truth at this moment." Frames between keyframes = "guess smoothly between the truths."

### The two families of keyframes

| Family | Where it lives | What it stores |
|---|---|---|
| **Property keyframes** (modern motion tween) | Inside a **tween span**, **per property** | A single property value (x, y, scaleX, rotation, alpha, …) for the tween's target object. |
| **Classic/frame keyframes** | Whole-frame | The **entire content** of the layer at that frame (all objects + their state). |

Animate has both: the **modern motion tween** uses property keyframes (fine-grained, one per property); the **classic tween** and frame-by-frame use whole-frame keyframes (coarse). Our app implements property keyframes as the primary system (it is strictly more flexible) and whole-frame keyframes for frame-by-frame (Part 15).

---

## 8.1 The keyframe data model

```jsonc
// PROPERTY keyframe (inside a motion tween span)
{ "frame": 10, "property": "x", "value": 320, "ease": null }

// WHOLE-FRAME keyframe (frame-by-frame / classic tween endpoints)
{ "frame": 1, "type": "keyframe", "content": [ nodeIds... ], "label": null, "actions": [] }
```

### 8.1.1 What data is stored (general)
- **Which frame** it occupies.
- **The value(s)** being keyed (one property, or whole content).
- **Optional easing** (Part 09) attached to that keyframe or the outgoing segment.
- **Optional metadata**: frame label (named goto target), frame actions (scripts), sound assignment (Part 17), color/alpha of a pose.

### 8.1.2 What changes visually
- A keyframe **marker** appears in the timeline (dot / diamond).
- On the stage: at that frame, the object shows the **keyed state** (e.g., rotated 45°).
- In panels: the Properties panel shows the keyed values when the playhead is on that frame.

### 8.1.3 What changes internally
- The document model gains a keyframe record at that frame.
- The **interpolator's input set** changes → all in-between frames between neighboring keyframes are **recomputed** (dirty range = the affected span).

---

## 8.2 Interpolation (how in-between frames are computed)

```
valueAt(t) = interpolate( keyBefore.value, keyAfter.value, ease(normalize(t)) )
```

- `t` = playhead frame, normalized to the segment `[frameBefore, frameAfter]` → `[0,1]`.
- `interpolate` depends on property type:
  - **Numbers** (x, y, alpha, scale, rotation, zoom): linear (or eased) numeric lerp.
  - **Rotation**: shortest-path or forced CW/CCW with optional multiple full turns (Part 09).
  - **Colors**: lerp in the color space (RGB or OKLab — our app uses OKLab for perceptually even fades, P1).
  - **Shapes (shape tween)**: **path morphing** — anchor correspondence between start/end paths, then per-anchor lerp (Part 09.4). This is the hardest interpolation; see 8.3.4.
  - **Bones**: per-joint angle/translation lerp (Part 14).
  - **Camera**: position/zoom/rotation lerp (Part 16).
- **Easing** (Part 09.5) remaps `t` (ease-in/out, custom curves) before interpolation.

**Sampling rule:** playback (and export) evaluates the timeline at integer frames (and at arbitrary times for video export with motion blur). The interpolator is **deterministic** — same inputs → same frames.

---

## 8.3 Keyframe types (per the requirement)

For each: **stored data / visual change / internal change / interpolation / move / delete / duplicate**.

### 8.3.1 Position keyframe
- **Stored:** `{property:'x'|'y', value}` (motion tween) or whole-frame content position (classic).
- **Visual:** object at that spot; motion path shows a vertex (Part 10).
- **Internal:** tween's position curve gets a control point.
- **Interpolation:** linear/eased between position keys; the object travels the **motion path**.
- **Move (drag the keyframe in time):** the object reaches that position earlier/later; the path re-times.
- **Delete:** the curve loses a control point; path simplifies (the object no longer passes through that spot).
- **Duplicate:** two identical position keys (object pauses there between them).

### 8.3.2 Rotation keyframe
- **Stored:** `{property:'rotation', value}` (+ orientation flags: auto/CW/CCW, rotations count).
- **Visual:** object angle changes; the stage shows the rotated state.
- **Internal:** rotation curve control point.
- **Interpolation:** angle lerp; shortest-path unless flags force direction/full turns.
- **Move:** rotation happens earlier/later.
- **Delete:** rotation jumps from previous to next key directly.
- **Duplicate:** rotation holds (pause) between the duplicates.

### 8.3.3 Scale keyframe
- **Stored:** `{property:'scaleX'|'scaleY', value}` (independent per axis).
- **Visual:** object size changes around the pivot.
- **Internal:** scale curve control point.
- **Interpolation:** multiplicative-consistent lerp (lerp on log-scale for natural growth — our app's choice; Animate lerps linearly).
- **Move/Delete/Duplicate:** as rotation.

### 8.3.4 Shape keyframe (shape tween / frame-by-frame)
- **Stored:** whole-frame content = a **shape** (path + fills + strokes). In a shape tween, TWO shape keyframes (start + end) define the morph.
- **Visual:** the shape looks different at this frame.
- **Internal:** for shape tweens, the engine builds **anchor correspondence** between start/end paths (matching by index, position, or manual **shape hints** — Part 09.4).
- **Interpolation:** per-anchor lerp of positions + handles; per-fill color lerp; region count changes handled by splitting/merging loops (Part 09.4).
- **Move:** the morph starts/ends earlier/later.
- **Delete (one endpoint):** the tween breaks (dashed line = broken tween); the remaining frames hold the surviving keyframe.
- **Duplicate:** no visible change (identical shape between).

### 8.3.5 Symbol keyframe (symbol swap / instance change)
- **Stored:** whole-frame content = a **symbol instance** (which symbol + instance transform). Swapping the symbol at a keyframe = "symbol keyframe" in practice.
- **Visual:** a different symbol appears (e.g., mouth pose A → mouth pose B — see 8.3.9).
- **Internal:** the frame's instance `symbolId` changes.
- **Interpolation:** symbol swaps are **discrete** — no interpolation (the swap happens at the keyframe). (Position/transform of the instance still tweens around the swap.)
- **Move/Delete/Duplicate:** as classic keyframes.

### 8.3.6 Color keyframe (color/alpha of a symbol instance)
- **Stored:** `{property:'tint'|'brightness'|'alpha', value}` — the instance's **color effect** (Part 11).
- **Visual:** the instance recolors/fades.
- **Internal:** color-effect curve control point.
- **Interpolation:** color lerp (RGB/OKLab) or alpha lerp.
- **Move/Delete/Duplicate:** as other property keys.

### 8.3.7 Camera keyframe
- **Stored:** `{frame, camera:{x,y,z,zoom,rotation,tint}}` on the camera layer.
- **Visual:** the whole stage view changes (pan/zoom/rotate) — the camera keyframe changes the **frame**, not the art.
- **Internal:** camera layer's keyframe data.
- **Interpolation:** position/zoom/rotation lerp (zoom often lerped in log-space for natural push-ins — our app's choice).
- **Move:** the camera move re-times.
- **Delete:** camera snaps from previous to next view.
- **Duplicate:** camera holds (static shot).

### 8.3.8 Bone keyframe (pose)
- **Stored:** `{frame, pose:{boneStates:[{boneId, rotation, translation}]}}` on a pose layer.
- **Visual:** the armature takes that pose.
- **Internal:** each bone's angle/position control points.
- **Interpolation:** per-bone angle/translation lerp between poses (IK is *not* re-solved during playback — the solver runs at author time; playback interpolates stored angles. This is how Animate behaves and it's the right model).
- **Move:** the pose re-times.
- **Delete:** the armature interpolates across the gap (or breaks if it was a single pose).
- **Duplicate:** the pose holds.

### 8.3.9 Mouth keyframe (lip-sync viseme)
- **Stored:** a **graphic-symbol instance** whose "first frame" is set to a mouth-pose frame (via Frame Picker / auto lip-sync — Part 18). In practice = a **symbol-swap/instance keyframe** pointing at a different mouth pose.
- **Visual:** the mouth shape changes (A/E/O/M/rest…).
- **Internal:** the instance's `symbolId` or `firstFrame` changes.
- **Interpolation:** discrete (mouth shapes snap, like real speech — no morph).
- **Move/Delete/Duplicate:** as symbol keyframes; auto lip-sync generates a run of these from audio (Part 18).

---

## 8.4 Keyframe lifecycle events (what happens when…)

### 8.4.1 A keyframe is MOVED (dragged in time)
1. The keyframe record's `frame` changes.
2. The span it belongs to re-computes (dirty range).
3. If it was a tween property keyframe, the property curve re-times; the motion path re-draws (Part 10).
4. If it lands past the layer duration, the layer extends.
5. Undo = one `MoveKeyframeCommand`.

### 8.4.2 A keyframe is DELETED
1. The record is removed.
2. **Property keyframe:** the property curve loses the point; neighbors interpolate across (or hold the remaining value).
3. **Whole-frame keyframe:** the layer reverts to the previous keyframe's hold (or becomes empty if it was the first).
4. **Classic/shape tween endpoint:** the tween **breaks** (rendered as a dashed line; the span holds the surviving endpoint).
5. **Pose:** armature interpolates across, or breaks.
6. Undo = one `DeleteKeyframeCommand`.

### 8.4.3 A keyframe is DUPLICATED (copy-paste)
1. A new record with identical data at the target frame.
2. Between identical keys, the property **holds constant** (a pause — the classic timing trick).
3. Undo = one `PasteKeyframeCommand`.

---

## 8.5 Auto-keying (when a keyframe is created for you)

- **Rule (our app, explicit):** editing an object's property while the playhead is on a **non-keyframe** frame auto-inserts a property keyframe (motion tween) or converts to a keyframe (frame-by-frame) at the playhead, and shows a toast: "Auto-keyed frame N."
- **Animate legacy "Auto-Keyframe mode":** a scrub-with-keys mode; deprecated but our app offers a toggle (P2) for muscle-memory users.
- **Blank keyframe vs keyframe:** auto-key on empty layers creates a **keyframe with content** (F6 semantics), not blank.

---

## 8.6 Keyframes + audio/symbols/rigging (cross-interactions)

- **Audio:** sound is attached to **whole-frame keyframes** (the sound starts at that keyframe; Stop sync at a later keyframe — Part 17). A keyframe can carry a `sound:{assetId, sync, loop, effect}`.
- **Symbols:** graphic-instance frame mapping (Part 11) means a main-timeline keyframe can *drive* a graphic symbol's internal frame — the mechanism behind Frame Picker lip-sync.
- **Rigging:** poses are keyframes on pose layers (8.3.8); bone constraints are **not** keyframed (constraints are rig-level, static per bone).

---

## 8.7 BUILD CHECKPOINT M2 (keyframe slice)

- [ ] Two keyframe families implemented: property keyframes (per-property, inside tween spans) + whole-frame keyframes (frame-by-frame).
- [ ] Interpolator for: numbers, rotation (with direction/flags), colors (OKLab), alpha, scale (log-lerp), camera, bones.
- [ ] Shape morph interpolation with anchor correspondence (details in Part 09.4).
- [ ] Keyframe move/delete/duplicate semantics exactly as 8.4, incl. tween-break on endpoint delete.
- [ ] Auto-keying rule + toast.
- [ ] Frame labels + frame actions stored on keyframes.
- [ ] All keyframe types render correct timeline visuals.

*Next: `09_tweening.md` — Motion Tween, Classic Tween, Shape Tween (start/end/interpolation/supported properties/easing/motion path/rotation/scale/color/alpha/filters/morphing) + the complete easing system.*

---

<!-- ===== FILE: 09_tweening.md ===== -->

# PART 09 — TWEENING
### Motion Tween, Classic Tween, Shape Tween — each with starting state, ending state, interpolation, supported/unsupported properties, easing, motion path, rotation, scale, color, alpha, filters, morphing, keyframe behavior — plus the complete easing system.

---

## 9.0 The three tween types at a glance

| | Motion Tween (modern) | Classic Tween | Shape Tween |
|---|---|---|---|
| Interpolates | A **symbol/text instance's properties** over a span | A single object between two **whole-frame keyframes** | A **raw shape morphing** into another shape |
| Storage | A **span** with per-property keyframes | Two keyframes + a span flag | Two keyframes + a span flag |
| Target | Symbol instances + text (others auto-wrapped) | Instances/groups/text (converted to symbol) | Raw shapes only |
| Motion path | Yes (editable Bézier) | Only via **motion guide** (legacy) | No |
| Per-property keys | Yes (x, y, scaleX, … independent) | No (single value per keyframe) | No |
| Easing | Per-property + presets | Simple ease + custom graph | Simple ease + custom graph |
| Modern default? | Yes (current Animate) | Legacy (kept for compat) | Yes (for morphing) |

**Design rule for our app:** implement **motion tween as the primary system** (it is strictly more powerful), **shape tween** for morphing, and **classic tween as a compatibility layer** that internally maps to whole-frame keyframes. The timeline visual language distinguishes them (Part 07.2).

---

## 9.1 MOTION TWEEN

### 9.1.1 Starting state
- A **tween span** on a **tween layer**, with a **target object** (symbol instance or text) at the first frame. The first frame is a **property keyframe** holding all initial values.
- Creation: select an object → Insert > Motion Tween. If the object isn't a symbol/text, Animate **wraps it in a symbol** (our app prompts: "Tweening requires a symbol — convert?").

### 9.1.2 Ending state
- Move the playhead in the span and change a property (drag the object, change alpha in Properties, rotate, etc.) → a **property keyframe** is created at that frame. The tween interpolates from the previous key of that property to this one.
- There is **no single "end keyframe"** — each property has its own keys, possibly at different frames.

### 9.1.3 Interpolation
- Per-property numeric interpolation (Part 08.2): position, scale, rotation, skew, alpha, color, filters.
- The **span** is the unit: select it as one object, drag it, copy it, delete it, or stretch it (all keys scale proportionally).

### 9.1.4 Supported properties (what a motion tween can animate)

| Property | Keyframe granularity | Notes |
|---|---|---|
| x, y (position) | independent | Drives the **motion path** (Part 10). |
| scaleX, scaleY | independent | Around the pivot. |
| rotation | single | With orientation options (9.1.7). |
| skewX, skewY | independent | |
| alpha (opacity) | single | Instance color-effect alpha. |
| tint / brightness | single | Instance color effect. |
| **Filters** (drop shadow, blur, glow, etc.) | per-filter per-param | Instance filters (Part 11). |
| 3D (rotationX/Y/Z, z — legacy) | per-property | Legacy only. |

### 9.1.5 Unsupported properties
- **Raw-shape geometry** (use shape tween).
- **Symbol swap** is not a *tweened* property (discrete swap at a keyframe; position still tweens around it).
- **Pivot changes** — pivot is static within a span in practice.
- **Frame labels/actions** — not tweened.
- **Bones** — bones use pose layers, not motion tweens (Part 14).

### 9.1.6 Easing
- Per-property easing in the **Motion Editor / graph editor** *[WISH W4]*: each property curve can have its own ease (ease-in/out, presets, custom Bézier). See 9.4.

### 9.1.7 Motion path
- Position keys define a **motion path** — a visible, editable Bézier the object follows (full spec: Part 10). Rotate-along-path option orients the object to the path tangent.

### 9.1.8 Rotation details
- Rotation is stored as **degrees + orientation flags**: `Auto` (shortest path), `CW`, `CCW`, and a **"rotations"** count (number of extra full turns — e.g., a wheel spins 3× while moving).

### 9.1.9 Keyframe behavior
- Property keyframes are **per-property**: you can key x at frame 5 and alpha at frame 12 independently. Right-click a span → **View Keyframes** → pick which property's keys to display.
- Deleting a property keyframe reverts that property to interpolation across the gap.

### 9.1.10 Tween span operations
- **Move span** (drag to another layer/frame); **stretch** (scale all keys); **swap target** (paste a new instance onto the span / Swap Symbol — the tween re-targets, keeping the property curve); **save as motion preset** (reusable tween — Part 09.5).

---

## 9.2 CLASSIC TWEEN

### 9.2.1 Starting & ending state
- Two **whole-frame keyframes** on the same layer (start content at K1, end content at K2) + a "Classic Tween" flag on the span between them.
- Both keyframes must contain the **same object** (usually a symbol instance, or a group/text — Animate auto-converts to symbol with a warning).

### 9.2.2 Interpolation
- The object's **whole state** interpolates: position, scale, rotation, skew, alpha, color, filters — all in **one** keyframe pair (no per-property keys).
- Frames render light blue with an arrow; a **dashed line** = broken tween (missing endpoint / different object).

### 9.2.3 Supported / unsupported
- Supported: transform (move/scale/rotate/skew), color effect (alpha/tint/brightness), filters.
- Unsupported: shape morphing, per-property keys, motion path (without a motion guide layer).

### 9.2.4 Motion guide (legacy path support)
- A **motion guide layer** above the tweened layer holds a **path**; the classic tween's object follows it (snap the object's pivot to the path start/end). Full guide/path semantics: Part 10.
- Orientation-to-path + snap-to-path options.

### 9.2.5 Easing
- A single **Ease** slider (−100 ease-in … +100 ease-out) + a **Custom Ease** graph (drag control points on a value/time curve — see 9.4).

### 9.2.6 Copy/Paste Motion
- **Copy Motion as XML** / **Paste Motion Special** (Animate) — copy a classic tween's property curves and apply to another object (motion presets). Our app: **Copy Motion / Paste Motion** as JSON (same idea).

### 9.2.7 Why keep classic tween at all?
- Muscle memory + a huge body of tutorials use it; it is simpler to reason about ("two poses → tween"). Our app keeps it as a thin layer over whole-frame keyframes + an interpolator. It also matches the **frame-by-frame → tween hybrid** workflows many animators use.

---

## 9.3 SHAPE TWEEN

### 9.3.1 Starting & ending state
- Two **whole-frame keyframes** with **raw shapes** (draw a square at K1, a circle at K2) + a "Shape Tween" flag. The shape **morphs** between them.

### 9.3.2 Interpolation (shape morphing — the hard part)
1. **Anchor correspondence**: match anchors of the start path to the end path. Default: by **index order** (anchor 0→0, 1→1…). If counts differ, the engine **inserts/splits** anchors so both paths have equal counts (subdivide the one with fewer).
2. **Per-anchor lerp**: each anchor's position + handles lerp across the segment; the fill follows the moving outline.
3. **Fill color lerp**: fill/stroke colors lerp (RGB/OKLab).
4. **Shape hints** (Modify > Shape > Add Shape Hint, Ctrl+Shift+H): the user places **lettered markers** (a, b, c…) on start & end shapes to **force correspondence** ("this corner morphs to THAT corner") — fixes chaotic morphs.

### 9.3.3 Supported / unsupported
- Supported: raw shapes (paths, fills, strokes, colors, variable-width profiles — Animate supports width-profile shape tweens).
- Unsupported: symbols/groups/text/bitmaps (must **Break Apart** to raw shapes first).

### 9.3.4 Easing
- Simple ease slider + custom ease graph (same as classic).

### 9.3.5 Keyframe behavior
- Only the two endpoint keyframes are editable; intermediate frames are computed. Add an intermediate keyframe (a third shape) for multi-stage morphs. Delete an endpoint → tween breaks (dashed).

### 9.3.6 Shape-tween + motion
- You can **move** the shape between K1 and K2 (position changes) — the shape morphs **and** travels. Color + position + shape all tween together.

---

## 9.4 THE COMPLETE EASING SYSTEM

Easing = remapping the interpolation parameter `t` (Part 08.2) so motion accelerates/decelerates. Our app implements a unified easing engine used by **all** tween types and the graph editor.

### 9.4.1 The easing function

```
easedT = easeFunction(t)          # t ∈ [0,1] → eased t' ∈ [0,1]
valueAt(t) = lerp(v0, v1, easedT)
```

### 9.4.2 Built-in easings

| Family | Functions |
|---|---|
| Linear | linear |
| Quadratic / Cubic / Quartic / Quintic | easeIn, easeOut, easeInOut |
| Sine | easeIn, easeOut, easeInOut |
| Exponential | easeIn, easeOut, easeInOut |
| Circular | easeIn, easeOut, easeInOut |
| Back | easeIn, easeOut, easeInOut (overshoot) |
| Elastic | easeIn, easeOut, easeInOut (spring) |
| Bounce | easeIn, easeOut, easeInOut |
| Steps | stepStart, stepEnd, stepN(n) (discrete) |

*(These are the standard Robert Penner easing curves — public domain; implement them directly.)*

### 9.4.3 The ease slider (−100 … +100)
- Classic/shape tween: a single **Ease** value. Negative = **ease-in** (slow start, fast end); positive = **ease-out** (fast start, slow end). The slider sets the strength; the curve is quadratic by default.

### 9.4.4 Custom ease (graph editor)
- A **value-over-time graph**: horizontal axis = frames (0%→100% of the segment), vertical = percentage of change (0%→100%). A diagonal line = linear. Drag the line / add control points = custom acceleration curve (Bézier).
- Our app's graph editor *[WISH W4]* shows **every property curve** of a tween (position X/Y, scale, rotation, alpha…) on one shared timeline — the After-Effects-style experience users want: multi-select keyframes, drag values directly on the graph, per-property eases.

### 9.4.5 Easing presets
- Animate ships **ease presets** (pre-configured curves: "Ease In", "Ease Out", "Bounce In", "Spring", etc.) applicable from a dropdown. Our app: the built-in functions (9.4.2) are the presets + a **save-custom-preset** option.

### 9.4.6 Motion presets (reusable tweens)
- A **motion preset** = a saved tween (all property curves + easing) that can be applied to another object. Animate's Commands menu (Copy/Paste Motion, motion presets). Our app: **Motion preset library** (JSON), drag-onto-object to apply.

---

## 9.5 Tween model (data)

```jsonc
// motion tween span (on a tween layer)
{ "type":"tween", "kind":"motion",
  "targetId":"n123",
  "start": 1, "duration": 60,
  "properties": {
     "x":      [ {frame:1, value:0, ease:null}, {frame:61, value:320, ease:{fn:'easeOut', a:1.7}} ],
     "y":      [ {frame:1, value:0}, {frame:61, value:0} ],
     "rotation":[ {frame:1, value:0}, {frame:61, value:360, orientation:'CW', rotations:1} ],
     "alpha":  [ {frame:1, value:1}, {frame:61, value:0} ]
  },
  "path": { "anchors":[...], "closed":false }   // derived from x/y keys (Part 10)
}

// classic/shape tween
{ "type":"classicTween" | "shapeTween", "start":1, "end":30, "ease": 0, "customEase":[ {t,y}... ], "shapeHints":[{startAnchor, endAnchor}] }
```

---

## 9.6 BUILD CHECKPOINT M2 (tween slice)

- [ ] Motion tween: span + per-property keyframes for x/y/scale/rotation/skew/alpha/tint/filters; auto-wrap non-symbols (with prompt).
- [ ] Motion path rendering + editing (Part 10 completes it); rotate-along-path; rotation flags (CW/CCW/loops).
- [ ] Classic tween: whole-frame interpolation + motion-guide path + ease slider/custom graph + copy/paste motion.
- [ ] Shape tween: anchor correspondence + subdivision + shape hints + color/width-profile morphing.
- [ ] Easing engine: all Penner functions + slider + custom Bézier graph + presets + motion presets.
- [ ] Graph editor (AE-style): multi-property curves, multi-select keys, per-property ease *[WISH W4]*.
- [ ] Broken-tween rendering (dashed) + recovery UX.

*Next: `10_motion_path.md` — path, anchors, Bézier handles, tangents, curves, motion guide, position interpolation, orientation, rotate-along-path, path editing/duplication/reversal.*

---

<!-- ===== FILE: 10_motion_path.md ===== -->

# PART 10 — MOTION PATH
### The path a tweened object follows: path, anchors, Bézier handles, tangents, curves, motion guide, position interpolation, orientation, rotation-along-path, path editing/duplication/reversal.

---

## 10.0 What a motion path is

A motion path is the **curve traced by an object's position over time** in a motion tween. It is derived from the tween's **position property keyframes** (x, y keys — Part 09.1): each position keyframe = one **vertex** on the path. The object travels the path, arriving at each vertex at that keyframe's time.

```
positionKeys:  (frame 1, P0) (frame 30, P1) (frame 60, P2)
motion path =  Bézier curve through P0 → P1 → P2
object position at t = point on the curve at arc-position(t)
```

Two kinds in Animate:
1. **Motion-tween path** (modern) — the path **is** the tween's position curve; editable directly on stage.
2. **Motion guide** (classic tween, legacy) — a separate guide-layer path that the tweened object snaps to.

Our app implements #1 as the primary (it's the modern model) and #2 as a compatibility layer.

---

## 10.1 Path anatomy (the terms)

| Term | Meaning |
|---|---|
| **Path** | The ordered curve the object follows. |
| **Vertex / anchor point** | A point where the path changes direction; one per **position keyframe**. |
| **Bézier handle / tangent** | The two-direction line at a vertex that controls the curve's approach/exit. |
| **Tangent length** | How far the curve is "pulled" toward the handle (longer = wider arc). |
| **Curve segment** | The Bézier between two adjacent vertices. |
| **Closed vs open path** | A closed path loops (the object returns to the start and continues). |
| **Arc position** | How far along the path the object is at time t (parameterized by the position curve's easing, **not** by arc-length unless normalized). |

### Data model

```jsonc
// derived from the tween's x/y keys, cached for editing:
"path": {
  "anchors": [ { "x":0,"y":0,"h1x":..,"h1y":..,"h2x":..,"h2y":.. }, ... ],  // h1=incoming, h2=outgoing handles
  "closed": false,
  "vertexFrames": [1, 30, 60]      // which frame each anchor corresponds to
}
```

Editing the path **writes back** to the x/y keys (they are the same data, two views).

---

## 10.2 Position interpolation along the path

Two distinct notions of "position on a path":

1. **Parameter interpolation** — `point = bezier(path, t)` where `t` = eased segment progress (Part 08.2/09.4). This is what Animate does: the object's speed along the path follows the **position easing**, and equal `t` steps are **not** equal distances (a long curve segment and a short one are both traversed in their allotted keyframe interval). 
2. **Arc-length reparameterization** — constant speed along the path regardless of segment length.

**Design rule (our app):** default to **parameter interpolation** (matches Animate exactly — users expect it), and offer **"constant speed"** as a per-tween option (P1, valuable for wheels/cameras). Both are implemented by sampling the Bézier and building an arc-length lookup table when constant speed is requested.

### Multi-segment mapping
- Segment `i` spans `[vertexFrames[i], vertexFrames[i+1]]`. The object's position at frame `f` in that range = `bezier(segment_i, ease((f - f0)/(f1 - f0)))`.
- The segment's **own easing** comes from the position property keys (per-key easing — Part 09.4).

---

## 10.3 Orientation & rotation along the path

| Option | Behavior |
|---|---|
| **No orientation** | The object keeps its authored rotation (doesn't turn with the path). |
| **Orient to path** | The object **rotates to face the path tangent** (its forward axis aligns with travel direction) — e.g., a car following a road, a bird banking. |
| **Rotation along path (combined)** | The object's own rotation property **adds** to the path orientation (e.g., a spinning wheel while orienting to the road). |

Implementation: at each frame, compute the **tangent angle** `θ = atan2(dy, dx)` of the path at the object's position; apply `rotation_final = objectRotation + θ` when orient-to-path is on. The object's **forward axis** is defined as its +X local axis (or a user-specified "forward" angle).

**Snap to path (classic motion guide):** the object's **pivot** snaps to the guide path at the start/end keyframes; in between it follows the path (orient-to-path optional).

---

## 10.4 Path editing (what the user can do)

| Operation | Tool | Effect |
|---|---|---|
| **Move a vertex** | Selection (click a vertex) or Subselection | Moves that position keyframe's (x,y) → the object re-routes through the new point. |
| **Drag a segment** | Selection (drag the curve itself) | Reshapes the segment (re-fit Bézier through the drag point) → updates the adjacent position keys' tangents. |
| **Pull tangent handles** | Subselection | Changes the curve's approach/exit at a vertex (smooth vs corner: Alt splits the handles). |
| **Add a vertex** | Click on the path (Subselection / right-click → Add Keyframe) | Inserts a new position keyframe at that point (at the corresponding frame). |
| **Delete a vertex** | Select vertex → Delete | Removes that position keyframe; the path re-smooths between neighbors. |
| **Straighten/curve a segment** | Convert point (Subselection) | Toggle the vertex between corner (sharp) and smooth (curved). |

**Critical rule:** path edits are **time-aware** — dragging a vertex changes the *position at that keyframe's time*, not the timing. To change *when* the object is somewhere, move the keyframe on the timeline (Part 08.4.1).

---

## 10.5 Path duplication & reversal

| Operation | Does |
|---|---|
| **Duplicate path (copy motion)** | Copy the tween's position curve to another tween/object (Copy/Paste Motion — Part 09.2.6). The object follows the same route. |
| **Reverse path (Reverse Frames)** | Reverses the keyframe order → the object travels the path **backwards** (end→start). The curve geometry is unchanged; only the time direction flips. |
| **Reverse path direction (our app addition, P2)** | Keep timing, but reorder the vertices so the object goes start→end along the *mirrored* route. Distinct from Reverse Frames (which reverses time). |

---

## 10.6 Motion guide layers (legacy classic-tween paths)

- A **motion guide layer** sits above a tweened layer; its content is a **path** (not rendered at export).
- The tweened layer is **indented/linked** to the guide; the object's pivot **snaps to the guide's start** at K1 and **end** at K2.
- The object follows the guide; **Orient to Path** + **Snap** options in the frame Properties.
- Unlinking = drag the layer out from under the guide.
- **Our app:** supports guide layers as a compatibility feature; the modern motion path (10.1) is the recommended tool.

---

## 10.7 BUILD CHECKPOINT M2 (path slice)

- [ ] Motion path derived from x/y keys, rendered on stage, editable (vertices, segments, handles, add/delete).
- [ ] Path edits write back to position keys (single source of truth).
- [ ] Parameter interpolation (default) + constant-speed option (arc-length table).
- [ ] Orient-to-path + rotation-along-path + forward-axis setting.
- [ ] Copy/paste motion; reverse frames; reverse-direction.
- [ ] Motion guide layers (classic tween compat) with snap + orient.

*Next: `11_symbol_system.md` — graphic/movie clip/button symbols, instances, nesting, nested animation, registration point, symbol editing, swap, break apart, convert-to-symbol.*

---

<!-- ===== FILE: 11_symbol_system.md ===== -->

# PART 11 — SYMBOL SYSTEM
### Graphic, Movie Clip, Button symbols; instances; nesting; nested animation; registration point; symbol editing modes; swap; break apart; convert to symbol. This is the reuse engine that makes character animation possible.

---

## 11.0 The core idea

A **symbol** is a **reusable, self-contained timeline** stored once in the Library. You place **instances** (references) of it on stage. Edit the symbol once → **every instance updates**. This "define once, reuse everywhere" is the single most important concept in the whole editor — it powers characters, lip-sync, UI, and file size.

```
Library
 └── symbol "arm"  (definition: own timeline, own layers, own artwork)
Stage
 ├── instance of "arm" (left arm — placed, transformed)
 └── instance of "arm" (right arm — flipped, different transform)
```

- **Symbol (definition)** = the master copy in the Library.
- **Instance** = a placed reference; has its **own** transform/color/name but shares the definition's content.
- Editing the **definition** changes all instances; editing an **instance** (transform, tint, alpha) changes only that instance.

---

## 11.1 The three (four) symbol types

### 11.1.1 Graphic symbol
- **Purpose:** static art + reusable animation that stays **synchronized to the main timeline**.
- **Timeline:** has its own frames, but its playback is **driven by the main timeline** — a graphic instance on main-frame N shows the graphic's internal frame mapped by its **loop mode** (11.4).
- **No interactivity/sound** inside (ignored in graphic symbols).
- **Smaller file** than movie clips (no independent timeline overhead).
- Use: repeating visual elements, lip-sync mouth sets (via Frame Picker — Part 18), symbols you need to scrub in sync.

### 11.1.2 Movie Clip symbol
- **Purpose:** self-contained animation that plays **independently** of the main timeline.
- **Timeline:** its own clock — a 30-frame movie clip loops forever regardless of the main timeline, even if the main timeline has 1 frame.
- Supports **interactivity + sound + nested clips**; scriptable (instance name).
- Use: walk cycles, flapping wings, looping effects, buttons' animated states, anything that must run on its own.

### 11.1.3 Button symbol
- **Purpose:** interactive button with **4 built-in states** on its own timeline:
  1. **Up** — resting.
  2. **Over** — pointer hover.
  3. **Down** — pressed.
  4. **Hit** — invisible **hit area** (defines the clickable region; not rendered).
- Use: UI buttons, navigation. (Legacy AS3 buttons run scripts; our app wires them to the event/behavior system — Part 01 §1.12.)

### 11.1.4 Font symbol (niche)
- Embeds a font as a reusable asset for other documents. Our app: font embedding is a **document/asset setting** (Part 22), not a separate symbol type (P3).

---

## 11.2 Convert to Symbol (the #1 command)

**Trigger:** select stage content → **Modify > Convert to Symbol (F8)** (or right-click, or drag into Library).

**Dialog:**
| Field | Meaning |
|---|---|
| Name | Symbol name (unique in Library). |
| Type | Graphic / Movie Clip / Button. |
| Registration point | A **9-point grid** (TL/TC/TR/ML/C/MR/BL/BC/BR) — where the symbol's **origin (0,0)** sits relative to its artwork. |

**What happens:**
1. The selected content is **wrapped** into a new symbol definition (added to Library).
2. The stage selection becomes an **instance** of that symbol.
3. The instance's x/y = where the **registration point** lands on stage.

### Registration point — why it matters (character rigs)
- The registration point is the symbol's **(0,0)**. When you place/transform an instance, `x/y` refers to this point.
- For a **rig**, set the registration point at the **joint** (e.g., an arm's registration at the shoulder) so rotating the instance pivots naturally — even before you touch the transform point (Part 04.7).
- You can **move the registration point** later: edit the symbol and move its artwork relative to the crosshair.

---

## 11.3 Symbol editing modes (how you get inside)

| Mode | How | View | Use |
|---|---|---|---|
| **Symbol edit mode** | Double-click the symbol in the **Library**, or Edit > Edit Symbols (Ctrl+E) | Full-window view of **only** the symbol (crosshair = registration point; breadcrumb shows the symbol name) | Clean focused editing of the definition. |
| **Edit in Place** | Double-click the **instance on stage** | The symbol's contents edit **in context** — other stage content dims but stays visible | Editing with visual reference to the scene. |
| **Edit Selected / Edit All** | Edit menu | Drill into a nested selection / jump out to all | Navigating nesting. |
| **Back button / breadcrumb** | Click "Back" or the breadcrumb level | Exit one level up | Always available. |

**Key behavior:** while editing a symbol, **all instances update live**. The breadcrumb (`Scene ▸ character ▸ head ▸ eye`) shows nesting depth.

---

## 11.4 Graphic instance loop modes & Frame Picker

A **graphic** instance shows which internal frame? Controlled by **Loop** options in Properties:

| Mode | Behavior |
|---|---|
| **Loop** | Repeats the symbol's internal frames, mapped 1:1 with the main timeline (internal frame = (mainFrame - 1) % symbolDuration + 1). |
| **Play Once** | Plays once, then holds the last frame. |
| **Single Frame** | Always shows **one** internal frame (the "First" frame) — static. |

- **First frame** field = which internal frame the instance starts at (set via number or the **Frame Picker** panel — a visual browser of the symbol's frames, core to lip-sync Part 18).
- **This is how Animate does lip-sync and expression switching:** one mouth symbol with 12 viseme frames; each keyframe on the main timeline is the *same instance* with a different **First frame**.

**Movie clips ignore these** — they always play their own clock.

---

## 11.5 Instance properties (what's stored per instance)

```jsonc
{ "type":"symbolInstance",
  "symbolId":"arm",                // which definition
  "transform": {...},              // Part 04
  "colorEffect": { "mode":"none|brightness|tint|alpha|advanced", "value":... },
  "filters": [ { "type":"dropShadow|blur|glow|...", "params":{...} } ],
  "loop": { "mode":"loop|playOnce|singleFrame", "firstFrame": 1 },   // graphic only
  "instanceName": "leftArm"        // for scripting/behaviors
}
```

- **Color effect** — per-instance: brightness (%), tint (color + %), alpha (0–100), advanced (combined). This is how you recolor one instance without touching the symbol (e.g., 3 red balls from one symbol).
- **Filters** — per-instance effects: Drop Shadow, Blur, Glow, Bevel, Gradient Glow, Gradient Bevel, Adjust Color. Filters are tweenable in motion tweens (Part 09.1.4).
- **Instance name** — a scripting/behavior handle (unique per scope).

---

## 11.6 Swap Symbol & Duplicate Symbol

| Command | Does |
|---|---|
| **Swap Symbol** (Properties / right-click) | Replace an instance's symbol with a **different** symbol **while keeping** the instance's transform, color effect, name. (e.g., swap mouth pose symbol A → B without re-placing.) |
| **Duplicate Symbol** | Clone the symbol definition (new name) and point **this instance** at the clone — lets you vary one instance without affecting others. |

**Swap is the heart of lip-sync/expression workflows:** swap the mouth instance to a new pose at a keyframe → the pose changes, position stays.

---

## 11.7 Break Apart (Ctrl+B) on symbols

| Target | Break Apart once | Break Apart twice |
|---|---|---|
| Symbol instance | Detaches the instance → the symbol's art becomes **raw content on this frame** (a copy; the symbol stays in the Library). | (if it was a group inside) → further flatten to shapes. |
| Text | Per-character text blocks | Vector shapes. |
| Bitmap | Bitmap-fill region (editable) | — |
| Group | Its children | (children may be groups/symbols → keep breaking). |

**Rule:** Break Apart flattens **one level**; repeat to go deeper. It **never deletes** the Library symbol — it only detaches this instance from it.

---

## 11.8 Nested animation (how it works — the full mechanism)

Nesting = symbols **inside** symbols. The model is a **tree of timelines**:

```
Main timeline (frame 1..240)
 └─ layer "body" → instance "character" (movie clip, 240 frames internal)
      └─ inside "character":
          ├─ layer "head" → instance "head" (graphic)
          │     └─ inside "head": layer "eye" → instance "blink" (movie clip, 10-frame loop)
          └─ layer "arm" → instance "arm" (movie clip, walk swing)
```

### How playback samples the tree (deterministic rule)
```
sample(node, time):
  for each child instance on the current frame:
    case graphic:  childTime = map(mainTime, instance.loop)   // 11.4
    case movieClip: childTime = instanceInternalClock          // independent
    recurse sample(child, childTime)
```

- **Graphic** nests **synchronize** to the parent clock (driven).
- **Movie clip** nests **run free** (own clock, loop).
- **Button** nests are state-driven (Up/Over/Down/Hit).

### The classic "nested animation not visible" gotcha
A movie clip's internal animation **does not play on the main timeline** (it plays on export/test). A graphic's internal animation **does** scrub with the main timeline. This is the #1 beginner confusion. Our app shows a **live "play nested clips" preview toggle** so users see movie-clip animation while authoring (default ON) — a direct improvement.

### Practical recipe (from Animate community best practice)
1. Animate the part as a **movie clip** (independent loop).
2. Put the movie clip where needed; it loops on its own.
3. Use **graphic symbols** when you need the parent timeline to **drive** the child (lip-sync, expressions, synced repeats).

---

## 11.9 Editing the registration point after creation

- Enter symbol edit → move the artwork relative to the **crosshair** (the crosshair = the registration point). Moving art right = registration point moves left relative to art. Also **Edit > Edit Symbols** then reposition.
- The instance's on-stage position updates accordingly (x/y = registration point's location).

---

## 11.10 Data model (symbols & instances)

```jsonc
// Library entry (definition)
{ "type":"symbol", "id":"arm", "name":"arm", "symbolType":"graphic|movieClip|button",
  "registrationPoint": { "x":0, "y":0 },          // symbol-local (0,0) origin
  "timeline": { "layers":[...], "duration": 30 } }

// Instance (on any timeline)
{ "type":"symbolInstance", "symbolId":"arm", "transform":{...}, "colorEffect":{...},
  "filters":[...], "loop":{"mode":"loop","firstFrame":1}, "instanceName":null }
```

Full schemas: Part 33.

---

## 11.11 BUILD CHECKPOINT M3 (symbol slice)

- [ ] Create symbols from selection (F8) with name/type/registration-grid; drag-to-library.
- [ ] Three types implemented (graphic loop/play-once/single-frame + first-frame; movie clip independent clock; button 4 states).
- [ ] Editing modes: symbol edit + edit-in-place + breadcrumb + back button; live instance updates.
- [ ] Instance properties: transform, color effect, filters, loop, instance name.
- [ ] Swap Symbol / Duplicate Symbol.
- [ ] Break Apart hierarchy (instance → raw content → shapes).
- [ ] Nested playback: graphic sync vs movie-clip free; live preview toggle.
- [ ] Registration point editing.

*Next: `12_library.md` — import, create, rename, duplicate, delete, organize, folders, search, preview, linkage, export, reuse, replace, update instances.*

---

<!-- ===== FILE: 12_library.md ===== -->

# PART 12 — LIBRARY
### The asset database: import, create, rename, duplicate, delete, organize, folders, search, preview, linkage, export, reuse, replace, update instances — every capability, control-by-control.

---

## 12.0 What the Library is

The Library is the document's **asset database** — the single store of every **symbol**, imported **bitmap**, imported **sound/video**, **brush**, and **component**. It is the project's asset graph root: symbols reference other symbols; instances reference symbols; the Library holds the definitions.

- **One Library per document** (each open doc has its own).
- **Not a file browser** — it stores assets *inside* the project (references + imported data).

### Data model

```jsonc
"library": [
  { "id":"arm", "name":"arm", "kind":"symbol|bitmap|sound|video|brush|component",
    "folderId": null, "order": 3,
    // per kind:
    "symbolType":"graphic", "timeline":{...},              // symbol
    "assetId":"bmp_01", "width":512, "height":512, "dataRef":"assets/bmp_01.png",  // bitmap
    "durationMs": 4200, "sampleRate":44100, "dataRef":"assets/voice.mp3"            // sound
  }
]
```

---

## 12.1 Panel anatomy (control-by-control)

| Control | Icon concept | Action | Data change |
|---|---|---|---|
| **Asset list** | rows (icon + name + kind + use-count) | select / double-click to edit (symbol) | selection state |
| **Preview window** | thumbnail / waveform / video | shows the selected asset (symbol preview = its frame 1; sound = waveform; button = clickable preview) | view only |
| **Search box** | magnifier | filters the list by name substring | filter state |
| **New Symbol** button | + with symbol glyph | Create empty symbol → edit mode (Part 11.3) | adds symbol |
| **New Folder** button | folder | create folder (assets can nest) | adds folder |
| **Properties** (i) | info | rename/type/linkage/export options | asset metadata |
| **Delete** (trash) | trash | delete asset (prompt if used by instances → "unused only" default) | removes asset (+ optionally its instances) |
| **Sort / view menu** | gear | sort by name/kind/date; icon vs list view; expand/collapse folders | view state |
| **Use-count column** | number | how many instances reference this asset | derived |
| **Linkage column** (legacy AS3) | id text | runtime export identifier | asset metadata |

---

## 12.2 Every Library capability (spec)

### 12.2.1 Import asset
- Drag a file (PNG/JPEG/SVG/AI/MP3/WAV/…) into the panel, or File > Import > Import to Library (Part 27). The asset lands in the Library (and, if "to Stage", an instance is also placed at the current frame).
- Imported **bitmaps** become `bitmap` assets (reusable fills + placed instances).
- Imported **audio** becomes `sound` assets (placed on audio layers — Part 17).

### 12.2.2 Create symbol
- **New Symbol** (Ctrl+F8) = empty symbol → edit mode.
- **Convert to Symbol** (F8) = wrap stage selection → symbol + instance (Part 11.2).
- **Drag selection into the Library** = same as Convert to Symbol (default type prompt).

### 12.2.3 Rename
- Double-click the name (or Properties). Renaming a symbol **does not break instances** (they reference by ID, not name — our design rule).

### 12.2.4 Duplicate
- Right-click → Duplicate: clones the **definition** (deep-copies its timeline + nested refs) with a new name. Instances keep pointing at the original. Use: vary a symbol without affecting the master (then Swap to the clone — Part 11.6).

### 12.2.5 Delete
- Right-click → Delete. If **in use**, prompt: "N symbols use this asset" → options: cancel / delete asset and **leave instances as raw content** (break-apart them) / (our app) delete asset + its instances.
- **Select Unused Items** (menu) → delete all unused assets in one go (file-size hygiene before publish).

### 12.2.6 Organize (folders)
- Folders group assets (nestable). Assets can be dragged between folders. Folder operations: new, rename, collapse/expand, delete (non-recursive by default).
- **Auto-arrange**: sort assets into folders by kind (symbols/, bitmaps/, sounds/) — our app P2 nicety.

### 12.2.7 Search
- Live substring filter across name (and kind). Search respects folder scope option (search all vs current folder).

### 12.2.8 Preview
- **Symbol**: animated preview (plays its timeline, looped) — Animate shows frame 1 + a play button; our app: full live preview with scrub.
- **Sound**: waveform + play button (with stop).
- **Bitmap**: thumbnail + dimensions.
- **Button**: clickable preview (roll over/press).

### 12.2.9 Linkage (legacy AS3)
- "Export for ActionScript" + identifier — exposes the asset to runtime code. **Historical.** Our app: assets are referenced by ID in the behavior/script layer (no special linkage step).

### 12.2.10 Export asset
- Right-click → Export: save a symbol as its own file (SWF legacy; our app: export symbol as **image/sequence/sprite-sheet**), or export a bitmap/sound to disk.

### 12.2.11 Reuse
- **Drag an asset onto the stage** = place an instance (symbol) / place a bitmap / (sound → only onto an audio layer/frame).
- Instances reference the definition by ID; the use-count increments.

### 12.2.12 Replace (Swap)
- **Swap Symbol** (Part 11.6) from the Properties panel or by dragging a Library symbol **onto a selected instance** (replace in place). This is the Library's "replace" capability.

### 12.2.13 Update instances
- Editing a symbol (Part 11.3) **updates all instances automatically** — the Library is the single source of truth. There's no manual "update" step; the use-count + live preview make the propagation visible.
- **Update from file** (our app P2): re-import an external PNG that replaced a bitmap asset → all its instances refresh.

### 12.2.14 Open external library
- **File > Import > Open External Library** — open another project's Library **read-only** and drag assets from it into the current doc (cross-project reuse without merging projects).

---

## 12.3 Library ↔ rest-of-app interactions

- **Stage**: drag-out = instantiate; drag-onto-instance = swap; F8 = convert.
- **Timeline**: audio assets dragged onto audio layers (Part 17); symbol instances placed on frames.
- **Properties**: selecting an instance shows its symbol's name + Swap button (opens Library).
- **Publish/Export** (Part 28): the Library determines what's bundled (unused assets can be excluded — file-size option).
- **Undo**: Library ops (create/rename/delete/duplicate) are Commands (Part 36).

---

## 12.4 BUILD CHECKPOINT M3 (library slice)

- [ ] Asset list + preview (symbol anim preview, sound waveform, bitmap thumb) + search + folders + sort.
- [ ] Import (bitmap/vector/audio) into Library; drag-to-stage instantiate.
- [ ] Create/rename/duplicate/delete with use-count + "unused only" deletion; delete-in-use prompt.
- [ ] Swap-from-library (drag onto instance).
- [ ] Edit symbol → all instances update (live preview).
- [ ] Open external library (read-only cross-doc reuse).
- [ ] Library ops are undoable; assets referenced by ID (rename-safe).

*Next: `13_character_animation.md` — the complete character pipeline: artwork → parts → symbols → hierarchy → pivots → bones → IK → poses → animation → reusable clips.*

---

<!-- ===== FILE: 13_character_animation.md ===== -->

# PART 13 — CHARACTER ANIMATION (THE COMPLETE WORKFLOW)
### Character artwork → separate body parts → symbols → hierarchy → pivot points → bones → IK → poses → animation → reusable clips. The full pipeline, step-by-step, with three rigging approaches and a concrete example character.

---

## 13.0 The two production approaches (and when to use each)

| Approach | How it moves | Best for | Rig style |
|---|---|---|---|
| **Cut-out / puppet** | Separate parts (symbols) hinged at joints, posed per frame or tweened | Fast production, limited budget, stylized shows | Hierarchy + pivots (+ bones/IK) |
| **Frame-by-frame** | Redraw every frame | Full traditional animation, nuanced motion | Drawings + onion skin (Part 15) |
| **Hybrid** (industry standard) | Cut-out body + hand-drawn accents (face, hair, effects) | Most professional work | Both |

This part documents the **cut-out pipeline** (the one that uses symbols/bones/IK); frame-by-frame is Part 15; the hybrid is a composition of both.

---

## 13.1 STEP 1 — Character artwork (prepare the parts)

**Goal:** the character exists as **separate, cleanly-cut parts**, each drawn to its final look.

Rules of thumb:
- **One part per movable joint** — head, torso, upper arm, forearm, hand, upper leg, lower leg, foot, plus eyes/brows/mouth as separate small parts.
- **Draw parts with overlap** at the joint (the upper arm slightly overlaps the torso) so no gaps show when rotating.
- **Cut parts cleanly** (no stray pixels; use object-drawing mode or convert each to a symbol).
- **Front/back ordering matters**: decide the stacking (e.g., torso behind arms; one arm in front, one behind).

Input methods:
- Draw in-app (Parts 05–06), or
- Import external art (PSD/AI/PNG — Part 27; AI/PSD can import **per-layer** so each layer becomes a part).

---

## 13.2 STEP 2 — Separate body parts (into symbols)

1. Select each part → **Convert to Symbol (F8)** (Part 11.2).
2. **Naming convention** (enforced by our app's character template, P2): `ch_armUpper_R`, `ch_armLower_R`, `ch_hand_R`, `ch_head`, `ch_eye_L`, `ch_mouth`, etc. Prefix = character, suffix = side.
3. Type: **Movie Clip** for parts that animate independently (walk cycles); **Graphic** for parts driven by the main timeline (mouth poses — Part 18).
4. At this point every part is a Library symbol; the character is a set of instances.

**Distribute to Layers** (Part 07.4.13) — our app auto-places each selected part on its own layer with the part's name; this is the single biggest time-saver for rigging.

---

## 13.3 STEP 3 — Build the hierarchy (nesting)

**Goal:** make the character a **tree** so parts move together correctly.

```
character (root movie clip)
 ├─ torso
 ├─ head (movie clip)
 │    ├─ face
 │    ├─ eye_L, eye_R (movie clips — blink inside)
 │    └─ mouth (graphic — viseme frames inside)
 ├─ arm_R (movie clip)
 │    ├─ armUpper_R (symbol)
 │    ├─ armLower_R (symbol, child of armUpper — rotates at elbow)
 │    └─ hand_R (symbol)
 └─ arm_L (mirrored copy)
```

How to build it (Animate practice):
1. Select the parts that belong together (e.g., upper arm + forearm + hand) → **F8** → new symbol "arm_R" (this nests them).
2. Inside "arm_R", position forearm's pivot at the elbow, hand's pivot at the wrist.
3. Repeat for head, legs, etc. → then nest the whole body under "character".
4. **Wrap into a single "character" movie clip** so the entire rig is one reusable instance (13.7).

**Nesting rules recap (Part 11.8):** movie clips play independently; graphics sync to the parent. Rig parts are usually **movie clips** (or plain symbols inside a movie clip) so each limb's internal animation (if any) runs on its own.

---

## 13.4 STEP 4 — Set pivot points (the make-or-break step)

**Goal:** every part rotates around its **joint**, not its center.

For each part:
1. Select the part → Free Transform (Q).
2. Drag the **transform point (pivot)** to the joint: upper arm pivot → shoulder; forearm pivot → elbow; hand pivot → wrist; head pivot → neck.
3. **Set the registration point at the same joint** when the symbol is created (Part 11.2) so the part's origin = joint (placement math stays simple).

**Why:** if the pivot is at the part's center, rotating the forearm swings it around its middle (broken elbow). Pivot-at-joint makes rotation *be* the joint movement.

---

## 13.5 STEP 5 — Bones & IK (optional but powerful)

*(Full engine spec: Part 14.)*

- **Chain the parts with the Bone tool (M):** click shoulder → drag to elbow → drag to wrist. This creates an **armature** (parent→child bones) on a **pose layer**.
- **Set constraints:** elbow rotation limits (−10°..130°) so it can't bend backwards; knee (0°..140°); wrist translation off.
- **Now posing is inverse-kinematic:** drag the **hand** → the forearm + upper arm follow automatically (the IK solver computes the joint angles). Far faster than rotating each part.
- **IK vs FK:** IK = drag the end (hand), chain follows. FK = rotate each joint explicitly (full control). Our app supports **both** + a per-chain toggle (Part 14).

---

## 13.6 STEP 6 — Poses

A **pose** = one snapshot of the character's joint configuration (all parts' transforms, or all bones' angles).

**Pose workflow (cut-out):**
1. Frame 1: set the **key pose** (contact, down, passing, up — the walk-cycle 4 poses).
2. Insert keyframes (F6) or **Insert Pose** (bones) at the next beat.
3. Set the next pose.
4. **Tween** between poses (motion tween for transforms / IK auto-interpolation for bones).

**Pose library (our app addition, P1):** save named poses ("walk_contact", "walk_down") and **reuse them** on any keyframe — a direct quality-of-life win over Animate.

---

## 13.7 STEP 7 — Animate (keyframes + tweens + easing)

- **Blocking:** rough key poses first (every 4–8 frames), no in-betweens.
- **In-between:** let tweens interpolate; add **breakdowns** (extra keyframes) where arcs need correction (e.g., a hand swinging should arc, not go straight).
- **Easing** (Part 09.4): limbs ease-in/out; avoid robotic linear motion.
- **Arcs:** move the pivot/vertices so motion follows arcs (Part 10 motion path for the whole body).
- **Timing:** hold poses for weight (Part 07 exposure); overlap motion (hair lags the head) via delayed keys.
- **Squash & stretch:** scale keys on impact frames.

**The walk-cycle recipe (canonical):**
1. 4 contact poses (or 8 with down/passing/up), 12–24 fps feel.
2. Body bob (torso y) offset half a step from the legs.
3. Arm swing opposite to legs.
4. Foot **does not slide**: match the foot's backward speed to the body's forward speed on contact (the classic fix — our app offers a **ground-contact lock** helper, P2).
5. Loop it inside a **movie clip** (13.8).

---

## 13.8 STEP 8 — Reusable clips (the payoff)

- Wrap the finished walk into a **movie clip** "walkCycle" → place it anywhere; it loops forever.
- Build a **library of clips**: idle, walk, run, jump, wave, talk. Each = one movie clip.
- Assemble scenes by **placing clips on the main timeline** (or scene timelines — Part 25) and adding transitions.
- **This is the entire point of symbols + nesting** (Parts 11–12): build once, reuse everywhere, keep files small.

---

## 13.9 The three rigging approaches compared (implementation)

| Approach | Model | Pros | Cons | Our app |
|---|---|---|---|---|
| **A. Transform hierarchy** (parts + pivots, no bones) | nested instances + transforms | Simple, robust, copy/paste-safe | FK only (rotate each part) | P0 (core) |
| **B. Bones/IK** | armature + pose layer (Part 14) | Fast posing, constraints | Historically buggy on copy/paste *[WISH W2]* | P1 (designed robust) |
| **C. Asset Warp** | mesh + pins (T2D.11) | Deform one bitmap/vector, no cut-out | Limited articulation, soft only | P1 |

Our app ships **all three** (they serve different art styles) with a **shared rig layer** so A→B→C can mix per part.

---

## 13.10 Character data model (the rig as data)

```jsonc
"character": {
  "id":"ch_hero", "rootSymbolId":"character",
  "parts": [
    { "id":"head", "symbolId":"ch_head", "parentId":null, "pivot":{"x":20,"y":8} },
    { "id":"armUpper_R","symbolId":"ch_armUpper_R","parentId":"torso","pivot":{"x":0,"y":0} }
  ],
  "rigs": [
    { "id":"armR_ik", "type":"bones", "chain":["armUpper_R","armLower_R","hand_R"],
      "constraints":[{ "boneId":"elbow","minRot":-10,"maxRot":130 }] }
  ],
  "poses": [
    { "id":"walk_contact", "parts":[ { "partId":"armUpper_R","transform":{...} }, ... ] }
  ],
  "clips": [
    { "id":"walkCycle", "symbolId":"walkCycle", "duration": 24, "loop": true }
  ]
}
```

*(Full schemas: Part 33.)*

---

## 13.11 BUILD CHECKPOINT M4 (character slice)

- [ ] Art import (per-layer) + in-app part drawing.
- [ ] Convert parts to symbols with joint-aligned registration points; distribute-to-layers.
- [ ] Nest into root movie clip; pivot-at-joint for every part.
- [ ] Bone chain + constraints + IK pose by dragging the end; FK fallback.
- [ ] Pose recording (F6 / Insert Pose) + tweening + easing; pose library.
- [ ] Walk-cycle recipe reproducible (no foot-slide); ground-contact helper.
- [ ] Wrap finished animation into reusable movie clips; scene assembly from clips.

*Next: `14_bone_ik.md` — bones, armature, parent/child, joint, root, IK target, rotation/translation constraints, bone length, pose, armature layer, bone animation, IK pose, keyframe behavior — with the shoulder→upper-arm→elbow→forearm→wrist→hand example and what happens when you drag the hand.*

---

<!-- ===== FILE: 14_bone_ik.md ===== -->

# PART 14 — BONE / IK SYSTEM
### Bones, armature, parent/child, joint, root, IK target, rotation/translation constraints, bone length, pose, armature layer, bone animation, IK pose, keyframe behavior — with the shoulder→upper-arm→elbow→forearm→wrist→hand example and the exact sequence when the user drags the hand.

---

## 14.0 The vocabulary (defined once)

| Term | Meaning |
|---|---|
| **Bone** | A rigid segment connecting a **parent joint** to a **child joint**, with a length and an angle (relative to its parent). |
| **Armature** | The whole connected bone tree (one root + its descendants). One armature per pose layer. |
| **Parent / Child** | Bones form a **tree**: each bone has one parent (except the root) and zero+ children. |
| **Joint** | A bone's endpoint where it meets its child (the pivot). Joints carry **constraints**. |
| **Root** | The top bone of the armature (no parent). Its position anchors the whole chain on stage. |
| **IK target** | The point the user drags (the **end effector**, e.g., the hand). IK solves joint angles to reach it. |
| **Rotation constraint** | min/max angle a joint may rotate (±), and a flag to **lock** rotation (rigid). |
| **Translation constraint** | whether a joint may translate along x/y (for sliding joints). |
| **Bone length** | The distance from parent joint to child joint. For symbol armatures it's the distance between the two instances' pivots; for IK shapes it's the carved distance. |
| **Pose** | A stored snapshot of all bone angles/translations at one frame. |
| **Armature layer / pose layer** | The timeline layer (green) that stores the armature + its poses. |
| **Spring** | A bone property making it lag/wobble (secondary motion). |

---

## 14.1 Two kinds of armatures (same tool, two targets)

| | Symbol armature (chain of instances) | IK shape (bones inside one shape) |
|---|---|---|
| **What bones connect** | Symbol instances (their pivots) | Control points inside a raw shape |
| **Deformation** | Each instance rotates/translates as a rigid part | The shape's contour **bends** (bound points follow bones) |
| **Editing after rigging** | Instances stay individually editable | Shape editing becomes limited (no new strokes/scale/skew; Animate warns) |
| **Use** | Cut-out characters (limbs) | Tails, tentacles, plant stems, single-piece characters |
| **Weighting** | none (whole instance per bone) | **Bind tool** (Part 02d T2D.9) sets point→bone weights |

---

## 14.2 The bone model (data)

```jsonc
"armature": {
  "bones": [
    { "id":"b0", "parentId":null, "childId":"b1",              // symbol armature: link by bone chain
      "length": 60, "rotation": 0, "translationX":0, "translationY":0,
      "minRot": -10, "maxRot": 130, "rotationLocked": false,
      "xEnabled": false, "yEnabled": false,
      "jointSpeed": 100, "spring": null }                       // {strength, damping}
  ],
  "bindings": [ { "boneId":"b0", "targetNodeId":"armUpper_R" } ]   // symbol armature
            // or: { "boneId":"b0", "controlPoints":[3,4,5] }        // IK shape
}
```

**Coordinate system (the [WISH W2] fix):** each bone stores its **angle relative to its parent** (local space) and each instance stores its **local transform**. All IK math runs in local space with **stable bone IDs**. Result: copy/pasting a rig, scaling a child, or re-parenting **cannot corrupt poses** (this is the exact bug class Animate users report; we design it out at the data level).

---

## 14.3 Building an armature (the interaction)

### 14.3.1 Symbol armature
1. Place instances on stage (shoulder, upper arm, forearm, hand) roughly in position.
2. Select the **Bone tool (M)**.
3. Click the **root instance** (shoulder) to set the root; the first bone is created at the click point.
4. **Drag from the root's joint to the next instance** (elbow) → child bone; repeat elbow→wrist, wrist→hand.
5. The chain is now an armature on a **pose layer**.

### 14.3.2 IK shape
1. Draw the shape; select it fully (marquee the whole shape).
2. Bone tool: **click-drag inside the shape** to carve the first bone; drag from its tail to carve the next.
3. If the shape is too complex, prompt to convert to a movie clip first (Animate does this).
4. Use the **Bind tool** to fix which contour points each bone pulls.

---

## 14.4 Posing & the IK solve (what happens when you drag the hand)

**Example chain: Shoulder → Upper Arm → Elbow → Forearm → Wrist → Hand.**

The user drags the **hand** (the IK target). Sequence:

1. **Grab:** pointer-down on the hand's joint selects the armature (or just the end bone); the current pose is captured as the solve's starting state.
2. **Drag:** on each pointer-move, the IK solver runs with the **target = pointer position**:
   - **Step 1 — reach:** compute the chain's total reach. If the target is **beyond** full extension (distance from shoulder > Σ bone lengths), the solver **straightens** the chain pointing at the target (arm fully extended toward it) — the "unreachable" case.
   - **Step 2 — solve angles:** find joint angles that place the hand at the target:
     - **2-bone analytic** (shoulder+elbow, 2 segments): the classic two-bone IK with a closed-form solution — given the shoulder root, the target, and the two lengths, compute elbow angle (law of cosines) and shoulder angle; choose the **elbow bend direction** (up/down) from the current pose or a bias.
     - **N-bone** (3+ segments): **CCD** (cyclic coordinate descent — iteratively rotate each joint toward the target from the tip back) or **FABRIK** (forward-and-backward reaching inverse kinematics — reposition joints along the bone-length constraints). Our app: **FABRIK as default** (converges fast, respects length), **CCD** for polish/rotation-dominant rigs, **2-bone analytic** for the common 2-segment limb (fast + deterministic).
   - **Step 3 — apply constraints:** clamp each joint's rotation to its **[minRot, maxRot]**; apply translation constraints; apply joint speed/spring.
   - **Step 4 — write pose:** store the solved angles into the current pose (and update the stage).
3. **Release:** commit `PoseCommand` (the pose change is undoable as one step).
4. **Authoring note:** during playback the app **interpolates stored angles** — it does **not** re-run IK every frame (Part 08.3.8). IK runs only at author time when you drag. This is exactly Animate's model and the right one (deterministic playback).

**What the user sees while dragging:** the elbow and shoulder joints rotate automatically; the hand follows the pointer; if the target is unreachable, the arm goes straight; if a constraint blocks the solve, the hand stops short (the solver clamps and the hand may not reach the pointer — show a subtle indicator).

---

## 14.5 Constraints (in detail)

| Constraint | Field | Behavior |
|---|---|---|
| **Rotation min/max** | `minRot, maxRot` (degrees, relative to parent) | The joint clamps to the range. E.g., elbow −10°..130° prevents hyperextension. |
| **Rotation lock** | `rotationLocked` | The bone is rigid relative to its parent (moves with it, can't rotate independently). |
| **Translation x/y enable** | `xEnabled, yEnabled` | Allows a joint to **slide** (e.g., a piston, a tongue extending). Both disabled = pure rotation joint. |
| **Joint speed** | `jointSpeed` (0–100%) | Limits how fast a joint responds → "weight" (a heavy arm lags). 100% = unlimited. |
| **Spring** | `spring{strength,damping}` | The bone overshoots/wobbles when its parent moves (secondary motion like hair/antennae). |

**Constraint visualization:** draw the min/max angle **wedges** at each joint while editing (our app) so users see the allowed range.

---

## 14.6 The pose layer (timeline interaction)

- Adding the first bone **creates a pose layer** (green) and moves the armature onto it.
- **Insert Pose** (right-click a frame → Insert Pose): records the current armature configuration as a **pose** at that frame.
- **Poses are keyframes** (diamonds, Part 08.3.8): between poses, bones interpolate (angles + translations).
- **Runtime vs Authoring** (legacy AS3): "Type = Runtime" exposes the armature to script at runtime. Our app: a "runtime-riggable" flag for the behavior layer (P2).
- Deleting all bones removes the pose layer; the instances revert to normal layers.

---

## 14.7 IK pose editing rules

- **Select a bone:** click (Selection); Shift+click multi; double-click = whole armature; Parent/Child/Next-sibling buttons in Properties navigate.
- **Move a joint/instance:** drag with Selection (moves the bone, updating lengths); **Alt/Option+drag** moves one instance alone (bones stretch to follow).
- **Move a bone end in an IK shape:** Subselection drag (blocked if multiple poses exist — our app edits only the current pose + warns).
- **Add/remove bones:** Bone tool drag adds a child; right-click → Remove Bone / Remove Armature.
- **Reparent:** our app allows dragging a bone's parent link (P1) — the [WISH W2] local-space model makes this safe (Animate cannot re-parent cleanly after animation).

---

## 14.8 Bone animation (authoring workflow)

1. Frame 1: **Insert Pose** (initial pose).
2. Move the playhead to frame 10; drag the hand to the new pose; **Insert Pose**.
3. Frames 2–9 auto-interpolate (angles lerp).
4. Add **easing** on the pose span (Part 09.4) for weight.
5. Key each limb's poses on the **same pose layer** or **separate pose layers** (one armature per layer; a character with 2 arms + 2 legs = 4 armatures/layers).

---

## 14.9 BUILD CHECKPOINT M4 (IK slice)

- [ ] Bone tool: build symbol armatures AND IK shapes (carve + bind).
- [ ] Bone model in local space with stable IDs; parent/child tree; root anchoring.
- [ ] IK solvers: 2-bone analytic, CCD, FABRIK; unreachable-target straighten; bend-direction bias.
- [ ] Constraints (rotation min/max/lock, translation, joint speed, spring) with wedge visualization.
- [ ] Pose layer + Insert Pose; pose interpolation; pose editing rules (incl. move/delete/duplicate).
- [ ] The shoulder→elbow→wrist→hand example works end-to-end: drag hand → elbow/shoulder solve → constraints hold → pose recorded → tween.
- [ ] Copy/paste/scaling/re-parenting of rigs does not corrupt poses *[WISH W2]*.

*Next: `15_frame_by_frame.md` — drawing frame → next frame → onion skin → redraw → exposure → playback, with every onion-skin control.*

---

<!-- ===== FILE: 15_frame_by_frame.md ===== -->

# PART 15 — FRAME-BY-FRAME ANIMATION
### The traditional workflow: drawing frame → next frame → onion skin → redraw → exposure → playback — with every onion-skin control, and the cel/drawing-reuse system [WISH W1].

---

## 15.0 Frame-by-frame vs tweening (when to use each)

- **Frame-by-frame** = every frame is a **keyframe** you drew. Total control, no interpolation artifacts. Use for: nuanced motion (hands, faces, hair, water), stylized/limited animation, effects.
- **Tweening** (Part 09) = you author endpoints, the app fills the middle. Use for: mechanical motion, cut-out rigs, camera, UI.
- **Hybrid** (industry norm): tween the body, frame-by-frame the accents. The editor must make both **equally easy** and let them **coexist on different layers**.

---

## 15.1 The workflow (step-by-step)

### Step 1 — Draw frame 1
- Draw the key pose on layer 1, frame 1 (a keyframe, since frame 1 is one by default).

### Step 2 — Next frame
- **Insert Blank Keyframe (F7)** on frame 2 (starts empty) **or** **Insert Keyframe (F6)** (copies frame 1's drawing — you modify the copy).
- *[WISH W1] The cel/drawing-reuse rule:* **F6 (copy) vs F7 (blank) is the key decision:**
  - **F6** duplicates the previous drawing → edit the copy (trace-over). This is the traditional "cel" workflow but in Animate it makes an **independent copy** — a change to the original does **not** propagate (users hate this: "duplicate a frame and only that frame changes").
  - **Our app adds a third way (W1):** **"Drawing" asset + exposure** — a drawing is a **reusable asset** in the Library; a frame **exposes** a drawing. Duplicate a frame = **expose the same drawing** (shared); edit-on-duplicate = **instantiate a new drawing** (independent). This gives both behaviors explicitly (15.5).

### Step 3 — Onion skin
- Turn on onion skin to see the **previous/next** drawings **ghosted** (semi-transparent) behind the current one → draw the in-between accurately.

### Step 4 — Redraw
- Draw the in-between; repeat steps 2–4 for every frame.

### Step 5 — Exposure & timing
- Adjust **exposure** (how many frames each drawing holds — Part 07.3) to control timing (twos = 2 frames/drawing, ones = 1 frame/drawing). Classic limited animation uses twos (12fps feel on 24fps).

### Step 6 — Playback
- Enter to play; `.` / `,` to step; scrub to check arcs.

---

## 15.2 Onion skin — every control, in detail

Onion skin = a **render pass** that draws neighboring frames' contents ghosted so you can see motion continuity.

### 15.2.1 The controls (timeline bottom row)

| Control | Icon concept | Does |
|---|---|---|
| **Onion Skin** (toggle) | two overlapping squares | Show previous + next frames ghosted. |
| **Onion Skin Outlines** | overlapping square outlines | Show ghosts as **outlines only** (lighter on CPU). |
| **Edit Multiple Frames** | stacked squares with pencil | Show (and allow **editing**) multiple frames at once — not just ghosts. |
| **Modify Markers** (dropdown) | flag | Choose the onion-skin **range**: Always Show Markers / Anchor Markers / Onion 2 / Onion 5 / Onion All. |
| **Start/End onion markers** | bracket handles on the frame ruler | Manually drag the **onion range** (which frames ghost). |
| **Onion tint colors** | color chips | Past frames tint one color, future frames another (configurable). |
| **Onion opacity** (our app) | slider | Ghost strength (0–100%). |

### 15.2.2 Onion-skin behavior rules
- **Past frames** ghost in one tint (default red-ish), **future frames** in another (default green-ish); the **current frame** is full color.
- Ghosts are **not editable** (except in Edit Multiple Frames mode) and **never export**.
- Onion range defaults to a few frames around the playhead; markers define it.
- **Anchor Markers**: lock the onion range so it doesn't follow the playhead (e.g., always show frames 1–5 while you draw 6–12).
- Onion skin applies **per current layer** (or all layers — a toggle, our app default: all).
- Only **keyframe drawings** ghost (static frames show the same ghost — no point re-drawing them).

### 15.2.3 Implementation
- The renderer draws the ghost pass **under** the current frame: for each frame in the onion range, render its content with tint+alpha, using a cached bitmap per frame (invalidate on edit). Outline mode renders path strokes only. This is a **cache-friendly** design (key for long frame-by-frame scenes).

---

## 15.3 Frame-by-frame tools & shortcuts

| Action | Shortcut | Does |
|---|---|---|
| Next/prev frame | `.` / `,` | step the playhead (draw → step → draw) |
| Insert keyframe (copy prev) | F6 | new key with copied content |
| Insert blank keyframe | F7 | new empty key |
| Extend frame (exposure) | F5 | hold the drawing one more frame |
| Delete frame / Clear keyframe | Shift+F5 / Shift+F6 | shorten / empty |
| Play / stop | Enter | playback |
| Onion skin toggle | (assignable; our app: `O`) | show ghosts |

---

## 15.4 Playback & exposure rules

- **Exposure** = the number of consecutive frames a drawing holds (its "hold"). Editing exposure = drag the span edge / F5 / Shift+F5 (Part 07).
- **Timing on twos:** duplicate each drawing across 2 frames (hold of 2). This halves the drawing work — the classic economical technique.
- **Ones vs twos vs threes:** hold length 1/2/3 — more holds = choppier but stylized. The editor's exposure system makes this trivial.
- **Loop playback** + **scrub with audio** (Part 17) are the review tools.

---

## 15.5 The cel / drawing-reuse system [WISH W1] — our improvement

**Problem (Animate):** F6 copies a drawing into an **independent** duplicate. Change the original later → duplicates don't update. Users explicitly asked for a **cel-based workflow** where drawings are reusable assets.

**Our model — two explicit operations:**

| Operation | Shortcut (ours) | Semantics |
|---|---|---|
| **Expose same drawing** (share) | `D` then click the frame, or right-click → "Expose Drawing" | The frame **references** a Library drawing; editing the drawing updates **every frame** that exposes it. (Like a symbol, but a flat drawing — the cel model.) |
| **Duplicate to new drawing** (independent) | F6 (default) | Copies the drawing into a **new** Library drawing; edits affect only this frame. (Animate's behavior, kept.) |
| **Edit drawing** | double-click (or in-place) | Edit a drawing in the **Drawing Editor** (its own canvas) or in place. |

Data model:

```jsonc
// a drawing is a Library asset
{ "type":"drawing", "id":"d_012", "layers":[...], "duration":1 }   // one flat drawing (multi-layer optional)

// a frame exposes a drawing
"frames":[ { "type":"keyframe", "drawingId":"d_012" } ]
```

Benefits:
- Reuse one drawing across frames/scenes (exposure = reference, not copy).
- Fix a drawing once → all its exposures update (trace-over corrections propagate).
- Smaller files (shared geometry).
- **Still fully compatible** with the classic F6-copy workflow (independent drawings).

This is a **strict superset** of Animate's behavior and directly answers the top community request.

---

## 15.6 BUILD CHECKPOINT M4 (frame-by-frame slice)

- [ ] Frame-by-frame workflow: F6/F7/F5, step `.`/`,`, play, scrub.
- [ ] Onion skin: toggle, outlines, edit-multiple-frames, markers (always/anchor/2/5/all), draggable range, tint colors, opacity; ghosts never export; cache-friendly.
- [ ] Exposure editing (span drag) + ones/twos/threes timing.
- [ ] Cel/drawing system: drawing assets, expose-same vs duplicate-new, drawing editor, propagate edits *[WISH W1]*.

*Next: `16_camera.md` — camera tool, camera layer, position, zoom, rotation, camera keyframes, tweening, presets, movement, and how a new app should represent camera animation.*

---

<!-- ===== FILE: 16_camera.md ===== -->

# PART 16 — CAMERA
### Camera tool, camera layer, position, zoom, rotation, keyframes, tweening, presets, movement, layer depth (parallax), attach-to-camera — and how a new app should represent camera animation.

---

## 16.0 What the camera is (and is not)

- The **camera** is an **animatable screen-space transform** applied to the whole stage: **pan (x/y), zoom, rotate**, plus optional **color/tint effects**. It is a **document object** — it renders at export, unlike the view zoom/pan (Part 02d T2D.5) which is authoring-only.
- It **frames** the artwork; it does **not** resize the stage or move layers (layers stay in stage space; the camera changes the *view*).
- Added in Animate 2019 (was "Virtual Camera" in the Adobe learn series); available for all built-in doc types (HTML5 Canvas, WebGL, AS3).
- **Adding depth:** the **Layer Depth panel** assigns each layer a **z-depth**; the camera then produces **parallax** (near layers move more than far layers) — the 2.5D effect.

### Three distinct "zooms" (never confuse them — document in tooltips)

| Term | Scope | Animated? | Exported? |
|---|---|---|---|
| **View zoom** (Ctrl+=, wheel) | authoring viewport | no | no |
| **Camera zoom** (this part) | the whole scene | **yes** | **yes** |
| **Object scale** (Part 04) | one object | yes | yes |

---

## 16.1 The camera model (data)

```jsonc
"camera": {
  "enabled": true,
  "x": 0, "y": 0,            // pan (stage-space position of the camera center)
  "z": 0,                     // depth position (for 2.5D; default 0)
  "zoom": 1.0,               // 1.0 = 100% (no scale)
  "rotation": 0,             // degrees, around the camera center
  "tint": null,              // optional scene-wide color tint {color, amount}
  "filters": []              // optional camera filters (blur, etc.)
}

// per-layer depth
"layers[i].zDepth": 0        // 0 = at camera plane; negative = behind camera; positive = closer
```

### Camera transform math (concept)
```
screenPoint = CameraMatrix(stagePoint)
CameraMatrix = Translate(center) · Rotate(rotation) · Scale(zoom · depthScale(zDepth)) · Translate(-x, -y)
```
- **depthScale(zDepth)** = the parallax factor for a layer at depth `d`: layers nearer the camera (small positive `d` in Animate's convention) scale/move **more** than layers at `d=0`. (Animate: camera at 0; objects closer = lower positive numbers, farther = higher positive numbers; behind camera = negative.)
- The camera's own **zoom** scales everything uniformly.

---

## 16.2 The Camera layer (timeline)

- Enabling the camera (Camera tool or the **Add Camera** button on the timeline) creates a **Camera layer** at the top of the layer list.
- The camera layer holds **camera keyframes**: each keyframe stores `{x, y, z, zoom, rotation, tint}`.
- Between camera keyframes, values **tween** (classic-tween-style interpolation on the camera layer; easing applies).
- Deleting the camera layer disables the camera.

### Attach-to-camera (HUD layers)
- Layers that must **not** move with the camera (HUD, captions, scoreboards) can be **attached to the camera** (the chain-link dot in the layer row, or right-click → Attach To Camera).
- Attached layers are pinned to the **camera view** — they stay fixed on screen while the world pans/zooms.
- Multiple layers can be attached; their z-depth still applies.

---

## 16.3 Camera interaction (the tool)

| Action | Input (desktop) | Input (touch) | Result |
|---|---|---|---|
| **Pan** | drag | one-finger drag | `x/y` change |
| **Zoom** | `Shift`+drag (or on-screen slider) | pinch (or slider) | `zoom` change |
| **Rotate** | `Ctrl/Cmd`+drag (or slider) | two-finger twist | `rotation` change |
| **Reset a property** | reset icon next to it | tap reset | property → default |

- **On-screen UI:** a zoom slider + rotate slider with a center value readout; the camera border drawn around the stage.
- **Properties panel:** numeric x/y/z/zoom/rotation + tint + filters + reset buttons.

---

## 16.4 Camera animation workflow

1. Select the Camera tool → camera layer is created/selected.
2. **Frame 1:** set the starting shot (keyframe exists by default on frame 1).
3. Move the playhead to the target frame; **Insert Keyframe (F6)** on the camera layer.
4. Pan/zoom/rotate to the new shot.
5. Right-click between the keys → **Create Classic Tween** (or motion tween) → the camera move interpolates.
6. Apply **easing** (ease-out for a cinematic settle; ease-in-out for push-ins).
7. Preview (`Enter`) — scrub shows the move.

**Common camera moves (presets):**

| Preset | Keys | Use |
|---|---|---|
| **Push-in** | zoom 100% → 200% (ease-out) | focus a subject |
| **Pull-out** | zoom 150% → 100% | reveal context |
| **Pan** | x 0 → 400 | follow a character |
| **Truck + parallax** | pan + layers at different z-depth | 3D-feel tracking |
| **Rotate** | rotation 0 → 8° | dramatic tilt |
| **Shake** | several ±x/y keys over 3–6 frames | impact/explosion |

**Our app ships these as one-click camera presets (P1)** — Animate has no built-in camera presets; this is a direct improvement. A preset = a function that writes the camera keyframes + easing for you.

---

## 16.5 Layer depth & parallax (the 2.5D effect)

1. Enable **Advanced Layers** (timeline top) + open the **Layer Depth panel** (Window > Layer Depth).
2. Assign z-depth to layers: near layers (foreground) lower positive numbers; far layers (background) higher; behind-camera = negative.
3. Camera pans/zooms → near layers move **faster** (bigger parallax) than far ones → depth illusion.
4. **z-depth is keyframable per layer** (Animate ties it to keyframes; you can tween it) — a layer can move toward/away from the camera over time.
5. **Implementation:** per-layer `zDepth` → depthScale factor in the camera matrix (16.1). Render layers back-to-front (far first), each with its own depth scale. Cache each layer's raster; apply camera matrix per layer (GPU: one draw call per layer with a transform).

---

## 16.6 How a new app should represent camera animation (summary spec)

1. **One `Camera` object per scene/timeline** (not per layer) with `{x, y, z, zoom, rotation, tint, filters}`.
2. **Camera keyframes on a dedicated camera layer** (or a camera track — our app uses a camera track on the timeline so it can't be confused with content layers).
3. **Interpolation:** lerp position/rotation; **zoom lerped in log-space** (natural push-ins); easing per segment.
4. **Per-layer zDepth** → parallax scale; layers attachable to camera (HUD).
5. **Camera presets** (push/pull/pan/shake/truck) as one-click keyframe writers.
6. **Export:** the camera matrix is applied at render time in every exporter (image/sequence/video/HTML — Part 28) so the output matches the editor exactly.

---

## 16.7 BUILD CHECKPOINT M4 (camera slice)

- [ ] Camera object + camera layer/track; enable/disable; camera border + on-screen zoom/rotate sliders.
- [ ] Pan/zoom/rotate via tool (desktop modifiers + touch gestures) + numeric Properties.
- [ ] Camera keyframes + tweening + easing; log-space zoom interpolation.
- [ ] Layer depth panel + per-layer zDepth + parallax rendering (back-to-front, per-layer transform).
- [ ] Attach-to-camera (HUD) layers.
- [ ] Camera presets (push/pull/pan/shake/truck).
- [ ] Camera exported identically in all exporters.

*Next: `17_audio.md` — import, formats, audio layer, waveform, sync (Event/Start/Stop/Stream), loop, trim, volume, scrubbing, timeline sync, export sync.*

---

<!-- ===== FILE: 17_audio.md ===== -->

# PART 17 — AUDIO
### Import, formats, audio layers, waveform, sync modes (Event/Start/Stop/Stream), loop, trim, volume, scrubbing, timeline synchronization, export synchronization.

---

## 17.0 The two kinds of sound (the core concept)

Animate divides sound into **two behaviors** — this distinction drives everything in this part:

| | **Event sound** | **Stream sound** |
|---|---|---|
| **Starts** | After the sound **fully downloads/loads** | As soon as enough data is buffered (begins immediately) |
| **Continues** | Until explicitly stopped (independent of the timeline) | Only while the timeline plays; **stops with the timeline** |
| **Timeline relationship** | Not tied to frames — plays out fully even if the timeline stops | **Synchronized to the timeline**: if the animation can't keep up, frames are **dropped** so audio stays in sync |
| **Duration** | Full sound regardless of the frames it occupies | Can never play longer than the frames it occupies |
| **Use** | Music, UI clicks, ambient loops | **Voice/dialogue** (must match lip-sync), any sound that must sync to picture |

**Rule:** dialogue & lip-sync → **Stream**; music/sfx → **Event**. (Animate's docs explicitly say auto lip-sync works best with Stream — Part 18.)

---

## 17.1 Import & formats

| Category | Formats |
|---|---|
| **Audio** | MP3 (most common), WAV, AIFF. (Our app additionally: OGG, FLAC, M4A/AAC — cross-platform via the platform audio decoder.) |
| **Video (with audio)** | MP4/FLV import → the audio track can be used separately. |

- Import = File > Import to Library, or drag the file into the Library (Part 12).
- Each imported sound becomes a **sound asset** in the Library: `{id, name, durationMs, sampleRate, channels, dataRef}`.
- The Library preview shows the **waveform** + a play button.

---

## 17.2 Placing audio on the timeline (audio layers)

**Best practice: one sound per layer** (so each has independent sync/volume). Steps:

1. Create a layer (audio layers are just normal layers that carry sound).
2. Select a **keyframe** on that layer (sound attaches to a **keyframe**, not a static frame).
3. Drag the sound asset from the Library onto the stage/frame, **or** in the frame's Properties, choose the **Sound** dropdown → pick the asset.
4. The **waveform** appears across the following frames (its horizontal extent = the sound's duration at the current fps).

### Waveform display
- Drawn across the frame grid; **frame ruler** shows the time mapping (`frames = seconds × fps`).
- **Scrubbing** the playhead across the waveform plays the sound at the scrub position (Stream sync; scrubbing Event audio also works in our app — P1).
- Zooming the timeline ruler zooms the waveform.

---

## 17.3 The Sync menu (frame Properties > Sound)

| Sync | Behavior |
|---|---|
| **Event** | Starts when the playhead reaches the keyframe; plays fully; **other Event sounds can overlap** (multiple can play at once). |
| **Start** | Like Event, but **if the same sound is already playing, don't start another** (no overlap). |
| **Stop** | **Silences the specified sound** when the playhead reaches this keyframe (place a keyframe with Sync=Stop + the same sound selected to end it early). |
| **Stream** | Timeline-synchronized; drops animation frames to keep audio in sync; stops when the timeline stops; can't outlast its frames. |

### Loop
- A **Loop** count in the Sound properties (0 = none; N = repeat N times). Stream loops repeat within the occupied frames; Event loops repeat until stopped.
- **Audio loop on timeline** (current Animate): a per-span **loop toggle** for streaming audio over a frame range (used for looping background music under a scene).

---

## 17.4 Trim & volume & effects

| Control | Does |
|---|---|
| **Start/End trim (Edit)** | Edit the sound's **in/out points** (play only a slice). Our app: drag the waveform's trim handles + numeric fields. |
| **Effect** | Prebuilt volume curves: Left channel / Right channel / Fade Left-to-Right / Fade Right-to-Left / Fade In / Fade Out / Custom. |
| **Custom volume envelope** | A **volume curve** (points with volume %) over the sound's duration — our app draws it over the waveform, draggable points (P1; Animate has a modal envelope editor). |
| **Volume (master)** | Per-sound volume % (our app: a slider next to the waveform). |

---

## 17.5 Timeline synchronization (the rules)

- **Sound starts at its keyframe.** Moving the keyframe moves the start.
- **Event sound** plays its full duration regardless of the following frames (the waveform is shown, but the sound won't be cut by a shorter span).
- **Stream sound** is bounded by its span — if the span ends before the sound, the sound **cuts off** (extend the span to hear it all; drop-animation-frames applies on publish).
- **Stop keyframe** (Sync=Stop) ends a sound early at a chosen frame.
- **Scrubbing:** Stream audio plays while scrubbing (scrub-audio toggle). Event audio plays on scrub too in our app (better for reviewing dialogue).
- **Mute** (Control menu / timeline speaker) silences playback without removing data.

### Frame↔time math (fps-dependent)
```
sound frames = ceil(durationSeconds × fps)
frame → ms = frameIndex / fps × 1000
```
Changing fps re-maps the waveform's frame extent (Part 01 §1.7).

---

## 17.6 Export synchronization

| Target | Behavior |
|---|---|
| **HTML5/Web** | Stream audio = timeline-synced playback (the runtime keeps frame/audio sync; may drop frames). Event audio = triggered at keyframes. Audio bitrate/format set in Publish Settings (Part 28). |
| **Video (MP4/MOV)** | Audio is **muxed** into the video container, frame-accurate by construction (the exporter samples audio at each video frame). |
| **GIF** | **No audio** (GIF is silent — warn the user). |
| **PNG/JPEG sequence** | No audio (provide a sidecar WAV option — our app P1). |
| **Project file** | Audio assets + keyframe references saved; re-importable losslessly. |

**Export sync rule (our app):** for video export, encode audio **per frame boundary** (sample-exact), never by "start time + wall clock" — this guarantees A/V sync even after trimming/looping. For web export, ship the audio as a separate asset with `startAt`/`loop`/`sync` metadata so the runtime reproduces Stream/Event semantics.

---

## 17.7 Audio data model

```jsonc
// asset
{ "type":"sound", "id":"s_voice01", "name":"voice01", "durationMs":4200,
  "sampleRate":44100, "channels":1, "dataRef":"assets/voice01.mp3" }

// keyframe attachment
"frames":[ { "type":"keyframe", "sound":{
    "assetId":"s_voice01", "sync":"stream|event|start|stop",
    "loop":0, "trimStartMs":0, "trimEndMs":4200,
    "volume":1.0, "envelope":[{t:0,v:1},{t:1,v:1}] } } ]
```

---

## 17.8 BUILD CHECKPOINT M4 (audio slice)

- [ ] Import MP3/WAV (+ OGG/FLAC) into Library with waveform preview.
- [ ] Attach sound to a keyframe; waveform across frames; scrub-audio playback.
- [ ] Sync modes Event/Start/Stop/Stream with exact semantics (17.3).
- [ ] Loop count + timeline audio loop; trim in/out; volume + custom envelope.
- [ ] fps re-mapping of the waveform; mute toggle.
- [ ] Export: video mux sample-exact; HTML runtime sync metadata; GIF/sequence warnings.

*Next: `18_lip_sync.md` — audio → speech analysis → phonemes/visemes → mouth symbols → frame assignment → manual correction, with the 12-viseme mapping, auto lip-sync workflow, and an improved original version.*

---

<!-- ===== FILE: 18_lip_sync.md ===== -->

# PART 18 — LIP SYNC
### Audio → speech analysis → phonemes/visemes → mouth symbols → frame assignment → manual correction. Adobe Animate's documented Auto Lip-Sync workflow (12 visemes) + the Frame Picker manual workflow + an improved original automatic system.

---

## 18.0 Correction first (accuracy)

Adobe Animate **does** ship an **Auto Lip-Sync** feature (added 2018–2019, Adobe Sensei-assisted): it analyzes an **audio layer**, detects speech, and **auto-places mouth-pose keyframes** on the timeline. It is a **graphic-symbol-driven** system: one symbol holds all mouth poses (visemes); keyframes switch that symbol's shown frame. This part documents that real workflow, then designs an **original, better** system (18.6).

**Note the split:** *Adobe Character Animator* does **real-time** facial/viseme tracking; *Adobe Animate* does **offline** auto lip-sync from an audio layer. Our app implements Animate's offline model (plus improvements).

---

## 18.1 The concept: phonemes → visemes → mouth symbols

- **Phoneme** = a unit of *sound* (the "ah" in "cat", the "ee" in "see"). Speech = a sequence of phonemes with timestamps.
- **Viseme** = a unit of *visual* mouth shape. Multiple phonemes share one viseme (e.g., "p", "b", "m" all look like closed lips — you hear the difference, you don't see it).
- **Mouth symbol** = the artist's drawing of one viseme.
- **Lip sync** = map the audio's phoneme timeline → viseme timeline → mouth-symbol keyframes at the right frames.

The classic animation **mouth chart** (Preston Blair style, ~12 shapes — the basis of Animate's 12 visemes) groups phonemes like this:

| # | Viseme (mouth shape) | Phonemes it covers | Mouth looks like |
|---|---|---|---|
| 1 | **A** | "ah", "hat", "father" | wide open, jaw dropped |
| 2 | **B / M-P** | "m", "p", "b" | closed lips (pressed) |
| 3 | **C / D-G-K-N-R-S-T-Y-Z** | "d","g","k","n","r","s","t","y","z","ch","j" | slightly open, teeth nearly closed |
| 4 | **D** | "den", "they" | open, tongue at top |
| 5 | **E** | "ee", "see", "me" | wide smile, teeth together |
| 6 | **F / V** | "f", "v" | bottom lip under top teeth |
| 7 | **L / TH** | "l", "th" | tongue between/at teeth |
| 8 | **O** | "oh", "go", "no" | round open "O" |
| 9 | **U** | "oo", "you", "do" | pursed small "O" |
| 10 | **W / Q** | "w", "q", "oo-w" | tight small pucker |
| 11 | **Rest / Neutral** | silence, breathing | relaxed, slightly open |
| 12 | (extra/expression) | e.g. "G" growl, or a second "E" | per artist |

*(This is the standard 12-shape mouth chart; Animate's dialog shows 12 default visemes the user maps to their own frames. Our app ships this chart as the default viseme set.)*

---

## 18.2 The mouth library (the mouth symbol)

The whole system is driven by **one graphic symbol** containing one **frame per mouth pose**:

```
symbol "mouth" (graphic)
  frame 1  = pose A     (ah)
  frame 2  = pose B/M   (closed)
  frame 3  = pose C/D   (teeth)
  frame 4  = pose E     (ee)
  frame 5  = pose F/V
  frame 6  = pose L/TH
  frame 7  = pose O
  frame 8  = pose U
  frame 9  = pose W/Q
  frame 10 = pose Rest
```

- Each frame is a full mouth drawing (lips, teeth, tongue, jaw) drawn **in place** (same registration point) so switching frames doesn't shift the mouth.
- Label each frame with the viseme name (Animate recommends labeling frames; our app uses a structured `viseme` field).
- The mouth is placed on the character's face (nested in the head symbol — Part 13.3).

**Why a graphic symbol (not movie clip):** the main timeline must **drive** which frame shows (Frame Picker / First-frame mapping — Part 11.4). A graphic instance's "First frame" = the mouth pose.

---

## 18.3 The Auto Lip-Sync workflow (Adobe Animate, documented)

1. **Prepare the mouth symbol** (18.2) — a graphic symbol with all mouth poses as frames.
2. **Import the audio** into a new layer (Part 17); set its **Sync = Stream** (Animate's docs: auto lip-sync works best with Stream).
3. **Place the mouth symbol** on its own layer, its span covering the audio's length.
4. **Select the mouth instance** → Properties → **Lip Syncing** button → the **Create Lip Syncing** dialog opens showing the **12 default visemes**.
5. **Map each viseme → a mouth-pose frame:** click a viseme → a popup lists the symbol's frames → pick the matching pose. (Animate: click viseme, pick frame; Enter/Space to confirm.)
6. **Choose the audio layer** in the dialog → **Sync**.
7. **Result:** Animate analyzes the audio, detects speech, and **auto-inserts keyframes** across the mouth layer — each keyframe sets the mouth instance's frame to the matched viseme. (You can also pre-select a **frame range** to apply sync only there.)
8. **Preview:** `Ctrl+Enter` — mouth moves in sync with the voice.
9. **Correct manually** (18.5).

---

## 18.4 What the analysis does (phoneme/viseme detection — concept)

1. **Segment the audio** into speech vs silence (energy/VAD — voice activity detection).
2. **Recognize phonemes** with their **time offsets** (speech-recognition / forced alignment produces `[{phoneme, startMs, endMs}, …]`).
3. **Map phonemes → visemes** (18.1 table); **merge** consecutive same-viseme runs (mouth doesn't re-shape mid-"mmmm").
4. **Convert time → frames**: `frame = round(ms / 1000 × fps)` (Part 01 §1.7).
5. **Emit keyframes**: at each viseme boundary frame, set the mouth instance's shown frame to that viseme's pose.
6. **Fast speech → fewer frames than visemes:** when multiple visemes land within one frame, keep the **most prominent** (longest/loudest within that frame).

---

## 18.5 Manual override & frame-by-frame correction

Auto lip-sync is a **starting point**, not the final. Corrections (the tools):

| Tool | Does |
|---|---|
| **Frame Picker panel** (Window > Frame Picker) | Visual browser of the mouth symbol's frames. Select a keyframe on the timeline → click a pose in the picker → that keyframe's mouth frame changes. Pin the symbol to keep it loaded. |
| **Swap (Part 11.6)** | Swap the mouth instance to a different pose symbol at a keyframe. |
| **Drag keyframes** | Move a mouth keyframe earlier/later to fix timing. |
| **Insert/delete keyframes** (F6/F7/Shift+F6) | Add/remove mouth poses manually. |
| **Hold/extend** (F5) | Hold a pose (e.g., hold the "M" closed longer on a plosive). |
| **Scrub with audio** (Part 17.5) | Scrub the playhead to hear + see the sync and fix by ear. |

**Manual workflow (no auto):** place the mouth symbol, scrub the audio, and at each phoneme press the Frame Picker pose → F6 → repeat. Labor-intensive but full control — the fallback our app must also support perfectly.

---

## 18.6 The improved original system (our app's design)

Built on the same graphic-symbol/viseme model, but strictly better:

| Improvement | How |
|---|---|
| **1. Live waveform + phoneme lane** | Show the audio waveform with a **phoneme lane** above the mouth layer (colored blocks = detected phonemes, labeled). Click a block → jump there. |
| **2. Editable detection** | Drag phoneme boundaries to re-time; re-map a phoneme to a different viseme (right-click → set viseme). The auto result is a **first pass you edit**, not a black box. |
| **3. Confidence display** | Each detected phoneme shows a **confidence** value; low-confidence blocks are highlighted for manual review. |
| **4. Per-character timing bias** | A **lead/lag offset** (ms) per mouth symbol (some mouths lead the audio slightly — classic lip-sync trick). |
| **5. Viseme dictionary** | A user-editable phoneme→viseme map (share between projects). Ships with the 12-shape default. |
| **6. Multi-language** | The phoneme recognizer is pluggable; ship an English model, allow custom models (P2). |
| **7. Better VAD** | Silence/energy detection with a **threshold slider** + manual silence marks. |
| **8. Blends** | Optional **cross-fade/morph between mouth poses** (shape-tween the mouth between visemes) for smooth speech (toggle; snaps are default for stylized look). |
| **9. Batch** | Auto lip-sync **multiple characters** from one audio layer (each with its own mouth symbol). |
| **10. Undoable** | The whole auto-pass is **one undoable command**; manual edits are normal commands (Part 36). |

### Improved pipeline (data flow)

```
audio asset (Stream, on audio layer)
  → VAD (silence threshold)
  → phoneme recognition → [{phoneme, startMs, endMs, confidence}]
  → viseme dictionary → [{viseme, startFrame, endFrame, confidence}]
  → merge same-viseme runs; resolve sub-frame collisions (longest wins)
  → write mouth-layer keyframes: {frame, instance.firstFrame = visemePoseFrame}
  → user edits (Frame Picker, drag, re-map) → final
```

---

## 18.7 Lip-sync data model

```jsonc
"lipSync": {
  "mouthSymbolId": "mouth",
  "audioAssetId": "voice01",
  "audioLayerId": "L_audio",
  "visemeMap": { "A":1, "B/M":2, "C/D":3, "E":4, "F/V":5, "L/TH":6, "O":7, "U":8, "W/Q":9, "rest":10 },
  "result": [ { "viseme":"O", "startFrame":12, "endFrame":14, "confidence":0.93 } ],
  "leadMs": 0, "blend": false
}
```

The **mouth layer keyframes** are ordinary keyframes whose instance `firstFrame` = the viseme's pose frame (Part 11.4) — so lip-sync reuses the symbol system, not a parallel one.

---

## 18.8 BUILD CHECKPOINT M4 (lip-sync slice)

- [ ] Mouth symbol = graphic with one frame per viseme; labeled; Frame Picker browses it.
- [ ] Auto lip-sync: select mouth + audio layer → detect → map 12 visemes → auto keyframes (one undoable command).
- [ ] Phoneme lane + waveform + confidence display; drag phoneme boundaries; re-map visemes.
- [ ] Manual override: Frame Picker per keyframe, swap, drag keys, hold/extend, scrub-with-audio.
- [ ] Viseme dictionary (editable, sharable); lead/lag bias; multi-character batch; optional blend.
- [ ] Sync = Stream works end-to-end; Ctrl+Enter preview in sync.

*Next: `19_facial_animation.md` — eyes/eyebrows/mouth/head systems via symbols + keyframes + nested timelines, then blink system, eye direction, mouth system, expression system, head movement system.*

---

<!-- ===== FILE: 19_facial_animation.md ===== -->

# PART 19 — FACIAL ANIMATION
### Building faces from eyes/eyebrows/mouth/head via symbols + keyframes + nested timelines — then five complete subsystems: Blink, Eye direction, Mouth, Expression, Head movement.

---

## 19.0 The facial rig (how a face is constructed)

A face = a **nested structure of symbols**, each part independently swappable/animatable:

```
head (movie clip, on the character rig — Part 13)
 ├─ skull/face base (static artwork, one symbol)
 ├─ eye_L, eye_R (movie clips — blink + pupil inside)
 │    ├─ sclera (white), eyelid (movie clip that closes), pupil (symbol that moves)
 ├─ brow_L, brow_R (symbols — raised/furrowed by rotation/position)
 └─ mouth (graphic symbol — viseme frames inside, Part 18)
```

**Why nesting:** each subsystem (blink, eye direction, mouth) has its **own timeline** inside its own symbol, so it can loop/animate independently while the head moves — the nested-timeline model from Part 11.8.

**Design rule:** build each face part as a symbol with **one pose per frame** (like the mouth symbol), driven by **Frame Picker / swap** on the parent timeline, OR as a movie clip with its **own looping animation** (blink). Use graphics for parent-driven poses, movie clips for self-looping motions.

---

## 19.1 Blink system

### 19.1.1 Construction
- **Eyelid** = a movie clip with frames: `open (1) → half (2) → closed (3) → half (2) → open (1)` (a 3-frame blink on 2s = ~6 frames). The closed frame = an eyelid shape drawn over the eye (skin color + lash line).
- Place the eyelid movie clip over the eye; it plays **only when triggered**.

### 19.1.2 Triggering (two approaches)
1. **Timeline-triggered (recommended):** a blink is a **keyframe event** — place a keyframe that starts the eyelid clip (or a graphic eyelid whose frame advances). Blinks happen on the main timeline at authored moments (natural, controllable).
2. **Random/auto blink (our app P1):** the eyelid clip has an **auto-blink behavior** — holds "open" for a random 2–6 s, then plays the blink. Set via a parameter (min/max interval). This removes the tedium of manual blinks (a top-requested nicety).

### 19.1.3 Timing rules
- A blink = **~6–10 frames** (fast close, fast open; the close is faster than the open).
- Blinks every **2–6 seconds** (randomized feels natural).
- **Never blink mid-line** (during a word) — the classic mistake. Our app's auto-blink **avoids active lip-sync frames** (reads the lip-sync result — Part 18) automatically.

### Data
```jsonc
"blink": { "eyelidSymbolId":"eyelid", "mode":"auto|timeline",
           "minIntervalMs":2000, "maxIntervalMs":6000, "avoidSpeech":true }
```

---

## 19.2 Eye direction system

- **Pupil** = a small symbol inside the eye; move it to look left/right/up/down (offset within the sclera bounds).
- **Eye-direction poses:** a graphic symbol with frames `lookLeft / lookRight / lookUp / lookDown / center` — swap/frame-pick to change gaze (same mechanism as the mouth — Part 18.2).
- **Animate gaze:** keyframe the pupil position (motion tween) or swap the direction pose; add a **quick ease** for a darting look.
- **Blink on direction change** (subtle realism): trigger a blink when the gaze changes — our app does this automatically (P2 toggle).
- **Both eyes together:** eye_L and eye_R are usually driven together (a "gaze" controller sets both pupils — our app's face rig template does this).

### Data
```jsonc
"gaze": { "eyeL":{...}, "eyeR":{...}, "current":"center|left|right|up|down",
          "pupilOffset":{x,y}, "blinkOnChange":true }
```

---

## 19.3 Mouth system

- The mouth **is** the lip-sync system (Part 18): a graphic symbol, one frame per viseme, driven by auto lip-sync or manual Frame Picker.
- **Mouth as expression** (not speech): the same symbol can include **expression poses** (smile, frown, grin, gritted teeth) as extra frames — swap to them for expressions (Part 11.6).
- **Mouth + jaw:** for big open visemes, the whole **jaw/lower face** can move (nest the mouth in a "jaw" movie clip that rotates open on "A/O" poses) — advanced but standard for quality rigs.

---

## 19.4 Expression system

An **expression** = a coordinated set of part poses: brows + eyes + mouth together.

| Expression | Brows | Eyes | Mouth |
|---|---|---|---|
| Neutral | rest | center, open | rest |
| Happy | raised | slightly squinted | smile |
| Angry | furrowed (rotated inward/down) | narrowed | frown/gritted |
| Surprised | high raised | wide | "O" (ah) |
| Sad | inner tips up | droopy lids | slight frown |
| Scared | raised + inner up | wide | open "E/A" |

### Implementation (two options)
1. **Expression symbols (recommended for limited rigs):** one graphic symbol with an **expression per frame** (the whole face redrawn per expression). Swap the face instance → expression changes. Simple, reliable, great for stylized work.
2. **Composite (recommended for flexible rigs):** an **expression preset** = a named bundle of part-pose references:
   ```jsonc
   "expression":"happy" = { brows:{rotation:-15, y:-4}, eyes:{pose:"squint"}, mouth:{frame: smileFrame} }
   ```
   Applying an expression sets all parts at once. Our app ships a **preset library + a per-expression keyframe** (one keyframe = one expression; tweens interpolate between them if the parts are transform-based).

- **Blend/transition:** transform-based expressions tween smoothly (brows rise, mouth corners turn). Frame-based expressions swap (snap). Our app supports both; default = swap (matches Animate's style).

---

## 19.5 Head movement system

- The **head** is a symbol; rotate/scale/position it for **turns, nods, tilts, shakes**.
- **Nod** = rotation up/down around the neck pivot (Part 13.4); **tilt** = rotation around the nose axis (skew/rotate); **shake** = rapid small rotations.
- **Anticipation & settle:** nod = down-up-settle (3 keys with ease — Part 09.4); shake = 3–5 fast alternating keys.
- **Head turn (2D fake):** swap between **front / ¾ / side** head poses (frames in a graphic symbol) + a quick ease — the standard limited-animation turn. (Full 360° head turns = a different, advanced rig — P3.)
- **Overlap:** the head leads, hair/brows lag (secondary motion — offset their keys or use spring bones, Part 14.5).

### Head-movement data
```jsonc
"head": { "symbolId":"head", "pivot":{"x":20,"y":8},       // neck pivot
          "poses":["front","threeQuarter","side"],           // turn poses
          "movement": { "nod":"rotation", "tilt":"skew", "shake":"rotation" } }
```

---

## 19.6 The facial-animation workflow (end-to-end)

1. **Draw parts** (eyes, brows, mouth, head) as clean separate artwork (Part 05).
2. **Symbolize** each; nest under a **head movie clip** (Part 11.8).
3. **Set pivots** (neck for head, eyelid hinge for blink) (Part 13.4).
4. **Build the mouth library** (viseme frames — Part 18.2).
5. **Build blink** (eyelid clip + auto/timeline trigger).
6. **Animate:** head moves + expressions on keyframes; mouth from lip-sync; gaze + blinks on top.
7. **Layer the order:** brows on top, then eyes, then mouth, over the face base.

---

## 19.7 BUILD CHECKPOINT M4 (facial slice)

- [ ] Face rig: head/eyes/brows/mouth symbols nested under a head movie clip; pivots at hinges.
- [ ] Blink: eyelid clip + timeline trigger + auto-blink (random interval, avoids speech).
- [ ] Eye direction: pupil move + gaze poses + blink-on-change.
- [ ] Mouth: lip-sync (Part 18) + expression poses in the same symbol.
- [ ] Expression system: preset library + per-expression keyframes + swap/tween modes.
- [ ] Head movement: nod/tilt/shake/turn with anticipation + overlap.

*Next: `20_layers.md` — create/delete/rename/move/duplicate/lock/hide/outline/group/hierarchy/type/order/parenting.*

---

<!-- ===== FILE: 20_layers.md ===== -->

# PART 20 — LAYERS
### Every layer function: create, delete, rename, move, duplicate, lock, hide, outline, folders, hierarchy, layer type, layer order, layer parenting — plus the complete layer-type reference and the layer data model.

---

## 20.0 What a layer is

A layer = a **horizontal strip of frames** + a set of **display properties** (visibility, lock, outline, type, order, depth). Layers stack **bottom → top** (top = drawn frontmost on stage). Layers exist to:

1. **Separate** objects so they don't merge/cut (merge model — Part 06) and so each can animate independently.
2. **Organize** (folders, naming).
3. **Apply special behavior** (mask/guide/pose/camera/audio — the layer *type*).

### Layer data model

```jsonc
{
  "id":"L3", "name":"arm_R", "type":"normal",      // normal|folder|mask|masked|guide|motionGuide|pose|tween|camera|audio
  "visible":true, "locked":false, "outline":false,
  "outlineColor":"#ff0000",                          // per-layer outline tint
  "parentId":null,                                   // folder parent (hierarchy) or layer-parenting link
  "zDepth":0, "attachedToCamera":false,              // camera (Part 16)
  "frames":[...], "height":18                         // row height in px
}
```

---

## 20.1 Layer lifecycle operations

| Operation | Trigger | Data change | Rules |
|---|---|---|---|
| **Create** | + button / Insert menu | append a `normal` layer above the active one | named "Layer N"; becomes active. |
| **Delete** | trash / right-click → Delete | remove layer + its frames | prompt if it's a mask/guide/pose layer with dependents (21.3); undoable. |
| **Rename** | double-click name | `name` | names are display-only; IDs are stable (rename-safe refs). |
| **Move (reorder)** | drag up/down | layer order in `layers[]` | changes render order (top = front). Dragging into a folder nests it. |
| **Duplicate** | right-click → Duplicate Layer | deep-copy layer (frames + content) inserted above | new layer = independent copy. |
| **Copy/Paste Layer** | context menu | copy layer (with frames) to clipboard → paste | paste into another timeline (scene/symbol). |

---

## 20.2 Layer state toggles

| State | Toggle | Effect on stage | Effect on editing | Effect on export |
|---|---|---|---|---|
| **Visible** | eye | shown | editable | exported (default) |
| **Hidden** | eye off | not shown | not selectable/editable | **not exported** (default "export hidden layers" = off) |
| **Locked** | padlock | shown (normally) | **not selectable/editable**; skipped by Select All | exported |
| **Outline** | square | rendered as **outlines only** | editable normally | exported **fully** (outline is authoring-only) |

- **Locked layers** still render (unlike hidden). They protect finished art while you draw on other layers.
- **Outline mode** = a view aid to see through a layer (e.g., see the rig under a filled foreground) without changing its data.
- Lock/hide/outline on a **folder** cascade to all children.

---

## 20.3 Layer types (the complete reference)

| Type | Purpose | Stores | Interactions | Where |
|---|---|---|---|---|
| **Normal** | Standard content | frames with shapes/instances/text | default | everywhere |
| **Folder** | Group layers | `children` (layer list indentation) | lock/hide/outline cascade; collapse/expand | everywhere |
| **Mask** | Defines a clipping shape | a shape (the mask) | clips the **masked** layer(s) below it (Part 21) | everywhere |
| **Masked** | Is clipped by the mask above | normal content | only shows where the mask is opaque (Part 21) | under a mask |
| **Guide** | Non-printing helper (paths, notes) | a path | content invisible at export; snaps objects to it | classic tween (Part 10.6) |
| **Motion Guide** | Classic-tween path | a path | linked tween layer follows it | classic tween (Part 10.6) |
| **Pose** | IK armature | armature + poses (Part 14) | green; Insert Pose; bones | rigging |
| **Tween** | Motion-tween spans | tween spans (Part 09) | blue; one target per span; no drawing | motion tweens |
| **Camera** | Camera keyframes | camera states (Part 16) | camera tool; attach layers | camera |
| **Audio** | Sound frames | sound attachments (Part 17) | waveform display | audio |

**Type conversion rules:**
- Normal ↔ Folder ↔ Mask ↔ Guide: changeable via right-click → Properties (some conversions warn, e.g., mask→normal breaks clipping).
- Pose/Tween/Camera/Audio: created automatically by their tools; converting away (e.g., delete bones) reverts to normal.
- **One armature per pose layer**; **one target per tween span** (Part 09); **one mask per mask group** (Part 21).

---

## 20.4 Layer hierarchy (folders & nesting)

- A **folder** contains child layers (indented under it, with a collapse/expand triangle).
- **Nesting depth**: our app supports unlimited nesting (Animate: 2 levels); folders are **purely organizational** — they do **not** create a coordinate space (unlike symbol nesting, Part 11.8).
- **Folder + camera**: folders can carry z-depth and attach-to-camera like layers (applied to children).
- **Drag-drop rules:** drag a layer onto a folder = nest; drag to the left edge = out of the folder; drag between two layers = reorder at that level.

---

## 20.5 Layer parenting (transform inheritance)

**Layer parenting** (Animate's modern feature) = a layer **inherits the transform of its parent layer**, so moving/rotating the parent moves the children as a group — like a lightweight rig without symbols.

| Aspect | Rule |
|---|---|
| **Link** | A layer's `parentId` points at another layer; the UI shows an indent + connector line. |
| **Inheritance** | Child transform = parent transform ∘ child local transform (position/rotation/scale/skew). |
| **Visibility** | Hiding a parent hides children. |
| **Pose/IK** | Parenting works with rigs (parents can drive IK chains). |
| **Reparent** | Change `parentId` anytime; *[WISH W2]* our app stores **local-space** transforms so re-parenting is a clean matrix change (Animate's copy/paste + re-parent bugs are design-out: stable IDs + local space — Part 14.2). |

**Layer parenting vs symbol nesting (choose correctly):**
- **Parenting** = transforms only, no timeline isolation (all on the same timeline).
- **Nesting (symbols)** = full timeline isolation + reuse (Part 11).
- Use parenting for quick group motion; nesting for reusable, independently-animating parts.

---

## 20.6 Layer order & render rules

- Render order = `layers[]` index order, **bottom → top** (index 0 = backmost).
- Within a layer: display-list order (back → front) per Part 01 §1.4.2.
- **Mask groups** render: mask layer clips the masked layer(s) directly below (Part 21).
- **Camera** applies after all layers composite (Part 16).
- **Move Ahead/Behind** (Modify > Arrange, Ctrl+↑/↓) changes **object** order within a layer — distinct from layer reordering.

---

## 20.7 BUILD CHECKPOINT M2/M3 (layers slice)

- [ ] All lifecycle ops (create/delete/rename/move/duplicate/copy-paste) with correct undo.
- [ ] Visibility/lock/outline with cascade-through-folders and export rules (hidden = not exported by default).
- [ ] All 11 layer types with their storage + auto-creation + conversion warnings.
- [ ] Folders with nesting, collapse/expand, drag rules.
- [ ] Layer parenting with local-space inheritance and safe re-parenting *[WISH W2]*.
- [ ] Render order + within-layer object order.

*Next: `21_masks.md` — mask/masked layers, clipping behavior, animated masks, nested masks, alpha behavior, and the original equivalent implementation.*

---

<!-- ===== FILE: 21_masks.md ===== -->

# PART 21 — MASKS
### Mask layers, masked layers, clipping behavior, animated masks, nested masks, alpha behavior — and the original equivalent implementation.

---

## 21.0 The concept

A **mask** = a shape that acts as a **window**: the **masked** layer's content is visible **only where the mask is**, hidden everywhere else. The mask itself is invisible at export (it defines the window, not the artwork).

```
mask layer     ┐ (shape = the window; not rendered itself)
masked layer   ┘ (content = clipped to the mask shape)
```

Use: spotlight reveals, circular portraits, text wipes, iris transitions, hiding parts of a character behind a boundary.

---

## 21.1 Mask layer vs masked layer

| | Mask layer | Masked layer |
|---|---|---|
| Role | Defines the **clip shape** | Provides the **content** being clipped |
| What it contains | A shape (fill defines the window; strokes are ignored as mask — only **fills** count) | Normal content (shapes/instances/text) |
| Visibility | Invisible at export (shown outlined/hatched in authoring) | Visible **only within** the mask |
| Position | Directly **above** its masked layer(s) | Directly **below** the mask |

### Creating a mask (the workflow)
1. Create a layer with the mask shape (e.g., a circle).
2. Create the content layer below it.
3. Right-click the mask layer → **Mask** (converts to mask type; the layer below becomes **masked** — indented).
4. **Lock both layers** to see the mask effect on stage (Animate's quirk: mask preview requires locked layers — our app shows it live without locking, and marks the lock-dependency in a tooltip).

### Linking rules
- One mask layer can mask **one or more** layers directly below it (each becomes masked).
- Unmasking: right-click the masked layer → **Unmask**, or drag it out from under the mask.
- Mask + masked layers can be **folders** too (folder-as-mask works on folder content).

---

## 21.2 Clipping behavior (exact rules)

- The **mask fill** (its filled regions, per the fill rule — Part 05.3.1) defines the window. Mask **strokes are ignored**.
- Masked content shows where it **overlaps the mask fill**; hidden elsewhere.
- **Multiple mask sub-shapes** = union of their fills (multiple windows).
- The mask's **color/alpha is irrelevant** — only its **geometry** (shape outline) matters. (Alpha masks are a separate feature — 21.5.)
- Masked content **keeps its own** colors/effects — the mask only gates visibility.

---

## 21.3 Animated masks

A mask can **animate like any layer** — its shape can move/scale/rotate/morph across keyframes, revealing different parts of the masked content over time.

| Technique | How | Use |
|---|---|---|
| **Moving mask** | Motion-tween the mask shape's position (Part 09) | spotlight following a character; window sliding over a scene |
| **Morphing mask** | Shape-tween the mask between shapes (Part 09.3) | iris open/close, blob reveals |
| **Rotating/scaling mask** | transform keys on the mask | clock-wipe, spiral reveal |
| **Mask + masked both animate** | mask moves + content moves (parallax reveal) | complex reveals |

**Rules:**
- Both mask and masked layers can be tweened independently (mask on its own layer, content on its own).
- On a **tween layer** as mask: the tween's target's **fill** defines the window per frame.
- **Export:** animated masks render per-frame (the clip is re-evaluated at each frame).

---

## 21.4 Nested masks

- A mask can clip a layer that itself contains a **symbol** whose internal timeline has **its own mask** (nested masking).
- Rules: each symbol's internal masks apply **inside** the symbol first; the outer mask then clips the symbol's **composited result**. (Masks nest cleanly because each timeline is a self-contained render scope — Part 11.8.)
- **Limitation (Animate):** a mask layer cannot contain a mask layer (masks don't stack *within* one timeline beyond the one mask/masked pair). **Our app:** allows **multiple mask groups** per timeline (a group = one mask + its masked layers), a direct improvement.

---

## 21.5 Alpha behavior (alpha masks)

- Animate's native mask is **hard-edged** (binary: in or out) — the mask fill's alpha is ignored.
- **Alpha/soft masks** (feathered edges, gradient fades) are achieved via:
  1. A **gradient mask fill** — Animate **does not** soften the clip (gradient mask = still binary window of the gradient's region). Our app **adds true alpha masks** (P1): the mask's **alpha channel** scales the masked content's opacity (soft edges, gradient reveals).
  2. **Filters/blends** on the masked content (Part 11.5) for soft fades inside the window.
- Our app supports **two mask modes**: `clip` (binary, Animate-compatible) and `alpha` (soft, alpha-weighted) — a per-mask-layer setting.

---

## 21.6 Implementation (the original equivalent)

### Rendering pipeline (per frame)
```
for each mask group (mask layer + its masked layers):
  1. Render the masked layers into an offscreen buffer B (their normal composite).
  2. Render the mask layer's fills into a stencil/mask buffer M (geometry only for 'clip';
     alpha channel for 'alpha').
  3. Compose: result = B clipped by M  (destination-in / stencil test).
  4. Draw result into the main framebuffer at the group's stacking position.
```

- **Web/GPU:** use the **stencil buffer** (clip mode) or a **mask texture** (alpha mode); per-layer render targets with caching (Part 32 Renderer).
- **Vector fallback:** boolean **intersection** of masked content's paths with the mask path (Part 06.5 engine) for vector exports (SVG) where stencils aren't available.
- **Cache:** a mask group's composited buffer caches until any member changes (dirty-flag).

### Data model

```jsonc
"layers":[
  { "id":"M1", "type":"mask",     "maskMode":"clip|alpha", "frames":[...] },   // the mask shape
  { "id":"C1", "type":"masked",   "maskId":"M1", "frames":[...] }              // clipped content
]
```

---

## 21.7 BUILD CHECKPOINT M2 (mask slice)

- [ ] Mask/masked layer types + linking (one mask, N masked) + unmask; live preview without lock.
- [ ] Clip semantics: mask fills define window; strokes ignored; multiple windows; content keeps its own color/effects.
- [ ] Animated masks (move/morph/rotate) on both mask and content layers.
- [ ] Nested masks inside symbols (inner-first, then outer clip).
- [ ] Alpha mask mode (soft edges/gradients) as a per-mask setting; stencil/mask-texture rendering + vector boolean fallback for SVG export.

*Next: `22_text.md` — text tool, static/dynamic/input, font, size, alignment, spacing, color, transform, text animation.*

---

<!-- ===== FILE: 22_text.md ===== -->

# PART 22 — TEXT
### Text tool, static/dynamic/input text, font, size, alignment, spacing, color, transform, text animation — the complete text system.

---

## 22.0 The three text types (behavior, not just style)

| Type | Meaning | Runtime | Use |
|---|---|---|---|
| **Static** | Authored display text; **not changeable at runtime**; rendered as outlines/glyphs | fixed | Titles, labels, logos |
| **Dynamic** | Text whose **content is updated at runtime** (a variable, a score, a caption) | mutable via binding/script | Scoreboards, captions, live data |
| **Input** | A **user-editable field** (typing at runtime) | editable by the end user | Forms, name entry, chat |

The type is a **per-text-block property** (`textType`), stored with the text node.

---

## 22.1 The text tool & text blocks

- **Click** = **point text** (auto-width; grows with content; no wrap).
- **Drag** = **fixed-width box** (content wraps at the box width).
- **Click inside existing text** = character editing (caret + selection).
- Text is a **node** in the scene graph (Part 03.4.5): selectable, transformable, keyframable.

### Text model

```jsonc
{ "type":"text",
  "text":"Hello", "textType":"static|dynamic|input",
  "style": { "fontFamily":"Inter", "fontSize":24, "color":"#000000", "alpha":1,
             "bold":false, "italic":false, "underline":false,
             "align":"left|center|right|justify",
             "letterSpacing":0, "lineSpacing":1.2 },
  "box": { "width":null, "height":null, "autoSize":"width" },   // null = point text
  "embedFonts":[], "antiAlias":"normal|device", "selectable":true,
  "binding": null }   // dynamic text: a variable/expression (Part 22.6)
```

---

## 22.2 Font & glyphs

- **Font family** — any installed system font, or an **embedded font** (bundled with the project so it renders identically everywhere).
- **Embedding** — for dynamic/input text (and for export targets without the font), you **embed** the needed **glyphs** (a subset: basic Latin, a specific range, or the characters used). Embedded fonts guarantee WYSIWYG across devices.
- **Fallback** — un-embedded text falls back to a system font → layout may shift (the classic bug). Our app **warns** ("font not embedded — may differ at export") and offers one-click embed.
- **Web fonts** — our app additionally supports Google/local web fonts (HTML5 export maps them to `@font-face`), a direct improvement over Animate.

### Font metrics the engine must expose
- **baseline, ascent, descent, advance width, kerning** — needed for caret positioning, box wrapping, and export fidelity. Use the platform text API (canvas `measureText` / Skia / DirectWrite) — never hand-roll metrics.

---

## 22.3 Style controls (the complete set)

| Control | Field | Notes |
|---|---|---|
| Font family | `fontFamily` | dropdown with preview |
| Size | `fontSize` | px (pt at 72dpi in print contexts) |
| Color | `color` + `alpha` | *[WISH W6]* alpha slider always visible |
| Bold / Italic / Underline | `bold, italic, underline` | style flags |
| Alignment | `align` | left/center/right/justify (box text) |
| Letter spacing | `letterSpacing` | tracking (px) |
| Line spacing | `lineSpacing` | leading (multiplier or px) |
| Auto-kern | (auto) | optional manual kerning override |
| Anti-alias | `antiAlias` | normal (smooth) / device (system, sharper at small sizes) |
| Selectable | `selectable` | input/dynamic: user can select/copy |
| Border/background (input) | (P1) | optional field border/fill for input fields |
| Max chars (input) | (P1) | character limit |
| Embed | `embedFonts` | glyph subset registration |

---

## 22.4 Text transform

- Text transforms like any node (Part 04): move/scale/rotate/skew. Scaling text scales the glyphs (vector) — no quality loss.
- **Distort/Envelope** require Break Apart (text → shapes), same rule as symbols (Part 04.6).
- **Flip** mirrors text (useful for labels in mirrored scenes).

---

## 22.5 Text animation

| Technique | How | Use |
|---|---|---|
| **Motion tween text** | text wraps into a symbol automatically (Part 09.1.1); tween position/scale/rotation/alpha | fades, slides, title cards |
| **Per-character animation** | Break Apart once → each **character** becomes its own text block → tween each (stagger with delayed keys) | typewriter, wave-in titles |
| **Morph text** | Break Apart twice → text becomes **vector shapes** → shape tween (Part 09.3) | liquid text morphs |
| **Masked text reveal** | mask layer wipes across the text (Part 21) | wipe-on, spotlight |
| **Blur/glow** | instance filters (Part 11.5) | focus effects |

---

## 22.6 Dynamic text binding (runtime)

- A **dynamic** text block binds to a **variable/expression** (e.g., `score`, `player.name`, `timer.text`). The runtime updates `text` each frame/event.
- Our app's **behavior/event system** (Part 01 §1.12) provides the binding; HTML5 export compiles it to a JS data-binding; input text binds to a form value.
- **Legacy:** Animate's AS3 `TextField` (scripting); TLF (Text Layout Framework) deprecated. Our app: no TLF, a clean binding model instead.

---

## 22.7 Export behavior per type

| Type | HTML5/Web | Image/sequence/video | SVG |
|---|---|---|---|
| Static | glyph outlines or embedded font | rendered to pixels (or vector if exported as SVG) | `<text>` or outlined paths |
| Dynamic | JS-bound text (embedded font) | rendered at current value | current value |
| Input | form input | rendered at current value (static) | current value |

**Rule:** un-embedded fonts on export → warn + offer (a) embed, (b) outline the text to paths (lossless but not editable), or (c) accept system-font fallback.

---

## 22.8 BUILD CHECKPOINT M3 (text slice)

- [ ] Text tool (point + box) with inline editing; three text types.
- [ ] Full style set (family/size/color/alpha/bold/italic/align/letter/line spacing/anti-alias/selectable).
- [ ] Font embedding (glyph subsets) + web fonts + export warnings.
- [ ] Text transform + break-apart hierarchy (chars → shapes).
- [ ] Text animation techniques (tween/per-char/morph/mask).
- [ ] Dynamic text binding; per-type export behavior.

*Next: `23_color.md` — fill, stroke, color picker, swatches, alpha, gradient (linear/radial), custom colors, color replacement.*

---

<!-- ===== FILE: 23_color.md ===== -->

# PART 23 — COLOR
### Fill, stroke, color picker, swatches, alpha, linear/radial gradients, custom colors, color replacement — the complete color system.

---

## 23.0 The color model

- **Fill** = the interior style of a shape (solid / gradient / bitmap).
- **Stroke** = the outline style of a shape (solid; + width/cap/join/dash — Part 05.1).
- Every color = **RGBA** (red, green, blue, **alpha**), editable in **RGB** or **HSB**, entered as **hex**, with an **alpha** channel. Gradients store a list of **stops** (offset + color + alpha).
- Animate's fill/stroke controls live in the **Tools panel (Color section)** + the **Color panel**; swatches live in the **Swatches panel**.

### Color data

```jsonc
"color": { "r":63, "g":169, "b":245, "a":1.0 }                      // solid
"fillStyle": {
  "type":"linear|radial|bitmap|solid",
  "stops": [ { "offset":0, "color":{...} }, { "offset":1, "color":{...} } ],   // gradients
  "transform": { "centerX":0,"centerY":0,"scaleX":1,"scaleY":1,"rotation":0,"focal":0 },
  "bitmapAssetId": null }
```

---

## 23.1 The Color controls (Tools panel)

| Control | Icon concept | Does |
|---|---|---|
| **Stroke color chip** | pencil over a color square | sets the **stroke** color for new/selected strokes |
| **Fill color chip** | bucket over a color square | sets the **fill** color for new/selected fills |
| **Swap** | two arrows | swap current fill ↔ stroke |
| **Black & White** | b/w split square | reset fill=white, stroke=black |
| **No Color** | red slash | set fill/stroke to **none** (e.g., fill-only or stroke-only shapes) |
| **Chip click** | — | opens the **color picker** popover |

**Chip rules:**
- Clicking a chip opens the picker; the **currently selected tool's** default style updates (what new drawings will use).
- With a shape **selected**, changing the chip restyles the selection too.
- **No Color** on fill = the shape is stroke-only; on stroke = fill-only. (A shape can't have *both* none — that'd be invisible.)

---

## 23.2 The Color Picker (popover)

| Control | Does |
|---|---|
| **Hue/Saturation field** (2D box) | click to pick hue + saturation |
| **Brightness slider** | vertical luminance |
| **RGB / HSB numeric fields** | exact entry (0–255 RGB, 0–360° H / 0–100 S/B) |
| **Hex field** | `#RRGGBB` entry |
| **Alpha field (A)** | 0–100% — *[WISH W6]* our app also mirrors alpha as a persistent slider outside the picker |
| **Swatch strip** | quick-pick saved swatches |
| **Eyedropper (in-picker)** | sample any color on screen |

**Space:** store one canonical color internally (RGBA); RGB/HSB/hex are **views** of the same value (round-trip exactly; no drift).

---

## 23.3 Swatches panel

- A grid of saved color chips. Operations:
  - **Add current color** (from the picker).
  - **Delete / rename** swatches; **organize into folders**.
  - **Import/export** swatch sets (our format: JSON; optionally ASE-compatible).
  - **Default palette** (a large pre-built set) + per-document custom sets.
- Swatches are **document-level or app-level** (app-level = available in every document — our app default).

---

## 23.4 Alpha (opacity)

- Every color carries **alpha 0–100%**. Applies to fills, strokes, and (separately) to symbol instances via **color effect** (Part 11.5).
- **Where alpha lives in our UI:** top-level opacity slider next to the color chip (always visible) *[WISH W6]*, plus the A field in the picker.
- **Same-style overlap** (merge model): merged same-style fills do **not** double-darken (Part 05.3.5).

---

## 23.5 Gradients

### 23.5.1 Linear gradient
- Two+ **stops** along a **straight axis**. Each stop = offset (0–1) + color + alpha.
- **Transform** (Gradient Transform — Part 02a T2A.4): center, scale (stretch), rotation of the axis.
- Data: `stops[]` + `transform`.

### 23.5.2 Radial gradient
- Two+ stops from **center** outward. Extra property: **focal point** (offset the center of the inner stops → off-center highlights, fake 3D lighting).
- Transform: center, scaleX/Y (elliptical), rotation, focal.

### 23.5.3 Gradient editing UI
- The Color panel shows a **gradient bar** with draggable **stop handles** (double-click a stop = edit its color; drag off = delete; click empty space = add stop).
- **Gradient Transform tool** edits the on-object transform (Part 02a T2A.4).
- **Lock Fill** (Brush/Bucket) shares one gradient space across strokes (Part 02c).

### 23.5.4 Gradient rendering
- Render gradients on GPU: pass `stops` + transform to the shader/`createLinearGradient`/`createRadialGradient`. Radial focal point maps to the two-circle gradient trick (offset inner circle). Exact fidelity at all scales (gradients scale with the shape).

---

## 23.6 Bitmap fills

- A **bitmap asset** used as a **fill** (tile/stretch a texture inside a shape).
- Controls: **scale/tile** the bitmap within the fill (Gradient Transform corner handles); **Lock Fill** continuity.
- Useful for textured backgrounds, pattern fills, screen tones.

---

## 23.7 Custom colors & color replacement

| Feature | Does |
|---|---|
| **Custom color** | Any picked/edited color (RGB/HSB/hex/alpha) — saved to swatches for reuse. |
| **Color replacement (Find & Replace)** | Edit > Find and Replace → **Colors**: replace all uses of color X with color Y across the document (fills and/or strokes). Our app: scoped (document / scene / selection) + preview. |
| **Adjust color (instance filter)** | Per-instance hue/brightness/contrast adjustment (Part 11.5) — recolor without re-authoring. |
| **Swap fill/stroke** | the swap button (23.1). |
| **Eyedropper** | sample + copy styles (Part 02d T2D.1). |

---

## 23.8 Color interactions with the rest of the app

- **Tweens:** colors tween (motion tween tint/alpha; shape tween fill color). Interpolate in **OKLab** for perceptually even fades (Part 08.2).
- **Lip-sync/expressions:** mouth poses reuse the symbol colors; no per-frame color data needed.
- **Export:** colors are exported as-is (RGBA); alpha preserved in PNG/Web/Video; GIF **quantizes** to 256 colors (Part 28 warning).

---

## 23.9 BUILD CHECKPOINT M2 (color slice)

- [ ] Fill/stroke chips + swap/b&w/no-color; picker (HS field + brightness + RGB/HSB/hex + alpha + swatch strip + in-picker eyedropper).
- [ ] Swatches panel (add/delete/folders/import-export/default palette).
- [ ] Alpha everywhere; no double-darkening on same-style merge.
- [ ] Linear + radial gradients (stops editor + focal point + transform tool); GPU rendering.
- [ ] Bitmap fills (tile/stretch + lock fill).
- [ ] Find & Replace colors; adjust-color instance filter; OKLab tween interpolation.

*Next: `24_align_distribute.md` — align left/center/right/top/middle/bottom, distribute H/V, spacing, stage-relative vs object-relative.*

---

<!-- ===== FILE: 24_align_distribute.md ===== -->

# PART 24 — ALIGN / DISTRIBUTE
### Align left/center/right/top/middle/bottom, distribute horizontal/vertical, spacing, match size, stage-relative vs object-relative alignment.

---

## 24.0 The two alignment spaces

Every align/distribute operation works **relative to one of two spaces** (a toggle in the panel):

| Space | Reference | Use |
|---|---|---|
| **Align to Stage** | The stage rectangle (0,0,w,h) | Center titles, pin elements to edges, layout across the whole frame |
| **Align to Selection** | The **bounding box** of the selected objects (Part 03.4.10) | Align objects to each other |

**Important Animate nuance:** "Align to Stage" means aligning **relative to the stage bounds**; "Align to Selection" means **relative to the selection's union bounding box**. Our app keeps these two plus a third (below).

---

## 24.1 Alignment operations (the 6)

Each computes the selection's bounding box (or the stage) and sets each object's position:

| Operation | Moves objects so their… | Reference axis |
|---|---|---|
| **Align Left** | left edge = reference left | x |
| **Align Center (horizontal)** | center-x = reference center-x | x |
| **Align Right** | right edge = reference right | x |
| **Align Top** | top edge = reference top | y |
| **Align Middle (vertical)** | center-y = reference center-y | y |
| **Align Bottom** | bottom edge = reference bottom | y |

### Data flow (per operation)
```
ref = stage bounds  OR  selection union bounds
for each selected object:
  delta = (target edge position) - (object's current edge position)
  object.transform.x/y += delta
commit = one AlignCommand (undoable)
```

---

## 24.2 Distribute operations

Distribute **spaces objects evenly** between the first and last (extreme) objects.

| Operation | Evenly spaces the objects'… | Along |
|---|---|---|
| **Distribute Left Edges** | left edges | x |
| **Distribute Horizontal Centers** | center-x | x |
| **Distribute Right Edges** | right edges | x |
| **Distribute Top Edges** | top edges | y |
| **Distribute Vertical Centers** | center-y | y |
| **Distribute Bottom Edges** | bottom edges | y |

### Algorithm
```
sort objects by the distributed coordinate (x or y)
total span = last.position - first.position          // extremes stay fixed
gap = total span / (N - 1)
for i in 1..N-2: object[i].position = first.position + gap * i
```
(The first and last objects **do not move** — they define the span.)

---

## 24.3 Spacing (even gaps)

Our app adds (Animate has partial support): **Space Evenly Horizontally / Vertically** — distribute the **gaps between objects** equally (not the centers). Algorithm:

```
totalWidth = Σ object widths
freeSpace = (last.right - first.left) - totalWidth
gap = freeSpace / (N - 1)
place objects left→right with `gap` between them
```
This is what users usually mean by "distribute" (equal visual gaps), and is a common Animate complaint — we provide both center-distribution and gap-distribution.

---

## 24.4 Match size & related

| Operation | Does |
|---|---|
| **Match Width / Height / Both** | resize all selected to match the reference (largest, smallest, or stage) |
| **Match Size (W & H)** | both dimensions |
| **Space buttons** | (covered in 24.3) |

---

## 24.5 Alignment math details

- **Rotated/skewed objects:** alignment uses the **axis-aligned bounding box** (Part 03) — same as Animate. (Our app offers "use rotated bounds" as an option, P2.)
- **Groups/symbols:** align by their bounding box; the group's internal layout is untouched (the group moves as one).
- **Locked/hidden objects** are excluded from the selection and don't affect the bounding box (Part 03.7).
- **Single object + Align to Stage** = snap the object to the stage edge/center (very common).

---

## 24.6 BUILD CHECKPOINT M2 (align slice)

- [ ] Align panel with the 6 align + 6 distribute + match-size + spacing buttons.
- [ ] Stage vs selection space toggle; third "align to first-selected" option (our addition).
- [ ] Even-gap distribution (24.3) in addition to center distribution.
- [ ] Correct behavior for rotated objects, groups, locked/hidden exclusion.
- [ ] One undoable command per operation.

*Next: `25_scenes.md` — scene creation, duplication, ordering, duration, navigation, scene-level timeline/camera/audio.*

---

<!-- ===== FILE: 25_scenes.md ===== -->

# PART 25 — SCENES
### Scene creation, duplication, ordering, duration, navigation, scene-level timeline/camera/audio — plus multi-scene tabs (a user-requested improvement).

---

## 25.0 What a scene is

A **scene** = a named, self-contained **main timeline** within a document. A document = an **ordered list of scenes** sharing one **Library** (Part 12).

```
document
 ├─ scene "intro"   (timeline: layers × 240 frames)
 ├─ scene "act1"    (timeline: layers × 480 frames)
 └─ scene "credits" (timeline: layers × 120 frames)
```

- Playback plays scenes **in list order** (intro → act1 → credits) unless a behavior jumps to a named scene/frame (Part 01 §1.12).
- Scenes share **all Library assets** (a symbol made in one scene is usable in every scene).
- Use scenes for: shots, chapters, game levels, distinct acts. (Many modern productions instead use **one scene + movie-clip symbols** — both must work.)

---

## 25.1 Scene operations

| Operation | Trigger | Data change | Rules |
|---|---|---|---|
| **Create** | Scene panel + / Insert > Scene | append a scene with a default timeline | named "Scene N"; becomes active. |
| **Duplicate** | Scene panel → Duplicate | deep-copy the scene's timeline (+ optionally its used assets) | assets stay shared; timeline copied. |
| **Delete** | trash | remove the scene | prompt; other scenes unaffected; shared assets stay (use-count recomputed). |
| **Rename** | double-click | scene name | display-only; referenced by ID. |
| **Reorder** | drag up/down | scene order | changes playback order. |
| **Navigate** | click / Edit bar / View > Go To | switch the active scene (which timeline is shown/edited) | stage + timeline re-bind to the new scene. |

---

## 25.2 Scene properties

- **Duration** = the scene's timeline extent (max frame across layers) — edited by extending/shortening frames (Part 07).
- **Background color** — inherited from the document (Part 01 §1.7) by default; our app allows **per-scene background** override (P1).
- **Scene-level settings** — frame rate is **document-level** (all scenes share fps); our app allows per-scene fps override (P2, with a conversion warning).

---

## 25.3 Scene-level timeline / camera / audio

Each scene's timeline is **independent**:

| Subsystem | Per-scene behavior |
|---|---|
| **Timeline** | Own layer stack + frames. The Library is shared; frames are not. |
| **Camera** | **One camera per scene** (the camera layer lives on the scene's timeline — Part 16). Different scenes = different camera moves. |
| **Audio** | Scene audio lives on the scene's audio layers (Part 17). A sound that must span scenes is placed on each scene (or on a top-level "project audio" track — our app's addition, P1: a **master audio track** above scenes for global music). |
| **Onion skin** | Applies within the scene (doesn't ghost across scene boundaries). |

---

## 25.4 Scene navigation (authoring UX)

- **Scene panel** (Window > Scene): the list; click to switch.
- **Edit bar** (above stage): `Scene ▸ symbol ▸ …` breadcrumb (Part 11.3) — clicking the scene name switches scenes; "Back" exits symbol edit.
- **View > Go To**: First / Previous / Next / Last scene.
- **Playback** (`Enter`): plays the **active scene**; **Test** (`Ctrl+Enter`) plays **all scenes in order**.

---

## 25.5 Multi-scene tabs *[WISH W12]* (our improvement)

Users explicitly asked: "I wish I could have multiple scenes open like in Animate." Our app:

- **Tabs for scenes** (like document tabs): open multiple scenes side-by-side in tabs; switch without losing context.
- **Split view** (P2): view two scenes simultaneously (reference one while animating another).
- Scene tabs are **view state** (not saved in the project) — the scene list itself is the data.

---

## 25.6 Data model

```jsonc
"document": {
  "settings": {...},                 // Part 01 §1.7
  "scenes": [
    { "id":"sc1", "name":"intro",  "timeline": { "layers":[...], "duration": 240 } },
    { "id":"sc2", "name":"act1",   "timeline": {...} }
  ],
  "sceneOrder": ["sc1","sc2"],
  "library": [...],                  // shared across scenes
  "masterAudioTrack": null           // optional project-wide audio (our addition)
}
```

---

## 25.7 BUILD CHECKPOINT M5 (scene slice)

- [ ] Scene CRUD + reorder + rename + navigate (panel + edit bar + Go To).
- [ ] Per-scene timeline/camera/audio; shared library with use-count.
- [ ] Playback: active scene (Enter) vs all-scenes-in-order (Test).
- [ ] Scene tabs + split view *[WISH W12]*.
- [ ] Optional per-scene background + master audio track.

*Next: `26_properties_panel.md` — the contextual inspector: object/shape/text/symbol/frame/document/camera/audio property schemas.*

---

<!-- ===== FILE: 26_properties_panel.md ===== -->

# PART 26 — PROPERTIES PANEL
### The contextual inspector: the complete property schema for every context — document, shape, drawing object, group, symbol instance, text, frame/tween, camera, audio, bone, warp asset. Plus the context-binding mechanism.

---

## 26.0 The mechanism (context → schema)

The Properties panel **re-binds** to the current context and renders that context's **property schema**. The binding precedence (Part 01 §1.6):

1. **Tool options** (a tool is active and nothing is selected on stage) → tool schema.
2. **Stage selection** (shape / drawing object / group / instance / text / bone / warp pins / camera / multiple) → object schema.
3. **Selected frame(s)** (timeline) → frame/tween schema.
4. **Document** (nothing selected) → document schema.

### Implementation contract

```ts
interface PropertySchema {
  sections: PropertySection[];    // grouped controls
}
interface PropertySection {
  id: string; title: string;
  fields: PropertyField[];        // each: {id, label, type:'number|text|color|select|slider|checkbox|gradient|curve', value, get, set, validate?, min?, max?, unit?}
}
```

Every selectable object type exposes `getPropertySchema(selection)`; the panel renders it and **writes back via Commands** (Part 36 — no direct writes). Fields subscribe to `document:changed` to stay live.

---

## 26.1 Document properties (nothing selected)

| Section | Fields |
|---|---|
| **Document** | Width (px), Height (px), Ruler units, Frame rate (fps), Background color (+ alpha for canvas transparency), Auto-save interval |
| **Platform** | Document type (HTML5 Canvas / WebGL / Video-only / our app types) |
| **Publish** | Publish profile, target folder |
| **Info** | Title, description, author |

---

## 26.2 Shape properties (raw shape / drawing object selected)

| Section | Fields |
|---|---|
| **Position & Size** | X, Y (registration/transform point toggle), W, H (px), constrain-proportions lock |
| **Fill** | Fill color chip + alpha, Fill type (solid/linear/radial/bitmap), gradient stops editor, bitmap asset + tile scale |
| **Stroke** | Stroke color chip + alpha, Stroke width (px), Stroke style (solid/dash/brush), cap (round/square/butt), join (round/miter/bevel + miter limit), width profile selector + save |
| **Shape** | Fill rule (nonzero/even-odd), Corner radius (primitives), Start/end angle + inner radius (oval primitive), Sides/points (polystar) |
| **Display** | (drawing object) — convert to symbol hint, break apart |

---

## 26.3 Group properties

| Section | Fields |
|---|---|
| **Position & Size** | X, Y, W, H |
| **Group** | Type badge ("Group"), Edit-in-place hint, Break Apart button |

---

## 26.4 Symbol instance properties

| Section | Fields |
|---|---|
| **Instance** | Symbol name + Swap button, Instance type (Graphic/Movie Clip/Button), Instance name (scripting handle) |
| **Position & Size** | X, Y, W, H |
| **Color Effect** | Mode (None / Brightness / Tint / Alpha / Advanced) + its value(s) — *[WISH W6]* Alpha shown as a top-level slider |
| **Display** | Blending mode (Normal/Multiply/Screen/Overlay…), (visible) |
| **Filters** | Add filter list (Drop Shadow / Blur / Glow / Bevel / Gradient Glow / Gradient Bevel / Adjust Color) + per-filter params; per-filter enable |
| **Looping** (graphic only) | Loop mode (Loop / Play Once / Single Frame), First frame + **Frame Picker** button (Part 18.5) |
| **Tracking** (button only) | Button tracking mode (as button / as menu item) |
| **Lip Syncing** (graphic, when audio present) | Auto lip-sync button (Part 18.3) |

---

## 26.5 Text properties

| Section | Fields |
|---|---|
| **Text** | Text type (Static/Dynamic/Input), text content (edit in place) |
| **Character** | Font family, size, color + alpha, bold/italic/underline, letter spacing, auto-kern |
| **Paragraph** | Align (L/C/R/justify), line spacing, indent/margins |
| **Behavior** | Selectable, anti-alias (normal/device), embed fonts (glyph subset dialog), border/background (input), max chars (input) |
| **Position & Size** | X, Y, W, H (box width = wrap) |

---

## 26.6 Frame / tween properties (frame(s) selected)

| Context | Sections |
|---|---|
| **Keyframe (frame-by-frame)** | Label (name + type: name/comment/anchor), Sound (asset + sync Event/Start/Stop/Stream + loop + trim + effect), Actions (behavior list) |
| **Classic tween span** | Ease slider + Edit custom ease, Rotate (Auto/CW/CCW + turns), Orient to path, Snap, Sync (graphic), Scale (check), Sound |
| **Shape tween span** | Ease slider + custom ease, Blend (distributive/angular), Shape hints (list), Sound |
| **Motion tween span** | Ease (per-property → opens graph editor), Rotation orientation, View Keyframes submenu (which property keys shown) |
| **Pose span** | Type (Author-time / Runtime — legacy), bone list |

---

## 26.7 Camera properties

| Section | Fields |
|---|---|
| **Camera** | X, Y, Z position; Zoom (%); Rotation (°) — each with a reset button |
| **Color Effects** | Tint (color + amount), Filters |
| **Reset** | Reset pan / zoom / rotation individually |

---

## 26.8 Audio properties (audio keyframe selected)

| Section | Fields |
|---|---|
| **Sound** | Sound asset (dropdown from Library), Sync (Event/Start/Stop/Stream), Loop count, Effect (channel fades), Edit trim (in/out), Volume + envelope editor (our app) |

---

## 26.9 Bone properties (bone selected — Part 14)

| Section | Fields |
|---|---|
| **Bone** | Length, Joint: rotation (enable + min/max), translation (x/y enable), Joint speed, Spring (strength/damping), Parent/Child/Next/Previous navigation buttons |

---

## 26.10 Warp asset properties (warp pins selected — T2D.11)

| Section | Fields |
|---|---|
| **Warp** | Mode (Rigid/Flexible), Envelope toggle, Add/Remove handle, Reset warp, Pin position (x/y) |

---

## 26.11 Multiple / mixed selection

- Shows only **common** fields: X, Y, W, H (Part 03.4.10). Type-specific sections hidden.

---

## 26.12 BUILD CHECKPOINT M5 (properties slice)

- [ ] Context-binding precedence implemented; panel re-renders on selection/tool/frame/document changes.
- [ ] All schemas above render + two-way bind (edit on stage → panel updates; edit in panel → stage updates via Commands).
- [ ] Numeric fields commit on Enter/blur with validation; color/alpha/gradient controls live.
- [ ] Swap, Frame Picker, Lip Syncing, filters, easing controls reachable from the panel.

*Next: `27_import.md` — supported import categories (images, vector, audio, video, animation assets, libraries) and what happens to each imported asset.*

---

<!-- ===== FILE: 27_import.md ===== -->

# PART 27 — IMPORT
### Supported import categories (images, vector, audio, video, animation assets, libraries) and exactly what happens to each imported asset.

---

## 27.0 Import entry points

| Entry | Does |
|---|---|
| **File > Import > Import to Stage** | Import + **place an instance** at the current frame (current layer). |
| **File > Import > Import to Library** | Import into the Library only (no placement). |
| **File > Import > Open External Library** | Open another project's Library **read-only** to drag assets in (Part 12.2.14). |
| **Drag & drop** | Drop a file onto the stage (import + place) or onto the Library (import only). |
| **Paste** | Paste an image from the clipboard (import as bitmap). |

All imports land in the **Library** as assets (Part 12); "to Stage" additionally places an instance at the current frame.

---

## 27.1 Images (raster)

| Format | What happens |
|---|---|
| **PNG** | Imported as a **bitmap asset** (alpha preserved). Placed as a bitmap instance. |
| **JPEG** | Bitmap asset (no alpha). |
| **GIF** | Bitmap asset (first frame by default; **animated GIF**: our app imports frames as a **sequence** or a movie clip — P1; Animate imports the first frame). |
| **WebP** (our app) | Bitmap asset (alpha + animation support). |
| **PSD** | **Per-layer import** option: each layer → a separate bitmap (named by layer); flattened option → one bitmap. (This powers the character-part import workflow — Part 13.1.) |
| **AI** (Adobe Illustrator, via import) | **Vector** import: paths/artboards → shapes (or per-layer). See 27.2. |

**What a bitmap asset is:** `{kind:'bitmap', width, height, dataRef}` — referenced, not embedded pixel-data-in-JSON (the pixels live in the project's `assets/` folder; the model stores a ref — Part 33).

**What you can do with an imported bitmap:** place it; use it as a **fill** (Part 23.6); **Break Apart** → editable region (Lasso/Magic Wand); **Trace Bitmap** → vectorize; **Swap Bitmap** → replace with another asset.

---

## 27.2 Vector graphics

| Format | What happens |
|---|---|
| **SVG** | Paths → **shapes** (fills + strokes → the shape model, Part 06.9); text → text nodes (or paths); gradients → gradient fills. |
| **AI** | Artboards/layers → shapes (or per-layer). |
| **PDF** (our app, P2) | Pages → shapes. |

**Vector import rules:**
- The importer converts foreign path models (quadratics, arcs, `d` attributes) to our **cubic-Bézier** canonical form (Part 05.1.8).
- Fill rules, gradients, and transforms are mapped to our model; unsupported effects are **flattened or flagged** (an import report lists conversions).
- Imported vectors become **drawing objects** (safe default) or raw shapes (user option).

---

## 27.3 Audio

| Format | What happens |
|---|---|
| **MP3** | Sound asset (Part 17). |
| **WAV / AIFF** | Sound asset (uncompressed or compressed on publish). |
| **OGG / FLAC / M4A** (our app) | Sound asset. |

Imported audio → Library sound asset → placed on audio layers (Part 17.2).

---

## 27.4 Video

| Format | What happens |
|---|---|
| **MP4 (H.264)** | Options: **embed** (convert to a video asset played in a component — legacy) or **link** (reference external). Our app: import the **audio track** separately + place video as a **video asset** on a video layer (P1). |
| **FLV** (legacy) | Embedded video (legacy). |

**Frame extraction** (our app, P1): import a video's frames as a **PNG sequence** (for rotoscoping reference — place on a guide layer).

---

## 27.5 Animation assets (sprite sheets & sequences)

| Asset | What happens |
|---|---|
| **Sprite sheet** (PNG + JSON/XML atlas) | Import as **frames**: each cell → a frame in a new **movie clip symbol** (named). Used for game art. |
| **Image sequence** (PNG_001..PNG_N) | Import as a **frame-by-frame sequence** (one keyframe per image, on twos/ones per option). |
| **Animated GIF** (our app) | Import as a movie clip (frames) — 27.1. |

---

## 27.6 Libraries (reuse across projects)

| Operation | Does |
|---|---|
| **Open External Library** | Open another project's Library read-only → drag symbols/assets into the current document (they're **copied** in). |
| **Symbol reuse** | A dragged symbol becomes a local copy (or a shared reference — our app offers "link" mode, P2). |

---

## 27.7 Import report (our app)

Every import emits an **import report** (Output panel): what was created (asset names/IDs), what was **converted/flattened** (unsupported effects), and warnings (missing fonts, downscaled images). This makes import non-mysterious — a direct usability win.

---

## 27.8 BUILD CHECKPOINT M3 (import slice)

- [ ] Import to Stage / to Library / external library / drag-drop / paste.
- [ ] Raster: PNG/JPEG/GIF/WebP (+ PSD per-layer); bitmap asset + placement.
- [ ] Vector: SVG/AI → shapes with cubic-Bézier conversion + import report.
- [ ] Audio: MP3/WAV/OGG/FLAC → sound assets.
- [ ] Video: embed/link + audio extraction + frame extraction.
- [ ] Sprite sheets + image sequences → movie clips / frame-by-frame.

*Next: `28_export_publish.md` — image, PNG sequence, GIF, video, HTML5, web, audio, project file — with resolution/FPS/compression/transparency/audio/quality/dimensions.*

---

<!-- ===== FILE: 28_export_publish.md ===== -->

# PART 28 — EXPORT / PUBLISH
### Every export/publish option: image, PNG/JPEG sequence, animated GIF, video, HTML5/Web, audio, project file — with resolution, FPS, compression, transparency, audio, quality, dimensions.

---

## 28.0 The two concepts

- **Export** = one-shot output of the current frame/scene (image, GIF, sequence, video, audio).
- **Publish** = the configured **pipeline** that produces platform output (HTML5/Web bundle, WebGL, etc.) from the whole document, driven by **Publish Settings** (a saved profile).

**Universal rule:** every exporter renders the document by **sampling the timeline** (the same evaluator as playback — Part 01 §1.16), so authoring = output. The camera (Part 16) applies identically in all exporters.

---

## 28.1 Image export

| Setting | Meaning |
|---|---|
| **Format** | PNG (lossless + alpha), JPEG (lossy, no alpha), SVG (vector), WebP (our app). |
| **Resolution / Dimensions** | Match Movie (stage size) or custom W×H; **Scale** (1×/2×/4× — supersampling for crisp output). |
| **Transparency** | PNG alpha preserved (stage background = transparent if "no color" — Part 01 §1.7). |
| **Quality** | JPEG 0–100 (compression). |
| **Which frame** | Current frame (or a named frame — Animate exports the `#Static`-labeled frame; our app: current frame or chosen frame). |

---

## 28.2 PNG / JPEG sequence

- Exports **every frame** (or a range: `#First`–`#Last` labeled frames in Animate; our app: a frame-range field) as `name_0001.png`, `name_0002.png`, …
- **Settings:** format, scale/resolution, transparency (PNG), quality (JPEG), **FPS** (stored in a sidecar for later video mux).
- Use: video editing pipelines, sprite sources, frame-by-frame delivery.

---

## 28.3 Animated GIF

| Setting | Meaning |
|---|---|
| **Playback** | Static (single frame) or Animated. |
| **Loop** | Loop continuously / N times. |
| **Dimensions** | Match Movie or custom; scale. |
| **FPS** | Frame rate of the GIF (often 12/24/30). |
| **Colors** | Palette size (256 max; **optimize colors** removes unused); **dither** (ordered/diffusion/none); **interlace**. |
| **Transparency** | Optional transparent background. |
| **Range** | All frames or `#First`–`#Last`. |
| **Audio** | **None — GIF is silent** (warn the user). |

---

## 28.4 Video export

| Setting | Meaning |
|---|---|
| **Format** | MP4 (H.264) — and our app: WebM (VP9). |
| **Resolution** | Stage size or custom; scale. |
| **FPS** | Output frame rate (default = document fps). |
| **Quality / bitrate** | CRF/bitrate for the encoder. |
| **Audio** | Include the audio track; **codec** (AAC), **bitrate** (kbps). Audio is muxed **sample-exact per frame** (Part 17.6). |
| **Range** | Whole document / scene / frame range. |
| **Motion blur** (our app, P2) | Frame-blend for smoother motion. |

---

## 28.5 HTML5 Canvas publish (the web target)

Produces an **HTML + JavaScript + asset folder** bundle:

| Setting | Meaning |
|---|---|
| **Output** | Output name + folder; **include JavaScript in HTML** vs external `.js`; **overwrite HTML** toggle. |
| **Preloader** | Default or custom GIF preloader. |
| **Assets** | Export images/assets to a subfolder (or root); **spritesheet** combining (format PNG/JPEG/both, quality 8/24/32-bit, size constraints). |
| **Texture export** | Export vector animation as **textures** (rasterized) for performance. |
| **Transparency** | Stage color "no color" → transparent canvas. |
| **Loop** | Loop playback on/off. |
| **Audio** | Audio asset settings (bitrate, format). |
| **Libs** | Hosted vs local JS libraries (our app: self-contained local bundle). |

---

## 28.6 Web / other targets

| Target | What it produces |
|---|---|
| **WebGL/glTF** (Animate's newer target) | 3D-compatible export (for Animate's WebGL doc type). Our app: optional glTF/WebGL bundle (P2). |
| **SWF (legacy)** | Flash player format — **historical only**; not implemented in our app (Flash is dead; note in docs). |
| **OAM (legacy)** | Widget package — historical. |
| **AIR (legacy)** | Desktop/mobile app package — historical. |

---

## 28.7 Audio-only export

- Export the project's **audio tracks** as WAV/MP3 (dialogue stems, music) — our app (P1).

---

## 28.8 Project file (save)

- The **project file** (our format: JSON + `assets/` folder — Part 33) is the lossless master. Exports (PNG/GIF/MP4/HTML) are **derived**; the project preserves everything (layers, symbols, tweens, audio refs, camera).
- **Autosave + crash recovery** *[WISH W11]*: periodic autosave to a `.autosave` slot + recovery prompt on launch.

---

## 28.9 Publish profiles

- A **publish profile** = a named, saved bundle of all publish settings (e.g., "web-720p", "video-4k"). Switch profiles to re-target without reconfiguring. (Animate has Publish Profiles; our app extends with per-target profiles.)

---

## 28.10 The universal settings matrix

| Setting | Image | Sequence | GIF | Video | HTML5 |
|---|---|---|---|---|---|
| Resolution | ● | ● | ● | ● | ● (canvas size) |
| Scale | ● | ● | ● | ● | — |
| FPS | — | ● (sidecar) | ● | ● | ● |
| Compression/quality | ● | ● | ● (palette/dither) | ● (bitrate) | ● (textures) |
| Transparency | ● (PNG/SVG) | ● (PNG) | ● | — | ● |
| Audio | — | — | — | ● | ● |
| Loop | — | — | ● | — | ● |
| Range | frame | range | range | range | whole doc |

---

## 28.11 BUILD CHECKPOINT M3 (export slice)

- [ ] Image export (PNG/JPEG/SVG/WebP) with scale + transparency + quality.
- [ ] PNG/JPEG sequence with range + sidecar fps.
- [ ] Animated GIF (loop/palette/dither/transparency/range) + silent-audio warning.
- [ ] Video (MP4/WebM) with sample-exact audio mux + bitrate/quality.
- [ ] HTML5 bundle (JS + assets + spritesheets + preloader + transparency + loop + audio).
- [ ] Audio-only export; project save + autosave/recovery; publish profiles.

*Next: `29_shortcuts.md` — the complete keyboard reference grouped by navigation/drawing/selection/transform/timeline/playback/frames/layers/symbols/tools/editing/view.*

---

<!-- ===== FILE: 29_shortcuts.md ===== -->

# PART 29 — KEYBOARD SHORTCUTS
### The complete keyboard reference, grouped by Navigation / Drawing / Selection / Transform / Timeline / Playback / Frames / Layers / Symbols / Tools / Editing / View. (Win = Ctrl/Alt; Mac = Cmd/Option.)

> **Design rule *[WISH W8]*:** keep the Flash/Animate muscle-memory shortcuts (V/A/Q/F5/F6/F7, etc.) as defaults — the community explicitly asked for the same shortcuts. Our app ships these defaults + a fully **rebindable** shortcut editor (Edit > Keyboard Shortcuts). Differences from Animate are marked **[ours]**.

---

## 29.1 Tools

| Tool | Shortcut |
|---|---|
| Selection | V |
| Subselection | A |
| Free Transform | Q |
| Gradient Transform | F |
| Lasso (Polygon/Magic Wand modes) | L |
| Pen | P |
| Text | T |
| Line | N |
| Rectangle (+Oval/PolyStar/Primitives flyout) | R |
| Oval | O |
| Pencil | Shift+Y (older: Y) **[ours: P is Pen, keep Shift+Y]** |
| Paint Brush | Y |
| Brush | B |
| Eraser | E |
| Width | U |
| Eyedropper | I |
| Paint Bucket | K |
| Ink Bottle | S |
| Bone | M |
| Camera | C |
| Hand | H |
| Zoom | Z |
| Stage Rotate | Shift+H |
| Time Scrubber | Shift+Alt+H |
| Temporarily Hand (from any tool) | hold Space |
| Temporarily Selection (from some tools) | hold Ctrl/Cmd |

---

## 29.2 File / Edit

| Action | Win | Mac |
|---|---|---|
| New | Ctrl+N | Cmd+N |
| Open | Ctrl+O | Cmd+O |
| Close | Ctrl+W | Cmd+W |
| Save | Ctrl+S | Cmd+S |
| Save As | Ctrl+Shift+S | Cmd+Shift+S |
| Import to Stage | Ctrl+R | Cmd+R |
| Import to Library | Ctrl+I | Cmd+I |
| Export | Ctrl+Shift+R | Cmd+Shift+R |
| Publish | Shift+Alt+F12 | Shift+Option+F12 |
| Publish Settings | Ctrl+Shift+F12 | Cmd+Shift+F12 |
| Print | Ctrl+P | Cmd+P |
| Quit | Ctrl+Q | Cmd+Q |
| Undo | Ctrl+Z | Cmd+Z |
| Redo | Ctrl+Shift+Z (or Ctrl+Y) | Cmd+Shift+Z |
| Cut | Ctrl+X | Cmd+X |
| Copy | Ctrl+C | Cmd+C |
| Paste in Center | Ctrl+V | Cmd+V |
| Paste in Place | Ctrl+Shift+V | Cmd+Shift+V |
| Duplicate | Ctrl+D | Cmd+D |
| Select All | Ctrl+A | Cmd+A |
| Deselect All | Ctrl+Shift+A | Cmd+Shift+A |
| Find & Replace | Ctrl+F | Cmd+F |
| Preferences | Ctrl+U | Cmd+U |
| Keyboard Shortcuts (editor) | Ctrl+Shift+Alt+K | Cmd+Shift+Option+K |

---

## 29.3 Selection (Part 03)

| Action | Shortcut |
|---|---|
| Add to / remove from selection (toggle) | Shift+click |
| Marquee select | drag on empty |
| Contact-sensitive toggle | preference (no default key) |
| Select frame content by clicking keyframe | click (toggle, Part 03.3.6) |
| Hide Edges (suppress selection highlight) | Ctrl+Shift+E |

---

## 29.4 Transform (Part 04)

| Action | Shortcut |
|---|---|
| Constrain (scale proportion / 45° rotate / axis skew) | hold Shift |
| Rotate/scale about opposite corner / center | hold Alt/Option |
| Move pivot | drag white circle |
| Re-center pivot | double-click pivot |
| Rotate 90° CW | Ctrl+Shift+9 |
| Rotate 90° CCW | Ctrl+Shift+7 |
| Flip Horizontal / Vertical | (Modify > Transform menu) |
| Scale & Rotate (numeric dialog) | Ctrl+Alt+S |
| Remove Transform | Ctrl+Shift+Z (Animate legacy; **[ours: reassigned — use menu]**) |
| Nudge 1 px | Arrow keys |
| Nudge 10 px | Shift+Arrow |
| Move Ahead / Behind | Ctrl+↑ / Ctrl+↓ |
| Bring to Front / Send to Back | Ctrl+Shift+↑ / Ctrl+Shift+↓ |
| Group / Ungroup | Ctrl+G / Ctrl+Shift+G |

---

## 29.5 Timeline & Frames (Part 07/08)

| Action | Shortcut |
|---|---|
| Insert Frame (extend) | F5 |
| Insert Keyframe (copy prev) | F6 |
| Insert Blank Keyframe | F7 |
| Delete Frame | Shift+F5 |
| Clear Keyframe | Shift+F6 |
| Convert to Symbol | F8 |
| New Symbol | Ctrl+F8 |
| Insert Frame / Keyframe / Blank Keyframe (menu) | via Insert menu |

---

## 29.6 Playback (transport)

| Action | Shortcut |
|---|---|
| Play / Stop | Enter |
| Rewind | Ctrl+Alt+R |
| Go to First / Last | Home / End |
| Step Forward / Backward One Frame | `.` / `,` |
| Next / Previous Keyframe | Ctrl+. / Ctrl+, (assignable) |
| Test (preview in player) | Ctrl+Enter |
| Loop playback / Mute | (Control menu) |
| Scrub | drag playhead |

---

## 29.7 Layers (Part 20)

| Action | Shortcut |
|---|---|
| Insert Layer | (timeline + button; assignable) |
| Insert Layer Folder | (assignable) |
| Delete Layer | (timeline trash) |
| Distribute to Layers | (Modify > Timeline) |
| Lock/Unlock All | (context menu) |

---

## 29.8 Symbols & Editing (Part 11)

| Action | Shortcut |
|---|---|
| Convert to Symbol | F8 |
| Edit Symbols (cycle edit depth) | Ctrl+E |
| Break Apart | Ctrl+B |
| Edit in Place | double-click instance |
| Group / Ungroup | Ctrl+G / Ctrl+Shift+G |

---

## 29.9 View (Part 01 §1.2.3)

| Action | Win | Mac |
|---|---|---|
| Zoom In / Out (stage) | Ctrl+= / Ctrl+- | Cmd+= / Cmd+- |
| Zoom 100% | Ctrl+1 | Cmd+1 |
| Fit in Window | Ctrl+0 | Cmd+0 |
| Show/Hide Rulers | Ctrl+Shift+Alt+R | Cmd+Shift+Option+R |
| Show/Hide Grid | Ctrl+' | Cmd+' |
| Show/Hide Guides | Ctrl+; | Cmd+; |
| Snap to Objects | Ctrl+Shift+/ | Cmd+Shift+/ |
| Show/Hide Work Area (pasteboard) | Ctrl+Shift+W | Cmd+Shift+W |
| Show/Hide Timeline | (assignable; **[ours: Ctrl+Alt+T]**) | — |
| Show/Hide Library | Ctrl+L | Cmd+L |
| Show/Hide Align | Ctrl+K | Cmd+K |
| Preview Mode (outline/fast/full) | (View menu) | — |
| Document settings | Ctrl+J | Cmd+J |

---

## 29.10 Text (Part 22)

| Action | Shortcut |
|---|---|
| Modify Font | Ctrl+T |
| Modify Paragraph | Ctrl+Shift+T |
| Narrower / Wider letter spacing (kerning) | Ctrl+← / Ctrl+→ |

---

## 29.11 Our additions (new shortcuts)

| Action | Shortcut |
|---|---|
| Onion skin toggle | O |
| Onion outlines | Shift+O |
| Edit Multiple Frames | Alt+O |
| Expose same drawing (cel) | D (then click) **[WISH W1]** |
| Play nested movie clips (preview) | Ctrl+Shift+P |
| Graph editor toggle | Ctrl+Shift+G (rebindable) |

---

## 29.12 BUILD CHECKPOINT M5 (shortcut slice)

- [ ] Full shortcut table implemented as a data file (not hard-coded), defaulting to the above.
- [ ] Shortcut editor (rebind, conflict detection, reset to default, import/export).
- [ ] Keyboard shortcuts work on desktop; on mobile they map to toolbars/buttons (Part 31).

*Next: `30_context_menus.md` — right-click menus for stage, object, shape, symbol, timeline, layer, frame, library asset, audio, scene — every command explained.*

---

<!-- ===== FILE: 30_context_menus.md ===== -->

# PART 30 — CONTEXT MENUS
### Right-click (long-press) menus for stage, object, shape, symbol, timeline, layer, frame, library asset, audio, scene — every command explained.

> Every context menu is **context-scoped**: it shows only commands valid for the target. Implementation: a `ContextMenuBuilder` maps `(hitTarget, selection, tool, clipboard, doc-state)` → an ordered command list; each command is enabled/disabled by predicates. On mobile, long-press opens the same menu (Part 31).

---

## 30.1 Stage (empty area / pasteboard)

| Command | Does |
|---|---|
| Paste | Insert clipboard content at the click point. |
| Paste in Place | Insert at the same coordinates as the source. |
| Select All / Deselect All | Selection (Part 03.3.5). |
| New Symbol / Convert to Symbol | (if relevant) create a symbol. |
| Document Properties | Open document settings (Part 01 §1.7). |
| Grid / Guides / Rulers | Toggle view aids (Part 01 §1.4.4). |
| Arrange (front/back) | (if objects exist) z-order. |
| Timeline actions | Insert frame/keyframe (when a timeline context exists). |

---

## 30.2 Object (generic — groups, drawing objects, bitmaps)

| Command | Does |
|---|---|
| Cut / Copy / Paste | Clipboard ops (Part 36). |
| Duplicate | Copy + offset. |
| Convert to Symbol (F8) | Wrap into a symbol (Part 11.2). |
| Break Apart (Ctrl+B) | Flatten one level (Part 06.8). |
| Edit / Edit in Place | Drill into group/object (Part 03.4). |
| Arrange | Bring to Front / Forward / Backward / Send to Back / Lock / Unlock. |
| Transform | Flip H/V, Rotate 90°, Scale & Rotate, Remove Transform (Part 04). |
| Export PNG… | Export the object as an image (Part 28). |

---

## 30.3 Shape (raw shape / drawing object)

Everything in 30.2 **plus** shape-specific:

| Command | Does |
|---|---|
| Convert Lines to Fills | Stroke → fill outline (Part 05.1.13). |
| Expand Fill / Soften Fill Edges | Morphological ops (Part 06.8). |
| Smooth / Straighten / Optimize | Path cleanup (Part 06.4.3). |
| Add Shape Hint | Add a morph hint (Part 09.3.2) — only in a shape tween. |
| Combine Objects | Union / Intersect / Punch / Crop (Part 06.5). |
| Trace Bitmap | (if bitmap) vectorize (Part 27.1). |

---

## 30.4 Symbol instance

| Command | Does |
|---|---|
| Edit / Edit in Place / Edit Symbol | Enter edit modes (Part 11.3). |
| Swap Symbol | Replace with another symbol, keep transform (Part 11.6). |
| Duplicate Symbol | Clone the definition for this instance (Part 11.6). |
| Break Apart | Detach from symbol → raw content (Part 11.7). |
| Convert to Symbol | Wrap again (nested symbol). |
| Set Instance Name | (scripting handle). |
| Arrange / Transform / Export PNG | as 30.2. |

---

## 30.5 Timeline (header / empty grid)

| Command | Does |
|---|---|
| Insert Frame / Keyframe / Blank Keyframe | F5/F6/F7 (Part 07.4). |
| Insert Scene | Add a scene (Part 25). |
| Timeline preferences | Row height, cell colors, onion defaults. |

---

## 30.6 Layer (right-click a layer row)

| Command | Does |
|---|---|
| Insert Layer / Folder | Add above. |
| Delete Layer | Remove (prompt if dependents). |
| Duplicate Layer | Deep copy. |
| Rename | Inline rename. |
| Layer Properties | Type, outline color, height (Part 20.3). |
| Mask / Unmask | Convert mask type (Part 21.1). |
| Show All / Lock Others / Hide Others | Batch state (Part 20.2). |
| Distribute to Layers | (selection) split objects to own layers (Part 07.4.13). |
| Copy / Paste Layer | Cross-timeline layer copy. |

---

## 30.7 Frame (right-click a frame cell)

| Command | Does |
|---|---|
| Insert Frame / Keyframe / Blank Keyframe | Part 07.4. |
| Delete Frame / Clear Keyframe | Part 07.4. |
| Remove Frames | Delete + leave gap (Part 07.4.6). |
| Copy / Cut / Paste Frames | Frame clipboard (Part 07.4.7). |
| Reverse Frames | Reorder keyframes (Part 07.4.10). |
| Convert to Keyframes / Blank Keyframes | Bake (Part 07.4.12). |
| Create Motion / Classic / Shape Tween | Tween spans (Part 09). |
| Insert Pose | (pose layer) Part 14.6. |
| Sync (graphic) | sync nested graphic loops (Part 07.4.14). |
| Actions | (frame) open behavior editor (Part 01 §1.12). |

---

## 30.8 Library asset (right-click in Library)

| Command | Does |
|---|---|
| Edit | (symbol) open edit mode. |
| Duplicate | Clone the asset. |
| Rename | Inline rename. |
| Delete | Remove (prompt if in use — Part 12.2.5). |
| Select Unused Items | Find deletable assets. |
| Properties | Metadata (type, linkage legacy, export options). |
| Export | Save the asset to disk. |
| Update from file | (bitmap) re-import a newer file (Part 12.2.13). |
| Move to folder / New Folder | Organize (Part 12.2.6). |

---

## 30.9 Audio (audio keyframe / waveform)

| Command | Does |
|---|---|
| Sound Properties | Sync / loop / trim / effect (Part 17.3). |
| Edit Envelope | Volume curve (Part 17.4). |
| Stop Sound | Insert a Sync=Stop keyframe (Part 17.3). |
| Remove Sound | Detach from the keyframe. |
| Export Audio | Save the sound asset to disk. |

---

## 30.10 Scene (Scene panel)

| Command | Does |
|---|---|
| Add Scene | Append. |
| Duplicate Scene | Deep copy timeline. |
| Rename | Inline. |
| Delete | Remove (prompt). |
| Reorder | (drag in panel). |

---

## 30.11 BUILD CHECKPOINT M5 (context-menu slice)

- [ ] ContextMenuBuilder with enable/disable predicates; every menu above implemented.
- [ ] Long-press opens the same menu on touch (Part 31).
- [ ] Menu commands reuse the same Commands as toolbar/menu (single source of behavior).

*Next: `31_mobile_translation.md` — desktop interaction → mobile equivalent for every feature (drag, right-click, shortcuts, timeline scrub, multi-select, transform handles, …).*

---

<!-- ===== FILE: 31_mobile_translation.md ===== -->

# PART 31 — MOBILE TRANSLATION
### Desktop interaction → mobile equivalent, for every feature. The design principle: **one codebase, two input adapters** (pointer events unified; only the gesture mapping differs).

---

## 31.0 The architecture principle

The tool/command layer (Parts 02–06) is **input-agnostic**: it consumes normalized **gestures** (tap, drag, pinch, twist, long-press, double-tap), not raw events. Two adapters translate:

```
Desktop input (mouse + keyboard + stylus)  ─┐
                                            ├─▶ GestureBus ─▶ Tools/Commands (unchanged)
Touch input (finger + stylus + pen)        ─┘
```

- **Desktop** = Windows / macOS / **Linux** (mouse, Wacom/tablet stylus, keyboard).
- **Mobile** = Android / iOS / ChromeOS tablets (+ phones, degraded), stylus (Apple Pencil / S-Pen / USI).
- **Web** = the same touch adapter (touch laptops, iPads in browser).
- **The canvas is the app** — no OS-native file pickers required for editing; use web/file APIs for open/save.

---

## 31.1 The master mapping table (desktop → mobile)

| # | Desktop interaction | Mobile equivalent |
|---|---|---|
| 1 | Mouse drag | **Finger drag** (with finger-offset loupe when precision needed) |
| 2 | Right-click | **Long-press** (≈500 ms) → context menu (Part 30) |
| 3 | Keyboard shortcut | **Toolbar / action button** (persistent bottom toolbar) + optional on-screen modifier keys |
| 4 | Shift+click (toggle select) | **Select mode** toggle (each tap toggles membership) or long-press to add |
| 5 | Marquee select (drag empty) | **One-finger drag on empty** (two-finger = pan, so no conflict) |
| 6 | Timeline drag (playhead) | **Touch scrub** (drag playhead / stage Time Scrubber) |
| 7 | Transform handles (Free Transform) | **Touch handles** (≥44 px, snap, pinch/twist for scale/rotate) |
| 8 | Hover (cursor feedback, tooltips) | **Tap-and-hold preview** + persistent hint bar (no hover exists) |
| 9 | Modifier keys (Shift/Alt/Ctrl) | **Modifier buttons** in the toolbar (Shift=constrain, Alt=duplicate/center) or multi-finger gestures |
| 10 | Mouse wheel zoom | **Pinch zoom**; double-tap toggle |
| 11 | Middle/space drag pan | **Two-finger drag** |
| 12 | Right-click drag (context drag) | **Long-press then drag** |
| 13 | Keyboard text entry | **System keyboard** (IME-aware) |
| 14 | Undo (Ctrl+Z) | **Two-finger tap** or Undo button |
| 15 | Precise pixel nudges (arrows) | **Nudge buttons** + numeric input (Transform/Info panels) |
| 16 | Hover-preview a tool effect | **Live preview on drag** (the effect shows during the gesture, not before) |
| 17 | Double-click (drill into group/symbol) | **Double-tap** |
| 18 | Double-click pivot (re-center) | **Double-tap pivot** (or a "center pivot" button) |
| 19 | Marquee zoom (Z tool drag) | **Pinch** or double-tap-to-fit |
| 20 | Stylus pressure/tilt | **Stylus pressure/tilt** (Apple Pencil/S-Pen via pointer events) |
| 21 | File dialogs (open/save/export) | **System file/share sheet** (web: file API / download) |
| 22 | Drag asset from Library to stage | **Tap asset → "Place" button → tap stage** (or drag with a held finger) |

---

## 31.2 Per-feature mobile specifics

### 31.2.1 Selection (Part 03)
- Tap = select; long-press = add-to-selection or context menu (configurable).
- **Select mode** (toolbar toggle): tap toggles membership — the Shift replacement.
- Marquee = one-finger drag on empty; lasso = the Lasso tool with finger trace.
- Anchor selection (Subselection): tap path → anchors appear; drag with **loupe**; long-press anchor → add/delete/convert menu.

### 31.2.2 Drawing (Part 05)
- Finger drawing gets **stronger smoothing** (jitter); stylus gets pressure/tilt.
- **Brush size** = always-visible slider (also gesture: drag up/down with two fingers while drawing — P2).
- Pen anchors: tap to place; tap-drag for handles; **double-tap to close**; long-press anchor = ops.
- The **finger-offset loupe**: a magnified bubble above the finger (offset by ~80 px) showing what's under it — required for anchors, handles, pivots, bone joints.

### 31.2.3 Transform (Part 04)
- Handles ≥44 px; corner drag = scale; **pinch = scale**, **twist = rotate**; long-press corner = rotate mode.
- Pivot drag via loupe; numeric Transform panel is the precision path.
- Distort/Envelope: drag corner/mesh points with loupe.

### 31.2.4 Timeline (Part 07)
- Scrub = drag playhead (or drag the stage — Time Scrubber).
- Frame ops = **long-press a frame** → menu (insert/delete/copy/paste/clear/tween).
- Layer ops = long-press the layer row → menu.
- **Ruler pinch** = zoom the frame ruler; two-finger horizontal = scroll frames.
- Onion skin = toolbar toggles.

### 31.2.5 Rigging (Part 14) & camera (Part 16)
- Bone: drag joint-to-joint to add; drag bone to pose; constraints via numeric panel.
- Camera: one-finger pan, pinch zoom, twist rotate (matches the tool exactly).

### 31.2.6 Panels
- Panels collapse to a **bottom sheet / side drawer** on small screens; the **Properties panel** becomes a swipeable bottom sheet.
- The **Library** becomes a grid browser with search + tap-to-place.

---

## 31.3 The persistent mobile toolbar (the shortcut replacement)

A bottom toolbar with the most-used actions (configurable):

`Undo | Redo | Select-mode | Constrain(Shift) | Alt | Onion | Play | Add Keyframe | Delete | Color | Brush size`

Plus a **contextual** section that mirrors the active tool's Options (so no keyboard is ever required).

---

## 31.4 Feature-parity checklist (what MUST work on touch)

| Feature | Mobile interaction | Status |
|---|---|---|
| Select/move/marquee/toggle | tap / drag / select-mode | required |
| Free transform (all modes) | handles + pinch/twist | required |
| Draw (all tools) | finger/stylus + smoothing | required |
| Anchor/curve editing | loupe + long-press menu | required |
| Timeline (all frame/layer ops) | long-press menus + scrub | required |
| Symbols/library/swap | tap-to-place, long-press edit | required |
| Tweens/easing | frame menu + properties sheet | required |
| Bones/IK, warp, camera | gestures + numeric panels | required |
| Audio/lip-sync | waveform scrub + menus | required |
| Export/publish | share sheet / save | required |
| Undo/redo | two-finger tap / buttons | required |

---

## 31.5 BUILD CHECKPOINT M5 (mobile slice)

- [ ] GestureBus with the 8 gestures; two input adapters (mouse/kbd, touch).
- [ ] The master mapping table implemented end-to-end.
- [ ] Finger-offset loupe for anchors/handles/pivots/bones.
- [ ] Persistent mobile toolbar (undo/redo/select-mode/constrain/alt/onion/play/keyframe/delete).
- [ ] Bottom-sheet Properties + grid Library; long-press context menus everywhere.
- [ ] Feature-parity checklist passes on a tablet.

*Next: `32_architecture.md` — the original module architecture (renderer, vector/raster engines, scene graph, timeline/tween/rig/IK/symbol/audio/lipsync/camera/text engines, asset library, serializer, undo, export, input engines) with responsibilities, inputs/outputs, data structures, dependencies, events, state, performance.*

---

<!-- ===== FILE: 32_architecture.md ===== -->

# PART 32 — ORIGINAL APP ARCHITECTURE
### The module architecture for the new application. For each module: responsibilities, inputs, outputs, data structures, dependencies, events, state, performance considerations.

---

## 32.0 The system in one diagram (data flow)

```
                        ┌──────────────────────────────┐
 Desktop Input Engine ─▶│                              │
 Mobile  Input Engine ─▶│      Tool/Gesture Layer       │──▶ Commands ─▶ Undo/Redo
                        │   (Parts 02–06 tool specs)    │
                        └──────────────┬───────────────┘
                                       │ mutate
                        ┌──────────────▼───────────────┐
                        │      DOCUMENT MODEL (Part 33) │◀── Project Serializer
                        │  scenes/layers/frames/symbols │      (save/load/autosave)
                        └──────┬────────────────────┬───┘
                               │ evaluate(time)     │ changed
                    ┌──────────▼─────┐   ┌──────────▼──────────┐
                    │  Scene Graph    │   │  Event Bus          │──▶ Panels (Properties,
                    │  (render tree)  │   │  (context/selection │      Timeline, Library…)
                    └──────────┬─────┘   │   /document:changed)│
                               │         └─────────────────────┘
             ┌─────────────────┼──────────────────┐
      ┌──────▼──────┐  ┌───────▼──────┐  ┌────────▼────────┐
      │Vector Engine│  │ Raster Engine │  │  Text Engine    │
      └──────┬──────┘  └───────┬──────┘  └────────┬────────┘
             └─────────────────┼──────────────────┘
                       ┌───────▼───────┐
                       │ Canvas Renderer│──▶ WebGL/Canvas2D/Skia
                       └───────────────┘

Side engines (plug into the model): Tween, Rig/IK, Symbol, Audio, LipSync, Camera, Export.
```

**Golden rules:**
1. **Single source of truth** = the Document Model (Part 33). Every module reads/writes only through it (via Commands).
2. **All mutations are Commands** (undoable). Panels never write directly.
3. **Evaluation is pure**: `evaluate(model, time) → renderTree` — same path for editing and export (WYSIWYG, Part 01 §1.16).
4. **Everything cross-platform**: no OS-specific code above the Renderer/Input/Audio boundaries.

---

## 32.1 Canvas Renderer

- **Responsibilities:** rasterize the render tree to screen (or offscreen for export); apply view transform + camera (Part 16); draw selection overlays; manage render caches; hit-test support.
- **Inputs:** render tree (from Scene Graph), view state (zoom/pan/rotate), selection overlay state.
- **Outputs:** pixels to the canvas; hit-test results.
- **Data structures:** `RenderNode` tree (mirrors the scene graph, one per drawable), per-layer `LayerCache` (offscreen bitmap), `DrawCommand` list (sortable, cacheable).
- **Dependencies:** Vector Engine (tessellate paths), Raster Engine (bitmap blits), Text Engine (glyph atlas), Camera Engine (matrix).
- **Events:** emits `frameRendered`, `hitTest(query)`.
- **State:** caches + dirty flags; `dirtyRegions[]` per layer.
- **Performance:** **dirty-region rendering** (only changed layers re-rasterize); layer caches (a static layer renders once); GPU transforms for camera/zoom (no re-rasterize on pan/zoom — just re-composite); WebGL for gradients/filters/mesh warp; fallback Canvas2D. Target: **60 fps playback** on integrated GPUs; **interactive** editing on low-end.

---

## 32.2 Vector Engine

- **Responsibilities:** path representation (cubic Béziers), stroke outline generation (width profiles, caps, joins), fill tessellation (winding rules), **boolean ops** (union/intersect/subtract — used by merge mode, eraser, combine — Part 06), path simplification (smooth/straighten/optimize), shape-tween anchor correspondence (Part 09.3).
- **Inputs:** path data (anchors+handles), styles, boolean requests.
- **Outputs:** tessellated triangles/outline polygons for the renderer; modified paths.
- **Data structures:** `Path` (anchors, handles, closed), `Region` (anchor-index loops), `StrokeOutline` (offset polygon), `Mesh` (triangulation).
- **Dependencies:** none (pure geometry); used by Renderer + shape tools.
- **State:** stateless (pure functions) + a tessellation cache keyed by path hash.
- **Performance:** polygon clipping (Greiner–Hormann / Vatti) for booleans; ear-clipping/Earcut for triangulation; RDP for simplification; cache tessellations. Booleans run on a **worker** for big shapes.

---

## 32.3 Raster Engine

- **Responsibilities:** bitmap assets (decode, cache, mipmap), bitmap fills (tile/stretch), **pixel editing** (Magic Wand flood-fill, eraser on broken-apart bitmaps, color replace), bitmap filters (blur/glow via convolution), bitmap pencil (raster drawing — *[WISH W10]*).
- **Inputs:** bitmap buffers + pixel ops.
- **Outputs:** edited buffers, region masks (for Lasso/Wand selection).
- **Data structures:** `BitmapBuffer` (RGBA), `RegionMask` (alpha channel), mipmap chain.
- **Dependencies:** Renderer (blits).
- **State:** decoded cache, edited buffers (dirty).
- **Performance:** ops on GPU where possible (filters); flood-fill via BFS on a downsampled grid first (fast reject), then precise.

---

## 32.4 Scene Graph

- **Responsibilities:** build the render tree from the document at a given time; maintain the display list (z-order); resolve nesting (Part 11.8); apply masks (Part 21) and camera (Part 16); provide hit-testing (Part 03.2).
- **Inputs:** document model + time.
- **Outputs:** `RenderNode` tree + hit-test results.
- **Data structures:** `SceneNode` (transform + children + content ref), spatial index (R-tree per layer).
- **Dependencies:** Document model; calls Vector/Raster/Text for content.
- **State:** rebuilt per frame (cheap — it's references, not pixels) + cached spatial index.
- **Performance:** spatial index for O(log n) hit-tests; skip hidden/locked layers early.

---

## 32.5 Layer System

- **Responsibilities:** layer list, types (Part 20), folders, parenting (local-space transforms), visibility/lock/outline, z-depth, mask grouping.
- **Inputs:** layer ops (create/delete/reorder/…) from the timeline UI.
- **Outputs:** updated `layers[]` in the model.
- **Data structures:** `Layer` (Part 20 data model).
- **Dependencies:** Document model.
- **Events:** `layer:changed`.
- **Performance:** layer list ops are O(layers) — trivial.

---

## 32.6 Timeline Engine

- **Responsibilities:** the clock — playhead, frame ruler, sparse frame storage + the **hold rule** (Part 07.3), frame ops (insert/delete/copy/paste/reverse/convert — Part 07.4), playback ticking (requestAnimationFrame), scrubbing.
- **Inputs:** frame ops, play/scrub commands.
- **Outputs:** `evaluate(time)` calls to the Scene Graph; timeline UI state.
- **Data structures:** `Timeline` (layers + sparse frames), `PlayheadState`.
- **Dependencies:** Document model, Audio Engine (scrub audio), Scene Graph.
- **Events:** `playhead:moved`, `timeline:changed`.
- **Performance:** sparse storage (no per-frame objects); playback tick = one evaluate + dirty render.

---

## 32.7 Keyframe Engine

- **Responsibilities:** keyframe records (both families — Part 08), interpolation for all property types (numbers, rotation flags, colors in OKLab, scale log-lerp), keyframe move/delete/duplicate semantics (Part 08.4).
- **Inputs:** keyframe ops.
- **Outputs:** interpolated values; keyframe records.
- **Data structures:** `Keyframe`, per-property key arrays.
- **Dependencies:** Tween Engine (spans), Document model.
- **State:** pure interpolators + cached segment lookups.
- **Performance:** O(log n) key lookup; interpolation is arithmetic — negligible.

---

## 32.8 Tween Engine

- **Responsibilities:** tween spans (motion/classic/shape — Part 09), per-property keyframes, **easing** (Penner functions + custom Bézier + presets — Part 09.4), motion-path derivation (Part 10), motion presets.
- **Inputs:** tween creation/edits.
- **Outputs:** tween spans + evaluated property values.
- **Data structures:** `TweenSpan`, `PropertyCurve`, `EaseFunction`.
- **Dependencies:** Keyframe Engine, Vector Engine (shape morph).
- **Performance:** precompute arc-length tables for constant-speed paths (Part 10.2).

---

## 32.9 Rig Engine

- **Responsibilities:** character rigs (Part 13) — part hierarchy, pivots, poses, pose library, rig layers; **stable local-space math + stable IDs** *[WISH W2]* so copy/paste/re-parent can't corrupt poses.
- **Inputs:** rig edits (nest, pivot, pose).
- **Outputs:** rig data (Part 13.10).
- **Data structures:** `Rig`, `Pose`, `Part`.
- **Dependencies:** Document model, Symbol Engine.

---

## 32.10 IK Engine

- **Responsibilities:** bone graph + solvers (2-bone analytic, CCD, FABRIK — Part 14.4), constraints (rotation/translation/spring/joint-speed), pose interpolation (Part 08.3.8), bind weighting (IK shapes).
- **Inputs:** bone ops, drag-target.
- **Outputs:** solved joint angles → poses.
- **Data structures:** `Armature`, `Bone`, `Constraint`.
- **Dependencies:** Rig Engine, Timeline (pose layers).
- **Performance:** FABRIK converges in a few iterations for ≤20 bones; solvers run only at author-time (playback interpolates — Part 14.4).

---

## 32.11 Symbol Engine

- **Responsibilities:** symbol definitions + instances (Part 11), nesting/playback rules (graphic sync vs movie-clip free — Part 11.8), swap/duplicate, break-apart, edit modes.
- **Inputs:** symbol ops.
- **Outputs:** symbol/instance records.
- **Data structures:** `Symbol`, `Instance` (Part 11.10).
- **Dependencies:** Library, Scene Graph (nesting evaluation).

---

## 32.12 Audio Engine

- **Responsibilities:** audio decode + waveform, sync modes (Event/Start/Stop/Stream — Part 17.3), loop, trim, volume envelope, scrubbing, export mux (sample-exact — Part 17.6).
- **Inputs:** audio assets + keyframe attachments.
- **Outputs:** decoded buffers, played audio, exported tracks.
- **Data structures:** `SoundAsset`, `SoundAttachment`.
- **Dependencies:** Timeline (keyframe timing), Export Engine.
- **Performance:** decode on worker; Stream sync drops *animation* frames (not audio) per Part 17.

---

## 32.13 Lip Sync Engine

- **Responsibilities:** VAD (silence detection), phoneme recognition + confidence, viseme mapping (12-viseme dictionary — Part 18.1), frame assignment, phoneme-lane editing, batch/multi-character.
- **Inputs:** audio layer + mouth symbol + viseme map.
- **Outputs:** mouth-layer keyframes (instance first-frame) + phoneme-lane data.
- **Data structures:** `LipSyncResult` (Part 18.7).
- **Dependencies:** Audio Engine, Symbol Engine (Frame Picker), Timeline.
- **Performance:** recognition runs once per sync (offline); editable after.

---

## 32.14 Camera Engine

- **Responsibilities:** camera object + camera layer keyframes (Part 16), matrix (pan/zoom/rotate/z-depth parallax), attach-to-camera, presets, log-space zoom interpolation.
- **Inputs:** camera ops.
- **Outputs:** camera matrices per layer.
- **Data structures:** `Camera`, `CameraKeyframe`.
- **Dependencies:** Layer System (z-depth), Renderer.

---

## 32.15 Text Engine

- **Responsibilities:** text nodes (static/dynamic/input — Part 22), glyph atlas + font metrics, wrapping, embedding, runtime binding, export glyph outlining.
- **Inputs:** text edits.
- **Outputs:** rendered glyphs; metrics.
- **Data structures:** `TextNode`, `FontAtlas`, `FontMetrics`.
- **Dependencies:** Renderer (glyph blit), Export Engine.
- **Performance:** glyph atlas (one texture per font/size); cache text layout.

---

## 32.16 Asset Library

- **Responsibilities:** asset database (Part 12) — symbols/bitmaps/sounds/brushes, folders, search, preview, use-counts, import.
- **Inputs:** asset ops.
- **Outputs:** `library[]` + asset files.
- **Data structures:** `Asset` (Part 12 data model).
- **Dependencies:** Import (Part 27), Serializer.
- **Events:** `library:changed`.

---

## 32.17 Project Serializer

- **Responsibilities:** save/load the project (JSON + `assets/` folder — Part 33), **autosave + crash recovery** *[WISH W11]*, version migration, partial save (worker, non-blocking).
- **Inputs:** document model.
- **Outputs:** project file(s).
- **Data structures:** `ProjectFile` (Part 33).
- **Performance:** incremental save (dirty assets only); compress large documents; save on worker to keep UI responsive.

---

## 32.18 Undo/Redo Engine

- **Responsibilities:** command stack (Part 36) — record Commands with before/after, selection restore, coalescing (typing, slider drags), history panel.
- **Inputs:** Commands from tools/panels.
- **Outputs:** undo/redo of model state.
- **Data structures:** `Command` {do, undo, label, prevSelection}.
- **Performance:** store **diffs/IDs**, not full-model snapshots (memory-safe on long sessions).

---

## 32.19 Export Engine

- **Responsibilities:** all exporters (Part 28) — image/sequence/GIF/video/HTML5/audio — sampling the timeline identically to playback.
- **Inputs:** export settings + document.
- **Outputs:** files.
- **Dependencies:** Renderer (offscreen), Audio Engine (mux), Camera Engine.
- **Performance:** frame-parallel rendering (worker pool) for sequences/video.

---

## 32.20 Desktop Input Engine & Mobile Input Engine

- **Responsibilities:** translate raw input → **gestures** (Part 31) → tool events; keyboard → shortcut map (Part 29); stylus pressure/tilt.
- **Inputs:** mouse/keyboard/stylus (desktop); touch/pen (mobile).
- **Outputs:** `Gesture` events.
- **Data structures:** `Gesture` {type, points, modifiers, pressure, tilt}.
- **Dependencies:** Tool layer.
- **Performance:** pointer events at device rate; no per-event allocation churn.

---

## 32.21 BUILD CHECKPOINT M6 (architecture slice)

- [ ] All 21 modules stubbed with their interfaces; the golden rules (single model, commands-only, pure evaluate) enforced by the code structure.
- [ ] Renderer hits 60 fps playback with layer caches + dirty regions.
- [ ] Vector booleans + stroke outlines + tessellation working (they back merge mode + eraser).
- [ ] Undo/redo, autosave/recovery, cross-platform input adapters functional.

*Next: `33_data_model.md` — the JSON schemas for Project, Scene, Layer, Character, Body Part, Bone, Symbol, Instance, Frame, Keyframe, Tween, Pose, Audio, Mouth Shape, Camera, Asset, Text, Effect.*

---

<!-- ===== FILE: 33_data_model.md ===== -->

# PART 33 — DATA MODEL (JSON SCHEMAS)
### The complete JSON schemas for the original app: Project, Scene, Layer, Character, Body Part, Bone, Symbol, Instance, Frame, Keyframe, Tween, Pose, Audio, Mouth Shape, Camera, Asset, Text, Effect. This is the single source of truth every other part references.

> Conventions: `id` = UUID (stable, rename-safe). `dataRef` = relative path inside the project's `assets/` folder (binary data is NOT inlined in JSON). All fields documented with type + purpose. Schemas shown as JSON-with-comments (strip comments in the real validator).

---

## 33.1 Project

```jsonc
{
  "$schema": "app/project.schema.json",
  "formatVersion": 1,                     // migration version
  "meta": { "title":"My Project", "author":"", "createdAt":"...", "modifiedAt":"..." },
  "settings": {                            // Part 01 §1.7
    "width": 1920, "height": 1080, "units":"px",
    "fps": 24, "backgroundColor": "#ffffff", "backgroundAlpha": 1
  },
  "scenes": [ Scene ],                     // §33.2, in order
  "library": [ Asset ],                    // §33.17 (shared across scenes)
  "brushes": [ Brush ],                    // art/pattern brushes
  "masterAudioTrack": null,                // optional global audio
  "preferences": { "contactSensitive": true, "autoKey": true }
}
```

---

## 33.2 Scene

```jsonc
{ "id":"sc1", "name":"intro", "timeline": Timeline, "backgroundOverride": null }
// Timeline = { "layers":[ Layer ], "duration": 240 }   // duration = max extent (derived)
```

---

## 33.3 Layer

```jsonc
{
  "id":"L3", "name":"arm_R", "type":"normal",     // normal|folder|mask|masked|guide|motionGuide|pose|tween|camera|audio
  "visible":true, "locked":false, "outline":false, "outlineColor":"#ff0000",
  "parentId": null,                    // folder parent (hierarchy) — Part 20.4
  "transformParentId": null,           // layer parenting (transform inheritance) — Part 20.5
  "zDepth": 0, "attachedToCamera": false,          // Part 16
  "maskMode": "clip",                  // 'clip'|'alpha' (Part 21.5), when type==='mask'
  "frames": [ Frame ],                 // sparse — §33.8
  "height": 18
}
```

---

## 33.4 Character

```jsonc
{ "id":"char_hero", "rootSymbolId":"character", "name":"Hero",
  "parts":[ BodyPart ], "rigs":[ Rig ], "poses":[ Pose ], "clips":[ Clip ] }
// Clip = { "id":"walkCycle", "symbolId":"walkCycle", "duration":24, "loop":true }
```

---

## 33.5 Body Part

```jsonc
{ "id":"head", "symbolId":"ch_head", "parentId":null,
  "pivot": { "x":20, "y":8 },           // joint position in the part's local space
  "zOrder": 3 }
```

---

## 33.6 Bone (Armature)

```jsonc
"armature": {
  "bones": [
    { "id":"b0", "parentId":null, "childId":"b1",
      "length":60, "rotation":0, "translationX":0, "translationY":0,
      "minRot":-10, "maxRot":130, "rotationLocked":false,
      "xEnabled":false, "yEnabled":false,
      "jointSpeed":100, "spring": { "strength":0, "damping":0 } | null }
  ],
  "bindings": [
    { "boneId":"b0", "targetNodeId":"armUpper_R" }            // symbol armature
    // or { "boneId":"b0", "controlPoints":[3,4,5] }          // IK shape
  ]
}
```

---

## 33.7 Symbol & Instance

```jsonc
// Library symbol (definition)
{ "type":"symbol", "id":"arm", "name":"arm", "symbolType":"graphic|movieClip|button",
  "registrationPoint": { "x":0, "y":0 },
  "timeline": Timeline }

// Instance (placed on any timeline)
{ "type":"symbolInstance", "symbolId":"arm",
  "transform": Transform,                          // §33.16
  "colorEffect": { "mode":"none|brightness|tint|alpha|advanced", "value": { } },
  "filters": [ { "type":"dropShadow|blur|glow|...", "params":{...} } ],
  "loop": { "mode":"loop|playOnce|singleFrame", "firstFrame":1 },   // graphic only
  "instanceName": null }
```

---

## 33.8 Frame (sparse — only keyframes & spans are stored)

```jsonc
// whole-frame keyframe (frame-by-frame / classic endpoints)
{ "type":"keyframe", "content":[ nodeIds ], "label":null, "actions":[],
  "sound": SoundAttachment | null }

// blank keyframe
{ "type":"blankKeyframe" }

// motion tween span (on a tween layer)
{ "type":"tween", "kind":"motion", "targetId":"n123", "start":1, "duration":60,
  "properties": {                                   // per-property keyframes
     "x":        [ {frame:1, value:0}, {frame:61, value:320} ],
     "rotation": [ {frame:1, value:0}, {frame:61, value:360, orientation:"CW", rotations:1} ]
  } }

// classic / shape tween span
{ "type":"classicTween"|"shapeTween", "start":1, "end":30, "ease":0,
  "customEase":[{t:0,y:0},{t:1,y:1}], "shapeHints":[{startAnchor:0, endAnchor:2}] }

// IK pose
{ "type":"pose", "pose": { "boneStates":[ { "boneId":"b0", "rotation":0.4, "translationX":0, "translationY":0 } ] } }
```

---

## 33.9 Keyframe (property keyframe)

```jsonc
{ "frame": 10, "property": "x|y|scaleX|scaleY|rotation|skewX|skewY|alpha|tint|...",
  "value": 320, "ease": null,          // null = linear; else {fn:'easeOut', ...}
  "orientation": null, "rotations": 0 }   // rotation only
```

---

## 33.10 Tween (motion preset — reusable)

```jsonc
{ "id":"preset_fadeUp", "name":"Fade Up", "kind":"motion",
  "properties": { "alpha":[ {frame:0,value:0},{frame:24,value:1} ],
                  "y":    [ {frame:0,value:40},{frame:24,value:0} ] } }
```

---

## 33.11 Pose (rig pose — reusable)

```jsonc
{ "id":"walk_contact", "name":"Walk Contact",
  "parts":[ { "partId":"armUpper_R", "transform":Transform } ],
  "bones":[ { "boneId":"b0", "rotation":0.2 } ] }
```

---

## 33.12 Audio

```jsonc
// asset
{ "type":"sound", "id":"s_voice01", "name":"voice01", "durationMs":4200,
  "sampleRate":44100, "channels":1, "dataRef":"assets/voice01.mp3" }

// keyframe attachment
{ "assetId":"s_voice01", "sync":"stream|event|start|stop", "loop":0,
  "trimStartMs":0, "trimEndMs":4200, "volume":1.0,
  "envelope":[ { "t":0, "v":1 }, { "t":1, "v":0.8 } ] }
```

---

## 33.13 Mouth Shape (viseme)

```jsonc
// A mouth symbol = a graphic symbol; each frame = one mouth pose, labeled:
"mouthPoses": [
  { "frame":1, "viseme":"A" }, { "frame":2, "viseme":"B/M" }, { "frame":3, "viseme":"C/D" },
  { "frame":4, "viseme":"E" }, { "frame":5, "viseme":"F/V" }, { "frame":6, "viseme":"L/TH" },
  { "frame":7, "viseme":"O" }, { "frame":8, "viseme":"U" }, { "frame":9, "viseme":"W/Q" },
  { "frame":10, "viseme":"rest" }
]
// lip-sync result
"lipSync": {
  "mouthSymbolId":"mouth", "audioAssetId":"voice01", "audioLayerId":"L_audio",
  "visemeMap": { "A":1, "B/M":2, ... },
  "result": [ { "viseme":"O", "startFrame":12, "endFrame":14, "confidence":0.93 } ],
  "leadMs": 0, "blend": false }
```

---

## 33.14 Camera

```jsonc
"camera": { "enabled":true, "x":0, "y":0, "z":0, "zoom":1.0, "rotation":0,
            "tint":null, "filters":[] }
// camera keyframe = a Frame on the camera layer: { "type":"keyframe", "camera":{...} }
```

---

## 33.15 Asset (Library entry)

```jsonc
{ "id":"bmp_01", "name":"hero.png", "kind":"bitmap|sound|video|symbol|brush|component",
  "folderId":null, "order":3,
  // kind-specific:
  "width":512, "height":512, "dataRef":"assets/hero.png",      // bitmap
  "durationMs":4200, "sampleRate":44100,                       // sound
  "symbolType":"graphic", "timeline": Timeline,                 // symbol
  "brushDef": { "mode":"art|pattern", "artRef":"...", "spacing":0, "cornerTile":"flank" } }
```

---

## 33.16 Transform (shared component — Part 04)

```jsonc
{ "x":0, "y":0, "scaleX":1, "scaleY":1, "rotation":0,
  "skewX":0, "skewY":0, "pivotX":0, "pivotY":0 }
```

---

## 33.17 Text

```jsonc
{ "type":"text", "text":"Hello", "textType":"static|dynamic|input",
  "style": { "fontFamily":"Inter", "fontSize":24, "color":"#000000", "alpha":1,
             "bold":false, "italic":false, "underline":false,
             "align":"left", "letterSpacing":0, "lineSpacing":1.2 },
  "box": { "width":null, "height":null, "autoSize":"width" },
  "embedFonts":[], "antiAlias":"normal", "selectable":true, "binding":null }
```

---

## 33.18 Effect (filters / color effects)

```jsonc
// instance color effect
{ "mode":"tint", "color":"#ff0000", "amount":40 }              // amount = %
{ "mode":"alpha", "value":60 }                                  // 0-100
{ "mode":"brightness", "value":-20 }

// filter
{ "type":"dropShadow", "blurX":8, "blurY":8, "distance":5, "color":"#000", "alpha":60, "angle":45 }
{ "type":"glow", "blur":10, "color":"#fff", "strength":2, "inner":false }
{ "type":"adjustColor", "hue":0, "saturation":0, "brightness":0, "contrast":0 }
```

---

## 33.19 Shape (the geometry — Part 06.9, reproduced for completeness)

```jsonc
{ "id":"n123", "type":"shape|drawingObject|rectPrimitive|ellipsePrimitive|polyStar|group",
  "transform": Transform, "fillRule":"nonzero",
  "path": { "anchors":[ { "x":0,"y":0,"h1x":-10,"h1y":0,"h2x":10,"h2y":0,"smooth":true } ], "closed":true },
  "fills":[ { "region":[0,1,2,3],
              "style":{ "type":"solid|linearGradient|radialGradient|bitmap",
                        "color":"#3fa9f5","alpha":1,
                        "stops":[{ "offset":0,"color":"#f00","alpha":1 }],
                        "transform":{ "centerX":0,"centerY":0,"scaleX":1,"scaleY":1,"rotation":0,"focal":0 },
                        "bitmapAssetId":null } } ],
  "strokes":[ { "path":{...},"closed":false,
                "style":{ "color":"#000","alpha":1,"width":2,"cap":"round","join":"miter","miterLimit":4,
                          "dash":null,"brushAssetId":null },
                "widthProfile":[ { "t":0,"wL":2,"wR":2 } ] } ],
  "params": null, "children": null }
```

---

## 33.20 BUILD CHECKPOINT M6 (data slice)

- [ ] All schemas in one JSON Schema set (`formatVersion` + validator).
- [ ] Serializer round-trips every schema exactly (save → load → identical model).
- [ ] `dataRef` indirection for binaries; `assets/` folder packaged with the project.
- [ ] Migration function for `formatVersion` bumps.

*Next: `34_ui_button_spec.md` — the master button table (name, icon concept, panel, purpose, action, required state, shortcut, mobile equivalent, desktop equivalent, dependencies, tooltip, error state).*

---

<!-- ===== FILE: 34_ui_button_spec.md ===== -->

# PART 34 — UI BUTTON SPECIFICATION
### The master table: every button — name, icon concept, panel, purpose, action, required state, shortcut, mobile equivalent, desktop equivalent, dependencies, tooltip, error state. Grouped by panel. (Icon concepts are *original* glyphs, never Adobe's art.)

> Column meanings: **Required state** = when the button is enabled; **Dependencies** = what must exist for it to work; **Error state** = what happens / what's shown when it can't act.

---

## 34.1 Tools panel (Part 01 §1.3)

| Button | Icon concept | Panel | Purpose | Action | Required state | Shortcut | Mobile equiv. | Desktop equiv. | Dependencies | Tooltip | Error state |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Select | solid arrow | Tools | select/move/reshape | activate Selection tool | always | V | toolbar button | V | hit-test engine | "Select and move objects" | locked layer → click does nothing + hint |
| Subselect | hollow arrow | Tools | edit anchors/handles | activate | always | A | button | A | path model | "Edit points and handles" | no path → anchors don't show |
| Free Transform | box + handles | Tools | move/scale/rotate/skew | activate | selection exists | Q | button | Q | selection | "Transform selection" | no selection → disabled |
| Gradient Transform | gradient square | Tools | edit gradient/bitmap fill | activate | shape w/ gradient selected | F | button | F | gradient fill | "Edit gradient" | solid fill → disabled |
| Lasso | rope loop | Tools | freeform select | activate | always | L | button | L | selection | "Freeform select" | — |
| Pen | pen nib | Tools | draw Bézier paths | activate | editable layer | P | button | P | vector engine | "Draw paths" | locked/tween layer → disabled + reason |
| Text | letter T | Tools | create/edit text | activate | editable layer | T | button | T | text engine | "Add text" | locked layer → disabled |
| Line | diagonal line | Tools | draw straight stroke | activate | editable layer | N | button | N | vector engine | "Draw line" | locked layer → disabled |
| Rectangle | square | Tools | draw rectangle | activate | editable layer | R | button | R | vector engine | "Draw rectangle" | locked layer → disabled |
| Oval | ellipse | Tools | draw oval | activate | editable layer | O | button | O | vector engine | "Draw oval" | locked layer → disabled |
| PolyStar | polygon | Tools | draw polygon/star | activate | editable layer | — | button | — | vector engine | "Draw polygon/star" | locked layer → disabled |
| Pencil | pencil | Tools | freehand stroke | activate | editable layer | Shift+Y | button | Shift+Y | smoothing | "Draw freehand line" | locked layer → disabled |
| Brush | paintbrush | Tools | paint fills | activate | editable layer | B | button | B | raster/vector fill | "Paint with brush" | locked layer → disabled |
| Paint Brush | pattern brush | Tools | art/pattern strokes | activate | editable layer | Y | button | Y | brush library | "Draw brush stroke" | no brush selected → prompt to pick |
| Eraser | eraser | Tools | erase shapes | activate | editable layer | E | button | E | boolean engine | "Erase" | symbol/bitmap → no effect hint |
| Width | line + bulge | Tools | variable stroke width | activate | stroke hovered | U | button | U | width profiles | "Adjust stroke width" | no stroke → disabled |
| Eyedropper | dropper | Tools | sample style | activate | always | I | button | I | style system | "Pick color/style" | — |
| Paint Bucket | tipping bucket | Tools | fill region | activate | shape present | K | button | K | flood fill | "Fill area" | open gap → hint to raise tolerance |
| Ink Bottle | ink bottle | Tools | apply stroke to outline | activate | shape present | S | button | S | stroke style | "Add stroke to shape" | no outline → disabled |
| Bone | bone glyph | Tools | build/pose armature | activate | instance/shape present | M | button | M | IK engine | "Create bones" | complex shape → convert prompt |
| Bind | bone + dots | Tools | edit point binding | activate | IK shape | — | button | — | bindings | "Bind points to bones" | no IK shape → disabled |
| Camera | video camera | Tools | enable camera | activate | always | C | button | C | camera engine | "Add camera" | — |
| Asset Warp | shape + pins | Tools | warp mesh | activate | shape/bitmap present | — | button | — | warp engine | "Warp asset" | symbol instance → disabled |
| Hand | hand | Tools (View) | pan view | activate | always | H | two-finger pan | H | viewport | "Pan canvas" | — |
| Zoom | magnifier | Tools (View) | zoom view | activate | always | Z | pinch | Z | viewport | "Zoom" | — |
| Stage Rotate | rotating frame | Tools (View) | rotate view | activate | always | Shift+H | twist | Shift+H | viewport | "Rotate view" | — |
| Stroke/Fill chips + swap + B&W + No Color | color chips | Tools (Colors) | set current styles | open picker / set | always | — | tap | click | color system | "Set stroke/fill color" | No Color both → warn invisible |

---

## 34.2 Timeline panel (Part 07)

| Button | Icon concept | Panel | Purpose | Action | Required state | Shortcut | Mobile | Desktop | Dependencies | Tooltip | Error state |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Eye (per layer) | eye | Timeline | toggle visibility | flip visible | always | — | tap | click | layer | "Show/Hide layer" | — |
| Lock (per layer) | padlock | Timeline | toggle lock | flip locked | always | — | tap | click | layer | "Lock layer" | — |
| Outline (per layer) | square | Timeline | toggle outline render | flip outline | always | — | tap | click | layer | "Outline mode" | — |
| Add Layer | + | Timeline | new layer | insert layer | always | — | button | button | — | "New layer" | — |
| Add Folder | folder+ | Timeline | new folder | insert folder | always | — | button | button | — | "New folder" | — |
| Delete Layer | trash | Timeline | delete layer | delete | layer selected | — | long-press | click | — | "Delete layer" | mask/pose dependents → confirm |
| Play | ▶ | Timeline | play/pause | toggle playback | timeline exists | Enter | button | Enter | timeline engine | "Play" | empty timeline → disabled |
| Go to First/Last | ⏮/⏭ | Timeline | jump playhead | set playhead | timeline exists | Home/End | button | Home/End | — | "First/Last frame" | — |
| Onion Skin | stacked squares | Timeline | show ghosts | toggle | timeline exists | O | button | O | renderer | "Onion skin" | — |
| Onion Outlines | outline squares | Timeline | ghost outlines | toggle | onion on | Shift+O | button | Shift+O | renderer | "Onion outlines" | — |
| Edit Multiple Frames | stacked + pencil | Timeline | edit all onion frames | toggle | onion on | Alt+O | button | Alt+O | — | "Edit multiple frames" | — |
| Modify Markers | flag | Timeline | onion range | menu | onion on | — | tap | click | — | "Onion range" | — |
| Center Frame | target | Timeline | center playhead | scroll to playhead | — | — | button | click | — | "Center playhead" | — |
| Loop | loop arrow | Timeline | loop playback | toggle | — | — | button | click | — | "Loop playback" | — |
| Attach-to-camera (per layer) | chain | Timeline | pin layer to camera | toggle | camera enabled | — | tap | click | camera | "Attach to camera" | no camera → disabled |
| Add Camera | camera | Timeline | enable camera | create camera layer | — | C | button | C | camera | "Add camera" | — |

---

## 34.3 Properties panel (Part 26) — key buttons

| Button | Icon concept | Panel | Purpose | Action | Required state | Shortcut | Mobile | Desktop | Dependencies | Tooltip | Error state |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Swap Symbol | swap arrows | Properties | replace instance's symbol | open Library picker | instance selected | — | tap | click | Library | "Swap symbol" | no symbols → empty picker |
| Frame Picker | filmstrip | Properties | pick graphic frame | open picker | graphic instance | — | tap | click | symbol frames | "Pick frame" | movie clip → disabled |
| Lip Syncing | mouth + wave | Properties | auto lip-sync | open dialog | graphic + audio layer | — | tap | click | audio + lip-sync engine | "Auto lip sync" | no audio → disabled |
| Add Filter | + | Properties | add instance filter | menu | instance selected | — | tap | click | filters | "Add filter" | — |
| Edit Ease | curve | Properties | custom ease | open graph | tween selected | — | tap | click | easing | "Custom ease" | no tween → disabled |
| Reset (camera props) | ↺ | Properties | reset camera prop | reset value | camera | — | tap | click | camera | "Reset" | — |
| Embed Fonts | font + lock | Properties | embed glyphs | open dialog | dynamic/input text | — | tap | click | font atlas | "Embed fonts" | — |

---

## 34.4 Library panel (Part 12)

| Button | Icon concept | Panel | Purpose | Action | Required state | Shortcut | Mobile | Desktop | Dependencies | Tooltip | Error state |
|---|---|---|---|---|---|---|---|---|---|---|---|
| New Symbol | + | Library | create empty symbol | create + enter edit | — | Ctrl+F8 | button | Ctrl+F8 | symbol engine | "New symbol" | — |
| New Folder | folder+ | Library | new folder | create | — | — | button | — | — | "New folder" | — |
| Delete Asset | trash | Library | delete | delete + prompt | asset selected | — | long-press | Del | — | "Delete asset" | in-use → confirm (Part 12.2.5) |
| Asset Properties | (i) | Library | edit metadata | open dialog | asset selected | — | tap | click | — | "Properties" | — |
| Search | magnifier | Library | filter assets | type filter | — | — | keyboard | — | — | "Search" | — |
| Select Unused | broom | Library | find unused | select unused | — | — | tap | click | use-counts | "Select unused items" | none unused → toast |

---

## 34.5 Color / Swatches / Align / Transform / Info panels

| Button | Icon concept | Panel | Purpose | Action | Required state | Shortcut | Mobile | Desktop | Dependencies | Tooltip | Error state |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Swap fill/stroke | ⇄ | Color | swap styles | swap | — | — | tap | click | — | "Swap fill/stroke" | — |
| Black & White | b/w | Color | reset styles | set | — | — | tap | click | — | "Black & white" | — |
| No Color | ∅ | Color | clear fill/stroke | set | — | — | tap | click | — | "No color" | both none → warn |
| Add Swatch | + | Swatches | save color | add | color picked | — | tap | click | — | "Add swatch" | — |
| Align Left/Center/Right/Top/Middle/Bottom | edge lines | Align | align selection | align | ≥1 object (≥2 for selection-relative) | — | tap | click | selection bounds | "Align" | no selection → disabled |
| Distribute H/V | spaced bars | Align | distribute | distribute | ≥3 objects | — | tap | click | selection bounds | "Distribute" | <3 → disabled |
| Match Size | equal squares | Align | match size | resize | ≥2 objects | — | tap | click | — | "Match size" | <2 → disabled |
| Constrain proportions | chain | Transform | lock W/H ratio | toggle | — | — | tap | click | — | "Constrain" | — |
| Reset Transform | ↺ | Transform | reset scale/rotate/skew | flatten | selection | — | tap | click | Part 04.9 | "Remove transform" | — |
| Registration/Transform point toggle | crosshair | Info | switch coordinate readout | toggle | selection | — | tap | click | — | "Point: reg/transform" | — |

---

## 34.6 Transport / Scenes / misc

| Button | Icon concept | Panel | Purpose | Action | Required state | Shortcut | Mobile | Desktop | Dependencies | Tooltip | Error state |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Test (preview) | play-in-window | (Control) | run full preview | export + play | doc exists | Ctrl+Enter | button | Ctrl+Enter | export engine | "Test movie" | — |
| Publish | rocket | (File) | run publish | publish | doc exists | Shift+Alt+F12 | button | — | export engine | "Publish" | errors → Output log |
| Undo / Redo | ↩/↪ | toolbar | revert/reapply | undo/redo | stack non-empty | Ctrl+Z / Ctrl+Shift+Z | two-finger tap | keys | undo engine | "Undo/Redo" | empty stack → disabled |
| Add Scene | scene+ | Scene | new scene | append | — | — | button | — | — | "Add scene" | — |
| Duplicate Scene | copy | Scene | duplicate scene | deep copy | scene selected | — | tap | click | — | "Duplicate scene" | — |
| Delete Scene | trash | Scene | delete scene | delete + prompt | scene selected | — | long-press | Del | — | "Delete scene" | last scene → blocked |

---

## 34.7 BUILD CHECKPOINT M6 (button slice)

- [ ] Every button in 34.1–34.6 implemented with its required-state, shortcut, tooltip, and error state.
- [ ] Buttons are **declarative** (a registry: id, icon, tooltip, action, enabled-predicate) so panels render from data (Part 26.0 contract).
- [ ] Error states are **visible** (toast/hint), never silent.

*Next: `35_priorities.md` — P0/P1/P2/P3 classification + build order.*

---

<!-- ===== FILE: 35_priorities.md ===== -->

# PART 35 — IMPLEMENTATION PRIORITY
### P0 (absolutely required) / P1 (important) / P2 (advanced) / P3 (optional) — every feature classified, then the build order.

---

## 35.0 Priority definitions

| Tier | Meaning | Ship |
|---|---|---|
| **P0** | The app is useless without it — the MVP core. | Release 1 |
| **P1** | Expected of a professional tool — the "real product". | Release 1–2 |
| **P2** | Advanced/quality-of-life; makes it better than Animate. | Release 2–3 |
| **P3** | Optional/niche/legacy-compat. | Later / never |

---

## 35.1 Feature classification (the complete table)

### Foundations
| Feature | Tier | Note |
|---|---|---|
| Document model + JSON serializer + autosave/recovery | P0 | *[WISH W11]* |
| Undo/redo (command pattern) + selection restore | P0 | |
| Event bus + panel/dock manager + workspace persistence | P0 | |
| Cross-platform shell (Win/macOS/**Linux**/Web/tablet) | P0 | core promise |
| Plugin/script API | P2 | *[WISH W13]* |

### Drawing & shape (Parts 05–06)
| Feature | Tier |
|---|---|
| Path model (cubic Béziers) + fill/stroke sub-objects | P0 |
| Stroke model (width/cap/join/dash/width-profile) | P0 |
| Merge model (union/cut/split) + object mode | P0 |
| Boolean ops (union/intersect/punch/crop) | P0 (backs merge+eraser) |
| Pen/Line/Rect/Oval/PolyStar/Pencil/Brush/Eraser/Width | P0 |
| Fill styles: solid/linear/radial/bitmap + gradient transform | P0 |
| Primitives (parametric) | P1 |
| Paint Brush (art/pattern) + brush library | P1 |
| Variable-width strokes + width profiles | P1 |
| Trace Bitmap | P1 |
| Expand/soften fill edges | P2 |
| Ragged/stipple stroke presets | P3 |
| Generator brushes (Deco/Spray equivalents) | P3 |

### Selection & transform (Parts 03–04)
| Feature | Tier |
|---|---|
| Selection (click/shift/marquee/lasso/select-all) | P0 |
| Free Transform (move/scale/rotate/skew/pivot) | P0 |
| Subselection (anchors/handles) | P0 |
| Distort/Envelope (raw shapes) | P1 |
| Numeric transform panel | P1 |
| Copy/paste transform; remove-transform flatten | P1 |
| Magic Wand (broken-apart bitmaps) | P1 |
| Rotated-bounds align option | P2 |

### Timeline & animation (Parts 07–10)
| Feature | Tier |
|---|---|
| Timeline (layers/frames/playhead/hold rule) | P0 |
| All frame ops (F5/F6/F7/delete/clear/copy/paste/move/reverse/convert) | P0 |
| Keyframes (whole-frame + property) + interpolators | P0 |
| Motion tween + per-property keys + easing | P0 |
| Classic tween + ease/custom graph | P0 |
| Shape tween + shape hints | P0 |
| Motion path (edit + orient) | P0 |
| Easing system (Penner + slider + custom curve) | P0 |
| Motion presets | P1 |
| Graph editor (AE-style, multi-property) | P1 *[WISH W4]* |
| Motion guide layers (legacy) | P2 |
| Constant-speed path (arc-length) | P2 |
| Auto-keyframe scrub mode | P2 |

### Symbols & reuse (Parts 11–12)
| Feature | Tier |
|---|---|
| Symbols (graphic/movie clip/button) + instances | P0 |
| Convert-to-symbol (F8) + registration grid | P0 |
| Nesting + graphic-sync vs movie-clip-free playback | P0 |
| Swap/Duplicate symbol; Break Apart | P0 |
| Library (folders/search/preview/use-count) | P0 |
| Edit-in-place + breadcrumb | P0 |
| Instance color effect + filters | P1 |
| Frame Picker | P1 |
| External library | P1 |
| Font symbols | P3 |

### Layers, masks, text, color, align (Parts 20–24)
| Feature | Tier |
|---|---|
| Layers (types/folders/visibility/lock/outline) | P0 |
| Layer parenting (local-space) | P1 |
| Masks (clip + animated) | P0 |
| Alpha masks | P1 |
| Text (static/dynamic/input + styles + embed) | P0 |
| Color system (picker/gradients/swatches/alpha) | P0 |
| Find & Replace colors | P1 |
| Align/distribute (+ even-gap) | P0 |

### Character & rigging (Parts 13–15, 19)
| Feature | Tier |
|---|---|
| Cut-out pipeline (parts→symbols→hierarchy→pivots) | P0 |
| Bone/IK (2-bone + FABRIK/CCD + constraints) | P1 |
| Asset Warp (pins/mesh, vector+raster) | P1 |
| Frame-by-frame + onion skin (all controls) | P0 |
| Cel/drawing-reuse system | P1 *[WISH W1]* |
| Pose library | P1 |
| Facial systems (blink/gaze/mouth/expression/head) | P1 |
| Auto-blink (random, avoids speech) | P2 |
| Full 360° head turns | P3 |

### Camera, audio, lip-sync (Parts 16–18)
| Feature | Tier |
|---|---|
| Camera (pan/zoom/rotate/keyframes/depth/parallax) | P1 |
| Camera presets | P2 |
| Audio (import/sync modes/loop/trim/envelope) | P1 |
| Lip-sync (auto + manual + Frame Picker) | P1 |
| Phoneme lane + confidence + re-map | P2 |
| Multi-language phoneme models | P3 |

### Import/export (Parts 27–28)
| Feature | Tier |
|---|---|
| Import: PNG/JPEG/SVG/MP3/WAV/PSD-per-layer | P0 |
| Export: PNG/JPEG/SVG image | P0 |
| PNG sequence + GIF + MP4 video | P0 |
| HTML5/Web bundle | P1 |
| Sprite sheets + image sequences (import/export) | P1 |
| WebM/OGG/FLAC/WebP | P2 |
| glTF/WebGL export | P3 |

### UX / cross-platform (Parts 29–31)
| Feature | Tier |
|---|---|
| Keyboard shortcuts (Flash defaults) + rebindable editor | P0 |
| Context menus (all) | P0 |
| Touch/mobile adapter + loupe + toolbar | P1 |
| Hover-preview + hint bar (touch) | P1 |
| Accessibility (contrast themes, tooltips) | P2 |
| AI in-betweening assistant | P2 *[WISH W9]* |
| Cloud sync / collaboration | P3 |

---

## 35.2 Build order (the roadmap)

### Release 0 (proof of core) — Parts 01–06
1. Shell + event bus + undo + serializer + cross-platform window.
2. Vector engine: paths, strokes, fills, booleans, merge/object modes.
3. Tools: selection/subselection/free-transform/pen/shapes/pencil/brush/eraser.
4. Selection + transform systems complete. → **A working drawing editor.**

### Release 1 (it animates) — Parts 07–12
5. Timeline + keyframes + frame ops.
6. Tweens (motion/classic/shape) + easing + motion path.
7. Symbols/instances/nesting + Library.
8. Layers/masks/text/color/align. → **A working animation editor (Animate-class).**

### Release 2 (it's for characters) — Parts 13–19
9. Cut-out rig pipeline + bone/IK + asset warp + pose library.
10. Frame-by-frame + onion skin + cel/drawing reuse.
11. Camera + audio + lip-sync + facial systems. → **A character-animation studio.**

### Release 3 (it ships everywhere) — Parts 27–31
12. Full import + export/publish (GIF/MP4/HTML5).
13. Touch/mobile adapter + shortcuts + context menus.
14. Polish: graph editor, presets, autosave, templates. → **A shipped product.**

### Release 4 (it's better than Animate) — the [WISH] list
15. Cel/drawing reuse (W1), robust IK (W2), warp-without-flicker (W3), AE-graph-editor (W4), free brush size + smoothing (W5), opacity slider/auto-select/eyedropper fix (W6), offline cross-platform (W7), Flash shortcuts (W8), AI in-betweening (W9), bitmap pencil (W10), autosave+recovery (W11), scene tabs (W12), extensibility (W13).

---

## 35.3 BUILD CHECKPOINT M6 (priority slice)

- [ ] Every P0 feature is implemented and tested before any P1 begins (P0 = the release blocker).
- [ ] The build order is tracked as a roadmap; each release = a milestone (M1–M6 from the earlier parts).
- [ ] The [WISH] improvements are scheduled in Release 4, not dropped.

*Next: `36_final_notes.md` — cross-cutting rules (undo granularity, performance, crash-safety), the glossary, and the final "is it complete?" checklist.*

---

<!-- ===== FILE: 36_final_notes.md ===== -->

# PART 36 — FINAL NOTES
### Cross-cutting engineering rules, the glossary, and the "is it complete?" checklist. Read this last — it binds all 35 parts together.

---

## 36.0 The 10 cross-cutting rules (must hold everywhere)

1. **Single source of truth.** The Document Model (Part 33) is the only state. Panels, tools, and exporters are projections. No module caches authoritative data.
2. **All mutations are Commands.** Every model change goes through the Undo/Redo engine (Part 32.18); every tool gesture = exactly one undoable command (undo granularity is specified per tool in Part 02).
3. **Evaluation is pure & deterministic.** `evaluate(model, time) → renderTree` — the same function serves authoring, playback, and export (WYSIWYG). Same inputs → same frames, always.
4. **IDs are stable; names are display-only.** Renaming a layer/symbol/scene never breaks references. Foreign keys are IDs (Part 33 convention).
5. **Local-space transforms + stable IDs for rigs.** *[WISH W2]* — bones and instances store local transforms; copy/paste, scaling children, and re-parenting are safe by construction (Parts 14.2, 20.5).
6. **Sparse frame storage.** Only keyframes/spans are stored; static/empty frames are derived by the hold rule (Part 07.3). Never materialize per-frame objects.
7. **Dirty-region rendering + layer caches.** Only changed layers re-rasterize; camera/zoom re-composite cached layers (Part 32.1). 60 fps playback; interactive editing on low-end hardware.
8. **Nothing is a black box.** Imports (Part 27.7), auto lip-sync (Part 18.6), and exports (Part 28) all emit **reports/confidence** the user can inspect and edit. The app is a tool, not a magic box.
9. **Undo-consistent selection.** Commands store `prevSelection` and restore it on undo/redo (Part 36.0.2 / Part 03.9).
10. **Crash-safety.** Autosave to a `.autosave` slot at a configurable interval + recovery prompt on launch *[WISH W11]*; the serializer writes atomically (write-temp → rename).

---

## 36.1 Performance budget (targets)

| Operation | Budget |
|---|---|
| Playback (60fps doc, cached layers) | 16 ms/frame incl. render |
| Hit-test (10k objects) | < 1 ms (spatial index) |
| Path tessellation (1k anchors) | < 5 ms (cached) |
| Boolean union of two complex shapes | < 50 ms (worker) |
| Undo/redo | instant (diff/ID-based) |
| Auto lip-sync (60s audio) | < 5 s (offline, worker) |
| Save (large project) | non-blocking (worker, incremental) |
| PNG sequence / video export | frame-parallel (worker pool) |

---

## 36.2 Glossary (the terms as used across all parts)

| Term | Definition | Part |
|---|---|---|
| **Armature** | A connected tree of bones (one root). | 14 |
| **Blank keyframe** | An explicit empty keyframe (breaks the hold). | 07 |
| **Break Apart** | Flatten one level (symbol→content→shapes). | 06.8 |
| **Cel** | A reusable drawing asset + its exposure on frames. | 15.5 |
| **Classic tween** | Whole-frame interpolation between two keyframes (legacy). | 09.2 |
| **Color effect** | Per-instance brightness/tint/alpha/advanced. | 11.5 |
| **Drawing object** | An atomic drawn object (object-drawing mode). | 06.2 |
| **Easing** | Remapping interpolation time (accel/decel). | 09.4 |
| **Envelope** | Mesh deformation of a raw shape. | 04.6.2 |
| **Exposure** | How many frames a drawing/keyframe holds. | 07.3 / 15.4 |
| **Fill rule** | Nonzero vs even-odd interior determination. | 05.3.1 |
| **Frame span** | [keyframe, nextKeyframe−1] held run. | 07.3 |
| **Graphic symbol** | Timeline driven by the parent timeline. | 11.1.1 |
| **IK** | Inverse kinematics (drag end → solve joints). | 14 |
| **Instance** | A placed reference to a symbol. | 11.0 |
| **Keyframe** | An authored snapshot (whole-frame or per-property). | 08 |
| **Lip sync** | Mapping speech audio → mouth-pose keyframes. | 18 |
| **Mask** | A shape that clips another layer's content. | 21 |
| **Merge model** | Overlapping raw shapes union/cut/split. | 06.1 |
| **Motion path** | The curve a tweened object follows. | 10 |
| **Movie clip** | Symbol with an independent clock. | 11.1.2 |
| **Onion skin** | Ghosting neighboring frames while drawing. | 15.2 |
| **Pivot (transform point)** | The point rotation/scale center on. | 04.7 |
| **Pose** | A stored armature/rig configuration. | 14.6 |
| **Registration point** | A symbol's (0,0) origin. | 11.2 |
| **Shape hint** | A forced anchor correspondence in a shape tween. | 09.3.2 |
| **Stream sound** | Timeline-synchronized audio. | 17.0 |
| **Swap** | Replace an instance's symbol, keeping transform. | 11.6 |
| **Tween span** | The unit of a motion tween (one target). | 09.1 |
| **Viseme** | A visual mouth shape for a phoneme group. | 18.1 |
| **z-depth** | A layer's distance from the camera (parallax). | 16.5 |

---

## 36.3 The "is it complete?" checklist (final gate)

**Data:** □ All 19 schemas (Part 33) valid + round-trip. □ IDs stable, names display-only. □ Autosave/recovery.

**Editor core:** □ All 30+ tools (Part 02) with the 27-field behavior. □ Selection/transform/drawing/shape systems (Parts 03–06). □ Merge + object modes both work.

**Animation:** □ Timeline + keyframes + all frame ops (07–08). □ Motion/classic/shape tweens + easing + graph editor (09). □ Motion paths (10).

**Reuse:** □ Symbols/instances/nesting (11). □ Library (12). □ Swap/break-apart/frame-picker.

**Characters:** □ Cut-out pipeline + bone/IK + asset warp (13–14). □ Frame-by-frame + onion skin + cel system (15). □ Camera + audio + lip-sync + facial (16–19).

**Structure:** □ Layers/masks/text/color/align/scenes (20–25). □ Properties panel (26).

**I/O:** □ Import (27) + export/publish (28). □ Shortcuts (29) + context menus (30).

**Cross-platform:** □ Desktop (Win/macOS/**Linux**) + touch (31). □ Architecture (32) + buttons (34) + priorities (35).

**The [WISH] improvements (Release 4):** □ W1 cel reuse · W2 robust IK · W3 warp-no-flicker · W4 AE graph editor · W5 free brush size · W6 opacity slider/auto-select/eyedropper fix · W7 offline cross-platform · W8 Flash shortcuts · W9 AI in-betweening · W10 bitmap pencil · W11 autosave/recovery · W12 scene tabs · W13 extensibility.

---

## 36.4 Final note

This blueprint is a **functional specification**, researched from Adobe Animate's documented capabilities and the animator community's requests, then re-designed as an **original** application: original UI, original icons, original names, original file format — no Adobe artwork, branding, or pixel-identical interface reproduced anywhere. An AI coding agent reading Parts 01–36 in order, passing each **BUILD CHECKPOINT**, will have built a professional, cross-platform 2D animation editor that matches Animate's workflow and exceeds it in the places animators asked for.

**— End of the 36-part blueprint. —**

---

