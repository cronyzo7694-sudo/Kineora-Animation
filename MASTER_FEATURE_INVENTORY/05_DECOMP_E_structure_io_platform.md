# §3. FULL FEATURE DECOMPOSITION — PART E: LAYERS · MASKS · TEXT · COLOR · ALIGN · SCENES · PROPERTIES · IMPORT · EXPORT · SHORTCUTS · CONTEXT-MENUS · MOBILE · ARCHITECTURE · DATA · BUTTONS · PRIORITIES · FINAL-NOTES

---

## 3.21 LAYERS  [F-20-01..07 · Part 20 · C-22 · REQ-LAY]

### 3.21.1 Layer data model  [F-20-01]
- `layer{id, name, type, visible, locked, outline, outlineColor, parentId, transformParentId, zDepth, attachedToCamera, maskMode, frames[], height}`.

### 3.21.2 Lifecycle ops  [F-20-02] — Create (+ button / Insert menu) · Delete (prompt if dependents) · Rename (dbl-click; display-only, ID stable) · Move (drag; reorder = render order) · Duplicate (deep copy) · Copy/Paste Layer (cross-timeline).

### 3.21.3 State toggles  [F-20-03 · REQ-LAY-002] — Visible (eye) / Hidden (not exported) / Locked (renders, not editable, skipped by Select All) / Outline (outlines only, exports full). Cascade through folders.

### 3.21.4 Layer types (11)  [F-20-04 · REQ-LAY-001]
| Type | Purpose | Auto-created by |
|---|---|---|
| Normal | standard content | default |
| Folder | group (children, collapse/expand) | + folder |
| Mask | clip shape (Part 21) | right-click |
| Masked | clipped content | mask link |
| Guide | non-printing path | — |
| Motion Guide | classic-tween path | classic tween |
| Pose | IK armature + poses | Bone tool |
| Tween | motion-tween spans | Motion tween |
| Camera | camera keyframes | Camera tool |
| Audio | sound frames | audio attach |
- Conversion rules: normal↔folder↔mask↔guide via Properties (mask→normal warns); pose/tween/camera/audio revert to normal when emptied. One armature/pose layer; one target/tween span; one mask/mask group.

### 3.21.5 Folders & hierarchy  [F-20-05] — unlimited nesting (ours; Animate = 2 levels); purely organizational (no coordinate space); drag rules (onto folder = nest; left edge = out; between = reorder).

### 3.21.6 Layer parenting  [F-20-06 · REQ-LAY-003] — `transformParentId` link; child transform = parent ∘ child (local space); hide parent = hide children; works with rigs; safe re-parent [W2].

### 3.21.7 Layer order & render rules  [F-20-07] — bottom→top; within layer display-list order; mask groups; camera last; Arrange (Ctrl+↑/↓) = object order within layer.

---

## 3.22 MASKS  [F-21-01..06 · Part 21 · C-22 · REQ-LAY-004/005]

### 3.22.1 Mask vs masked layers  [F-21-01] — mask defines window (invisible at export); masked = content clipped; one mask → N masked; unmask; **live preview without locking** (ours).

### 3.22.2 Clipping rules  [F-21-02 · REQ-LAY-004] — mask **fill** defines window (strokes ignored); content keeps own color/effects; multiple sub-shapes = union; color/alpha of mask irrelevant (hard-edge).

### 3.22.3 Animated masks  [F-21-03 · REQ-LAY-005] — moving (motion tween) / morphing (shape tween) / rotating/scaling masks; both mask+content can animate; per-frame re-eval at export.

### 3.22.4 Nested masks  [F-21-04] — inner masks apply first, outer clips composited result; multiple mask groups per timeline (ours).

### 3.22.5 Alpha masks  [F-21-05] — `maskMode: clip|alpha`; alpha = soft edges/gradient fades (ours P1).

### 3.22.6 Implementation  [F-21-06 · ENG-013] — stencil (clip) / mask-texture (alpha) / SVG boolean fallback; mask-group cache + dirty flag.

---

## 3.23 TEXT  [F-22-01..08 · Part 22 · C-16 · REQ-TXT]

### 3.23.1 Three text types  [F-22-01 · REQ-TXT-001] — **Static** (outlines at export) / **Dynamic** (runtime binding) / **Input** (user-editable).

### 3.23.2 Text tool & blocks  [F-22-02] — point text (click) / fixed-width box (drag) / inline edit (click-inside). Text = scene-graph node.

