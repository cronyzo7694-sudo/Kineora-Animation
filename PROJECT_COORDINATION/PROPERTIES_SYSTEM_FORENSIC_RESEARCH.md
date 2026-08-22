# PROPERTIES SYSTEM — FORENSIC RESEARCH (PHASE 1, RESEARCH ONLY)

> **Author:** AI-D (research assignment — human coordinator order, this round)
> **Date:** 2026-08-22 · **HEAD at research:** `f5f2ab9` · **NO product code was modified.**
> **Ownership note:** the Properties system is **SYS-17** (AI-C's SYS-15..21 range per
> AI_ASSIGNMENTS). This document is research FOR the future implementing agent — it does not
> transfer ownership. Every statement is tagged: [BLUEPRINT] [SYS] [ENGINEERING] [CONTRACT]
> [CODE] [TEST] [ADOBE] [INFERENCE]. Unknowns are marked **AMBIGUOUS — NOT SPECIFIED** or
> **BLOCKED**; nothing is invented.

---

## 1. Executive Summary

Kineora has a REAL, tested Properties panel slice ([CODE] `animator/ui/src/components/
PropertiesPanel.tsx`, 426 lines; [TEST] 29 UI tests + 15 Rust engine tests) covering THREE of the
Blueprint's four context-binding modes: **Document**, **Single object** (rect | symbol instance),
**Multiple objects** (common X/Y/W/H + mixed badge). Editing is command-clean (one undo per
commit, live preview is renderer-only, invalid input reverts inline). The largest verified gaps
vs Blueprint Part 26: **tool-options context absent**, **frame/tween schema lives in the timeline
strip, not the panel**, **no registration/transform-point toggle, no constrain lock, no skew/pivot
fields despite model support**, **document schema missing background-alpha/units/platform/info
fields**, and everything gradient/blend/filter/text/camera/bone/warp is **BLOCKED by model**, not
by the panel. One suspected defect (multi-selection W/H edit reaching non-Rect nodes) needs
verification before any fix (see §30 BUG-P-001).

## 2. Repository State

- origin/main = HEAD = `f5f2ab9` (docs: layer forensic research). Working tree clean before
  research; only this document + coordination rows added.
- Recent relevant commits: `eac6e7b` (SYS-14 full `selection:changed` payload), `5b2f09d`
  (selection consumers), `40999d7..094f08f` (edit/save fixes), `290cc7d` (Insert ▸ Scene).
- Parallel research already on main: `LAYER_SYSTEM_FORENSIC_RESEARCH.md` (layer architecture is
  under separate research — §17 of this doc defers to it, per the order).

## 3. Authority Hierarchy

Blueprint > Phase 2/2.5/3 > engineering > approved decisions > forensic specs >
FOUNDATION_CONTRACT/CROSS_SYSTEM_CONTRACT > tests > code > Adobe (reference) > inference.
Code = evidence of CURRENT behavior only.

## 4. Properties Context Inventory (Phase 2)

