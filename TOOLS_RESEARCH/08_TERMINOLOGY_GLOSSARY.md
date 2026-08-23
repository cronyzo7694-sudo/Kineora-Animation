# TERMINOLOGY GLOSSARY — 6 Core Tools (Pen, Pencil, Brush, Eraser, Shapes, Color)

> Ensures consistent terms across research and implementation. No Code.

## Purpose

Kineora must use consistent terminology, not randomly alternate between synonyms unless they mean different things. This glossary defines preferred terms for the 6 tools.

## Core Drawing Terms

| Term | Definition | When to Use | When NOT to Use | Kineora Preferred? |
|------|------------|-------------|-----------------|---------------------|
| **Stroke** | The outline of a shape or path, with color, width, style | For path outline, line, border | Not for fill | YES — use Stroke for outline |
| **Fill** | The interior color/pattern of a closed shape | For inside of rect/oval/path | Not for outline | YES — use Fill for interior |
| **Path** | A vector sequence of anchors and segments (bezier) | For Pen/Pencil/Brush vector paths | Not for primitive rect/oval (use Shape) | YES — Path for bezier |
| **Anchor Point** | A point defining a path segment, with optional handles | For Pen path points | Not for shape center | YES — Anchor Point |
| **Anchor** | Short for Anchor Point | In UI tooltips, but prefer full Anchor Point in docs | — | YES (short) |
| **Point** | Generic dot, but ambiguous — could be anchor, width point, etc. | Avoid generic, use specific: Anchor Point, Width Point | Avoid alone | NO — use specific |
| **Handle** | Bezier control handle (direction line + control point) | For Pen bezier handles | Not for transform handles | YES — Handle for bezier, Transform Handle for selection |
| **Control Point** | The end dot of a handle | For handle end | — | YES |
| **Direction Line** | Line from anchor to control point | For handle line | — | YES |
| **Segment** | Portion of path between two anchors | For path segment | — | YES |
| **Corner Point** | Anchor with no handles or with broken handles, sharp corner | For Pen corner | — | YES |
| **Smooth Point** | Anchor with symmetric handles, smooth curve | For Pen smooth | — | YES |
| **Shape** | Geometric primitive: Rectangle, Oval, Line, Polygon, Star | For Rect/Oval/Line/PolyStar tools | Not for freehand path | YES — Shape for primitives |
| **Primitive** | Live editable shape with parameters (e.g., Primitive Rectangle with corner radius hinges) | For live shapes with params | Not for ordinary path after conversion | YES — but deferred for MVP, use Shape for MVP |
| **Object** | Any selectable entity on stage: Rect, Oval, Path, SymbolInstance, etc. | For selection, properties, timeline | — | YES — generic |
| **Node** | Engine model term for object (NodeId, Node::Rect, etc.) | In engine docs only, not user-facing | Not in user UI | YES for engine, NO for UI — UI uses Object |
| **Brush Stroke** | A painted fill created by Brush tool, with points and size | For Brush tool | Not for Pencil (use Stroke) | YES — Brush Stroke |
| **Pencil Stroke** | Freehand line created by Pencil, stroke only | For Pencil | — | YES |

## Color Terms

| Term | Definition | Preferred? |
|------|------------|------------|
| **Fill Color** | Color of interior | YES |
| **Stroke Color** | Color of outline | YES |
| **Stroke Width** | Thickness of stroke/outline in pixels | YES |
| **Fill** | Short for Fill Color, but also means interior — use Fill Color when ambiguous | YES (contextual) |
| **Stroke** | Short for Stroke Color or Stroke Width — use Stroke Color / Stroke Width when ambiguous | YES (contextual) |
| **No Color / None** | Transparent fill or no stroke | YES — use None for transparent fill, No Stroke for no outline |
| **No Fill** | Fill = None, transparent interior | YES |
| **No Stroke** | Stroke disabled, no outline | YES |
| **Current Color / Authoring Color** | Fill/Stroke in ToolColors for new objects | YES — Current Fill, Current Stroke |
| **Selected Object Color** | Fill/Stroke of selected object in Properties | YES |
| **Swatch** | Small color square showing color | YES |
| **Eyedropper / Color Sampler** | Tool to sample color from canvas | YES — Eyedropper Tool (I) |
| **Opacity / Alpha** | Transparency 0-1 or 0-100% | YES — use Alpha for 0-1, Opacity for %? Decide: use Alpha for document (background_alpha), Opacity for UI? For MVP, use Alpha. Document: background_alpha 0..1 |
| **Gradient** | Linear/Radial color blend with stops | YES — but deferred |
| **Solid Color** | Single color, not gradient/bitmap | YES |

## Selection / Transform Terms

| Term | Definition | Preferred? |
|------|------------|------------|
| **Selection Tool** | Tool to select objects (V) | YES |
| **Subselection Tool** | Tool to select anchors (A) | YES |
| **Free Transform Tool** | Tool to scale/rotate (Q) | YES |
| **Selection** | Currently selected object ids | YES |
| **Marquee Selection** | Drag empty to select multiple via rect | YES |
| **Lasso Selection** | Freeform selection via lasso | YES — but deferred |
| **Bounding Box** | Rect around selection with handles | YES |
| **Transform Handle** | Small square at corner/edge of bounding box for scaling | YES |
| **Rotate Handle** | Handle above top-center for rotation | YES |
| **Origin / Center** | Point around which transform occurs | YES — use Center for rotate/scale anchor |
| **Anchor** | For transform, opposite handle or center — careful, same word as Anchor Point but different meaning! To avoid confusion, use Transform Anchor for transform, Anchor Point for path | YES — disambiguate |

## Layer Terms

