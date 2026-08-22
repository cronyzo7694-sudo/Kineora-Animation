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
| Rectangle | R | **WORKING** | drag-draw, Shift = square, Alt = from centre, Esc cancels, uses the **Fill Color swatch** (BUG-TOOL-007 fixed) | Stage.test.tsx |
| Paint Bucket | K | **WORKING** | click an object → repaint with the Fill Color, one undo step; "None" fill paints nothing | Stage.test.tsx |
| Ink Bottle | S | **WORKING** | click an object → stroke colour + width applied; "None" removes the stroke | Stage.test.tsx |
| Eyedropper | I | **WORKING** | click → copies the object's fill/stroke into the swatches → **auto-switches to Paint Bucket** (Adobe behavior) | Stage.test.tsx |
| Hand | H | **WORKING** | drag to move the view; **Spacebar** temporarily switches from any tool; never touches the document | Stage.test.tsx |
| Zoom | Z | **WORKING** | click = in, Alt+click = out, **drag a rectangle = that area fills the window**, Esc cancels, Enlarge/Reduce modifier in the options area, 8 %–2000 % like Animate | Stage.test.tsx, viewport.test.ts |
| Tools-panel colors area | — | **WORKING** | Fill + Stroke swatches, No-colour, swap, reset-to-default, stroke width — app state, never undoable | toolColors.test.ts, ToolColors.test.tsx |
| Tools-panel options area | — | **WORKING** (Zoom only) | shows only real modifiers; empty for tools that have none | ToolOptions.test.tsx |

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
| Oval / Rectangle-Primitive / Oval-Primitive / PolyStar | O · R · O · — | shape kinds (ellipse, rounded rect, star) + renderer + SVG export + hit-test |
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

### E1 — Shape kinds (Oval, Line, PolyStar, rounded Rect) · unlocks O, N, PolyStar
- `Node::Rect` gains `#[serde(default)] shape: ShapeKind {Rect, Oval, Line, Star{points, inner}}` and `corner_radius: f64` (defaults keep every existing file loading unchanged).
- `RectItem` carries `shape` + `corner_radius`; `canvasRenderer.ts` draws `ellipse()` / `lineTo()` / star path; `export.rs` emits `<ellipse>` / `<line>` / `<polygon>`; the export rasterizer follows.
- Hit-test: ellipse and line get their own inside-tests (an AABB hit on an oval is a bug, not an approximation).
- Session: `draw_shape(kind, x, y, w, h, fill)` — one command, same guards as `draw_rect` (folder / locked / hidden).
- Tools: Oval (O), Line (N) — Shift = circle / 45° constrain, Alt = from centre (same gesture code as the Rectangle tool, already tested).

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
| BUG-TOOL-008 (partial) | stroke on new shapes impossible | the Ink Bottle now applies stroke colour + width to any object; stroke-at-draw-time needs an engine parameter (E1) |
| zoom range | 5 %–3200 % (invented) | 8 %–2000 % exactly as documented by Adobe |