### 3.23.3 Font & glyphs  [F-22-03] — system or **embedded** fonts (glyph subset); fallback warning + one-click embed; **web fonts** (ours); metrics (baseline/ascent/descent/advance/kerning).

### 3.23.4 Style controls  [F-22-04] — fontFamily · fontSize (pt) · color + alpha · bold/italic/underline · align (L/C/R/justify) · letterSpacing (tracking) · lineSpacing (leading) · auto-kern · antiAlias (normal/device — **Bitmap/Animation/Readability/Custom** per C-16) · selectable · border/background (input, P1) · max chars (input, P1) · embedFonts.

### 3.23.5 Text transform  [F-22-05] — move/scale/rotate/skew; distort/envelope require break-apart; flip mirrors.

### 3.23.6 Text animation  [F-22-06] — motion tween (auto-wrap to symbol) · per-character (break-apart once, stagger) · morph (break-apart twice → shape tween) · masked reveal · blur/glow filters.

### 3.23.7 Dynamic binding  [F-22-07] — bind to variable/expression; HTML5 → JS data-binding; no TLF.

### 3.23.8 Export per type  [F-22-08] — static = glyph outlines/embedded; dynamic = JS-bound; input = form; un-embedded → warn (embed/outline/fallback).

---

## 3.24 COLOR  [F-23-01..08 · Part 23 · C-12 · REQ-CLR]

### 3.24.1 Color model  [F-23-01] — RGBA (RGB/HSB views + hex + alpha); gradients = stops (offset+color+alpha).

### 3.24.2 Color controls (Tools panel)  [F-23-02] — **stroke chip** · **fill chip** · **swap** · **black & white** · **no color** (stroke-only/fill-only; both-none = warn).

### 3.24.3 Color picker (popover)  [F-23-03] — hue/saturation 2D field · brightness slider · RGB/HSB numeric · hex field · **alpha field (A)** · swatch strip · in-picker eyedropper.

### 3.24.4 Swatches  [F-23-04] — add/delete/rename · folders · import/export (JSON, ASE-compatible) · default palette · document/app-level.

### 3.24.5 Alpha  [F-23-05] — top-level opacity slider [W6] + A field; no double-darkening on merge.

### 3.24.6 Gradients  [F-23-06] — **linear** (stops + transform) · **radial** (+ focal point) · gradient bar editor (drag stops, dbl-click edit, drag-off delete, click add) · GPU render.

### 3.24.7 Bitmap fills  [F-23-07] — tile/stretch + lock-fill continuity.

### 3.24.8 Custom colors & replacement  [F-23-08] — Find & Replace colors (scoped doc/scene/selection + preview) · adjust-color instance filter · swap · eyedropper · OKLab tween interpolation.

---

## 3.25 ALIGN / DISTRIBUTE  [F-24-01..06 · Part 24 · C-12 · REQ-ALN]

### 3.25.1 Two spaces  [F-24-01] — **Align to Stage** vs **Align to Selection** (+ third "align to first-selected" ours).

### 3.25.2 Six align ops  [F-24-02] — Left / Center / Right / Top / Middle / Bottom (one `AlignCommand` each).

### 3.25.3 Distribute ops  [F-24-03] — Left Edges / Horizontal Centers / Right Edges / Top Edges / Vertical Centers / Bottom Edges (extremes fixed; gap = span/(N−1)).

### 3.25.4 Spacing (even gaps)  [F-24-04] — Space Evenly H/V (equal visual gaps, ours).

### 3.25.5 Match size  [F-24-05] — Match Width / Height / Both.

### 3.25.6 Math details  [F-24-06] — axis-aligned bounding box (rotated-bounds option P2); groups align as unit; locked/hidden excluded; single object + stage = snap to edge/center.

---

## 3.26 SCENES  [F-25-01..06 · Part 25 · C-11 · REQ-SCN]

### 3.26.1 Scene concept  [F-25-01] — named self-contained timeline; document = ordered scenes + shared Library.

### 3.26.2 Scene ops  [F-25-02 · REQ-SCN-001] — Create / Duplicate (deep-copy timeline; assets shared) / Delete (prompt; use-count recomputed) / Rename (ID-referenced) / Reorder (playback order).

### 3.26.3 Scene properties  [F-25-03] — duration (derived) · per-scene background override (P1) · per-scene fps override (P2).

### 3.26.4 Per-scene timeline/camera/audio  [F-25-04] — independent timelines; one camera per scene; scene audio layers + **master audio track** (P1).