| Context | Blueprint | Code | Tests | Adobe | Status |
|---|---|---|---|---|---|
| A. Nothing selected → Document schema | [BLUEPRINT] 26.0 precedence #4, 26.1 | [CODE] `details.length===0` → Document section | [TEST] PropertiesPanel.test doc fields | same | ✅ PARTIAL (fields missing, §6) |
| B/C. Document/Stage | merged into A ([BLUEPRINT] 26.1 "Document" includes stage W/H) | same | same | Adobe splits Doc settings dialog vs panel | ✅ PARTIAL |
| D. Single object (shape) | [BLUEPRINT] 26.2 | [CODE] `single.kind !== 'instance'` branch | [TEST] fill/stroke/x/y/w/h commits | similar | ✅ PARTIAL |
| E. Multiple objects | [BLUEPRINT] 26.11 "common fields X,Y,W,H only" | [CODE] `multi` → shared() nulls + '—' placeholder + badge | [TEST] mixed-value tests | Adobe same concept | ✅ IMPLEMENTED per 26.11 |
| F. Shape selected | = D (only Node::Rect exists) | [CODE] | [TEST] | — | ✅ rect-only |
| G. Path selected | [BLUEPRINT] 26.2 implies paths | none | none | — | ⏸️ BLOCKED — no path Node model |
| H. Text selected | [BLUEPRINT] 26.5 | none | none | — | ⏸️ BLOCKED — no Text node (SYS-07 blocked, AI-A report) |
| I. Symbol/instance | [BLUEPRINT] 26.4 | [CODE] instance branch: symbol name/type, Swap, Loop mode, First frame, (empty) badge | [TEST] swap/loop tests | Adobe has far more (color effect/filters/blend/instance name) | ✅ PARTIAL |
| J/K/L. Frame/keyframe/blank selected | [BLUEPRINT] 26.6 frame/tween schema IN PANEL | ❌ panel has NO frame context; classic-tween ease editor lives in `TimelineStrip.tsx` [CODE] | [TEST] TimelineStrip ease tests | Adobe: in panel | ⚠️ DIVERGENCE — schema location (see AMB-P-002) |
| M. Layer selected | [BLUEPRINT] 26.x none — layer props = Modify▸Timeline▸Layer Properties ([BLUEPRINT] §1.2.5) | LayersPanel color/outline dialog [CODE] | [TEST] layers | Adobe: Layer Properties dialog | ✅ matches (panel NOT required) — full dialog is a SYS-16 deferred item |
| N. Folder selected | see LAYER_SYSTEM_FORENSIC_RESEARCH.md | — | — | — | deferred to layer research |
| O. Scene selected | no scene schema in Part 26 | none | none | Adobe: none either | ✅ correctly absent |
| P. Tool active, no selection | [BLUEPRINT] 26.0 precedence #1 — TOOL OPTIONS FIRST | ❌ ABSENT (panel comment: "Tool-options schema is a later unit") | none | Adobe same precedence | ❌ MISSING (P0 gap — precedence order itself is violated: doc schema shows even when a drawing tool is armed) |
| Q. Tool active + selection | [BLUEPRINT] 26.0 #2 selection wins | trivially true today (no tool schema) | — | same | ⚠️ becomes real once P lands |

## 5. Complete Property Inventory (Phase 3 master table)

Legend: U=undo one command, D=dirty via snapshot, P=persisted in document JSON.

