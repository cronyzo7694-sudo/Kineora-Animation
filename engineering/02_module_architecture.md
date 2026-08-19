# 02_MODULE_ARCHITECTURE — MODULE TREE & SPECIFICATIONS

Dependency direction (layered): **Foundation → Domain → Engines → Services → UI → Platform**. No module may depend upward.

```
UI (Shell/Panels/Tools/Overlays) ──emit──▶ EventBus ◀──subscribe── UI
        │ commands
        ▼
CommandLayer (validate → mutate → record) ──▶ UndoHistory
        │ mutate
        ▼
DocumentModel (scenes/layers/frames/symbols/assets) ◀── ProjectSerializer (save/autosave/recover)
        │ evaluate(time)
        ▼
SceneGraph ──▶ Renderer (Canvas/WebGL) ──▶ screen
        ▲ content from: Vector/Raster/Text/Mask/Camera/Audio-visual engines
        └─ worker: Boolean/LipSync/Export
```

## Module inventory (MOD-xxx)
| ID | Module | Layer | Owner of |
|---|---|---|---|
| MOD-SHELL | App Shell | UI | window, regions, breadcrumb, status bar |
| MOD-WORKSPACE | Workspace Manager | UI | panel layout persistence/reset |
| MOD-PANEL | Panel/Docking Manager | UI | dock/float/resize/collapse |
| MOD-RENDER | Stage Renderer | Service | Canvas/WebGL, caches, overlays |
| MOD-SCENEGRAPH | Scene Graph | Domain | render tree, spatial index, nesting |
| MOD-DOC | Document Model | Domain | authoritative state (entities) |
| MOD-LAYER | Layer Engine | Domain | layer types/folders/parenting |
| MOD-SELECTION | Selection Engine | Domain | dual-domain selection, hit-test |
| MOD-HITTEST | Hit Testing | Domain | spatial queries, edge radius |
| MOD-XFR | Transform Engine | Domain | transform component + matrix |
| MOD-VECTOR | Vector Geometry | Foundation | paths, strokes, booleans, tessellation |
| MOD-DRAWING | Drawing Engine | Domain | tool gestures → draw commands |
| MOD-SHAPE | Shape Engine | Domain | merge model, primitives, break-apart |
| MOD-TIMELINE | Timeline Engine | Domain | clock, playhead, scrubbing, playback |
| MOD-FRAME | Frame Engine | Domain | sparse frames, hold rule, frame ops |
| MOD-KEYFRAME | Keyframe Engine | Domain | keyframes + interpolation |
| MOD-TWEEN | Tween Engine | Domain | motion/classic/shape spans |
| MOD-EASING | Easing/Curve Engine | Foundation | penner + custom bézier + presets |
| MOD-PATH | Motion Path Engine | Domain | path derived from x/y keys |
| MOD-SYMBOL | Symbol Engine | Domain | definitions, nesting, edit modes |
| MOD-INSTANCE | Instance Engine | Domain | instance props (color/filters/loop) |
| MOD-LIBRARY | Library/Asset Engine | Domain | asset DB, folders, use-count |
| MOD-RIG | Rig Engine | Domain | character hierarchy, poses |
| MOD-BONE | Bone Engine | Domain | bone graph, armature |
| MOD-IK | IK Solver | Foundation | 2-bone/FABRIK/CCD + constraints |
| MOD-POSE | Pose Engine | Domain | pose layer, pose library |
| MOD-WARP | Asset Warp Engine | Domain | warp pins + mesh |
| MOD-FBF | Frame-by-Frame Engine | Domain | cel/drawing reuse (W1) |
| MOD-ONION | Onion Skin Engine | Service | ghost pass |
| MOD-FACIAL | Facial Animation | Domain | blink/gaze/expression/head |
| MOD-VISEME | Mouth/Viseme Engine | Domain | mouth symbol frames |
| MOD-LIPSYNC | Lip Sync Engine | Service | VAD/phoneme/viseme/keyframes |
| MOD-AUDIO | Audio Engine | Service | decode/waveform/sync/mux |
| MOD-CAMERA | Camera Engine | Domain | camera + depth/parallax |
| MOD-MASK | Mask Engine | Domain | stencil/alpha/boolean clip |
| MOD-TEXT | Text Engine | Domain | glyph atlas, metrics, binding |
| MOD-COLOR | Color Engine | Foundation | color model, gradients, swatches |
| MOD-IMPORT | Import Engine | Service | per-format importers + report |
| MOD-EXPORT | Export/Render Engine | Service | per-format exporters |
| MOD-SCENE | Scene Engine | Domain | scene CRUD/order |
| MOD-INPUT | Input Engine | Service | gesture bus |
| MOD-KBD | Keyboard Shortcut Engine | Service | shortcut registry + conflicts |
| MOD-TOUCH | Touch/Pen Input | Service | touch adapter + loupe |
| MOD-COMMAND | Undo/Redo Command Engine | Domain | command stack, coalescing |
| MOD-BUS | Event Bus | Foundation | pub/sub |
| MOD-STATE | State Management | Foundation | state machines registry |
| MOD-PERSIST | Persistence/Serialization | Service | JSON+assets, version, migration |
| MOD-AUTOSAVE | Autosave/Recovery | Service | debounced dirty + atomic + slot |
| MOD-NOTIFY | Error/Notification | Service | toast/inline/modal, report |
| MOD-OVERLAY | Overlay Manager | UI | positioning/stacking/focus |
| MOD-MODAL | Modal Manager | UI | focus trap, queue |
| MOD-A11Y | Accessibility Layer | Cross | names/roles/focus/live-region |
| MOD-CACHE | Performance/Render Cache | Service | layer caches, memo, virtualization |
| MOD-TEST | Testing Infrastructure | Cross | test harness, fixtures, CI gates |
| MOD-PLUGIN | Plugin/Extensibility | Optional | script API (W13, P2) |

