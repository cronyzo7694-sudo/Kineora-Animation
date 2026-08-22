# KINEORA ANIMATION — TOOLS SYSTEM FORENSIC RESEARCH

```
PHASE:     RESEARCH ONLY (no product code, no feature implementation)
DATE:      2026-08-23
HEAD:      7ab803a0120e624fa82dc30f9be9136dd5e79711 (origin/main at research start after fetch)
REPO:      https://github.com/cronyzo7694-sudo/Kineora-Animation
AUTHORITY: Blueprint > Phase 2/2.5/3 > Engineering > Decisions > Forensic > Tests > Code > Adobe
```

This document is the implementation blueprint for later coding AIs. It does **not** invent product decisions. Where Kineora does not specify a rule, the cell is **AMBIGUOUS / NOT SPECIFIED**. Adobe is reference-only.

---

## 1. Executive Summary

Kineora’s **Blueprint Parts 02a–02d** specify a complete professional toolset (Selection, Subselection, Free Transform, Gradient Transform, Lasso, Pen + anchors, Text, Line, Rectangle, Oval, Primitives, PolyStar, Pencil, Brush, Paint Brush, Eraser, Width, Eyedropper, Paint Bucket, Ink Bottle, Hand, Zoom, Stage Rotate, Time Scrubber, Bone, Bind, Camera, Asset Warp). Legacy 3D tools, Fluid Brush, Deco, and Spray are explicitly **not** shipped as separate tools. [BLUEPRINT]

**Current engine + UI implement only a thin slice:**

| Implemented in code | Evidence |
|---|---|
| Selection tool (`tool.select`, shortcut V) | `commands.ts`, `Stage.tsx` [CODE] |
| Rectangle tool (`tool.rect`, shortcut R) | `Stage.tsx` → `drawRect` → `Session::draw_rect` → `DrawRect` [CODE] |
| Free Transform *as a command/tool id* (`tool.transform`, Q) | Registry exists; **Stage pointer path ignores `tool === 'transform'`** — handles run while `select` is active [CODE] |
| Viewport zoom/pan (not Zoom/Hand tools) | Wheel zoom, middle-button pan, View menu zoom commands [CODE] |
| Move / scale / rotate of `Node::Rect` + `Node::SymbolInstance` | `MoveSelection`, `TransformSelection` [CODE] |

**Node model is only two kinds:** `Node::Rect` and `Node::SymbolInstance`. There is **no** path, fill-region, stroke-spine, bezier, text, bitmap, primitive, brush-stroke, warp, bone, or camera node. [CODE] `animator/core/src/model.rs`

**Phase 2.5 UI contracts C-13 / C-14 / C-15 mark drawing/shape/transform UI as “UI COMPLETE / FUNCTIONAL.”** That is a **UI-contract completeness claim**, not engine completeness. The live command registry only exposes three tools. Treating C-13 as “tools are done” would be a product lie. [ENGINEERING] vs [CODE]

**Highest-value discovery:** future drawing tools cannot be honest until (1) a path/shape node type exists (or Rect is generalized), (2) current stroke/fill style is a first-class session state (draw currently hardcodes `#3f9bf5` and `stroke: None`), (3) tool state machine actually routes pointer events by `currentTool`, (4) folder/locked/hidden draw contract (already in `draw_rect`) is reused, not re-invented. [CODE] [BLUEPRINT]

**Do not mark SYS-13 Tools COMPLETE.** Board already says QUEUED / “5 tools” — even that “5” is **not evidenced** in the registry (only 3 command IDs). [CODE] [FORENSIC]

---

## 2. Repository State

| Item | Value | Tag |
|---|---|---|
| Research clone HEAD after `git fetch` + fast-forward | `7ab803a` `docs(ai-d): BUG-D-001 — pre-existing failing sys03-edit test` | [CODE] |
| Prior research-known HEAD | `37062ee` Find & Replace | [CODE] |
| Working tree at research start | clean | [CODE] |
| Product files modified this phase | **none** | — |
| Formal `FORENSIC_SPECS/SYS-13` | **does not exist** (queue says all SYS 1–28 QUEUED for naming) | [FORENSIC] |
| SYS-15…21 forensic folders | **do not exist** | [FORENSIC] |
| SYS-13 on PROJECT_BOARD | Owner AI-B, SPEC QUEUED, IMPL “5 tools” | [FORENSIC] |
| SYS-20 Drawing/Shapes | Owner AI-C, QUEUED, IMPL partial | [FORENSIC] |
| SYS-22 Transform | Owner AI-D, QUEUED, IMPL partial | [FORENSIC] |

Recent non-tool work on `main` since `37062ee`: File Save FSA, Insert Scene (`290cc7d`), rustfmt (`401370c`), AI-D BUG-D-001 note (`7ab803a`). [CODE]

---

## 3. Authority Hierarchy

1. Kineora Blueprint (`animate-blueprint/02a–02d`, `03`, `04`, `05`, `06`, `20`, `23`, `26`, `29`, `33`)
2. Phase 2 deep-research (`F-02-00_tools_full`, `F-03-*`, `F-04-*`, `F-05-*`, `F-06-*`)
3. Phase 2.5 UI contracts (`C-13`, `C-14`, `C-15`, `C-01`, `C-16`, `C-23`, `C-24`, `C-27`)
4. Engineering / FOUNDATION / CROSS contracts
5. Approved decisions (`DECISIONS.md`)
6. FORENSIC_SPECS (SYS-01…04 exist; SYS-13 does not)
7. Existing tests
8. Existing code (`animator/`)
9. Official Adobe helpx/learn.adobe.com
10. Inference — **never silently promoted to requirement**

**When Blueprint and Adobe differ, Blueprint wins.** Example: Eyedropper must **not** auto-paint on hover (WISH W6). [BLUEPRINT] [ADOBE]

**Code is not automatically correct.** Examples: `copyFrames` emits `document:changed` (Copy must not mutate). [CODE] `tool.transform` does not change Stage gesture routing. [CODE]

---

## 4. Complete Tool Inventory

Legend for **Required**: YES = Blueprint lists an equivalent; NO = Blueprint says do not ship / legacy; REF = Adobe-only unless decided.

