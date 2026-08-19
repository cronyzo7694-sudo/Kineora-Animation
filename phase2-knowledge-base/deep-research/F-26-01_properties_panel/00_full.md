# F-26-01..12 — PROPERTIES PANEL (full part)
```
SOURCE BLUEPRINT: Part 26 · DEEP FEATURES: F-26-01..12 · STATUS: AUDITED
DEPENDS ON: F-03 (selection), F-07 (frames), F-11 (instances)
```
## A. IDENTITY
1. Official name: Property inspector / Properties panel. 4. Purpose: contextual inspector that re-binds to tool/selection/frame/document. 8. Status: current.
## EVIDENCE
E1 [OFFICIAL] `selecting-objects.html`: selecting an object → Properties shows stroke/fill/dimensions/x-y of transformation point; mixed selection = set dims. E2 [OFFICIAL] `symbol-instances.html`: instance props (behavior/settings/color/location/size/loop/instance-name); reg/transform toggle. E3 [OFFICIAL] `classic-text.html`: text type menu (Classic Text) + style/paragraph/anti-alias. E4 [OFFICIAL] `using-sounds.html`: sound section per keyframe (sync/loop/effect). E5 [OFFICIAL] `frames-keyframes.html`: label field + type (name/comment/anchor).
## F-26-01 CONTEXT-BINDING MECHANISM
Precedence: tool → selection → frame → document. Schema contract: `getPropertySchema(ctx)` → sections → fields (Part 26.0). Panel renders; writes via Commands.
## F-26-02..12 SCHEMAS (consolidated)
- DOCUMENT: width/height/units/fps/bg(+alpha)/platform/publish.
- SHAPE: pos/size, fill(stops/bitmap), stroke(width/style/cap/join/profile), fillRule, primitive params.
- GROUP: pos/size, type badge, edit-in-place hint.
- INSTANCE: symbol+swap, type, instance name, pos/size, color effect (brightness/tint/alpha/advanced), filters(+params), loop (graphic), tracking (button), lip-syncing button.
- TEXT: type, content, char (family/size/color/bold/italic/letter-spacing/autokern), paragraph (align/margins/indents/line-spacing), behavior (selectable/AA/embed), pos/size.
- FRAME/TWEEN: label(name/comment/anchor), sound(sync/loop/trim/effect), ease+rotate+orient+snap+sync (classic), ease+blend+hints (shape), view-keyframes (motion).
- CAMERA: x/y/z/zoom/rotation + reset + tint/filters.
- AUDIO: sound asset, sync, loop, effect, trim, volume+envelope.
- BONE: length, rotation constraint, translation, joint speed, spring, nav buttons.
- WARP: mode (rigid/flexible), envelope, pins.
- MIXED: common only (x/y/w/h).
## L. LIMITATIONS
L.1 alpha nested in color-effect dropdown → ours: top-level slider (W6). L.2 mixed = common only (E1). L.3 label types: name(red flag)/comment(green //)/anchor(gold) (F-08 label evidence).
## M. EDGE CASES
M.1 nothing selected → document schema · M.2 mixed → common only · M.3 tool active → tool options · M.4 frame selected → frame schema · M.5 numeric commit on Enter/blur.
## O/P/Q/R/S/Y
Data: reads model; writes via Commands. Events: subscribes `selection:changed`/`tool:changed`/`timelineSelection:changed`/`document:changed`. Undo: field commit = one command (coalesced drags). Serialization: values persisted. Mobile: bottom-sheet panel. Implementation: `PropertySchemaRegistry` + `FieldRenderer` (number/text/color/select/slider/checkbox/gradient/curve).
## TESTS
TS-01 doc schema (empty) · TS-02 shape schema · TS-03 instance (swap/color/filters/loop) · TS-04 text schema · TS-05 frame label+sound · TS-06 camera · TS-07 audio · TS-08 bone · TS-09 mixed common-only · TS-10 field commit undo · TS-11 reg/transform toggle (E2) · TS-12 mobile sheet.
## AUDITS
No contradiction. Self-challenge: overlooked = context-precedence + label-types (name/comment/anchor) + mixed-common-only — covered.
```
FEATURE COMPLETE: F-26-01..12 — Properties panel — AUDITED
```
