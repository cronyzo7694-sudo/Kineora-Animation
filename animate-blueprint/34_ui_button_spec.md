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