| Property | Context | Editable | Source | Default | Range | Unit | U | D | P | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| doc width | Document | ✅ | [CODE][TEST] `SetDocumentSettings` | 1920 [CODE H01] | ≥2, no upper (P-2) [SYS] | px | ✅ | ✅ | ✅ | OK |
| doc height | Document | ✅ | same | 1080 | ≥2 | px | ✅ | ✅ | ✅ | OK |
| doc fps | Document | ✅ (Math.round in panel) | same | 24 | 1–120 clamp [SYS H01] | fps | ✅ | ✅ | ✅ | OK |
| doc background | Document | ✅ live-preview | same | #ffffff | hex | — | ✅ | ✅ | ✅ | OK |
| doc backgroundAlpha | Document | ❌ not in panel | model `Settings.background_alpha` [CODE]; [BLUEPRINT] 26.1 "+ alpha" | 1.0 | 0..=1 clamp [CODE H01] | — | — | — | ✅ | ❌ MISSING FIELD |
| doc units | Document | ❌ not in panel | `Settings.units` [CODE]; [BLUEPRINT] 26.1 "Ruler units" | 'px' | px/in/cm/mm [CODE PLATFORM_OPTIONS] | — | — | — | ✅ | ❌ MISSING FIELD |
| doc platform | Document | ❌ | `Settings.platform` [CODE]; [BLUEPRINT] 26.1 Platform section | 'HTML5 Canvas' | 3 options [CODE] | — | — | — | ✅ | ❌ MISSING FIELD (editability post-create: **AMBIGUOUS — NOT SPECIFIED**) |
| doc auto-save interval | Document | — | [BLUEPRINT] 26.1 | NOT SPECIFIED | NOT SPECIFIED | — | — | — | — | ⏸️ BLOCKED — SYS-28 autosave constants are `[ENGINEERING DECISION]` (2s/30s); a USER setting is not specified anywhere else → AMB-P-001 |
| doc title/description/author | Document Info | — | [BLUEPRINT] 26.1 Info; meta owner = SYS-06/SYS-17 (FL-0004) | model `Meta{title,author}` exists, `description` ABSENT [CODE] | — | — | — | — | ✅(2 of 3) | ❌ MISSING FIELDS (+ `description` needs model INT) |
| doc publish profile/folder | Document | — | [BLUEPRINT] 26.1 Publish | none | — | — | — | — | — | ⏸️ BLOCKED — SYS-27 publish-settings unit |
| obj X, Y | Single+Multi | ✅ | `patchTransforms` → `TransformSelection` [CODE] | — | unbounded f64 | px (stage coords, +y down, origin top-left) [CODE renderer/export] | ✅ | ✅ | ✅ (per-keyframe transforms) | OK |
| obj W, H | Single(non-instance)+Multi | ✅ | `setNodeProps` (base dims) [CODE] | — | ≥0 (panel min=0; engine clamps ≥0 [CODE apply_node_props "clamped ≥ 0"]) | px | ✅ | ✅ | ✅ | OK; see BUG-P-001 for multi w/ instance |
| obj rotation | Single | ✅ | `patchTransforms` | 0 | unbounded | degrees, around rect CENTER [CODE export.rs comment] | ✅ | ✅ | ✅ | OK; pivot fields unused — AMB-P-003 |
| obj scaleX/scaleY | Single | ✅ | `patchTransforms` (÷100 in panel) | 100% | unbounded (negative = flip [ENGINEERING eng08]) | % in UI, factor in model | ✅ | ✅ | ✅ | OK |
| obj skewX/skewY | — | ❌ not in panel | model `Transform.skew_x/skew_y` EXISTS [CODE] | 0 | NOT SPECIFIED | NOT SPECIFIED | — | — | ✅ | ❌ MISSING FIELDS (renderer support unverified — verify before exposing) |
| obj pivotX/pivotY | — | ❌ | model fields exist, default 0; renderer/export rotate around CENTER regardless | 0 | — | — | — | — | ✅ | AMB-P-003 (pivot semantics undefined in practice) |
| registration/transform-point toggle | Single | — | [BLUEPRINT] 26.2, [CONTRACT] C-09 prp.regtransform | — | — | — | — | — | — | ❌ MISSING (depends on AMB-P-003) |
| constrain-proportions lock | Single | — | [BLUEPRINT] 26.2 | — | — | — | — | — | — | ❌ MISSING (pure UI over existing commands) |
| fill color | Single(shape)+? | ✅ live-preview | `setNodeProps.fill` hex string | '#00ff00' draw default? **NOT SPECIFIED** (tool default) | #rrggbb only | — | ✅ | ✅ | ✅ [TEST fill_change_flows_into_export_and_survives_save_load] | OK (solid only) |
| fill alpha / type / gradient / bitmap | — | — | [BLUEPRINT] 26.2 Fill section | — | — | — | — | — | — | ⏸️ BLOCKED — color model is a plain hex string; no alpha channel, no gradient type in `Node::Rect` [CODE] |
| stroke enabled | Single | ✅ tri-state patch | `stroke_enabled` Option<bool> [CODE] | no stroke | — | — | ✅ | ✅ | ✅ | OK [TEST stroke_enable/disable] |
| stroke color | Single | ✅ live-preview | `stroke` hex | '#000000' when enabling [CODE panel] | #rrggbb | — | ✅ | ✅ | ✅ | OK |
| stroke width | Single | ✅ live-preview | `stroke_width` | 0 | ≥0 (panel min) | px | ✅ | ✅ | ✅ | OK |
| stroke style/cap/join/miter/dash | — | — | [BLUEPRINT] 26.2 Stroke | — | — | — | — | — | — | ⏸️ BLOCKED — model has only color+width |
| instance: symbol name/type | Single instance | read-only + Swap | `SelDetailJson.symbol_*` [CODE] | — | — | — | swap ✅ | ✅ | ✅ | OK |
| instance: loop mode / first frame | Single instance (graphic-like) | ✅ | `setInstanceLoop` [CODE]; [BLUEPRINT] 26.4 Looping | 'loop' / 1 | loop/playOnce/singleFrame; ≥1 | frames | ✅ | ✅ | ✅ | OK |
| instance name (scripting) | — | — | [BLUEPRINT] 26.4 | — | — | — | — | — | — | ⏸️ BLOCKED — no field on instance node model |
| color effect/blend/filters | — | — | [BLUEPRINT] 26.4 | — | — | — | — | — | — | ⏸️ BLOCKED — model + renderer |
| frame label/sound/actions; tween ease/rotate/orient | Frame ctx | ease slider only, in TimelineStrip [CODE] | [BLUEPRINT] 26.6 | ease 0 | −100..+100 [CODE] | — | ✅ (idempotent commit guard [CODE]) | ✅ | ✅ (tweens map) | ⚠️ PARTIAL + location divergence AMB-P-002; label field: model `Frame.label` exists — panel/strip edit **absent** |

