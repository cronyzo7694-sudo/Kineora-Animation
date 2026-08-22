# Deep Audit Report — Tools Research Folder

**Date:** 2026-08-23  
**Scope:** `TOOLS_RESEARCH/00_INDEX.md` through `TOOLS_RESEARCH/21_FINAL_TOOL_AUDIT.md`  
**Purpose:** record the quality checks performed before implementation.  
**Implementation status:** not started.

## 1. Checks performed

### Structural checks

- 22 Markdown files were scanned.
- Total research size: 4,683 lines before this report.
- Every planned tool family has a file:
  - Select, Transform, Pencil, Brush, Bucket, Eraser;
  - Pen, Line/Rectangle/Oval, PolyStar/Primitives;
  - Subselection, Width, Eyedropper/Ink Bottle;
  - Hand/Zoom/Stage Rotate;
  - Paint Brush, Text, Time Scrubber/Camera;
  - Bone/Bind/Asset Warp;
  - legacy/deferred tools;
  - command matrix and integrated acceptance matrix.
- All tool files contain purpose, UI/interaction, timeline behavior, acceptance tests, and dependencies.
- Relative Markdown file links resolve.
- Local Markdown fragment links resolve after checking heading slugs.
- No actual credential/private-key pattern exists in the research or source files. The dependency tree contains ordinary library examples with words such as `password`; that is not a repository credential.

### Cross-consistency checks

- Shortcut list was compared with the existing `animate-blueprint/29_shortcuts.md`.
- Command names were compared between `19_TOOL_COMMAND_MATRIX.md` and `21_FINAL_TOOL_AUDIT.md`.
- Viewport, camera, object transform, playhead, and export responsibilities were compared across tools.
- Auto-Key, held-frame, locked/hidden-layer, tween-span, preview, commit, undo, and export rules were compared across content tools.
- Primitive → Bake to Path → Subselection → Width relationships were checked.
- Pencil/Brush/Paint Brush distinctions were checked.
- Bucket/Eraser/boolean/region dependencies were checked.

## 2. Issues found and corrected in this audit

### Issue A — shortcut collision

The old research inherited two collisions:

- `O` was both Oval and Onion Skin.
- `D` was both color reset and Expose Same Drawing.

**Resolution:**

- `O` = Oval.
- `Shift+O` = Onion Skin.
- `Ctrl+Shift+O` = Onion Skin outlines.
- `D` = Expose Same Drawing.
- Color reset is a visible Color-panel action without a global default shortcut.
- Graph Editor uses `Ctrl+Alt+G`; Ungroup keeps `Ctrl+Shift+G`.
- Remove Transform has a menu/button action and no default shortcut.

The final list is in `21_FINAL_TOOL_AUDIT.md` and overrides older notes if needed.

### Issue B — style snapshot timing

Some tool notes originally allowed style/shape settings to be captured at pointer release while Brush already snapshotted at pointerdown. This could make a user changing a panel during a gesture see a preview that does not match the committed result.

**Resolution:** every content gesture snapshots its style/tool settings at `pointerdown`. The same snapshot drives preview and commit. Panel changes apply to the next gesture.

### Issue C — missing formal sections

Selection and view tools had useful content but inconsistent heading labels, which made automated completeness checks report false gaps.

**Resolution:** formal Purpose and Timeline interaction sections were added where appropriate. View tools explicitly say that Timeline interaction is view-only/no-op for document history.

### Issue D — broken local fragment

The Pen file linked to a non-existent anchor `#1-line-tool` in the grouped geometric-tools file.

**Resolution:** corrected to `#3-line-tool`; fragment audit now reports zero local fragment errors.

### Issue E — separate-layer coloring gap

A strict active-layer-only bucket/brush workflow would make the common line-art-on-one-layer and color-on-another workflow difficult.

**Resolution:** active layer remains the deterministic MVP default. A visible P1 `All visible unlocked layers` reference scope is specified for Brush/Fill modes and Bucket. Other layers are read-only references; resulting color is still committed to the active layer. Hidden/locked layers are excluded.

## 3. Intentional limitations, not hidden bugs

These are intentionally deferred and documented, not missing requirements:

- Skew, Distort, Envelope, and draggable transform pivot beyond the MVP center pivot.
- Full Merge mode booleans until the vector boolean engine is ready.
- Motion-path and shape-tween editing.
- Paint Brush Art/Pattern implementation until the basic Pencil/Brush loop is stable.
- Dynamic/Input text runtime binding.
- Camera layer depth/parallax and presets.
- Bone/Bind/Asset Warp.
- Fluid Brush, Deco, Spray, and legacy 3D as separate tools.

Deferred tools must be hidden or labelled Planned; they cannot appear as dead functional buttons.

## 4. Current code reality

The research is implementation-ready, but the current repository is not yet a full 2D editor:

- `animator/core/src/model.rs` currently has `Rect` and `SymbolInstance` node variants, not the full Path/Stroke/Fill/Primitive/Text/Brush/Bitmap model.
- `animator/core/src/command.rs` and `wasm.rs` contain the current rectangle/symbol/timeline command surface, not the future tool commands in the matrix.
- `animator/ui/src/components/Toolbar.tsx` and `App.tsx` currently dispatch a limited set of tools; the generic ToolController in the research is future work.
- `LayersPanel.tsx` and `TimelineStrip.tsx` exist as separate UI components. The unified Adobe-style layer/timeline row is future work.
- The Rust toolchain is not installed in this sandbox, so Rust compile/test verification cannot be performed here.

These are known implementation gaps. They are listed in `21_FINAL_TOOL_AUDIT.md` so coding cannot accidentally assume they already exist.

## 5. Existing verification evidence

Before this audit, the existing UI project was installed and verified:

- 59 UI test files passed.
- 779 UI tests passed.
- TypeScript/Vite production build passed.

The run emitted non-fatal existing warnings that should be cleaned before the UI usability gate:

1. Duplicate React key `1` in `TimelineStrip` tests.
2. Several React updates not wrapped in `act(...)` in integration tests.
3. Conflicting shorthand/non-shorthand `border` and `borderBottom` style updates in `DocumentTabs`.

These warnings are not caused by the research folder, but they are real code-quality items for the implementation/QA phase.

## 6. Usability verdict

**Research verdict: PASS with intentional implementation gates.**

The tool contracts are internally linked, the known conflicts are resolved, and the P0 animation workflow is explicit. The files are detailed enough to guide implementation without inventing behavior during coding.

**Code verdict: NOT YET VERIFIED.**

No document can honestly claim that the eventual UI will be usable until the P0 loop is implemented and the integrated acceptance scenarios pass on a Rust-enabled environment and in manual Canvas/touch/stylus testing.

## 7. Pre-code gate

Before writing the first feature code:

- read `21_FINAL_TOOL_AUDIT.md`;
- freeze the shared Path/Style/Command/Event contracts;
- fix or consciously accept the three existing UI warnings;
- restore/install Rust and run the current core baseline;
- preserve current rectangle/symbol/timeline tests;
- implement only Phase 0/Phase 1 in the final audit;
- do not expose P1/P2 tools as functional until their own tests pass.
