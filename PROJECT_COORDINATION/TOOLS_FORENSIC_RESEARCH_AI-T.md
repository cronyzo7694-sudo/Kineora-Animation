# TOOLS FORENSIC RESEARCH — AI-T (tool matrix + build order)

**Author:** AI-T (tools lane) · **Date:** 2026-08-23
**Scope:** every tool in the Blueprint Tools panel and the order in which we
build them. This document is *forensic*: each row states what the CODE does
today, what the SPEC requires, and what engine increment unlocks the tool.
Companion doc: `TOOLS_STATUS_AND_PLAN.md` (living status), `AI_PAIR_PROTOCOL.md`
(ownership + §7 register).

**Authority order (binding):** Blueprint > Phase-2/2.5 specs > Engineering
docs > DECISIONS register > this forensic file > Tests > Code > Adobe helpx.
Anything that exists ONLY in Adobe and not in the Blueprint must be labelled
`[ADOBE — NOT IN BLUEPRINT]` and reviewed before it ships. No schema, node
kind, or event is invented — model changes reference a Blueprint Part 33 field
or go to the AMB register.

---

## 1. The two contracts every tool obeys

### 1.1 Tools panel — Blueprint Part 01 §1.3.1 (four sections, fixed order)

| Section | Contents | Kineora today |
|---|---|---|
| **Tools** | Selection, Subselection, Free Transform, Lasso family, Pen family, Text, Line, Rectangle (+Oval/PolyStar/Primitives flyout), Pencil, Brush family, Eraser, Width, Eyedropper, Paint Bucket, Ink Bottle, Bone, Asset Warp, Camera | left rail, icons-only |
| **View** | Hand, Zoom, Stage Rotate, Time Scrubber | Hand + Zoom in the rail |
| **Colors** | **Stroke chip, Fill chip, swap button, black&white, no-color.** "Clicking a chip opens Color picker (Part 23); default fill/stroke for new shapes." | chips + swap + black&white on the rail; picker + no-color in the chip popover |
| **Options** | Contextual **modifiers for the active tool** (buttons/toggles). Numeric values open a popover or live in Properties — they are never loose on the rail | Zoom Enlarge/Reduce only, exactly as spec'd today |

**Rail layout contract (locked 2026-08-23 — regression = BUG):**
36 px wide · icons only (name + shortcut on hover/focus) · Tools+View in a
scroll region · Colors+Options pinned to the bottom.

### 1.2 Tool = state machine — Blueprint Part 01 §1.3.2