## 6.–7. Document & Stage Properties (Phase 4)

All document properties live in ONE struct: `Settings { width, height, fps, background,
background_alpha, units, platform }` [CODE model.rs] + `Meta { title, author, created_at,
modified_at }`. Owner: MOD-DOC storage; edit command `SetDocumentSettings` (validated:
`document_settings_are_validated` [TEST] — W/H≥2, fps 1..=120). Flow: panel →
`setDocumentSettings(patch)` → wasm → command → History → `document:changed{type:'settings'}`
[CODE client.ts] → App tick → repaint; renderer reads doc size/bg per frame → immediate.
formatVersion: SYS-28-owned, NEVER a panel field ([SYS] H10 §6 — display-only candidacy:
**AMBIGUOUS — NOT SPECIFIED**). Document name/path: SYS-02 identity — title bar + tabs, not the
panel [SYS H00 §5]. Ctrl+J opens the SAME schema as a dialog (`modify.document` → DocumentSettings
dialog [CODE App]) — two UIs over one command; consistent.

## 8.–9. Object Properties & Transform System (Phases 5–6)

Data model [CODE model.rs]: `Node::Rect { id, transform: Transform, width, height, fill,
stroke: Option<String>, stroke_width }` · `Node::Instance { symbol/loop fields, transform }` ·
`Transform { x, y, scale_x, scale_y, rotation, skew_x, skew_y, pivot_x, pivot_y }`.
- **Coordinates:** stage space, origin top-left, +y down; X/Y = the transform translation AT THE
  PLAYHEAD (per-keyframe transforms map: `Keyframe.transforms[NodeId]`) [CODE eval.rs/renderer].
  VERIFIED not-assumed: export clips to stage; viewport zoom/pan never enters values [CODE
  export.rs].
- **Composition:** evaluate() resolves base node + keyframe transform + tween interpolation →
  flat item {x,y,w,h,rotation,fill,stroke}; rotation applied around item CENTER at render/export
  [CODE]. scale multiplies base dims (`w = base_w * scale_x`) [CODE SelDetail base_w vs w].
  Matrix order beyond translate→scale→rotate(center): skew NOT rendered anywhere found —
  **verify in canvasRenderer before exposing skew fields** (flagged in P2 plan).
- **Editing at interpolated frames:** `patch_transform_at_interpolated_frame_does_not_jump`
  [TEST] — the engine auto-keys/updates correctly; no visual jump. No-op patches create NO
  command [TEST]. Cross-layer multi-patch: each node patched on its own layer, ONE command
  [TEST multi_node_patch_is_one_command, move_selection_across_layers…].

## 10.–13. Shape / Fill / Stroke / Color (Phases 8–11)

Only RECT exists. Oval/polystar/line/path/pen/primitives: no Node variants, no tools —
⏸️ BLOCKED BY MODEL (MOD-VECTOR foundation is spec-only [CONTRACT §C]). Fill = single hex string;
NO alpha, NO gradients, NO bitmap — the [BLUEPRINT] 26.2 fill/stroke sections are 80% blocked by
the color/vector model, not by panel work. Canonical color representation TODAY: `#rrggbb`
lowercase-insensitive string stored verbatim [CODE]; `<input type=color>` is the picker;
eyedropper/swatches/recent = SYS-21 (absent). Any gradient work needs a Leader-approved MOD-COLOR/
MOD-VECTOR foundation INT first — DO NOT start from the panel.