### 3.26.5 Navigation  [F-25-05] — Scene panel · breadcrumb scene click · View ▸ Go To (First/Prev/Next/Last) · Enter (active scene) vs Ctrl+Enter (all scenes).

### 3.26.6 Scene tabs  [F-25-06 · W12] — tabbed scenes + split view (P2); view state (not saved).

---

## 3.27 PROPERTIES PANEL  [F-26-01..12 · Part 26 · C-09 · REQ-PRP]

### 3.27.1 Context-binding mechanism  [F-26-01 · REQ-PRP-001]
- **Precedence:** 1. tool options → 2. stage selection → 3. selected frame(s) → 4. document.
- `getPropertySchema(selection)` → sections → fields `{id, label, type:'number|text|color|select|slider|checkbox|gradient|curve', value, get, set, validate?, min?, max?, unit?}`.
- Writes back via Commands (no direct writes).

### 3.27.2 Document schema  [F-26-02] — Width/Height (px) · Ruler units · Frame rate (fps) · Background color (+alpha) · Auto-save interval · Platform (doc type) · Publish profile/target · Title/description/author.

### 3.27.3 Shape schema  [F-26-03] — X/Y (reg/transform toggle) · W/H + constrain · Fill (chip+alpha, type, gradient stops, bitmap+tile) · Stroke (chip+alpha, width, style, cap, join+miter, width-profile) · Fill rule · Corner radius / angles / sides.

### 3.27.4 Group schema  [F-26-04] — X/Y/W/H · type badge · edit-in-place hint · Break Apart.

### 3.27.5 Instance schema  [F-26-05] — Symbol name + **Swap** · Instance type + name · Color Effect (mode+value) · Blending mode · **Filters** (add list + params) · **Looping** (graphic: loop/once/single + first frame + Frame Picker) · **Tracking** (button) · **Lip Syncing** (graphic + audio).

### 3.27.6 Text schema  [F-26-06] — type · content · family/size/color/alpha/bold/italic/underline/spacing/kern · paragraph (align/line/indent/margins) · behavior (selectable/AA/embed/border/max-chars) · X/Y/W/H.

### 3.27.7 Frame/tween schema  [F-26-07] — keyframe: label (name/comment/anchor) + sound (asset+sync+loop+trim+effect) + actions · classic tween: ease + rotate + orient/snap/sync/scale + sound · shape tween: ease + blend + hints + sound · motion tween: ease + rotation + view-keyframes · pose: type + bone list.

### 3.27.8 Camera schema  [F-26-08] — X/Y/Z · Zoom% · Rotation° (+reset each) · Color effects (tint) · Filters.

### 3.27.9 Audio schema  [F-26-09] — Sound asset dropdown · Sync · Loop · Effect · Trim · Volume + envelope.

### 3.27.10 Bone schema  [F-26-10] — Length · Rotation (enable+min/max) · Translation (x/y enable) · Joint speed · Spring (strength/damping) · Parent/Child/Next/Prev nav.

### 3.27.11 Warp asset schema  [F-26-11] — Mode (rigid/flexible) · Envelope toggle · Add/Remove handle · Reset · Pin position.

### 3.27.12 Multiple/mixed selection  [F-26-12] — common fields only (X/Y/W/H) + "mixed" badge.

---

## 3.28 IMPORT  [F-27-01..08 · Part 27 · C-30 · REQ-IMP]

### 3.28.1 Entry points  [F-27-01] — Import to Stage / to Library / Open External Library / drag-drop / paste.

### 3.28.2 Raster import  [F-27-02] — PNG (alpha) / JPEG / GIF (animated → frames, ours) / WebP / PSD (per-layer / flattened / movie-clip + registration + compression).

### 3.28.3 Vector import  [F-27-03] — SVG/AI (paths → shapes, quad→cubic, gradients → fills) / PDF (P2). Import report lists conversions.

### 3.28.4 Audio import  [F-27-04] — sound assets.

### 3.28.5 Video import  [F-27-05] — MP4/FLV (embed/link + audio extraction + frame extraction, P1).

### 3.28.6 Sprite sheets & sequences  [F-27-06] — atlas → movie clip frames; image sequence → frame-by-frame (ones/twos).

### 3.28.7 Libraries (external)  [F-27-07] — read-only cross-doc copy (or link P2).

### 3.28.8 Import report  [F-27-08 · REQ-SYS-009] — created/converted/warnings. Import = one undoable command.

---

## 3.29 EXPORT / PUBLISH  [F-28-01..11 · Part 28 · C-31 · REQ-EXP]