| Tool | Blueprint | Specs | Current Code | Adobe | Required | Status |
|---|---|---|---|---|---|---|
| Selection | T2A.1 | C-01, SYS-14 | FUNCTIONAL (click/shift/marquee/move; **no** edge-reshape) | yes | YES | PARTIAL |
| Subselection | T2A.2 | C-01 | **none** (no path anchors) | yes | YES | NOT IMPLEMENTED |
| Free Transform | T2A.3 | C-15 | PARTIAL (scale/rotate handles on **select** tool; no dedicated Q mode, no pivot drag, no distort/envelope/skew) | yes | YES | PARTIAL |
| Gradient Transform | T2A.4 | C-15 | none (no gradient fill matrix) | yes | YES | NOT IMPLEMENTED |
| 3D Rotation | T2A.5 LEGACY | — | none | AS3 only | **NOT REQUIRED** as separate tool | NOT REQUIRED |
| 3D Translation | T2A.6 LEGACY | — | none | AS3 only | **NOT REQUIRED** as separate tool | NOT REQUIRED |
| Lasso / Polygon / Wand | T2A.7 | F-03-06 | none | yes | YES | NOT IMPLEMENTED |
| Pen + Add/Delete/Convert | T2B.1 | C-13 | none | yes | YES | NOT IMPLEMENTED |
| Text | T2B.2 | C-16, SYS-07 | Text **menu** DEFERRED; no Text tool | yes | YES | DEFERRED (blocked by text engine) |
| Line | T2B.3 | C-13 | none | yes (stroke only, no fill) | YES | NOT IMPLEMENTED |
| Rectangle | T2B.4 | C-13 | PARTIAL (`Node::Rect`, hardcoded fill, no Shift/Alt, no radius, no current style) | yes | YES | PARTIAL |
| Oval | T2B.5 | C-13 | none | yes | YES | NOT IMPLEMENTED |
| Rect/Oval Primitive | T2B.6–7 | C-13 | none | yes | YES | NOT IMPLEMENTED |
| PolyStar | T2B.8 | C-13 | none | yes | YES | NOT IMPLEMENTED |
| Pencil | T2C.1 | C-13 | none | yes | YES | NOT IMPLEMENTED |
| Brush (fill) | T2C.2 | C-13 | none | yes | YES | NOT IMPLEMENTED |
| Paint Brush (art/pattern) | T2C.3 | C-13 | none | yes | YES | NOT IMPLEMENTED |
| Fluid Brush | T2C.4 REMOVED | — | none | removed | **NOT REQUIRED** (fold into Brush P2) | NOT REQUIRED |
| Eraser | T2C.5 | C-13 | none | yes | YES | NOT IMPLEMENTED |
| Width | T2C.6 | C-13 | none (no widthProfile) | yes | YES | NOT IMPLEMENTED |
| Eyedropper | T2D.1 | C-13 | none | yes (Adobe auto-switches; **Kineora forbids hover-paint**) | YES | NOT IMPLEMENTED |
| Paint Bucket | T2D.2 | C-13 | none | yes | YES | NOT IMPLEMENTED |
| Ink Bottle | T2D.3 | C-13 | none | yes | YES | NOT IMPLEMENTED |
| Hand | T2D.4 | C-13 | no tool; middle-button pan; **no Space temporary Hand** | yes | YES | PARTIAL (view only, no tool) |
| Zoom | T2D.5 | C-13 | no tool; wheel + View menu; **no Z click/marquee** | yes | YES | PARTIAL (view only, no tool) |
| Stage Rotate | T2D.6 | — | none | recent Adobe | YES (view-only) | NOT IMPLEMENTED |
| Time Scrubber | T2D.7 | — | none | recent Adobe | YES (P2 in Blueprint) | DEFERRED |
| Bone | T2D.8 | C-23, Part 14 | none | yes | YES | NOT IMPLEMENTED |
| Bind | T2D.9 | C-23 | none | yes | YES | NOT IMPLEMENTED |
| Camera | T2D.10 | C-27, Part 16 | none | yes | YES | NOT IMPLEMENTED |
| Asset Warp | T2D.11 | C-24 | none | yes | YES | NOT IMPLEMENTED |
| Deco / Spray | T2D.12–13 LEGACY | — | none | removed | **NOT REQUIRED** (P3 plugin optional) | NOT REQUIRED |

**C-13 lists `t.pen` … `t.ink` as FUNCTIONAL.** That contract is **out of date relative to `commands.ts`**. Coding agents must treat C-13 as a *target UI checklist*, not current truth. [ENGINEERING] [CODE]

---

## 5. Tool-by-Tool Forensic Research

Shared draw-target contract (applies to every mutating tool unless a tool is view-only):

Blueprint T2B.1 field 16: draw into **active layer + current frame**; locked/hidden blocked; tween layer blocked; non-keyframe **auto-inserts keyframe + toast**. [BLUEPRINT]

Code `Session::draw_rect`: blocks **folder**, **hidden**, **locked**; returns `NodeId(0)`; logs `draw:blocked(...)`. Does **not** check tween layer. `DrawRect.apply` calls `ensure_keyframe` (silent auto-key, **no toast**). [CODE]

---

### TOOL: Selection

**A. Purpose.** Select whole objects; move; (Blueprint) reshape raw edges; drill-in on double-click. Default tool. [BLUEPRINT] T2A.1

**B. Kineora Requirement.** Shortcut `V`. Click = replace select; empty = deselect; Shift+click toggle; marquee; Contact-Sensitive ON/OFF (preference); locked/hidden skipped; `Ctrl+A` unlocked+visible current timeline. Move = one `MoveCommand`. Edge-reshape of raw paths. Auto-key on non-keyframe move + toast. [BLUEPRINT]

**C. Adobe Behavior.** Black arrow; marquee; Shift add; Contact Sensitive option; edge reshape of merge shapes. [ADOBE] (standard Selection tool — helpx selection docs)