## 14. Text Properties (Phase 12)
Entire [BLUEPRINT] 26.5 schema = TARGET REQUIRED, ⏸️ BLOCKED BY MODEL (no Node::Text; SYS-07
blocked per AI-A report). Nothing implemented; nothing to fix in the panel until the model lands.

## 15. Symbol / Instance (Phase 13)
Implemented: name/type display, empty badge, Swap (Library dropdown), loop mode, first frame —
all engine-backed + tested [TEST symbols.rs / PropertiesPanel.test]. Missing vs 26.4: instance
name, color effect, blend, filters, button tracking, Frame Picker UI, lip-sync — first two need
model INTs; rest blocked (filters/renderer, audio). W/H for instances: panel hides base W/H
(instance dims derive from symbol content + scale) [CODE] — matches Adobe's derived sizing
[ADOBE]; Blueprint 26.4 lists W/H for instances → **divergence AMB-P-004** (does 26.4 W/H mean
scale-derived display? NOT SPECIFIED).

## 16. Frame Properties (Phase 14)
Panel has NO frame context. Existing frame-property surface: TimelineStrip span selection → ease
slider (−100..+100, draft + idempotent commit + one undo) [CODE TimelineStrip]. `Frame.label`
exists in the model, serialized, but NO edit UI anywhere [CODE grep]. Sound/actions/rotate/orient/
sync: blocked (audio model absent; rotate flags absent from ClassicTween struct — REQ-TWN-002 gap,
already on AI-D's SYS-23 list). Where the frame schema should LIVE (panel per 26.6 vs strip as
today) = **AMB-P-002 — a product/UX decision for the Leader**, not inventable.

## 17. Layer Properties (Phase 15)
Deferred to `LAYER_SYSTEM_FORENSIC_RESEARCH.md` (parallel research, same repo). Panel-relevant
facts only: no layer context in the panel [CODE]; layer name/color/outline edited in LayersPanel;
"do ALL layers appear on the timeline" and folder cascade semantics → covered by that document.

## 18. Scene Properties (Phase 16)
No scene schema in Part 26 (correctly absent from the panel). Scene name display: EditBar
breadcrumb + status [CODE]. Rename/duplicate/reorder = Scene panel features (Part 25.1), not
Properties. Per-scene background/fps overrides are P1/P2 wishes [BLUEPRINT 25.2] — NOT current
requirements.

## 19. Tool Properties (Phase 17)
Blueprint 26.0 precedence #1 (tool schema when tool armed + nothing selected) is **entirely
missing** — with only 2 real tools today (selection, rect-draw [CODE Toolbar/Stage]), the required
schema content per tool is thin but the PRECEDENCE mechanism is a P0 architectural gap: the panel
currently shows Document schema while a draw tool is armed. Tool option persistence scope
(global vs doc): **AMBIGUOUS — NOT SPECIFIED** for Kineora (Adobe: app-level [ADOBE]) → AMB-P-005.

## 20.–21. Multi-Selection & Mixed Values (Phases 7, 20)
[CODE-verified]: `shared(pick)` → value shown only when ALL agree, else empty field with '—'
placeholder + "Mixed selection — common fields only" badge; typing 80 into opacity-equivalent
(e.g. X) **sets the ABSOLUTE value on every selected node** (one command) — A→80, B→80. Common
fields = X/Y/W/H (+rotation/scale hidden in multi — panel shows them only for `single`) — matches
[BLUEPRINT] 26.11. Type-specific sections hidden in multi ✓. Payload consumed: the panel reads
`status.selection_details` (poll+events), NOT the `selection:changed` payload — the full
`{prevTargets,targets,kind,commonType,bounds}` (SYS-14, `eac6e7b`) is consumed by App re-render
tick only [CODE App.tsx:245]. No stale-panel path found: selection/document/activeDoc events all
tick + 120ms poll backstop [CODE].