### 3.29.1 Export vs publish  [F-28-01] — Export = one-shot; Publish = configured pipeline (profiles).

### 3.29.2 Image export  [F-28-02] — PNG/JPEG/SVG/WebP · resolution/scale (1×/2×/4×) · transparency · quality · frame (current/named).

### 3.29.3 PNG/JPEG sequence  [F-28-03] — every frame / range (#First–#Last) · scale · transparency · quality · sidecar fps.

### 3.29.4 Animated GIF  [F-28-04] — static/animated · loop (cont/N) · dimensions · fps · palette 256 + optimize + dither + interlace · transparency · range · **silent warn**.

### 3.29.5 Video export  [F-28-05] — MP4 (H.264) / WebM (VP9) · resolution · fps · bitrate · audio (AAC, sample-exact mux) · range · motion blur (P2).

### 3.29.6 HTML5 publish  [F-28-06] — JS + assets bundle · spritesheets (PNG/JPEG, 8/24/32-bit) · preloader · transparency · loop · audio · self-contained libs.

### 3.29.7 Web/other targets  [F-28-07] — WebGL/glTF (P2) · SWF/OAM/AIR (legacy, not built).

### 3.29.8 Audio-only export  [F-28-08] — WAV/MP3 stems (ours P1).

### 3.29.9 Project file save  [F-28-09] — JSON + assets/ (lossless master) · autosave + crash recovery [W11].

### 3.29.10 Publish profiles  [F-28-10] — named settings bundles.

### 3.29.11 Universal settings matrix  [F-28-11] — resolution/scale/fps/compression/transparency/audio/loop/range per format.
**Rule (REQ-EXP-002):** export = same evaluate as playback; camera applied in all exporters; overlays never exported.

---

## 3.30 SHORTCUTS  [F-29-01..12 · Part 29 · C-32]  *(full map §11)*
- 12 groups (tools/file-edit/selection/transform/timeline/playback/layers/symbols/view/text/custom) + **rebindable shortcut editor** (conflict detection, reset, import/export) [W8].

## 3.31 CONTEXT MENUS  [F-30-01..10 · Part 30 · C-07]  *(full trees §4)*
- 10 scoped menus: Stage / Object / Shape / Symbol / Timeline / Layer / Frame / Library / Audio / Scene — via `ContextMenuBuilder(hitTarget, selection, tool, clipboard, doc-state)`.

## 3.32 MOBILE TRANSLATION  [F-31-01..10 · Part 31 · C-33 · REQ-PLAT]

### 3.32.1 Architecture principle  [F-31-01 · REQ-PLAT-001] — one codebase, two input adapters (desktop mouse/kbd/stylus; touch/pen) → **GestureBus** → normalized gestures → tools (unchanged).

### 3.32.2 Master mapping table (22 rows)  [F-31-02] — drag→finger-drag · right-click→long-press · shortcut→toolbar button · Shift+click→select-mode · marquee→1-finger drag · timeline drag→touch scrub · handles→44px+pinch/twist · hover→tap-hold preview · modifiers→modifier buttons · wheel→pinch · middle-drag→2-finger · text→system keyboard · undo→2-finger tap · nudge→nudge buttons · etc.

### 3.32.3 Selection mobile  [F-31-03] · 3.32.4 Drawing mobile (smoothing + loupe)  [F-31-04] · 3.32.5 Transform mobile (pinch/twist)  [F-31-05] · 3.32.6 Timeline mobile (scrub + long-press + ruler pinch)  [F-31-06] · 3.32.7 Rigging/camera mobile  [F-31-07] · 3.32.8 Panels mobile (bottom sheets + grid library)  [F-31-08].

### 3.32.9 Persistent mobile toolbar  [F-31-09 · REQ-PLAT-002] — Undo/Redo/Select-mode/Constrain/Alt/Onion/Play/Add-keyframe/Delete/Back/Palette + tool ring + bottom sheets.

### 3.32.10 Feature-parity checklist  [F-31-10] — select/transform/draw/anchors/timeline/symbols/tweens/bones/camera/audio/export/undo all required on touch.

---

## 3.33 ARCHITECTURE  [F-32-01..21 · Part 32 · REQ-SYS]

### 3.33.1 Module inventory (21 blueprint modules → 54 MOD-*)
- **Engines:** Canvas Renderer · Vector · Raster · Scene Graph · Layer System · Timeline · Keyframe · Tween · Rig · IK · Symbol · Audio · Lip Sync · Camera · Text · Asset Library · Project Serializer · Undo/Redo · Export · Desktop/Mobile Input.
- **Golden rules:** single source of truth · all mutations = Commands · pure `evaluate(model,time)` · cross-platform.