**D. Current implementation.**
- UI: `tool.select` FUNCTIONAL, toolbar, V. `App.tsx` `useState('select')`, `bus.emit('tool:changed', { toolId })`.
- Stage (`Stage.tsx`): left-down on select → handle hit (scale/rotate) **or** Shift toggle **or** `selectAt` then move-drag **or** marquee.
- Engine: `select_at`, `select_toggle_at`, `select_in_rect` (contact-sensitive **always ON** — AABB touch), `select_all` skips hidden/locked, `move_selection` (zero delta no-op).
- Hit test: `eval.rs` AABB of Rect/instance (rotated rect). **No** path-edge hit. [CODE]

**E. Interaction Model.**
- mousedown object → arm move; move ≥ drag threshold (`pastDragThreshold` in `gesture.ts`) → live `previewDelta`; mouseup → `moveSelection(dx,dy)`.
- mousedown empty → marquee preview; mouseup → `selectInRect` or empty click → `selectInRect(pt,pt)` clears.
- double-click on canvas → **Fit in Window**, **not** edit-in-place. [CODE] vs [BLUEPRINT] drill-in
- Escape: `edit.exitOneLevel` (symbol depth), **not** cancel in-progress marquee/move (window `blur`/`pointercancel` cancel). [CODE]
- No Space-to-pan. Middle button pans. [CODE]

**F. Keyboard modifiers.**

| Modifier | Behavior | Kineora Required? | Adobe | Evidence |
|---|---|---|---|---|
| Shift click | toggle membership | YES | yes | [BLUEPRINT] [CODE] implemented |
| Shift drag move | 45° constrain | YES if enabled | yes | [BLUEPRINT] **NOT in Stage move** [CODE] |
| Shift marquee | add to selection | YES | yes | [BLUEPRINT] **NOT implemented** (marquee replaces) [CODE] |
| Alt drag | duplicate-drag | YES | yes | [BLUEPRINT] **NOT implemented** [CODE] |
| Ctrl/Cmd | temp Selection / force move | YES | yes | [BLUEPRINT] **NOT implemented** [CODE] |
| Space | pan | YES | yes | [BLUEPRINT] **NOT implemented** [CODE] |
| Escape | deselect / cancel gesture | partial | yes | [BLUEPRINT] vs [CODE] Esc = exit symbol |

**G. Output Data.** No new node on click. Move writes per-keyframe `transforms` map via `MoveSelection`. [CODE]

**H. Geometry.** Doc-space via `screenToDoc`. AABB hit. Rotation-aware bounds in eval. No bezier. [CODE]

**I. Fill/Stroke.** Selection does not set styles. Fill/stroke-only sub-selection **not implemented** (Blueprint merge-shape subobjects). [BLUEPRINT] [CODE]

**J. Options.** Magnet / Smooth / Straighten — **not in toolbar**. `view.snapping` DEFERRED (AMB SnapEngine). [CODE] [BLUEPRINT]

**K. Object/Merge.** Engine has **independent Rect nodes** (object-like). No merge boolean, no split-on-drag. [CODE] [BLUEPRINT] Part 06 required later.

**L. Selection Interaction.** `selection:changed` with `{prevTargets, targets, kind, commonType, bounds}` once per gesture (SYS-14 `eac6e7b`). Move does **not** re-emit selection (same ids). [CODE]

**M. Active Layer.** Selection is scene-wide (all visible unlocked layers). Move writes to **each node’s own layer**, not only active. [CODE] `MoveSelection`

**N. Timeline.** Move on non-keyframe: `ensure_keyframe` (auto-key). **No toast.** [CODE] vs [BLUEPRINT] toast required

**O. Scene.** Active scene only. [CODE]

**P. Undo.** One `MoveSelection` per completed non-zero drag. Undo restores prevSelection (INV-EDIT-2). [CODE]

**Q. Events.** `selection:changed` on select; `document:changed {type:'transform'}` on move. `tool:changed` on switch. [CODE]

**R. Persistence.** Selection **not** persisted. Transforms persist in keyframe maps / node base. [CODE]

**S. Rendering.** `evaluate` → canvas `RectItem`. Overlay handles from `selection_details`. [CODE]

**T. Performance.** AABB hit is O(n). Fine for current node counts. [INFERENCE] not specified

**U. UX.** Status bar `st-activeTool`. Stage footer `tool: {tool}`. Cursor is default; **no** black-arrow custom cursor. [CODE]

**V. Edge cases.** Zero move: no undo. Tiny drag below threshold: treated as click. Locked layer: not hit (eval skips). Folder: no content. Empty frame: miss. [CODE] Reverse drag / negative coords: allowed (doc space). [CODE]

**W. Bugs.**

| ID | File | Function | CURRENT | EXPECTED | SOURCE | SEV | OWNER |
|---|---|---|---|---|---|---|---|
| BUG-TOOL-001 | `Stage.tsx` | `onDoubleClick` | Fit viewport | Blueprint: drill-in / select fill+stroke | [BLUEPRINT] vs [CODE] | MED | SYS-13/14/19 |
| BUG-TOOL-002 | `Stage.tsx` | move path | no Shift constrain / Alt duplicate | Blueprint modifier matrix | [BLUEPRINT] | MED | SYS-13 |
| BUG-TOOL-003 | `session.rs` | `move_selection` | silent auto-key | toast on auto-key | [BLUEPRINT] T2A.1.16 | LOW | SYS-15/13 |
| BUG-TOOL-004 | `eval.rs` | hit_test | no edge reshape | Selection can reshape raw edges | [BLUEPRINT] | HIGH (blocked by no path model) | SYS-20 |

**X. Acceptance (future).** Click/shift/marquee/select-all match SYS-14 + T2A.1; move one undo; locked/hidden skipped; modifiers per matrix or documented AMB; no document:changed on select-only.

---

### TOOL: Subselection

**A–B.** Anchor/handle editor. Shortcut `A`. Path model required. [BLUEPRINT] T2A.2

**C.** Adobe white arrow. [ADOBE]

**D.** No command, no UI, no `Node` path. [CODE]

**E–X.** Entire interaction **NOT IMPLEMENTED**. Blocked by **no `shape.path`**. Status: **NOT IMPLEMENTED / BLOCKED (Node model)**.