## 22. Property Editing Semantics (Phase 18) — VERIFIED [CODE]
Numeric: focus → type (live renderer-only preview when valid) → **Enter/blur commits ONE
command** → invalid = inline error + revert (never silent) → Esc = cancel + clear preview →
unmount clears preview. Color: picker drag = live preview (`input`), **commit on native `change`
(picker close)/blur/Enter, deduped** (lastCommitted guard → close-then-blur = ONE command) →
Esc reverts. Multi: same value to all targets, one command. No keystroke-commits anywhere.
Matches [CONTRACT] C-09 §C/§G exactly.

## 23. Dependencies (Phase 19)
Verified graph: scale_x ↔ displayed W (W field edits BASE dims; scale edits multiplier — the two
are INDEPENDENT writes; combined visual size = base×scale [CODE]) · stroke enabled → gates
color/width fields [CODE] · fps → playback timing + publish output [CODE export27] · doc W/H →
stage + export clip [CODE] · selection → panel context · playhead → X/Y/rotation values (frame-
dependent transforms). No constrain lock exists, so no W↔H dependency today.

## 24. Validation (Phase 21)
Panel: `Number()` parse; rejects NaN/±Infinity/empty (revert, error text with range); min/max per
field (docW/H ≥2, fps 1..120, W/H ≥0, stroke-width ≥0). Engine double-validates: settings
[TEST document_settings_are_validated], dims clamp ≥0 [CODE]. Scientific notation: `Number()`
accepts "1e3" → committed as 1000 [CODE — INFERENCE from JS semantics, not explicitly tested].
Decimals: full f64 stored; DISPLAY rounded to 2dp (`fmt`) [CODE] — display-only, no data loss.

## 25.–26. Events & Undo (Phases 22–23)
Chain (verified): field commit → client fn → wasm command → History (one entry incl. multi-node)
→ client emits `document:changed{type:'transform'|'settings'}` → App tick → statusJson re-read →
panel re-derives → renderer redraws from evaluate(). No duplicate emission, no event loop (panel
never emits on receive). Undo table highlights [TEST properties.rs]: base-props undo/redo EXACT ·
stroke enable→recolor = separate steps · settings undo/redo exact · no-op = no entry · multi =
one entry · prevSelection restore = C-2 History contract (post-`fe7566f`).

## 27.–28. Persistence & Rendering (Phases 24–25)
Round-trips proven: fill [TEST], stroke into evaluate + SVG export [TEST], settings, transforms,
tweens [TEST tween_survives_save_load]. No display-but-not-saved property found. All visual
properties reach the renderer through the SAME evaluate() pass (authoring = export, REQ-EXP-002)
— immediate on commit; live preview covers pre-commit.

## 29. Cross-System Ownership (Phase 27)

| Concern | Owner | Panel's role |
|---|---|---|
| Panel UI + schemas | **SYS-17** (AI-C range) | render + command dispatch |
| selection payload | SYS-14 (AI-B) | consumer |
| transform/base commands | MOD-COMMAND foundation + SYS-22 semantics | dispatch only |
| document settings | SYS-06 (Ctrl+J) + SYS-17 shared schema | same command |
| meta title/author writer | SYS-06/SYS-17 (FL-0004) | future Info section |
| frame/tween schema | SYS-15 strip today; AMB-P-002 for target | — |
| color model/gradients | MOD-COLOR foundation (Leader) | blocked consumer |
| persistence | SYS-28 | none (panel never serializes) |

## 30. Bugs (Phase 28 — evidence-backed; DO NOT FIX in research phase)