Every tool implements one interface: `cursor()`, `onPointerDown/Move/Up`,
`onKeyDown/Up`, `optionsSchema`, `canTarget(hit)`. A gesture
(down → moves → up) emits exactly **one Command** ("undo = one step per
gesture"). Stage.tsx currently routes tools with an if-chain — the interface
refactor is item 2 in §4 and must land before Pen/Pencil/Brush complexity.

### 1.3 Per-tool "DONE" checklist (all ten, no partial credit)

1. Gesture + modifiers implemented per spec (Shift/Alt/Esc per tool).
2. 1 gesture = 1 undo command (live preview touches NO engine state).
3. Esc cancels mid-gesture: no command, no undo entry.
4. Folder / locked / hidden layer guard (`editable_target_layer`, B-5) — draw
   is blocked with a log line, paint/select skip per rules.
5. EXACT hit-test for the new geometry (an AABB hit on an oval is a bug).
6. Renderer (canvas) = SVG export (Rust) = raster export (renderContent):
   one geometry source, three outputs.
7. Options area shows the tool's real modifiers, in the right section,
   buttons/popovers only.
8. Rust tests (compile-gated locally) + UI tests (vitest) written and green.
9. Old project files load unchanged (`#[serde(default)]` on every new field).
10. Status doc + CHANGELOG row updated.

---

## 2. Tool matrix (Blueprint Part 02, spec-verified 2026-08-23)

Status legend: **WORKING** = wired end-to-end with green tests ·
**BASIC** = works but spec fields are missing (listed) · **BLOCKED** = needs
an engine/model increment (named) · **LEGACY** = Blueprint marks legacy;
not scheduled.

| # | Tool | Key | Spec | Engine unlock needed | Status 2026-08-23 |
|---|---|---|---|---|---|
| 1 | Selection | V | T2A.1 | — (exists) | **WORKING** (click, shift-toggle, marquee, 1-command drag) |
| 2 | Subselection | A | T2A.2 | E2 PATH (anchor model) | BLOCKED |
| 3 | Free Transform | Q | T2A.3 | — (exists) | **BASIC** (BUG-TOOL-005 fixed: select+move+scale/rotate; pivot drag / skew / distort missing) |
| 4 | Gradient Transform | F | T2A.4 | gradient fills (MOD-COLOR) | BLOCKED |
| 5 | Lasso (+Polygon, +Magic Wand) | L | T2A.7 | E4 `hits_in_polygon` | BLOCKED |
| 6 | Pen (+ Add/Delete/Convert Anchor) | P · = · − · Shift+C | T2B.1 | E2 PATH (bezier anchors) | BLOCKED |
| 7 | Text | T | T2B.2 | E3 `Node::Text` + font metrics | BLOCKED |
| 8 | Line | N | T2B.3 | E2 PATH — **a 2-anchor stroked path, NOT a thin rectangle** | BLOCKED |
| 9 | Rectangle | R | T2B.4 | — (exists); corner radius rides on the shape node | **WORKING**; radius = batch 1 |
| 10 | Oval | O | T2B.5 | E1 `ShapeKind::Oval` on the rect node | **THIS BATCH** (E1a) |
| 11 | Rectangle Primitive | R (flyout) | T2B.6 | parametric radius edit handles | BLOCKED (after batch 1) |
| 12 | Oval Primitive | O (flyout) | T2B.7 | parametric arc/hole handles | BLOCKED (after batch 1) |
| 13 | PolyStar (Polygon/Star) | — (flyout) | T2B.8 | E1 `ShapeKind::Star{points, inner}` | batch 1 |
| 14 | Pencil | Y | T2C.1 | E2 PATH + RDP simplify | BLOCKED |
| 15 | Brush | B | T2C.2 | E2 PATH (filled outline) | BLOCKED |
| 16 | Paint Brush (art/pattern) | B | T2C.3 | brush assets + stroked-path raster | BLOCKED (late) |
| 17 | Eraser | E | T2C.5 | E4 geometric erase (area subtraction, not delete) | BLOCKED |
| 18 | Width | U | T2C.6 | E2 stroke profile (variable width) | BLOCKED |
| 19 | Eyedropper | I | T2D.1 | — (exists) | **WORKING** (auto-switch to Bucket per Adobe) |
| 20 | Paint Bucket | K | T2D.2 | fill fill-rule/region detect for gaps | **BASIC** (repaints object fills; enclosed-region fill after E2) |
| 21 | Ink Bottle | S | T2D.3 | — (exists) | **WORKING** (stroke color+width; None removes) |
| 22 | Bone | M | T2D.8 | E5 IK chains | BLOCKED |
| 23 | Bind | — | T2D.9 | E5 (with Bone) | BLOCKED |
| 24 | Camera | C | T2D.10 | camera entity (Part 16) | BLOCKED |
| 25 | Asset Warp | W | T2D.11 | E5 mesh deformation | BLOCKED |
| 26 | Hand | H | T2D.4 | — (exists) | **WORKING** (Spacebar override included) |
| 27 | Zoom | Z | T2D.5 | — (exists) | **WORKING** (click/Alt/area-drag; 8–2000%) |
| 28 | Stage Rotate | Shift+H | T2D.6 | rotated viewport + inverse hit-test | BLOCKED |
| 29 | Time Scrubber | — | T2D.7 | timeline scrub (AI-B adjacency — coordinate) | BLOCKED |
| — | 3D Rotation / 3D Translation | — | T2A.5/6 | — | LEGACY (not scheduled) |
| — | Fluid Brush | — | T2C.4 | — | LEGACY ("removed", Blueprint's words) |
| — | Deco / Spray Brush | — | T2D.12/13 | — | LEGACY (not scheduled) |

(29 shippable rows; commonly quoted as "the 26 edit tools + Hand/Zoom/scrub
view family". Sub-tools — Pen anchors, Lasso modes, Primitives' handle dots —
ride on their parent tool's row.)

---

## 3. Engine unlock ladder (each rung shippable, each a separate PR)

- **E1 — parametric shapes on the rect node.** `Node::Rect` gains
  `#[serde(default)] shape: ShapeKind` — E1a = `{Rect, Oval}` (this batch),
  E1b = `Star{points, inner_size}` + `corner_radius` (batch 1). Renderer,
  SVG export, rasterizer, exact hit-test per shape; `draw_shape` session op
  with the same folder/locked/hidden guard as `draw_rect`; stroke+width at
  draw time (honors the Colors section — closes the rest of BUG-TOOL-008).
- **E2 — PATH model (Part 33.19 `path.anchors` + fills + strokes).** Unlocks
  11 tools: Pen (+3 anchor sub-tools), Line, Pencil, Brush, Subselection,
  Width, Eraser, Lasso family, and region-fill for Paint Bucket.
- **E3 — Text.** `Node::Text` + on-stage editing + canvas/SVG text.
- **E4 — Selection geometry ops.** `hits_in_polygon` (Lasso family), then
  eraser area-subtraction on paths.
- **E5 — Rig/view subsystems.** Bone/Bind, Asset Warp, Camera, Stage Rotate.

## 4. Build order (locked with the human — depth-first, ONE PR per feature)

1. **Rectangle group** — corner radius (T2B.4 field 12) + PolyStar (T2B.8:
   Polygon|Star, 3–32 sides, star-point-size 0–1) + the Tools-panel flyout
   that groups Rectangle/Oval/PolyStar (Blueprint §1.3.1 + Part 29: R/O keys,
   PolyStar has no default key).
2. **Tool interface refactor** (Part 01 §1.3.2) — replace the Stage.tsx
   if-chain with a `Tool` registry so gesture code stops compounding.
3. **PATH model** — anchors + fills + strokes in the document model, renderer,
   exporter, hit-test; serde-defaulted so old files load.
4. **Pen (P, +anchor sub-tools) → Line (N) → Pencil (Y) → Brush (B)** — in
   that order: Pen defines anchor semantics; Line is its degenerate case;
   Pencil/Brush add capture+simplify on top.
5. **Subselection (A) + Width (U) → Lasso family (L) → Eraser (E) →
   Text (T).**

*Why this order: every step depends only on rungs already shipped; the PATH
model is the highest fan-out unlock (11 tools) and lands immediately after
the tool-interface refactor that keeps its 4 consumers readable.*

---

## 5. Deferred-by-design notes (registered, not forgotten)

- **Fill = None at draw time.** The document model stores `fill: String`
  (never optional). Today the draw tools substitute white when the Fill
  swatch is None (pre-existing, matches `draw_rect`'s old contract). True
  fill-less shapes need `Option<fill>` in the model + renderer/export guards
  — E2PATH territory (paths carry fills[]) — AMB entry to be filed with batch 3.
- **Oval Settings (T2B.5 field 12: start/end angle, inner radius, close-path)
  and Rectangle/Oval Primitives' handle-dot editing (T2B.6/7)** are the
  Options-area increment that follows batch 1, not part of the basic tool.
- **Paint Bucket gap-size modifier + Magic Wand** need region detection over
  the path model (E2/E4). Today's Bucket repaints object fills only — labelled
  BASIC above, not hidden.
- **[ADOBE — NOT IN BLUEPRINT]** nothing shipped under this tag as of
  2026-08-23. The Eyedropper's auto-switch-to-Bucket is Blueprint T2D.1
  field 8 behavior; keep it cited as such.

## 6. Toolchain reality (why "Rust written ≠ Rust verified here)

The AI sandbox has **no cargo/rustc and no crates.io route**, so engine code
is written + reviewed here but compiled/tested by the human:

```
cd animator/core && cargo fmt && cargo clippy --all-targets -- -D warnings && cargo test
cd ../ui && npm run wasm && npm ci && npx tsc -b && npx vitest run && npm run build
```

Every tools PR states explicitly which of these were actually run. UI suite
(omnidirectional truth for green) at this writing: **868 tests**.

## 7. Register cross-references

- Ownership map + reporting format: `AI_PAIR_PROTOCOL.md` §2/§6.
- Live status table (what worked when): `TOOLS_STATUS_AND_PLAN.md`.
- Bug IDs: BUG-TOOL-005 (Q dead) fixed · BUG-TOOL-007 (rect blue) fixed ·
  BUG-TOOL-008 (stroke at draw) **closed by E1** · zoom range corrected to
  Adobe's 8–2000 %.