Acceptance: cannot start until SYS-20 path representation exists.

---

### TOOL: Free Transform

**A–B.** Q. Move/rotate/scale/skew; pivot; Distort/Envelope raw shapes only. One `TransformCommand` per gesture. [BLUEPRINT] T2A.3

**C.** Adobe Free Transform + envelope/distort exclusions for symbols/bitmaps/text. [ADOBE]

**D.**
- Command `tool.transform` sets string `'transform'`.
- `Stage.tsx` **never branches on `tool === 'transform'`**. Scale/rotate handles are processed when `tool === 'select'`.
- `transformMath.ts`: 8 scale handles + rotate handle; Shift proportional / 15° rotate; Alt scale from center.
- No pivot drag, no skew, no distort, no envelope.
- Menu: rotate 90, flip, remove transform FUNCTIONAL; Scale and Rotate dialog DEFERRED. [CODE]

**E.** Same as select + handle zones. Switching to Q does **not** change gestures (handles still only if already selected). [CODE]

**F.** Shift/Alt partially implemented in `transformMath`. Ctrl temp Selection: no. [CODE]

**G.** Writes `Transform` via `TransformSelection` (per-keyframe overrides). [CODE]

**H.** Scale around opposite handle or center (Alt). Rotation degrees clockwise Y-down (`model.rs` comment). [CODE]

**I.** Does not change fill/stroke. [CODE]

**J.** No Scale/Rotate&Skew/Distort/Envelope option strip. [CODE]

**K.** N/A (transform, not draw).

**L.** Requires existing selection. Empty selection: Q does nothing useful. [CODE]

**M–O.** Same layer/frame/scene as MoveSelection (per-node layer, auto-key). [CODE]

**P.** One `TransformSelection` on mouseup if pending map non-empty. [CODE]

**Q.** `document:changed {type:'transform'}`. **No** `selection:changed` (ids unchanged). [CODE]

**W.**

| ID | File | CURRENT | EXPECTED | SEV |
|---|---|---|---|---|
| BUG-TOOL-005 | `Stage.tsx` | Q tool id unused by pointer router | Dedicated transform mode per T2A.3 / C-15 | MED |
| BUG-TOOL-006 | `transformMath.ts` | no pivot/skew/distort | Blueprint zones | HIGH (feature gap) |

---

### TOOL: Gradient Transform

Required [BLUEPRINT] T2A.4 shortcut F. Needs gradient fill + `fill.style.transform`. **Model has only solid `fill: String`.** Status: **NOT IMPLEMENTED / BLOCKED (color model)**. SYS-21.

---

### TOOL: 3D Rotation / 3D Translation

Blueprint: **not a separate tool**; 2.5D + camera later. [BLUEPRINT] T2A.5–6 field 25. Status: **NOT REQUIRED**.

---

### TOOL: Lasso (+ Polygon, Magic Wand)

Required [BLUEPRINT] T2A.7 `L`. Partial region selection needs merge-shape **or** selection mask. Current selection is whole-node only. **NOT IMPLEMENTED / BLOCKED (shape + selection kinds)**. SYS-14 note: anchors/frames/bones “not invented.” [CODE]

---

### TOOL: Pen (+ Add / Delete / Convert Anchor)

Required [BLUEPRINT] T2B.1 `P`. One `DrawPathCommand` on complete path; Esc discards in-progress (no undo). Needs path node. **NOT IMPLEMENTED / BLOCKED (Node model)**.

Shortcut conflict risk: Blueprint Pencil historically `Y`/`Shift+Y`; Pen `P`. Current registry: **P unused**. [CODE]

---

### TOOL: Text

Required [BLUEPRINT] T2B.2 `T`. All `text.*` commands DEFERRED (“text engine is a future unit”). [CODE] SYS-07 QUEUED. **DEFERRED / BLOCKED (SYS-07)**.

---

### TOOL: Line

Required [BLUEPRINT] T2B.3 `N`. Stroke-only; Adobe: “You cannot set fill attributes for the Line tool.” [ADOBE] https://helpx.adobe.com/animate/using/draw-simple-lines-shapes.html

Kineora: Line = 2-anchor stroke-only path. [BLUEPRINT] **Do not** reuse `draw_rect` with zero height (that would still be a filled Rect). [INFERENCE] — implement as stroke path when model exists.

**NOT IMPLEMENTED.**

---

### TOOL: Rectangle

**A–B.** `R`. Drag corner-to-corner; Shift square; Alt from center; corner radius option; fill+stroke from current color; merge vs object; one DrawCommand. [BLUEPRINT] T2B.4

**C.** Adobe Rect + Object Drawing + rounded modifier; Shift-drag square. [ADOBE] same article.

**D.**
```
Stage onMouseDown tool==='rect' → rectGesture
mousemove → normalizeRect preview
mouseup if valid → drawRect(x,y,w,h,'#3f9bf5')
Session::draw_rect → Node::Rect { fill, stroke: None, stroke_width: 0 }
DrawRect command → nodes + keyframe content.push
selection = [new id]
```
Hardcoded fill. **No** current Color panel wiring. **No** Shift/Alt. **No** radius. [CODE] `Stage.tsx` ~396, `session.rs` `draw_rect`

**E.** Click without drag: threshold not met → **no node** (`isValidRect`). [CODE] `gesture.ts`

**F.**

| Modifier | Required | Code |
|---|---|---|
| Shift square | YES [BLUEPRINT] | **missing** |
| Alt from center | YES | **missing** |
| Esc cancel mid-drag | YES | blur/cancel clears preview; Esc not bound to cancel draw |

**G.** `Node::Rect` persisted in `doc.nodes` + frame content. [CODE]

**H.** Axis-aligned box; rotation later via transform. Width/height can be 0 if validation fails (not committed). [CODE]

**I.** Fill only at create. Stroke can be added later via Properties `set_node_props`. [CODE]

**J.** No options strip. [CODE]

**K.** Always independent node (object-like). Merge drawing **absent**. [CODE]

**L.** Auto-selected; `selection:changed` + `document:changed {type:'draw'}`. [CODE] `client.ts` `drawRect`

