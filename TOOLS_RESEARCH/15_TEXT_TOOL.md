# Text Tool — Research and Implementation Contract

**Status:** Research complete — batch 3  
**Priority:** P1 for complete cartoon titles/captions; not required for the first shape-only proof  
**Shortcut:** `T`  
**Related files:** [Selection](01_SELECT_TOOL.md), [Free Transform](02_FREE_TRANSFORM_TOOL.md), [Line/Rectangle/Oval](08_LINE_RECT_OVAL_TOOLS.md), [Properties blueprint](../animate-blueprint/26_properties_panel.md), [Text blueprint](../animate-blueprint/22_text.md)

## 1. Purpose

Text is a scene object with editable characters, style, layout box, and transform. It is required for titles, subtitles, labels, credits, speech cards, and eventually dynamic captions. It must not block the core vector drawing MVP, so implementation is staged:

- P1: Static text, point text, box text, basic typography, transform, export.
- P2: Dynamic/input text and runtime binding.
- P2/P3: advanced text animation, per-character controls, font embedding workflows.

## 2. Adobe behavior to retain

[ADOBE] Adobe distinguishes point text and fixed-width/box text. The Properties inspector controls font family, size, color, style, alignment, spacing, text behavior, and anti-aliasing. Static, dynamic, and input text have different runtime meanings. Text can be transformed; Break Apart converts text to characters and then vector shapes.

[KINEORA] Use a clean text engine and explicit edit mode. Do not silently rasterize text on creation. If an export target cannot carry an editable font, offer embedded font, outlined path, or a clearly labeled fallback.

## 3. Text node model

```text
TextNode {
  id: NodeId,
  text: string,
  behavior: Static | Dynamic | Input,
  layout: PointText | BoxText { width, height, overflow },
  style: TextStyle,
  transform: Transform,
  font_ref: FontRef,
  binding: Option<Binding>,
  selectable_at_runtime: bool
}

TextStyle {
  family,
  size,
  color: RGBA,
  bold,
  italic,
  underline,
  align: Left | Center | Right | Justify,
  letter_spacing,
  line_spacing,
  direction,
  anti_alias
}
```

Store text as Unicode. Do not assume one code unit = one visible character; caret/selection uses grapheme clusters and the text engine's metrics.

## 4. Create and edit workflow

### Create point text

```text
activate T
pointerdown on empty stage
  -> validate active layer/frame
  -> create editor-only text insertion point
  -> enter text edit mode
text input
  -> update preview text buffer
pointerdown outside / Ctrl+Enter / tool switch
  -> commit one CreateText/TextEdit command
```

Point text auto-expands horizontally and does not wrap by default.

### Create box text

- Drag a rectangle before typing.
- Text wraps at the fixed width.
- Height can auto-expand or clip according to the Overflow setting.
- Resize handles change the box; they do not change font size unless the user chooses a scale option.

### Edit existing text

- Text tool click/double-click inside a text node enters caret mode.
- Selection tool double-click can hand off to Text edit.
- `Esc` exits character editing to object selection; a second Escape clears selection/cancels an uncommitted new text node.
- Use native IME composition for Hindi and other languages; never commit partially composed text.
- Ctrl/Cmd+A selects all text in the active text node while editing, not all stage objects.

## 5. Properties panel

### Text section

- content editor;
- font family with installed/available status;
- size;
- bold/italic/underline;
- fill color and alpha;
- alignment;
- letter spacing/tracking;
- line spacing/leading;
- point vs box layout;
- overflow behavior;
- text behavior Static/Dynamic/Input.

### Transform section

Use the shared transform contract: X, Y, W, H, scale, rotation, skew when supported. Scaling via Transform keeps the text editable; changing font size changes text metrics and layout.

### Font availability

If the selected font is missing:

- show a warning chip;
- offer substitute preview;
- on export offer Embed, Outline, or Use fallback;
- never silently change the project text without recording a command.

## 6. Animation behavior

