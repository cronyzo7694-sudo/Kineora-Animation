# F-22-01 — THREE TEXT TYPES · F-22-02 — TEXT TOOL & BLOCKS · F-22-03 — FONT & GLYPHS
```
SOURCE BLUEPRINT: Part 22 §22.0–22.2 · DEEP FEATURES: F-22-01/02/03 · STATUS: AUDITED
DEPENDS ON: F-02-09 (Text tool)
```
## F-22-01 THREE TEXT TYPES
1. Official name: Static / Dynamic / Input text (classic text). 4. Purpose: authored vs runtime-updatable vs user-editable text. 8. Status: current (TLF legacy removed).
EVIDENCE
E1 [OFFICIAL] `classic-text.html`: Static = can't update dynamically; Dynamic = displays dynamically updating text; Input = user-entered text. E2 [OFFICIAL] same: **Classic Text** from Text Engine menu (TLF removed); variable-name method = legacy (Macromedia Flash 5 back-compat).
SEMANTICS (table)
| Type | Runtime | Use |
|---|---|---|
| Static | fixed (outlines exported) | titles/labels |
| Dynamic | updated (variable/binding) | score/captions |
| Input | user-editable | forms/entry |
LIMITATIONS: L.1 TLF removed (E2) → ours: clean binding model (no TLF). L.2 dynamic needs instance name (E2).
EDGE: M.1 static→dynamic convert · M.2 input selectable by default (E1).
TESTS: TS-01 three types create · TS-02 static fixed · TS-03 dynamic binding · TS-04 input editable · TS-05 no-TLF (ours).

## F-22-02 TEXT TOOL & BLOCKS
1. Official name: Text tool. 4. Purpose: point (auto-width) vs fixed-width box; text edit mode. 8. Status: current.
EVIDENCE
E1 [OFFICIAL] `classic-text.html`: static text = single line expanding OR fixed-width (wrapping); dynamic/input = single line OR fixed W/H field. E2 [OFFICIAL] same: **Static Vertical Text: width field disabled** (height adjusts width). E3 [BLUEPRINT Part 22.1]: click = point text; drag = box; click-inside = caret.
SEMANTICS: point text (auto-width) vs box (wrap); vertical text (legacy CJK); caret editing.
LIMITATIONS: L.1 vertical text legacy → ours: horizontal core, vertical P3.
EDGE: M.1 empty text block (zero width) · M.2 box resize re-wrap.
TESTS: TS-01 point text grows · TS-02 box wraps · TS-03 caret edit · TS-04 vertical legacy · TS-05 empty block.

## F-22-03 FONT & GLYPHS
1. Official name: (fonts/embedding). 4. Purpose: font family, embedding, metrics, fallback. 8. Status: current.
EVIDENCE
E1 [OFFICIAL] `classic-text.html`: font attributes = family, point size, style, color, letter spacing, **autokerning**, character position. E2 [OFFICIAL] same: **font outlines exported for static text**; dynamic/input = names stored, player locates similar fonts — **embed font outlines** to guarantee correct fonts; `_sans/_serif/_typewriter` + device fonts = static-horizontal only. E3 [OFFICIAL] same: font size in **points** regardless of ruler units.
SEMANTICS: static = outlines (WYSIWYG); dynamic/input = embed or fallback; font size in points (E3).
LIMITATIONS: L.1 un-embedded dynamic = fallback shift → ours: warn + one-click embed. L.2 device fonts = static-horizontal only (E2).
EDGE: M.1 embed subset (glyphs) · M.2 web fonts (ours).
TESTS: TS-01 family/size (pt, E3) · TS-02 static outlines · TS-03 embed dynamic · TS-04 fallback warn · TS-05 autokern.
## AUDITS (all three)
No contradiction. Self-challenge: overlooked = size-in-points (E3) + static-outlines-vs-embed (E2) + TLF-removed (E2) — covered.
```
FEATURE COMPLETE: F-22-01/02/03 — Text types, tool, fonts — AUDITED
```