**M.** Active layer only. Folder/hidden/locked → id 0 + toast “draw blocked…”. [CODE] Stage notify

**N.** Playhead frame; `ensure_keyframe`. Blank/held: becomes content keyframe. Tween layer: **not blocked**. [CODE] vs [BLUEPRINT]

**O.** Active scene. [CODE]

**P.** One `DrawRect` (“Draw rectangle”). Undo removes node + content id. [CODE]

**Q.** `document:changed` + `selection:changed`. [CODE]

**R.** Serialized in project JSON (`persist`). [CODE]

**S.** `evaluate` → canvas fill (+ optional stroke). [CODE]

**V.** Outside canvas / negative coords: allowed (pasteboard). [CODE]

**W.**

| ID | CURRENT | EXPECTED | SEV |
|---|---|---|---|
| BUG-TOOL-007 | fill `#3f9bf5` hardcoded | current fill from Color (Part 23) | HIGH |
| BUG-TOOL-008 | stroke always none | current stroke style | HIGH |
| BUG-TOOL-009 | no Shift/Alt | Blueprint modifiers | MED |
| BUG-TOOL-010 | tween layer allowed | Blueprint block + error | MED |

---

### TOOL: Oval / Primitives / PolyStar

Blueprint T2B.5–8. Need ellipse/parametric nodes or baked paths. **NOT IMPLEMENTED.** Do not fake ovals as many rects. [INFERENCE] — wait for SYS-20 node types.

Adobe: primitives stay editable; Object Drawing vs merge vs primitive are **three** modes. [ADOBE]

Kineora: primitives stay parametric until bake. [BLUEPRINT] AMBIGUOUS whether merge/object/primitive are all P0 — Blueprint 02b checkpoint says yes for first ship of drawing tools.

---

### TOOL: Pencil

T2C.1. Shared freehand pipeline (resample, RDP, one-euro, straighten). Modes Straighten/Smooth/Ink. Shortcut **not P** (Pen). [BLUEPRINT] **NOT IMPLEMENTED.** Pressure/tilt: required when stylus present; mouse constant width.

---

### TOOL: Brush (fill painter)

T2C.2 `B`. Five paint modes; size slider WISH W5; Lock Fill; paints **fills** not strokes. [BLUEPRINT] Adobe documents the same 5 modes. [ADOBE]

**NOT IMPLEMENTED.** Blocked by fill-geometry + clip masks + merge.

Adobe: brush size can scale with stage zoom (optional checkbox). [ADOBE] Kineora: **NOT SPECIFIED** whether brush px tracks zoom — mark **AMB-TOOL-001**.

---

### TOOL: Paint Brush (Art / Pattern)

T2C.3. Distinct from Brush. Library brush assets. Object drawing default for performance. [BLUEPRINT] [ADOBE] https://helpx.adobe.com/animate/using/working-with-paint-brush.html

**NOT IMPLEMENTED.** P1/P2 after Pencil/Brush spine exists.

---

### TOOL: Fluid Brush / Deco / Spray

**NOT REQUIRED** as separate tools. [BLUEPRINT] T2C.4, T2D.12–13

---

### TOOL: Eraser

T2C.5 `E`. Boolean subtract; 5 modes + Faucet; **no** secret double-click clear-stage (use confirmed Clear Stage). [BLUEPRINT] **NOT IMPLEMENTED.** Blocked by boolean path ops (Modify Shape also DEFERRED).

---

### TOOL: Width

T2C.6 `U`. `widthProfile [{t,wL,wR}]`. **NOT IMPLEMENTED.** Blocked by stroke path model.

---

### TOOL: Eyedropper

T2D.1 `I`. Sample to **style clipboard**; apply is **explicit** (WISH W6). Do **not** copy Adobe hover-paint. [BLUEPRINT OVERRIDE]

**NOT IMPLEMENTED.** Color panel exists for selected Rect props only (`set_node_props`).

---

### TOOL: Paint Bucket / Ink Bottle

T2D.2 `K`, T2D.3 `S`. Need enclosed regions + gap tolerance. **NOT IMPLEMENTED.** Blocked by vector regions (Rect is not a flood-fill mesh).

---

### TOOL: Hand / Zoom / Stage Rotate / Time Scrubber

View-only; **must not** dirty document. [BLUEPRINT]

Current: wheel zoom, middle pan, View menu zoom, **no** Hand/Zoom tools, **no** Space-Hand, **no** Z, **no** stage rotate, **no** stage scrub. [CODE]

`view.zoom*` already FUNCTIONAL via `stageViewController`. [CODE]

---

### TOOL: Bone / Bind / Camera / Asset Warp

Required later (Parts 14, 16, 02-AW). SYS-23/24/25 QUEUED. **NOT IMPLEMENTED.** Do not add Adobe-only gizmo details beyond Blueprint model writes.

---

## 6. Adobe Research (official)

Primary sources used:

- [ADOBE] Draw lines and shapes — https://helpx.adobe.com/animate/using/draw-simple-lines-shapes.html  
  Line: stroke attributes only, no fill. Rect/Oval: fill+stroke; Shift constrain; Object Drawing; Primitive mode separate; PolyStar 3–32 sides.
- [ADOBE] Paint Brush — https://helpx.adobe.com/animate/using/working-with-paint-brush.html  
  Art vs Pattern; Object Drawing default for performance; Straighten/Smooth/Ink on Paint Brush; convert lines to fills loses path edit.
- [ADOBE] Brush paint modes (Normal / Fills / Behind / Selection / Inside) — same “draw simple lines” family pages.

**Translation rule used throughout:** ADOBE BEHAVIOR ≠ KINEORA REQUIREMENT. Kineora-specific deltas: no hover-paint eyedropper; no hidden Eraser double-click wipe; no separate 3D tools; Fluid/Deco/Spray not shipped; auto-key **with toast**.

---

## 7. Kineora Current Implementation (architecture)

```
App.tsx tool state (string)
  → Toolbar (only commands with toolbar:true: select, rect, transform, + file/edit/timeline)
  → Stage(tool)
       pointer → select | rect only
       drawRect / moveSelection / transformSelection / select*
  → engine/client.ts (WASM facade + bus events)
  → animator/core Session + Command history
  → Document { nodes: Rect | SymbolInstance, layers, frames }
  → evaluate → canvasRenderer
```

