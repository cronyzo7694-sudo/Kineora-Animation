# F-22-04 — STYLE CONTROLS · F-22-05 — TEXT TRANSFORM · F-22-06 — TEXT ANIMATION · F-22-07 — DYNAMIC BINDING · F-22-08 — EXPORT PER TYPE
```
SOURCE BLUEPRINT: Part 22 §22.3–22.7 · DEEP FEATURES: F-22-04..08 · STATUS: AUDITED
DEPENDS ON: F-22-01/03
```
## F-22-04 STYLE CONTROLS
1. Official name: (text styles). 4. Purpose: full style set. 8. Status: current.
EVIDENCE
E1 [OFFICIAL] `classic-text.html`: letter spacing (tracking+kerning) + **Auto-Kern**; **superscript/subscript** toggle; alignment, **margins, indents, line spacing** (paragraph section). E2 [OFFICIAL] same: **anti-aliasing options** — Bitmap Text (no AA), **Anti-Alias For Animation** (ignores alignment/kerning, for animated text), **Anti-Alias For Readability** (small sizes), **Custom Anti-Alias** (sharpness + thickness); device fonts for some. E3 [OFFICIAL] same: **Selectable** (static horizontal/dynamic; input always); selectable text = copy/cut/paste.
SEMANTICS (style set)
family · size (pt) · style (bold/italic) · color+alpha · letter spacing · autokern · superscript/subscript · align · margins · indents · line spacing · anti-alias mode · selectable · embed.
LIMITATIONS: L.1 Anti-Alias-For-Animation ignores kerning (E2) → tooltip. L.2 selectable + line-spacing bug (community) → ours: fix.
EDGE: M.1 AA mode on animated text · M.2 superscript toggle.
TESTS: TS-01 letter spacing + autokern (E1) · TS-02 superscript/subscript · TS-03 margins/indents · TS-04 AA modes (E2) · TS-05 selectable (E3) · TS-06 custom AA sharpness/thickness.

## F-22-05 TEXT TRANSFORM
1. Official name: (text transform). 4. Purpose: move/scale/rotate/skew/flip; break-apart hierarchy. 8. Status: current.
EVIDENCE
E1 [OFFICIAL] `classic-text.html`: "transform text by rotating, skewing, or flipping." E2 [BLUEPRINT Part 22.4]: break-apart ×2 = shapes (distort/envelope then allowed).
SEMANTICS: text transforms as a node (Part 04); distort/envelope needs break-apart ×2; flip mirrors.
LIMITATIONS: L.1 distort on text blocked → break apart (E2).
EDGE: M.1 scaled text (vector, no quality loss) · M.2 flipped text.
TESTS: TS-01 rotate/skew (E1) · TS-02 flip · TS-03 break-apart → chars → shapes · TS-04 distort after break.

## F-22-06 TEXT ANIMATION
1. Official name: (text animation). 4. Purpose: tween/per-char/morph/mask techniques. 8. Status: current.
EVIDENCE
E1 [BLUEPRINT Part 22.5]: motion tween text (auto-wrap symbol); per-char (break-apart once + stagger); morph (break-apart ×2 + shape tween); masked reveal; filters.
SEMANTICS (techniques)
| Technique | How |
|---|---|
| Motion tween | text wraps to symbol (F-09-01) |
| Per-char | break-apart once → char blocks → staggered tweens |
| Morph | break-apart ×2 → shapes → shape tween |
| Masked reveal | mask layer wipe (F-21-03 E2) |
| Filters | blur/glow (F-11-09) |
LIMITATIONS: L.1 AA-for-animation mode recommended for animated text (E2-22-04).
EDGE: M.1 typewriter stagger · M.2 text wipe.
TESTS: TS-01 motion tween text · TS-02 per-char stagger · TS-03 morph · TS-04 mask wipe · TS-05 filter.

## F-22-07 DYNAMIC BINDING
1. Official name: (dynamic text binding). 4. Purpose: runtime text updates. 8. Status: current.
EVIDENCE
E1 [COMMUNITY/StackOverflow]: dynamic TextField + instance name + `T.text = "abc"` (script). E2 [BLUEPRINT Part 22.6]: ours = variable/expression binding in behavior system; HTML5 compiles to JS data-binding.
SEMANTICS: dynamic block binds to a variable; input binds to a form value.
LIMITATIONS: L.1 AS3 scripting legacy → ours: behavior graph + JS.
EDGE: M.1 score counter · M.2 input form.
TESTS: TS-01 dynamic binds variable · TS-02 input binds form · TS-03 HTML export JS binding.

## F-22-08 EXPORT PER TYPE
1. Official name: (text export). 4. Purpose: per-type export behavior. 8. Status: current.
EVIDENCE
E1 [OFFICIAL] `classic-text.html`: static = outlines exported; device fonts = static only. E2 [BLUEPRINT Part 22.7]: matrix.
SEMANTICS (matrix)
| Type | Web | Image/video | SVG |
|---|---|---|---|
| Static | outlines/embedded | rendered | `<text>` or paths |
| Dynamic | JS-bound (embedded) | current value | current value |
| Input | form input | current value | current value |
LIMITATIONS: L.1 un-embedded on export → warn + (embed/outline/fallback) choice (E1).
EDGE: M.1 embed at export time · M.2 outline-to-paths.
TESTS: TS-01 static outlines · TS-02 dynamic current value · TS-03 un-embedded warn · TS-04 SVG text/paths.
## AUDITS (all five)
No contradiction. Self-challenge: overlooked = AA-for-animation-ignores-kerning + size-in-points + break-apart-×2-for-distort — covered.
```
FEATURE COMPLETE: F-22-04..08 — Style, transform, animation, binding, export — AUDITED
```