- Static text is normal frame content and can be transformed/tweened.
- Text content change at frame 10 creates a keyframe content change; it does not rewrite frame 1.
- Text path/topology is not shape-tweened by default.
- Break Apart once creates separate character objects; each can be transformed/tweened.
- Break Apart twice converts characters to vector paths editable by [Subselection](10_SUBSELECTION_TOOL.md)/[Pen](07_PEN_TOOL.md).
- Dynamic/Input are later runtime behaviors; in offline authoring preview they display their current design-time value.

## 7. Break Apart contract

```text
BreakApart(textNode, level=1)
  -> [TextNode per grapheme/character]

BreakApart(textNode or characterNodes, level=2)
  -> [PathNode per glyph outline]
```

The command stores the original text node and generated nodes for exact undo. Complex scripts/ligatures may map a grapheme to multiple glyphs; preserve visual grouping rather than splitting in the middle of a ligature.

## 8. Context menus and shortcuts

- Edit Text.
- Select All Text.
- Copy/Cut/Paste characters while in edit mode.
- Break Apart.
- Embed/Outline Fonts.
- Convert to Symbol.
- Transform.
- Copy/Paste Style.

Shortcuts must respect text-edit focus so `P`, `B`, `T`, `E`, etc. type into the text instead of changing tools.

## 9. Export behavior

| Type | Static image/SVG | Sequence/video | HTML/web |
|---|---|---|---|
| Static | text or outlines | rendered at frame | embedded font or outlines |
| Dynamic | current design-time value | current value | binding metadata/runtime code later |
| Input | current value | current value | editable runtime field later |

SVG export may use `<text>` only when font fidelity is guaranteed; otherwise export glyph outlines. PNG/video rasterize using the same evaluated text layout as Canvas.

## 10. Errors and safeguards

- Locked/hidden/tween layer: blocked.
- Font unavailable: warn and offer fallback.
- Unsupported IME composition: keep composing text and do not lose input.
- Empty text on commit: discard empty node unless an explicit placeholder is desired.
- Text overflow: show editor warning and Properties action to resize box/fit text.
- Break Apart on dynamic/input text: confirm conversion to static design content.

## 11. Acceptance matrix

1. Click creates point text; drag creates box text.
2. Type Latin, Devanagari, emoji, and combining marks without character corruption.
3. Double-click enters edit mode; Escape exits without losing committed text.
4. Font, size, color, weight, alignment, spacing, and box dimensions update live and commit predictably.
5. Missing font warning appears and export choice is explicit.
6. Transform text without rasterization; Canvas and SVG/image export agree.
7. Break Apart once preserves character appearance and separate selection.
8. Break Apart twice produces editable vector glyph paths.
9. Text at frame 10 does not alter frame 1.
10. Undo coalesces a typing session sensibly and restores exact content/style.
11. Locked/hidden/tween guards work.
12. Text selection shortcuts do not change tools while editing.
13. Export excludes caret, selection box, and text edit handles.
14. Save/load preserves Unicode, style, layout, behavior, and font reference.
15. Dynamic/input conversion warns before losing runtime semantics.

## 12. Dependencies and code map

Dependencies: Text Engine, font metrics/embedding, Unicode/IME handling, Path/glyph outlining, selection/transform, Properties, timeline/keyframes, serializer, export.

Expected locations:

- `animator/ui/src/editor/textTool.ts`
- `animator/core/src/model.rs`
- `animator/core/src/text.rs` (new)
- `animator/core/src/command.rs`
- `animator/core/src/eval.rs`
- `animator/ui/src/components/PropertiesPanel.tsx`
- `animator/core/src/export.rs`

## Adobe source references

- [Using Animate authoring panels](https://helpx.adobe.com/animate/using/authoring-panels.html)
- [Work with classic text in Animate](https://helpx.adobe.com/animate/using/classic-text.html)
- Existing source: `animate-blueprint/02b_tools_drawing.md` T2B.2
- Existing source: `animate-blueprint/22_text.md`