**No Tool Controller interface** as specified in Part 01 §1.3.2 is present in TS (no `Tool` class). [CODE] vs [BLUEPRINT]

**Current stroke/fill “tool options”** = Properties panel patches on **selected** rects, not a tool style clipboard. [CODE]

---

## 8. Cross-Tool Architecture (as-is vs target)

Proven pipeline for **Rectangle** only:

`tool.rect` → Stage gesture → `drawRect` → `kineora_draw_rect` → `Session::draw_rect` (layer safety) → `DrawRect` → History → selection `[id]` → `document:changed` + `selection:changed` → evaluate → persist on save.

Proven pipeline for **Selection move**:

pointer → `moveSelection` → `MoveSelection` → per-layer auto-key transforms → History → `document:changed` (no selection event).

**Inconsistency:** Free Transform command does not enter the Stage pipeline. [CODE]

**Inconsistency:** C-13 claims all draw tools FUNCTIONAL. [ENGINEERING] vs [CODE]

---

## 9. Tool State

| State | Owner | Persisted? | Evidence |
|---|---|---|---|
| `currentTool` string | `App.tsx` React state | no | [CODE] |
| `previousTool` | **absent** | — | [CODE] |
| tool options (size, modes) | **absent** | — | [CODE] |
| object-drawing pref | **absent** (`opt.objmode` contract only) | — | [ENGINEERING] |
| pointer/drag/cancel | refs in `Stage.tsx` | no | [CODE] |
| selection | Session | no | [CODE] |

Switching tools mid-gesture: `toolRef` updates; in-flight rect/select refs are **not** explicitly aborted on tool change (only on blur/cancel). **AMBIGUOUS** whether switch should commit or discard — Blueprint Esc cancels; tool switch **NOT SPECIFIED**. Mark **AMB-TOOL-002**.

---

## 10. Layer Interaction

Evidence from `draw_rect` / `paste_objects` / hit_test / select_all:

| Tool (implemented) | Normal | Folder | Locked | Hidden | Empty layer |
|---|---|---|---|---|---|
| Selection hit | yes | n/a (no content) | skip | skip | miss |
| Move | yes (own layer) | n/a | not editable | not hit | n/a |
| Rectangle draw | yes | **block** log `draw:blocked(folder)` | block | block | yes (auto-key) |
| Transform handles | yes | n/a | not selected | not selected | n/a |
| All other tools | N/A | N/A | N/A | N/A | N/A |

Tween-layer draw block: **specified, not coded**. [BLUEPRINT] vs [CODE]

---

## 11. Timeline Interaction

| Operation | Frame target | Auto-key | Toast | Evidence |
|---|---|---|---|---|
| DrawRect | `playhead` | `ensure_keyframe` | no | [CODE] |
| Move/Transform | playhead, **per node layer** | yes | no | [CODE] |
| Select | playhead content only | no | — | [CODE] |
| View zoom/pan | none | no | — | [CODE] |

Held frame: drawing creates keyframe copying previous content then pushes new id (ensure_keyframe copies hold, then DrawRect pushes). [CODE]

---

## 12. Selection Interaction

| Situation | Select | Rect draw | Transform |
|---|---|---|---|
| Empty selection | marquee/clear | still draws | handles absent |
| Single | move/handles | new rect replaces selection | scales/rotates |
| Multi | move all; union handles | new rect only selected after | all in pending map |
| Locked object | not in selection | n/a | n/a |

Subselection / partial / fill-only: **not in engine**. [CODE]

---

## 13. Undo / Redo

| Tool | Operation | One Undo? | Selection Restored? | Document Changed? | Evidence |
|---|---|---|---|---|---|
| Selection | click/marquee | N/A (view) | n/a | **no** | [CODE] |
| Selection | move | yes `MoveSelection` | yes | yes | [CODE] |
| Rect | commit draw | yes `DrawRect` | yes (new id on redo) | yes | [CODE] |
| Rect | cancel / invalid | no command | no | no | [CODE] |
| Transform | handle gesture | yes `TransformSelection` | yes | yes | [CODE] |
| Zoom/pan | view | no | n/a | **no** | [CODE] |
| Unimplemented tools | — | — | — | — | — |

History bound 100. Dirty = snapshot diff. [CODE]

---

## 14. Events (existing only — do not invent)

| Event | When (tools) |
|---|---|
| `tool:changed { toolId }` | `setTool` |
| `selection:changed` | select/toggle/marquee/draw/paste/cut/delete/undo/redo |
| `document:changed { type }` | draw / transform / edit / frame / layer / … |
| `layer:changed` | not from tools |
| `playhead:moved` | not from tools (no Time Scrubber) |

**Do not** add `tool:stroke` etc. without a contract change.

---

## 15. Persistence

Rect nodes + transforms + fills persist. In-progress preview does not. Tool id does not persist (new session always `select`). [CODE]

Gaps: any future path/brush must extend `Node` + serde + `evaluate` + SVG export (`export.rs` currently rect-based). [CODE]

---

## 16. Rendering

`canvasRenderer.ts` draws axis-aligned/rotated rects, selection box, handles, marquee, `previewRect`. No live brush stamp, no bezier preview, no pen rubber-band. [CODE]

---

## 17. Bugs (research only — DO NOT FIX)

See BUG-TOOL-001…010 above.

Additional:

| ID | File | CURRENT | EXPECTED | SEV | OWNER |
|---|---|---|---|---|---|
| BUG-TOOL-011 | `client.ts` `copyFrames` | emits `document:changed` | Copy is not a mutation (SYS-03) | MED | SYS-15 / Edit |
| BUG-TOOL-012 | C-13 vs commands | contract says all tools FUNCTIONAL | honest DEFERRED/PARTIAL | HIGH (process) | SYS-13 spec |
| BUG-TOOL-013 | PROJECT_BOARD SYS-13 | “5 tools” | only 3 command IDs | LOW | board hygiene |
| BUG-TOOL-014 | `Stage.tsx` | no Escape cancel in-progress rect | Blueprint cancel | MED | SYS-13 |
| BUG-TOOL-015 | `tool.transform` | selection handles also on V | Q should own handles **or** Blueprint allows both — **AMB-TOOL-003** | AMB | product |

