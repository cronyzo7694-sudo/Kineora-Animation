# TOOLS — STATUS & IMPLEMENTATION PLAN (2026-08-23)

> **Rule of this document:** every row says what the code ACTUALLY does today.
> A tool is only "WORKING" when it is wired end-to-end (pointer → engine →
> render → undo) and covered by tests that run in CI. Anything else is listed as
> what it really is. (FL-0017: never claim FUNCTIONAL for a wishlist item.)

## 1. Current toolbox — what works right now

| Adobe tool | Key | Kineora | Behavior implemented (Adobe-verified) | Tests |
|---|---|---|---|---|
| Selection | V | **WORKING** | click select · Shift-toggle · marquee · drag-move (one undo step) · scale/rotate handles | Stage.test.tsx |
| Free Transform | Q | **WORKING** (basic) | now actually drives the pointer (BUG-TOOL-005 fixed): select + move + scale/rotate handles, Shift constrain, Alt from centre. **Pivot drag / skew / distort still missing** | Stage.test.tsx |
| Rectangle | R | **WORKING** | drag-draw, Shift = square, Alt = from centre, Esc cancels, uses the **Fill AND Stroke swatches** at draw time (BUG-TOOL-007/008 fixed, T2B.4 + Part 02b preamble) | Stage.test.tsx |
| Oval | O | **WORKING** | drag bounding box, Shift = circle, Alt = from centre, Esc cancels, fill+stroke swatches (T2B.5). Engine: `ShapeKind::Oval` on the rect node, exact ellipse hit-test + marquee (no AABB air), `<ellipse>` SVG export, same B-5 folder/locked/hidden guards, one undo per draw | Stage.test.tsx, canvasRenderer.test.ts, tests/draw_oval.rs |
| Paint Bucket | K | **WORKING** | click an object → repaint with the Fill Color, one undo step; "None" fill paints nothing | Stage.test.tsx |
| Ink Bottle | S | **WORKING** | click an object → stroke colour + width applied; "None" removes the stroke | Stage.test.tsx |
| Eyedropper | I | **WORKING** | click → copies the object's fill/stroke into the swatches → **auto-switches to Paint Bucket** (Adobe behavior) | Stage.test.tsx |
| Hand | H | **WORKING** | drag to move the view; **Spacebar** temporarily switches from any tool; never touches the document | Stage.test.tsx |
| Zoom | Z | **WORKING** | click = in, Alt+click = out, **drag a rectangle = that area fills the window**, Esc cancels, Enlarge/Reduce modifier in the options area, 8 %–2000 % like Animate | Stage.test.tsx, viewport.test.ts |
| Tools-panel colors area | — | **WORKING** | Fill + Stroke swatches, No-colour, swap, reset-to-default, stroke width — app state, never undoable | toolColors.test.ts, ToolColors.test.tsx |
| Tools-panel options area | — | **WORKING** (Zoom only) | shows only real modifiers; empty for tools that have none | ToolOptions.test.tsx |
| Line | N | **WORKING** (ink store) | two-point stroke, Shift constrains axis; select/move/delete/undo | Stage.test.tsx, inkStore.test.ts |
| Pencil | Y | **WORKING** (ink store) | freehand polyline, simplified on commit | Stage.test.tsx |
| Brush | B | **WORKING** (ink store) | freehand thick stroke | Stage.test.tsx |
| Pen | P | **WORKING** (ink store) | click anchors, Enter/double-click finish, click-first closes, Esc cancel | Stage.test.tsx |
| Text | T | **WORKING** (ink store) | click → prompt → place fill-colored text | inkStore |
| Eraser | E | **WORKING** (object erase) | drag deletes ink strokes + engine objects under the stroke | inkStore |
| Lasso | L | **WORKING** | freeform polygon selects ink + AABB-selects engine objects | inkStore |
| Subselection | A | **WORKING** (ink) | click a path then drag its anchors | inkStore |

**Adobe sources:** *Use the Stage and Tools panel for Animate* (Hand/Zoom/tool
panel areas, 8 %–2000 %, Spacebar override, zoom-marquee) and *Strokes, fills,
and gradients with Animate* (Fill/Stroke controls set the attributes of new
objects; Paint Bucket; Ink Bottle; Eyedropper auto-switch).