### 3.33.2 Full MOD list (54)  [engineering/02]
MOD-SHELL · WORKSPACE · PANEL · RENDER · SCENEGRAPH · DOC · LAYER · SELECTION · HITTEST · XFR · VECTOR · DRAWING · SHAPE · TIMELINE · FRAME · KEYFRAME · TWEEN · EASING · PATH · SYMBOL · INSTANCE · LIBRARY · RIG · BONE · IK · POSE · WARP · FBF · ONION · FACIAL · VISEME · LIPSYNC · AUDIO · CAMERA · MASK · TEXT · COLOR · IMPORT · EXPORT · SCENE · INPUT · KBD · TOUCH · COMMAND · BUS · STATE · PERSIST · AUTOSAVE · NOTIFY · OVERLAY · MODAL · A11Y · CACHE · TEST · PLUGIN.

### 3.33.3 Renderer pipeline  [F-32-01 · 06_rendering] — evaluate → layers → nesting → masks → camera → RenderTree (fill/stroke/textRun/bitmap/brushStroke/warpMesh/maskGroup/composite) → pixels. **Overlay pass (L1) never exported.** Caches: per-layer offscreen, dirty regions, tessellation.

### 3.33.4 State machines (8)  [04_state_machines]
STM-PLAYBACK · STM-EXPORT · STM-JOB · STM-MODAL · STM-TOOL · STM-EDIT · STM-FIELD · STM-DIRTY.

---

## 3.34 DATA MODEL  [F-33-01..19 · Part 33 · 03_document_model]

19 schemas: Project · Scene · Layer · Character · Body Part · Bone/Armature · Symbol & Instance · Frame · Keyframe · Tween preset · Pose · Audio · Mouth Shape · Camera · Asset · Transform · Text · Effect · Shape.
*(Full entity detail in §13.)*

Conventions: UUID ids (rename-safe) · `dataRef` indirection (binaries in `assets/`) · `formatVersion` + migration · sparse frames · derived fields never stored.

## 3.35 UI BUTTON SPEC  [F-34-01..07 · Part 34 · REQ-UI-001]

### 3.35.1–3.35.6 Button tables (grouped) — Tools (30+) · Timeline (eye/lock/outline/add/delete/play/onion/… ) · Properties (swap/frame-picker/lip-sync/add-filter/edit-ease/embed) · Library (new/delete/search/unused) · Color/Align/Transform/Info · Transport/Scenes/misc (test/publish/undo/redo/scene).

### 3.35.7 Button registry contract  [F-34-07 · REQ-UI-001] — declarative `{id, state: FUNCTIONAL|DISABLED-BY-CONTEXT|COMING-SOON, commandId, predicateId, visibility, a11yName, testId, tooltip}`. **Zero-dead-button** lint: FUNCTIONAL without commandId = fail.

## 3.36 PRIORITIES  [F-35-01..04 · Part 35]  *(full map §18)*
- P0 (MVP core) / P1 (real product) / P2 (advanced) / P3 (optional). Build order: Release 0–4.

## 3.37 FINAL NOTES  [F-36-01..04 · Part 36]

### 3.37.1 The 10 cross-cutting rules  [F-36-01]
1. single source of truth · 2. all mutations = Commands · 3. pure deterministic evaluate · 4. stable IDs, names display-only · 5. local-space rig transforms · 6. sparse frame storage · 7. dirty-region + layer caches · 8. nothing-is-a-black-box (reports) · 9. undo-consistent selection · 10. crash-safety (atomic autosave).

### 3.37.2 Performance budget  [F-36-02] — playback ≤16ms/frame · hit-test <1ms@10k · tessellation <5ms · boolean <50ms · undo instant · lip-sync <5s/60s · save non-blocking · export frame-parallel.

### 3.37.3 Glossary  [F-36-03] — 30+ terms (armature, blank keyframe, break-apart, cel, classic tween, color effect, drawing object, easing, envelope, exposure, fill rule, frame span, graphic symbol, IK, instance, keyframe, lip sync, mask, merge model, motion path, movie clip, onion skin, pivot, pose, registration point, shape hint, stream sound, swap, tween span, viseme, z-depth).

### 3.37.4 Completeness checklist  [F-36-04] — data / editor core / animation / reuse / characters / structure / I/O / cross-platform / [WISH].