---

## 18. Missing Functionality (P0 gaps)

1. Tool interface / router (Part 01 §1.3.2)
2. Path / stroke / fill-region node types (SYS-20)
3. Current style state (SYS-21) consumed at draw time
4. Remaining core tools (Pen, Line, Oval, Pencil, Brush, Eraser, Eyedropper, Bucket, Ink, Hand, Zoom)
5. Subselection + Width (path-dependent)
6. Object vs Merge drawing (Part 06) — **entire subsystem DEFERRED**
7. SnapEngine (SYS-04 AMB)
8. Pressure/tilt pipeline
9. Honest command registry rows (DEFERRED + reason) for unimplemented tools
10. Formal FORENSIC_SPECS/SYS-13

---

## 19. Ambiguities (do not invent)

| ID | Topic | Why open |
|---|---|---|
| AMB-TOOL-001 | Brush size vs stage zoom | Adobe has checkbox; Blueprint silent |
| AMB-TOOL-002 | Tool switch mid-gesture | commit vs discard unspecified |
| AMB-TOOL-003 | Free Transform handles on Selection tool | Adobe often allows; Blueprint lists separate tools |
| AMB-TOOL-004 | Contact-sensitive default | Blueprint has two prefs; code hard-ON; SYS-04 snapping AMB |
| AMB-TOOL-005 | Pencil default shortcut | Blueprint notes Animate Shift+Y vs Y; Part 29 must be read before binding |
| AMB-TOOL-006 | Primitive vs baked Rect for first Rectangle increment | Blueprint wants parametric `RectNode`; code already baked `Node::Rect` without radius |
| AMB-S03-003 | Paste Special | already OPEN; **not a tool** |
| AMB-S04-001..006 | Snap / guides | blocks magnet option |

---

## 20. Adobe vs Kineora Matrix

| Capability | Adobe | Kineora Spec | Kineora Code | Correct Target | Decision |
|---|---|---|---|---|---|
| Line fill | none | stroke-only | n/a | stroke-only | [BLUEPRINT]+[ADOBE] agree |
| Object Drawing | toggle | required Part 06 | independent nodes only | implement modes when merge exists | do not fake merge |
| Eyedropper hover paint | legacy yes | **forbidden** W6 | n/a | style clipboard + explicit apply | [BLUEPRINT OVERRIDE] |
| Eraser dblclick wipe | yes | **no** — confirm Clear | n/a | confirm dialog | [BLUEPRINT OVERRIDE] |
| 3D tools | AS3 | not separate tools | n/a | skip | [BLUEPRINT] |
| Fluid/Deco/Spray | removed | not ship | n/a | skip | [BLUEPRINT] |
| Brush 5 modes | yes | yes | n/a | implement when fills exist | [BLUEPRINT] |
| Paint Brush art/pattern | yes | yes | n/a | after stroke spine | [BLUEPRINT] |
| Auto-key on draw | yes | yes + toast | auto-key, no toast | add toast | [BLUEPRINT] |
| Rect Shift-square | yes | yes | no | add | [BLUEPRINT] |

---

## 21. Target Architecture (research-supported; NO CODE)

Matches Blueprint Part 01/32 **if** implemented later:

```
Tool Controller (currentTool, options, previousTool)
  → Pointer Input (doc-space, capture, modifiers)
  → Tool State (idle / preview / commit / cancel)
  → Geometry Builder (rect, path, stamps)   [needs SYS-20]
  → Engine Command (one undo unit)
  → History + dirty
  → Selection update
  → Events (existing names only)
  → Renderer (preview overlay + evaluate)
  → Persistence (Node serde)
```

Responsibilities:

- **Controller:** exclusive pointer owner; Space temporary Hand; Esc cancel.
- **Geometry Builder:** no document writes.
- **Command:** only mutation path (REQ-SYS-002 already true in Rust).
- **Layer gate:** reuse `draw_rect` folder/lock/hide checks for **all** draw tools.

---

## 22. Implementation Blueprint

### P0 — Foundation (before more tools)

1. Honest registry: add DEFERRED `tool.*` ids with reasons **or** keep three tools and fix C-13/board language. **Do not** mark FUNCTIONAL without engine.
2. Tool router in Stage: switch on `currentTool`; abort/cancel policy once AMB-TOOL-002 decided (until then: cancel in-progress, no commit — **this would be a decision**; coding AI must ask).
3. `CurrentStyle` session/UI state (fill, stroke, width) — SYS-21; Rect tool consumes it.
4. Path node design (SYS-20) — **product-owned**; do not invent bezier schema beyond Part 33.

### P1 — Core tools

Selection completeness (modifiers, toast, optional reshape **after** paths).  
Rectangle honest (style, modifiers, tween block).  
Hand + Zoom as view tools (no dirty).  
Line (after stroke path).

### P2 — Shape tools

Oval, PolyStar, Primitives, Pen.

### P3 — Paint

Pencil, Brush, Eraser, Bucket, Ink, Eyedropper.

### P4 — Transform extras

Dedicated Q mode, pivot, skew; Gradient Transform after gradients.

### P5 — Advanced

Width, Paint Brush, Lasso, Bone, Bind, Camera, Warp, Stage Rotate, Time Scrubber.

### Per-tool coding packet (Rectangle — next honest increment)

1. Required: T2B.4 + draw-target T2B.1.16  
2. Existing: `draw_rect` / `DrawRect` / Stage rect gesture  
3. Missing: style, modifiers, tween block, toast, radius  
4. Bugs: 007–010, 014  
5. Files: `Stage.tsx`, `session.rs`, `command.rs` (maybe), `client.ts`, `commands.ts`, `canvasRenderer.ts`, tests `Stage.test.tsx`  
6. Functions: `Session::draw_rect`, `drawRect`, `onMouseDown`/`up`  
7. Data: `Node::Rect`  
8. Command: existing `DrawRect`  
9. UI: toolbar already; options strip new  
10. Events: existing  
11. Selection: already selects new  
12. Undo: already one command  
13. Timeline: already playhead  
14. Layer: already gated  
15. Persistence: already  
16. Tests: modifier geometry; folder/lock/hide; undo; style  
17. Acceptance: see §24  
18. Deps: SYS-21 for style; SYS-04 snap optional  
19. Risks: hardcoded fill tests  
20. **Do not change:** History, selection payload shape, folder semantics, Adobe-only primitive dialogs

