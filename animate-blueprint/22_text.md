# PART 22 — TEXT
### Text tool, static/dynamic/input text, font, size, alignment, spacing, color, transform, text animation — the complete text system.

---

## 22.0 The three text types (behavior, not just style)

| Type | Meaning | Runtime | Use |
|---|---|---|---|
| **Static** | Authored display text; **not changeable at runtime**; rendered as outlines/glyphs | fixed | Titles, labels, logos |
| **Dynamic** | Text whose **content is updated at runtime** (a variable, a score, a caption) | mutable via binding/script | Scoreboards, captions, live data |
| **Input** | A **user-editable field** (typing at runtime) | editable by the end user | Forms, name entry, chat |

The type is a **per-text-block property** (`textType`), stored with the text node.

---

## 22.1 The text tool & text blocks

- **Click** = **point text** (auto-width; grows with content; no wrap).
- **Drag** = **fixed-width box** (content wraps at the box width).
- **Click inside existing text** = character editing (caret + selection).
- Text is a **node** in the scene graph (Part 03.4.5): selectable, transformable, keyframable.

### Text model

```jsonc
{ "type":"text",
  "text":"Hello", "textType":"static|dynamic|input",
  "style": { "fontFamily":"Inter", "fontSize":24, "color":"#000000", "alpha":1,
             "bold":false, "italic":false, "underline":false,
             "align":"left|center|right|justify",
             "letterSpacing":0, "lineSpacing":1.2 },
  "box": { "width":null, "height":null, "autoSize":"width" },   // null = point text
  "embedFonts":[], "antiAlias":"normal|device", "selectable":true,
  "binding": null }   // dynamic text: a variable/expression (Part 22.6)
```

---

## 22.2 Font & glyphs

- **Font family** — any installed system font, or an **embedded font** (bundled with the project so it renders identically everywhere).
- **Embedding** — for dynamic/input text (and for export targets without the font), you **embed** the needed **glyphs** (a subset: basic Latin, a specific range, or the characters used). Embedded fonts guarantee WYSIWYG across devices.
- **Fallback** — un-embedded text falls back to a system font → layout may shift (the classic bug). Our app **warns** ("font not embedded — may differ at export") and offers one-click embed.
- **Web fonts** — our app additionally supports Google/local web fonts (HTML5 export maps them to `@font-face`), a direct improvement over Animate.

### Font metrics the engine must expose
- **baseline, ascent, descent, advance width, kerning** — needed for caret positioning, box wrapping, and export fidelity. Use the platform text API (canvas `measureText` / Skia / DirectWrite) — never hand-roll metrics.

---

## 22.3 Style controls (the complete set)

| Control | Field | Notes |
|---|---|---|
| Font family | `fontFamily` | dropdown with preview |
| Size | `fontSize` | px (pt at 72dpi in print contexts) |
| Color | `color` + `alpha` | *[WISH W6]* alpha slider always visible |
| Bold / Italic / Underline | `bold, italic, underline` | style flags |
| Alignment | `align` | left/center/right/justify (box text) |
| Letter spacing | `letterSpacing` | tracking (px) |
| Line spacing | `lineSpacing` | leading (multiplier or px) |
| Auto-kern | (auto) | optional manual kerning override |
| Anti-alias | `antiAlias` | normal (smooth) / device (system, sharper at small sizes) |
| Selectable | `selectable` | input/dynamic: user can select/copy |
| Border/background (input) | (P1) | optional field border/fill for input fields |
| Max chars (input) | (P1) | character limit |
| Embed | `embedFonts` | glyph subset registration |

---

## 22.4 Text transform

- Text transforms like any node (Part 04): move/scale/rotate/skew. Scaling text scales the glyphs (vector) — no quality loss.
- **Distort/Envelope** require Break Apart (text → shapes), same rule as symbols (Part 04.6).
- **Flip** mirrors text (useful for labels in mirrored scenes).

---

## 22.5 Text animation

| Technique | How | Use |
|---|---|---|
| **Motion tween text** | text wraps into a symbol automatically (Part 09.1.1); tween position/scale/rotation/alpha | fades, slides, title cards |
| **Per-character animation** | Break Apart once → each **character** becomes its own text block → tween each (stagger with delayed keys) | typewriter, wave-in titles |
| **Morph text** | Break Apart twice → text becomes **vector shapes** → shape tween (Part 09.3) | liquid text morphs |
| **Masked text reveal** | mask layer wipes across the text (Part 21) | wipe-on, spotlight |
| **Blur/glow** | instance filters (Part 11.5) | focus effects |

---

## 22.6 Dynamic text binding (runtime)

- A **dynamic** text block binds to a **variable/expression** (e.g., `score`, `player.name`, `timer.text`). The runtime updates `text` each frame/event.
- Our app's **behavior/event system** (Part 01 §1.12) provides the binding; HTML5 export compiles it to a JS data-binding; input text binds to a form value.
- **Legacy:** Animate's AS3 `TextField` (scripting); TLF (Text Layout Framework) deprecated. Our app: no TLF, a clean binding model instead.

---

## 22.7 Export behavior per type

| Type | HTML5/Web | Image/sequence/video | SVG |
|---|---|---|---|
| Static | glyph outlines or embedded font | rendered to pixels (or vector if exported as SVG) | `<text>` or outlined paths |
| Dynamic | JS-bound text (embedded font) | rendered at current value | current value |
| Input | form input | rendered at current value (static) | current value |

**Rule:** un-embedded fonts on export → warn + offer (a) embed, (b) outline the text to paths (lossless but not editable), or (c) accept system-font fallback.

---

## 22.8 BUILD CHECKPOINT M3 (text slice)

- [ ] Text tool (point + box) with inline editing; three text types.
- [ ] Full style set (family/size/color/alpha/bold/italic/align/letter/line spacing/anti-alias/selectable).
- [ ] Font embedding (glyph subsets) + web fonts + export warnings.
- [ ] Text transform + break-apart hierarchy (chars → shapes).
- [ ] Text animation techniques (tween/per-char/morph/mask).
- [ ] Dynamic text binding; per-type export behavior.

*Next: `23_color.md` — fill, stroke, color picker, swatches, alpha, gradient (linear/radial), custom colors, color replacement.*