## Per-module spec (exemplar — full depth; others follow same template)
### MOD-TIMELINE — Timeline Engine
- **Purpose**: the clock — playhead, playback tick, scrubbing, looping, frame/time conversion.
- **Responsibilities**: fps math, playhead state, transport (play/pause/step/rewind/end), scrub (with audio), loop, `evaluate(time)` dispatch.
- **Non-responsibilities**: frame storage (MOD-FRAME), tween sampling (MOD-TWEEN), audio decode (MOD-AUDIO).
- **Public API**: `tick()`, `play()/pause()/stop()`, `seek(frame)`, `scrub(frame, {audio})`, `step(delta)`, `getState()`.
- **Internal**: PlaybackController (rAF loop, fps throttle), ScrubController (pointer→frame, audio sync).
- **State**: `{ playhead, playing, looping, scrubbing, muted }` (view state).
- **Inputs**: transport commands, pointer scrub gestures.
- **Outputs**: `evaluate(frame)` → render tree; `playhead:moved` events.
- **Events consumed**: `timeline:changed` (duration change re-clamps playhead).
- **Events emitted**: `playback:started/stopped`, `playhead:moved{frame,scrubbing}`.
- **Dependencies**: MOD-FRAME, MOD-TWEEN (sampling), MOD-AUDIO (scrub), MOD-BUS.
- **Dependents**: MOD-RENDER, MOD-UI (status bar), MOD-EXPORT.
- **Data structures**: `PlayheadState`, `TransportState`.
- **Undo**: transport = view state (no undo).
- **Persistence**: none (view); last-frame restore optional P2.
- **Rendering**: triggers dirty render on frame change.
- **Performance**: rAF-throttled; scrub throttled ~60Hz; [ENGINEERING TARGET] tick < 1ms + render budget 16ms.
- **Error**: empty timeline → play no-op; missing audio → silent scrub.
- **Mobile**: scrub via playhead/stage drag; transport in persistent toolbar.
- **Acceptance**: REQ-TIM-004 tests + playback determinism (same frame = same render).

*(Remaining modules: same template, authored in this folder's child files 03..14 where the engine detail is the content — e.g., MOD-TWEEN spec = 08_tween_easing_engine.md §module; MOD-RIG/IK = 09 §module; MOD-AUDIO/LIPSYNC = 10 §module; MOD-UI/OVERLAY = 11 §module; MOD-INPUT = 12 §module; MOD-PERSIST = 13 §module; MOD-IMPORT/EXPORT = 14 §module. Cross-cutting modules MOD-DOC/MOD-VECTOR/MOD-COMMAND/MOD-STATE are specified in 03/04/05/06.)*

## Ownership completeness check
Every Phase-2 feature group has an owner module (F-03→MOD-SELECTION/MOD-HITTEST, F-07→MOD-TIMELINE/MOD-FRAME, F-09→MOD-TWEEN/MOD-EASING/MOD-PATH, F-11→MOD-SYMBOL/MOD-INSTANCE, F-14→MOD-BONE/MOD-IK/MOD-POSE, F-18→MOD-LIPSYNC/MOD-VISEME, F-31→MOD-INPUT/MOD-TOUCH, C-01..C-38→MOD-UI submodules). No orphan feature: verified against 405-feature queue.
