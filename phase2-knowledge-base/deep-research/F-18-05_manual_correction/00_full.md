# F-18-05 — MANUAL OVERRIDE & FRAME PICKER · F-18-06 — IMPROVED ORIGINAL SYSTEM · F-18-07 — LIP-SYNC DATA MODEL
```
SOURCE BLUEPRINT: Part 18 §18.5–18.7 · DEEP FEATURES: F-18-05/06/07 · STATUS: AUDITED
DEPENDS ON: F-18-03, F-11-08
```
## F-18-05 MANUAL OVERRIDE & FRAME PICKER
1. Official name: Frame Picker (manual lip-sync). 4. Purpose: correct auto results frame-by-frame; the manual fallback. 8. Status: current.
EVIDENCE
E1 [OFFICIAL] `symbol-instances.html`: Frame Picker = visual per-frame browser of a graphic symbol; open via Properties > Looping > Use Frame Picker, or Window > Frame Picker; **pin** symbol; multiple symbols in separate panels. E2 [BLUEPRINT Part 18.5]: correction tools — Frame Picker, Swap, drag keyframes, F6/F7, hold (F5), scrub-with-audio.
SEMANTICS (correction toolkit)
| Tool | Does |
|---|---|
| Frame Picker | pick pose per keyframe (E1) |
| Swap | swap mouth instance (F-11-10) |
| Drag key | re-time (F-08-12) |
| F6/F7/F5 | add/blank/hold poses |
| Scrub + audio | review by ear (F-17-07) |
LIMITATIONS: L.1 manual = labor-intensive → auto + correct (F-18-03). L.2 picker graphic-only (E1).
EDGE: M.1 pin while scrubbing (E1) · M.2 hold a plosive (M pose longer).
TESTS: TS-01 frame picker picks pose · TS-02 pin (E1) · TS-03 swap mouth · TS-04 drag key re-time · TS-05 hold pose (F5) · TS-06 scrub review.

## F-18-06 IMPROVED ORIGINAL SYSTEM (ours)
1. Official name: (our lip-sync). 4. Purpose: 10 improvements over Animate's system. 8. Status: our-design.
IMPROVEMENTS (from blueprint Part 18.6)
1. Live waveform + phoneme lane (colored labeled blocks) · 2. Editable detection (drag boundaries, re-map) · 3. Confidence display · 4. Per-character lead/lag offset (ms) · 5. Viseme dictionary (editable/sharable) · 6. Multi-language pluggable · 7. VAD threshold slider · 8. Optional blend (morph between poses) · 9. Batch multi-character · 10. Undoable auto-pass (one command).
LIMITATIONS: L.1 blend default OFF (snap = stylized) · L.2 multi-language = models not bundled (P2).
EDGE: M.1 lead/lag per mouth · M.2 batch 3 characters one audio.
TESTS: TS-01 phoneme lane · TS-02 drag boundary re-time · TS-03 confidence highlight · TS-04 lead/lag offset · TS-05 dictionary edit · TS-06 VAD slider · TS-07 blend toggle · TS-08 batch · TS-09 undo auto-pass.

## F-18-07 LIP-SYNC DATA MODEL
EVIDENCE: [BLUEPRINT Part 18.7] (our design).
O. MODEL
```jsonc
"mouthPoses":[ {"frame":1,"viseme":"A"}, {"frame":2,"viseme":"B/M"}, ... ]
"lipSync": { "mouthSymbolId":"mouth","audioAssetId":"voice01","audioLayerId":"L_audio",
  "visemeMap":{"A":1,"B/M":2,"C/D":3,"E":4,"F/V":5,"L/TH":6,"O":7,"U":8,"W/Q":9,"rest":10},
  "result":[ {"viseme":"O","startFrame":12,"endFrame":14,"confidence":0.93} ],
  "leadMs":0,"blend":false }
```
Rule: mouth-layer keyframes = ordinary keyframes with instance firstFrame = viseme pose (reuses symbol system, not a parallel one).
TESTS: TS-01 visemeMap round-trip · TS-02 result frames · TS-03 keyframes reuse symbol system · TS-04 reload identical.
## AUDITS (all three)
No contradiction. Self-challenge: overlooked = pin-while-scrubbing (E1) + lead/lag trick + blend-default-off + keyframes-reuse-symbol-system — covered.
```
FEATURE COMPLETE: F-18-05/06/07 — Manual correction, improved system, data model — AUDITED
```
