# F-23-01 — COLOR MODEL · F-23-02 — COLOR CONTROLS · F-23-03 — COLOR PICKER · F-23-04 — SWATCHES
```
SOURCE BLUEPRINT: Part 23 §23.0–23.3 · DEEP FEATURES: F-23-01..04 · STATUS: AUDITED
DEPENDS ON: F-05 (fill/stroke)
```
## F-23-01 COLOR MODEL
1. Official name: (fill/stroke color model). 4. Purpose: RGBA + gradients + bitmap fills. 8. Status: current.
EVIDENCE: E1 [BLUEPRINT Part 23.0] model: solid/linear/radial/bitmap; stops (offset+color+alpha); gradient transform (center/scale/rotate/focal); alpha on every color.
O. MODEL
```jsonc
"color": { "r":63,"g":169,"b":245,"a":1.0 }
"fillStyle": { "type":"solid|linear|radial|bitmap",
  "stops":[{"offset":0,"color":{...}},{"offset":1,"color":{...}}],
  "transform":{"centerX":0,"centerY":0,"scaleX":1,"scaleY":1,"rotation":0,"focal":0},
  "bitmapAssetId":null }
```
TESTS: TS-01 round-trip color · TS-02 gradient stops · TS-03 transform · TS-04 bitmapAssetId.

## F-23-02 COLOR CONTROLS (Tools panel)
1. Official name: Stroke/Fill chips + swap + b&w + no-color. 4. Purpose: current stroke/fill defaults. 8. Status: current.
EVIDENCE
E1 [OFFICIAL] `strokes-fills-gradients.html`: Stroke Color + Fill Color controls (Tools panel + Properties); **Black And White button** = reset (white fill, black stroke); **No Color** = none; **swap**; System Color Picker; hex entry; **live color preview** (hover swatch previews on shape).
SEMANTICS: chips set current style for new drawings + restyle selection; no-color = stroke-only/fill-only; b&w = reset.
LIMITATIONS: L.1 both-none = invisible shape → warn.
EDGE: M.1 swap fill/stroke · M.2 no-color fill (stroke-only).
TESTS: TS-01 chip sets default · TS-02 restyle selection · TS-03 b&w reset (E1) · TS-04 no-color · TS-05 swap · TS-06 live preview (E1).

## F-23-03 COLOR PICKER
1. Official name: (color picker). 4. Purpose: choose color (RGB/HSB/hex/alpha). 8. Status: current.
EVIDENCE
E1 [OFFICIAL] `strokes-fills-gradients.html`: System Color Picker button; hex entry; hover preview. E2 [BLUEPRINT Part 23.2]: HS field + brightness slider + RGB/HSB/hex + alpha + swatch strip + in-picker eyedropper.
CONTROLS: hue/sat field · brightness · RGB/HSB fields · hex · alpha · swatches · eyedropper.
LIMITATIONS: L.1 alpha nested in picker → ours: top-level opacity slider (W6).
EDGE: M.1 hex entry · M.2 eyedropper in picker.
TESTS: TS-01 HS field · TS-02 RGB/HSB/hex · TS-03 alpha · TS-04 eyedropper · TS-05 opacity slider (ours).

## F-23-04 SWATCHES
1. Official name: Swatches panel. 4. Purpose: saved color chips. 8. Status: current.
EVIDENCE
E1 [OFFICIAL] `strokes-fills-gradients.html`: "Add to Swatches" (from gradient palette). E2 [BLUEPRINT Part 23.3]: add/delete/rename/folders/import-export/default palette.
SEMANTICS: chip grid; add current; folders; import/export sets; default palette.
LIMITATIONS: L.1 Animate swatches doc-scoped → ours: app-level + doc-level.
EDGE: M.1 import external set · M.2 folder organize.
TESTS: TS-01 add swatch (E1) · TS-02 delete/rename · TS-03 folders · TS-04 import/export · TS-05 default palette.
## AUDITS (all four)
No contradiction. Self-challenge: overlooked = live-hover-preview (E1) + b&w-reset + alpha-nested (W6) — covered.
```
FEATURE COMPLETE: F-23-01..04 — Color model, controls, picker, swatches — AUDITED
```