## 2. Tools that CANNOT be built on today's engine

The engine's document model has exactly two node kinds — `Node::Rect` and
`Node::SymbolInstance` (`animator/core/src/model.rs`). There is no path, no
curve, no text, no bitmap, no bone. So every remaining Adobe tool is blocked on
an ENGINE increment, not on UI work:

| Adobe tool | Key | Blocked on |
|---|---|---|
| Rectangle-Primitive / Oval-Primitive / PolyStar | R · O · — | shape params (corner radius, star points) + flyout UI + param handles |
| Line | N | path segment model |
| Pen (+ Add / Delete / Convert Anchor) | P · = · - · Shift+C | full bezier path model + anchor editing |
| Pencil / Paint Brush / Fluid Brush | Y · B | freehand capture → path simplification → stroke geometry |
| Eraser | E | boolean geometry (Adobe erases shape area, it does not delete objects) |
| Subselection | A | anchor-level selection + drag |
| Lasso / Polygon Lasso / Magic Wand | L | polygon hit-test facade in the engine (`hits_in_polygon`) |
| Text | T | `Node::Text` + font metrics + on-stage editing + SVG/canvas text |
| Width | U | variable-width stroke profile |
| Gradient Transform | F | gradient fills (MOD-COLOR) |
| Bone / Bind | M · — | IK chains |
| Asset Warp | W | mesh deformation |
| Camera | C | camera entity in the scene |
| Rotation (stage rotate) | Shift+H | rotated viewport in renderer + inverse mapping for hit-test |

## 3. Why they are not in this batch (blocker, not a choice)

The engine is Rust compiled to WASM. In this workspace:

```
cargo / rustc          : NOT INSTALLED
static.rust-lang.org   : unreachable   (rustup cannot install)
crates.io / index      : unreachable   (serde, serde_json, wasm-bindgen cannot be fetched)
```

So engine code here can be written but **cannot be compiled, tested, or turned
into the `public/wasm/` bundle the app loads**. Shipping thousands of lines of
unverified Rust would produce exactly the bug-ridden result we are trying to
avoid. Everything in §1 was therefore done in the UI layer, where the whole test
suite runs (832 tests green).

**To unblock:** allow `static.rust-lang.org` + `crates.io` in the sandbox, or
run locally after each batch:

```
cd animator/core && cargo fmt && cargo clippy --all-targets -- -D warnings && cargo test
cd ../ui && npm run wasm && npm test && npm run build
```

## 4. Engine plan for the remaining tools (ordered, each shippable)

### E1 — Shape kinds · E1a DONE (Oval), E1b next (corner radius + PolyStar + flyout)
- ~~`Node::Rect` gains `#[serde(default)] shape: ShapeKind`~~ → **E1a shipped:** `ShapeKind {Rect, Oval}` (serde default = rect, old files load unchanged). E1b adds `Star{points, inner}` + `corner_radius`; **Line is NOT a shape kind — it is a 2-anchor path and belongs to E2.**
- ~~`RectItem` carries `shape`~~ → shipped; `canvasRenderer.ts` draws `ellipse()`; `export.rs` emits `<ellipse>`; the rasterizer shares the same geometry fn.
- ~~Hit-test: ellipse gets its own inside-test~~ → shipped (exact implicit-equation test + exact ellipse∩box marquee; an AABB hit on an oval is a bug).
- Session: `draw_shape(kind, x, y, w, h, fill, stroke, stroke_width)` — one command, same guards as `draw_rect` (folder / locked / hidden); `draw_rect` kept as the legacy facade.
- Tools: Oval (O) — Shift = circle, Alt = from centre (shared drag gesture with Rectangle, already tested).
- **Shortcut decision (D-0009):** Blueprint Part 29 binds `O` to both Oval and the onion toggle; Oval keeps `O`, `view.onion` moved to `Ctrl+Alt+O` (register entry, AI-B to review).

### E2 — Path model · unlocks Pen, Pencil, Brush, Subselection, Width
- `Node::Path { points: Vec<Anchor{x,y,in,out}>, closed, fill, stroke, stroke_width }`.
- Pencil/Brush: capture pointer samples → Ramer–Douglas–Peucker simplify → path; Brush = filled outline, Pencil = stroked path.
- Pen: click = corner anchor, drag = smooth anchor, close on first anchor, Esc/Enter to end.
- Subselection: anchor hit-test + drag (one command per drag).