**What NOT to change globally:** other AIs’ commits; PAT; force-push; inventing Paste Special; merge boolean until Part 06; adding Adobe-only tools.

---

## 23. Test Matrix (specify only — do not write tests now)

For **each** tool that exists or is implemented later, coding agents must cover:

| Dimension | Cases |
|---|---|
| Layer | normal / folder / locked / hidden / empty / missing active |
| Frame | empty / content key / blank / hold / tween span |
| Selection | none / single / multi |
| Undo/Redo | commit, cancel, immediate undo, redo |
| Save/Load | geometry + style survive |
| View | zoom, pan (coords stay doc-space) |
| Scene | draw stays on active scene |
| Tool switch | mid-gesture (once AMB resolved) |
| Escape | in-progress discard |
| Modifiers | Shift / Alt / Ctrl / Space as specified |
| Events | dirty only on mutation; selection event rules |
| Auto-key | toast present (Blueprint) |

Minimum for **current** three tools: already partially in `Stage.test.tsx` / core tests — extend rather than replace.

---

## 24. Acceptance Criteria (ship-level for Tools system — not now)

Cannot claim SYS-13 COMPLETE until:

- SPEC (FORENSIC SYS-13) exists
- Every Blueprint-required **P0/P1** tool has IMPL + automated + build + runtime + manual + integration
- C-13/registry/status labels match reality
- No tool mutates through a non-Command path
- Layer safety identical across draw tools
- Copy/view tools never dirty

**Current honest status: RESEARCH + PARTIAL (3 tools).**

---

## 25. Do-Not-Invent List

**Adobe features Kineora does not require as tools:** 3D Rotation, 3D Translation, Fluid Brush, Deco, Spray, AS3-only camera/runtime bones.

**Do not invent:**

- Merge/boolean algorithms beyond Part 06
- Extra Node types not in Part 33
- New bus events
- Paste Special formats (AMB-S03-003)
- Snap numeric defaults beyond SYS-04 AMBs
- Hover-paint eyedropper
- Hidden Eraser wipe
- Marking C-13 FUNCTIONAL as engine-done
- Pressure curves not in Blueprint
- Timeline copy dirty “fix” as a Tools feature if owned by SYS-15 (document only)

**Blocked by engine model:** Pen, Pencil, Brush, Eraser, Width, Subselection, Bucket, Lasso partial, primitives-as-paths.

**Blocked by color model:** Gradient Transform, Lock Fill, bitmap fill.

**Blocked by timeline/layer:** Camera layer, pose/rig layer, mask/guide types (QUEUED).

**Blocked by text engine:** Text tool.

---

## 26. Recommended Implementation Order

1. **Docs/honesty:** SYS-13 forensic spec from this research; align C-13 + board (no code behavior change required except labels).  
2. **Style state + Rect tool honesty** (still one tool).  
3. **Tool router + Hand/Zoom tools** (view-only, unblocks Space/Z).  
4. **SYS-20 path node** (shared).  
5. Line → Oval → Pen.  
6. Pencil pipeline → Brush → Eraser.  
7. Eyedropper / Bucket / Ink.  
8. Free Transform completion + Gradient Transform.  
9. Width, Paint Brush, Lasso.  
10. Bone / Camera / Warp (their SYS).

---

## 27. Sources

| Tag | Location |
|---|---|
| [BLUEPRINT] | `animate-blueprint/02a_tools_selection_transform.md` … `02d_tools_utility.md`, `03`, `04`, `05`, `06`, `20`, `23`, `29`, `33` |
| [ENGINEERING] | `phase2.5-ui/contracts/C-13_drawing_tools.md`, `C-14`, `C-15`, `C-01`, `C-16` |
| [FORENSIC] | `FORENSIC_SPECS/00_SYSTEM_QUEUE.md`, `PROJECT_COORDINATION/PROJECT_BOARD.md` |
| [CODE] | `animator/ui/src/{App,commands,components/Stage,engine/client,editor/*,render/*}.tsx?`; `animator/core/src/{model,session,command,eval,wasm}.rs` |
| [TEST] | `Stage.test.tsx`, `Toolbar.test.ts`, SYS-14 client selection tests |
| [ADOBE] | helpx.adobe.com/animate/using/draw-simple-lines-shapes.html ; working-with-paint-brush.html |
| [INFERENCE] | labeled in-place; never used as requirement |
| [OTHER] | Phase-2 `F-02-00_tools_full` directory exists (parent of feature slices) |

---

## Appendix A — Current Kineora Tool Map (evidence)

| Tool | Shortcut | Command ID | UI | Rust | WASM | Node Type | Undo | Selection | Timeline | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| Selection | V | `tool.select` | toolbar + Stage | select_* / move | yes | n/a | move only | yes | current frame | PARTIAL |
| Rectangle | R | `tool.rect` | toolbar + Stage | `draw_rect` / `DrawRect` | `kineora_draw_rect` | `Node::Rect` | one | selects new | playhead + auto-key | PARTIAL |
| Free Transform | Q | `tool.transform` | toolbar only | `TransformSelection` | `kineora_transform_selection` | transform on existing | one | needs selection | auto-key | PARTIAL (routing bug) |
| Zoom in/out/100/fit | Ctrl+=/-/1/0 | `view.zoom*` | View menu | none (view) | none | n/a | no | no | no | FUNCTIONAL view, **not** Zoom tool |
| All others | — | **absent** | C-13 paper only | none | none | none | — | — | — | NOT IMPLEMENTED |

---

*End of research document. Coding AIs: implement one tool increment at a time; do not mark COMPLETE without the gate; do not invent AMBs.*