**BUG-P-001 (SUSPECTED — verify first)** · FILE `PropertiesPanel.tsx` (W/H render condition) +
`session.rs apply_node_props` · CURRENT: in a MULTI selection containing an instance, W/H fields
render (condition checks `single?.kind` which is null in multi) and commit `setNodeProps(width)`
against ALL ids including instances; `apply_node_props` matches `Node::Rect{..}` — behavior for
`Node::Instance` unverified (ignore? clone-through?). EXPECTED: instances excluded or safely
ignored, никогда corrupted. AUTHORITY [BLUEPRINT 26.11 common fields] leaves instance W/H open
(AMB-P-004). SEVERITY: MEDIUM (potential silent no-op inconsistency; data corruption unlikely but
unproven). OWNER: SYS-17 + SYS-22. REPRO: select rect+instance → edit W → inspect instance node.
RECOMMENDATION: add a Rust test first; then either filter instance ids in the panel commit or
make the engine behavior explicit.

**BUG-P-002 (COSMETIC/CONTRACT)** · `props-context` chip shows only Document/Object/Objects(n) —
C-09 requires tool/frame contexts in the chip once those modes exist. Not a defect today; will be
one after P0. SEVERITY LOW.

No stale-panel, no undo-bypass, no dirty-without-mutation, no polling-only refresh found — the
120ms poll is a BACKSTOP on top of events, matching STATUS.md's documented "honest refresh"
posture [CODE][SYS].

## 31.–32. Ambiguities & Blocked (Phases 33 input)

| ID | Question | Status |
|---|---|---|
| AMB-P-001 | Auto-save interval as a USER document setting (26.1) vs SYS-28 `[ENGINEERING DECISION]` constants | AMBIGUOUS — NOT SPECIFIED (Leader/human) |
| AMB-P-002 | Frame/tween schema location: Properties panel (26.6) vs TimelineStrip (current) | AMBIGUOUS — product decision |
| AMB-P-003 | Pivot/registration semantics: model has pivot_x/y (unused); renderer rotates around CENTER; Blueprint wants a registration/transform-point toggle | AMBIGUOUS — needs SYS-22 transform-spec resolution BEFORE the toggle |
| AMB-P-004 | Instance W/H display/edit (26.4 lists W/H; panel hides; Adobe shows derived) | AMBIGUOUS |
| AMB-P-005 | Tool-option persistence scope (global vs per-document) | AMBIGUOUS — NOT SPECIFIED |
| BLOCKED | gradients/alpha-fills/blend/filters/text/camera/bone/warp/audio/instance-name/stroke-styles/primitives/description-meta | model/foundation INTs required (MOD-COLOR, MOD-VECTOR, Node::Text, camera entity, audio assets) |

## 33. Adobe vs Kineora Matrix (Phase 26 — divergences that matter)
Adobe splits Doc properties (modal) vs panel; Kineora = one schema, two surfaces (dialog+panel) —
Kineora wins [BLUEPRINT 26.1]. Adobe FPS uses stepper+decimal fps; Kineora clamps int 1–120
[SYS H01] — Kineora wins. Adobe mixed-selection shows blank fields — Kineora identical ('—').
Adobe instance panel has Position&Size incl. W/H (derived, editable → adjusts scale); Kineora
hides (AMB-P-004). Adobe registration grid (9-point) on convert; transform point separate —
Kineora has neither (AMB-P-003). Adobe properties NOT added to requirement where Kineora silent:
filters UI details, 3D translation/rotation, TLF text, accessibility panel fields.

## 34.–35. Ownership Matrix & Data Model (Phases 29–30)
See §5 columns + §29. Data structures (existing, do NOT redesign): `Document{settings, scenes,
nodes, library, meta, format_version, next_id}` · `Scene{id,name,layers}` · `Layer{...kind,
parent_id,collapsed}` · `Keyframe{content, transforms, label}` · `ClassicTween{end,ease}` ·
`Node::Rect/Instance` · `Transform{x,y,scale,rotation,skew,pivot}` · `Settings` · `Meta` ·
selection: `Session.selection: Vec<NodeId>` + `SelDetailJson` projection · tool state: App-level
`tool` string + bus `tool:changed` [CODE].

## 36.–38. Target Architecture, Implementation Blueprint & Priorities (Phase 31 — NO CODE)

**P0 — foundational correctness (SYS-17 owner):**
1. Context-binding PRECEDENCE per 26.0 incl. tool-options mode. Files: `PropertiesPanel.tsx`
   (context resolution), `App.tsx` (pass `tool`), reuse `tool:changed`. No new events. Tests:
   context matrix (tool armed + empty selection → tool schema; selection overrides tool).