| Term | Definition | Preferred? |
|------|------------|------------|
| **Layer** | Row in timeline holding frames and content | YES |
| **Folder / Layer Folder** | Organizational layer containing other layers, no frames | YES — Folder |
| **Normal Layer** | Regular layer with frames and content | YES |
| **Active Layer** | Layer where new drawings land, highlighted with pencil ✎ | YES |
| **Visible / Hidden** | Eye flag — visible true/false | YES — Visible, Hidden |
| **Locked / Unlocked** | Padlock flag — locked true/false, not editable | YES |
| **Outline Mode** | Outline-only view, strokes only with layer color | YES |
| **Outline Color** | Color used in outline mode | YES |
| **Parent / Child / Nest** | Layer hierarchy — child nested under folder parent | YES |

## Timeline Terms

| Term | Definition | Preferred? |
|------|------------|------------|
| **Playhead** | Current frame indicator, red line | YES |
| **Frame** | Single time unit | YES |
| **Keyframe** | Frame with content (solid dot) | YES — Content Keyframe |
| **Blank Keyframe** | Keyframe with empty content (hollow dot) | YES |
| **Held Frame / Held Span** | Frame that holds previous keyframe content (gray) | YES |
| **Empty Frame** | Frame with no content and no hold (white) | YES |
| **Duration** | Max keyframe frame, min 1 | YES |
| **FPS** | Frames per second | YES |
| **Auto-keyframe / Ensure Keyframe** | When drawing at held frame, auto-create keyframe copying previous (F6 semantics) | YES |
| **Onion Skin** | View-only ghost of previous/next frames | YES |
| **Tween / Classic Tween** | Interpolation between two keyframes with same object | YES |

## Input Terms

| Term | Definition | Preferred? |
|------|------------|------------|
| **Pointer Down / Up / Move / Cancel** | Pointer events | YES |
| **Click** | Pointer down + up without drag | YES |
| **Drag** | Pointer down + move + up with movement | YES |
| **Gesture** | One complete interaction from down to up | YES |
| **Threshold / Drag Threshold** | Minimum movement to start dragging (3px) | YES |
| **Modifier** | Keyboard key that changes behavior: Shift, Alt, Ctrl/Cmd | YES |
| **Cursor** | Visual pointer icon | YES |
| **Preview** | Temporary visual during drag, editor-only, never exported | YES |
| **Commit** | Permanent document change on pointer up | YES |
| **Cancel / Discard** | Abandon gesture via Esc, pointercancel, blur, tool switch — no document change | YES |

## Brush Terms

| Term | Definition | Preferred? |
|------|------------|------------|
| **Brush Tip** | Shape of brush dab (round, square, textured) | YES |
| **Brush Size** | Diameter of brush in doc px | YES |
| **Hardness** | Softness of brush edge | YES — but deferred for MVP |
| **Spacing** | Distance between dabs along stroke | YES |
| **Pressure** | Tablet pressure 0-1 affecting size/opacity | YES |
| **Tilt** | Tablet tilt angle affecting brush angle | YES |
| **Smoothing / Stabilization** | Algorithm to smooth shaky input: Weighted, Stabilizer, etc. | YES — Smoothing for simple, Stabilization for advanced |
| **Stabilizer** | Advanced smoothing with delay, sample count | YES |
| **Paint Mode / Brush Mode** | Where brush paints: Normal, Fills, Behind, Selection, Inside | YES |

## Eraser Terms

| Term | Definition | Preferred? |
|------|------------|------------|
| **Eraser Tool** | Tool to erase (E) | YES |
| **Eraser Mode** | Same as Brush Mode but for erasing: Normal, Fills, Lines, etc. | YES |
| **Faucet** | Click to erase entire fill/line | YES — but deferred |
| **Partial Erase** | Erase part of stroke, splitting it | YES — but deferred, MVP whole-object |

## General

| Term | Definition | Preferred? |
|------|------------|------------|
| **Stage** | White rect 1920x1080 where content is authored, on gray pasteboard | YES |
| **Pasteboard** | Gray area outside stage, staging area, not exported | YES |
| **Viewport** | View transform: zoom + pan, doc↔screen math | YES |
| **Document** | Whole animation file with scenes, layers, nodes | YES |
| **Scene** | Container of layers, like Adobe Scene | YES |
| **Engine / Core** | Rust core compiled to WASM, handles document, commands, eval, export | YES |
| **WASM / WASM Core** | The compiled Rust core loaded via /wasm/kineora_core.js | YES |
| **Client / Engine Client** | TS facade engine/client.ts — UI's only doorway to core | YES |
| **Command** | Undoable operation: DrawRect, MoveSelection, etc. | YES |
| **Undo / Redo** | History of commands | YES |

## Terms to Avoid or Disambiguate

- **Point:** Avoid generic, use Anchor Point, Width Point, etc.
- **Line:** Avoid generic for outline, use Stroke or Path or Segment
- **Shape:** Use for geometric primitives only, not freehand paths
- **Object vs Shape vs Node:** Object = user-facing generic, Shape = geometric primitive, Node = engine model term (not user-facing)
- **Anchor:** Could be Anchor Point (path) or Transform Anchor (transform) — always specify which
- **Color vs Fill:** Fill is interior, Color is generic — use Fill Color when specific
- **Opacity vs Alpha:** Use Alpha for 0..1 numeric (background_alpha), Opacity for UI percentage? For consistency, use Alpha in engine, Opacity in UI? Decide: use Alpha for both but with % in UI? For MVP, use Alpha 0..1 in engine, Opacity label in UI but value 0..100%? Actually background_alpha 0..1, but UI shows? Keep Alpha.

## Glossary Creation Rule

When adding new term, add to this file with definition, when to use, when not to use, and whether Kineora prefers it.

This ensures no random alternation between synonyms.