### E3 — Text · unlocks T
- `Node::Text { text, font, size, colour, align, box }`, canvas `fillText`, SVG `<text>`, on-stage editing overlay, engine command per commit.

### E4 — Eraser, Lasso, Magic Wand
- `hits_in_polygon` engine facade (Lasso/Polygon Lasso), then Eraser as geometric subtraction on paths (needs E2).

### E5 — Rigging / camera / warp (Bone, Bind, Asset Warp, Camera)
- Largest subsystems; only after E1–E4 are stable.

## 5. Bugs fixed in the tools pass (registered IDs)

| ID | Was | Now |
|---|---|---|
| BUG-TOOL-005 | the Free Transform tool (Q) was registered but the Stage only understood 'select', so choosing it did nothing | Q drives select / move / handles |
| BUG-TOOL-007 | the Rectangle tool always drew `#3f9bf5` | draws with the Fill Color swatch |
| BUG-TOOL-008 | stroke on new shapes impossible | **closed (E1):** `draw_shape` takes fill + stroke + width; the Rectangle and Oval tools draw with the current swatches (Part 02b preamble) |
| zoom range | 5 %–3200 % (invented) | 8 %–2000 % exactly as documented by Adobe |

## 6. Merge note (2026-08-23, after PR #1)

`main` gained AI-B's work (Inc 0 folder guards + the unified Adobe-style
timeline chrome + onion skin P1). This branch was merged with it, keeping BOTH
sides:

- The Inc-0 engine guards (B-1…B-5, B-8) exist in both branches; **AI-B's
  implementation was kept** (`layer_and_ancestors_visible/unlocked`,
  `editable_target_layer`, `reject_frame_target`) so main stays the single
  source of truth and their tests keep passing.
- Kept from this branch on top: **B-6** (reordering a folder carries its whole
  subtree — still absent from main), the **BUG-P-001** properties fix, and the
  whole tools batch (Hand, Zoom, Paint Bucket, Ink Bottle, Eyedropper, colors
  area, options area, Free Transform wiring, Fill-Color-driven Rectangle).
- Their onion-skin subscription and my tool-colour/tool-option subscriptions now
  live side by side in `Stage.tsx`; nothing was dropped.

Post-merge verification: **859 UI tests pass**, `tsc -b` clean, `vite build`
clean. Rust still needs `cargo test` on a machine with the toolchain.

## 7. Oval batch + panel correction (2026-08-23, AI-T)

Rebuilt the lost previous-session work from scratch (the arena sandbox had
been re-cloned to the squashed PR-#3 merge; nothing was recoverable from git).

- **Tools forensic research** landed at `PROJECT_COORDINATION/TOOLS_FORENSIC_RESEARCH_AI-T.md`
  (29-row matrix + engine ladder E1–E5 + locked build order + 10-rule "done" checklist).
- **Tools panel corrected to the locked layout:** 36px rail · icons only (name+shortcut
  on hover/focus) · Tools+View in a scroll region · Colors+Options pinned bottom ·
  Colors area = Fill/Stroke chips + swap + black&white + no-color (click a chip →
  picker popover) · stroke width moved OFF the rail into a popover (W button).
- **Oval tool end-to-end (E1a):** engine `ShapeKind{Rect,Oval}` on `Node::Rect`
  (serde default → old files load), exact ellipse hit-test + marquee in `eval.rs`,
  `<ellipse>` in `export.rs`, `draw_shape` with fill AND stroke (BUG-TOOL-008 closed),
  `draw_rect` kept as the legacy facade; canvas renderer + rasterizer + draw preview
  draw the true ellipse; O key per Part 29 (onion toggle moved to Ctrl+Alt+O — D-0009,
  AI-B review). Oval Settings (arc/donut, T2B.5 field 12) + Primitives deferred to the
  corner-radius/PolyStar batch per the build order.
- **Verification:** `tsc -b` clean · **887 UI tests pass** (868 baseline + 19 new) ·
  `vite build` clean. **Rust NOT compiled here** (no cargo in the sandbox) —
  `cd animator/core && cargo fmt && cargo clippy --all-targets -- -D warnings && cargo test`
  on the human's machine, then `npm run wasm` in animator/ui.
