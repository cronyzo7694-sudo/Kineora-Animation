# F-03-17 — SELECTION EVENTS
```
SOURCE BLUEPRINT: Part 03 §3.9 · DEEP FEATURE: F-03-17 · STATUS: AUDITED
DEPENDS ON: F-03-02 · FEEDS: Part 32 (event bus)
```
## A. IDENTITY
1. Official name: (selection-change notification). Adobe's internal event names are **not public** → the event model is **[OUR DESIGN DECISION]**, aligned with the observable behavior (panels re-bind on selection change). 4. Purpose: notify panels/overlay/tools when the selection changes, so they re-render. 8. Status: our-model.

## EVIDENCE
E1 [OBSERVED] Properties/Info/Transform panels update instantly on selection change (F-03-02 E1/E2). E2 [OBSERVED] Selection persists only while the object exists (scrub → drops). E3 [INFERENCE] Adobe internals (event names, bus) are private → not documented.

## O. EVENT MODEL ([OUR DESIGN DECISION])
| Event | Trigger | Payload | Subscribers |
|---|---|---|---|
| `selection:changed` | click/marquee/lasso/select-all/deselect/undo-restore | `{prevTargets, targets, kind, commonType, bounds}` | Properties, Info, Transform, overlay, context-menu, Actions |
| `selection:preview` (throttled) | marquee/lasso drag | `{previewTargets}` | overlay |
| `timelineSelection:changed` | frame/layer selection | `{selectedFrames, selectedLayers, activeLayerId}` | timeline panel, frame Properties |
| `selection:lost` | node deleted / scrubbed away | `{nodeIds}` | stage, toast |
| `selection:hidden:changed` | Hide Edges toggle | `{hidden}` | overlay |
| `readoutPoint:changed` | reg/transform toggle | `{point}` | Info, Properties |
| `editMode:entered/exited` | drill in/out | `{scope, symbolId, breadcrumb}` | breadcrumb, dimming, timeline |

## D. EMIT RULES
1. Emit **once per gesture** (never per pointer-move). 2. Preview throttled (~60 Hz) during drags only. 3. Panels subscribe via the bus (Part 32) — no panel reads another directly. 4. Selection events carry **references/IDs**, never copies.

## Q/R
Undo/redo restores selection by **re-emitting** `selection:changed` with the command's captured `prevSelection`/post-state (F-03-02 Q). Events themselves are not serialized.

## S/T/U/V
Mobile: same events (tap/long-press/select-mode); announce selection via live region (a11y). Stylus: same events. Performance: one re-render per event; subscribers use dirty checks (no-op if payload unchanged).

## W. WORKFLOWS
W.1 Click shape → `selection:changed` → Properties renders shape schema; overlay draws box; Transform fills numeric fields — one event, four subscribers.

## TESTS
TS-01 click emits once (not per-move) · TS-02 marquee previews throttled · TS-03 undo re-emits restored selection · TS-04 selection:lost on delete · TS-05 scrub-drop emits lost · TS-06 hide-edges emits hidden:changed · TS-07 readout toggle emits · TS-08 editMode entered/exited · TS-09 panels re-bind · TS-10 mobile taps emit same events · TS-11 dirty-check no-op · TS-12 no event spam during playback (frame advances don't emit selection:changed).

## AUDITS
No contradiction. Self-challenge: overlooked = emit-once-per-gesture + selection:lost (deletion/scrub) + playback non-emission — covered. Marked [OUR DESIGN DECISION] throughout (Adobe internals private).
```
FEATURE COMPLETE: F-03-17 — Selection events — AUDITED
```
