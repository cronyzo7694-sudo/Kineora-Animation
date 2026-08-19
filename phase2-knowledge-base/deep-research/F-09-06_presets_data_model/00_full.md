# F-09-06 — EASING & MOTION PRESETS · F-09-07 — TWEEN DATA MODEL
```
SOURCE BLUEPRINT: Part 09 §9.4.5–9.4.6, §9.5 · DEEP FEATURES: F-09-06, F-09-07 · STATUS: AUDITED
DEPENDS ON: F-09-05, F-09-01
```
## F-09-06 PRESETS
1. Official name: ease presets / motion presets / Copy-Paste Motion. 4. Purpose: reuse a saved easing or whole tween across objects. 8. Status: current.
EVIDENCE
E1 [OFFICIAL] `classic-tween-animation.html`: save custom eases (Save and Apply) → reuse via custom list; **presets reusable within the same document type**; apply across multiple spans. E2 [OFFICIAL] same: ease presets for position/rotation/scale/color/filters. E3 [OFFICIAL] `classic-tween-animation.html`: **Copy Motion as XML** (Commands menu) copies motion properties at a frame to clipboard XML. E4 [OFFICIAL] `classic-tween-animation.html`: **Copy Motion / Paste Motion Special** (Edit > Timeline) apply to a symbol instance. E5 [OFFICIAL] `creating_a_motion_tween_animation.html`: motion tween can be saved as a **preset** for reuse (tween span advantage).
SEMANTICS
- Ease preset = named curve (E1/E2). Motion preset = whole tween (all property curves) (E5).
- Copy/Paste Motion = copy one object's motion to another (E3/E4).
LIMITATIONS: L.1 presets doc-type-scoped (E1) → ours: cross-doc JSON presets. L.2 XML clipboard legacy (E3) → ours: JSON.
EDGE: M.1 apply preset to a different-duration span (scales) · M.2 paste motion onto non-symbol (wrap).
TESTS: TS-01 save/apply ease (E1) · TS-02 per-property preset (E2) · TS-03 copy/paste motion (E4) · TS-04 motion preset reuse (E5) · TS-05 cross-doc (ours) · TS-06 undo.

## F-09-07 TWEEN DATA MODEL
EVIDENCE (all [OFFICIAL] carried): motion span (E-animation-basics), classic/shape span fields (E-classic-tween-animation, shape-tweening), roving (using-property-keyframes).
O. MODEL (Part 33 consolidated)
```jsonc
// motion tween span
{ "type":"tween", "kind":"motion", "targetId":"n123", "start":1, "duration":60,
  "properties": {
    "x":[ {frame:1,value:0}, {frame:61,value:320,roving:false} ],
    "rotation":[ {frame:1,value:0}, {frame:61,value:360,orientation:"CW",rotations:1} ],
    "alpha":[ {frame:1,value:1}, {frame:61,value:0} ] },
  "path": { "anchors":[...], "closed":false } }       // derived from x/y keys (Part 10)
// classic tween
{ "type":"classicTween", "start":1, "end":30, "ease":0, "customEase":[{t,y}...],
  "rotate":{"mode":"CW","count":1}, "orientToPath":true, "snap":false, "sync":false }
// shape tween
{ "type":"shapeTween", "start":1, "end":30, "ease":0, "customEase":[...], "shapeHints":[{"start":0,"end":2}] }
// ease preset
{ "id":"ease_bounceOut","name":"Bounce Out","fn":"bounceOut","params":{},"custom":[{"t":0,"y":0},{"t":1,"y":1}] }
// motion preset
{ "id":"preset_fadeUp","name":"Fade Up","kind":"motion","properties":{...} }
```
DOCUMENT vs VIEW: span records = document; displayed-key-type filter (F-08-01) + graph-editor zoom = view.
TESTS: TS-01 round-trip motion span · TS-02 classic span · TS-03 shape span + hints · TS-04 ease preset · TS-05 motion preset · TS-06 derived path recompute · TS-07 reload identical.
## AUDITS (both)
No contradiction. Self-challenge: overlooked = doc-type-scoped presets (E1) + XML legacy (E3) + derived path — covered.
```
FEATURE COMPLETE: F-09-06/07 — Presets & tween data model — AUDITED
```