2. BUG-P-001 verification test (`animator/core/tests/properties.rs`) + panel-side id filtering if
   confirmed. Must NOT change `NodePropsPatch` shape.
**P1 — core object properties:** background-alpha, units, platform (read-only until AMB), Info
(title/author — writer contract FL-0004) fields on the document schema; constrain-proportions
lock (UI-only over existing commands); rotation/scale in MULTI = blocked by 26.11 (common four
only — do NOT add). Files: `PropertiesPanel.tsx`, `client.ts setDocumentSettings` (already
supports patch), possibly `SettingsPatchJson` extension (units/platform — verify wasm command
accepts; if not, ONE foundation-adjacent INT).
**P2 — transform completion:** skew fields ONLY after verifying renderer applies skew (canvas +
export + eval parity — REQ-EXP-002); pivot/registration AFTER AMB-P-003 is resolved by a SYS-22
spec increment. Risk: exposing model fields the renderer ignores = fake UI (forbidden).
**P3 — timeline/layer/scene:** frame-label editor (model field exists; location per AMB-P-002);
classic-tween rotate flags (SYS-23 REQ-TWN-002 — AI-D); layer dialog per layer research doc.
**P4 — text/symbol:** blocked chain — Node::Text model INT → 26.5; instance-name model INT → 26.4.
**P5 — advanced:** gradients/blend/filters/camera/audio — each behind its foundation INT.
**What must NOT be changed by ANY of the above:** command-per-commit undo shape · renderer-only
preview channel · `document:changed` payload schema (FL-0030) · Settings serialization ·
selection payload · the poll backstop (until the Leader retires it globally).

## 39. Test Matrix (Phase 32 summary — required per increment)
Context×(display/edit/validate/undo/redo/dirty/save/load/render/events) × (single/multi/locked-
layer/hidden-layer/instance/empty-selection/tool-armed) + regression: existing 29 UI + 15 Rust
tests MUST stay green; every new field needs: commit-once, invalid-revert, Esc-cancel, mixed-
value, no-op-no-command, persistence-roundtrip, live-preview-no-engine-write.

## 40. Do-Not-Invent List (Phase 33)
Adobe-only (NOT Kineora requirements): 3D rotation/translation, TLF, accessibility fields, CSS
filters set beyond 26.4's list. Blocked-by-model: everything in §31 BLOCKED row. Unresolved:
AMB-P-001..005 + defaults for any new tool schema (NOT SPECIFIED) + skew range/units (NOT
SPECIFIED) + gradient data model (NOT SPECIFIED).

## 41. Recommended Implementation Order
P0.2 (BUG-P-001 verify — smallest, protects data) → P0.1 (precedence + tool mode) → P1 doc-schema
fields → P3 frame-label (after AMB-P-002 ruling) → P2 skew (after renderer verification) → rest
behind INTs/AMBs. Owner: SYS-17 (AI-C) unless Leader reassigns; SYS-22/23 items to AI-D.

## 42. Sources
Blueprint Part 26 (all sections), 01 §1.2.5/§1.6/§1.7, 03 §3.4.10, 04, 23, 25, 33 §33.1 ·
C-09 contract · eng 03/05/08/11 · FOUNDATION_CONTRACT §C · CROSS_SYSTEM_CONTRACT §D/§F ·
AI01_FORENSIC_LESSONS (FL-0004/0009/0030) · code: PropertiesPanel.tsx, client.ts (§840-860),
wasmTypes.ts (SelDetailJson), session.rs (NodePropsPatch/apply_node_props/selected_transform),
command.rs (TransformSelection/SetNodeProps/SetDocumentSettings), wasm.rs (§1085-1130), model.rs,
export.rs, TimelineStrip.tsx, LayersPanel.tsx, App.tsx (§240-250) · tests: properties.rs (15),
PropertiesPanel.test.tsx (29), transform*.rs, tween.rs · Adobe Animate Help (Properties panel,
document settings, symbol instances, mixed selection) as REFERENCE ONLY.
