# F-15-05 — EXPOSURE & TIMING (ones/twos/threes) · F-15-06 — CEL/DRAWING REUSE SYSTEM [WISH W1]
```
SOURCE BLUEPRINT: Part 15 §15.4–15.5 · DEEP FEATURES: F-15-05, F-15-06 · STATUS: AUDITED
DEPENDS ON: F-07-07 (holds), F-08-12
```
## F-15-05 EXPOSURE & TIMING
1. Official name: (exposure / hold timing). 4. Purpose: control how long each drawing holds (ones/twos/threes). 8. Status: current.
EVIDENCE
E1 [OFFICIAL] `frames-keyframes.html`: static frame span = same content for duration (F-07-06 E5). E2 [BLUEPRINT Part 15.4]: ones=1, twos=2, threes=3 frames per drawing; twos = 12fps feel on 24fps.
SEMANTICS
- Exposure = hold length (F-07-07). Ones/twos/threes = hold 1/2/3.
- Limited animation uses twos (halves drawing work).
LIMITATIONS: L.1 manual F5 repetition → ours: "hold N frames" dialog + span-edge drag + "apply to all keyframes" (P2).
EDGE: M.1 mixed ones/twos in one layer · M.2 hold across a tween (not allowed).
TESTS: TS-01 exposure = hold · TS-02 ones/twos/threes · TS-03 hold-N dialog (ours) · TS-04 apply-all (ours) · TS-05 undo.

## F-15-06 CEL / DRAWING REUSE SYSTEM [WISH W1]
1. Official name: (cel/drawing reuse — our design; Animate lacks it). 4. Purpose: reusable drawings + exposure so a frame references a drawing (cel model), fixing "duplicate frame = independent copy" complaint. 8. Status: our-design (W1).
EVIDENCE
E1 [COMMUNITY] r/animation: "no cel based workflow… duplicate a frame and make changes, only that frame changes." E2 [OFFICIAL] F-07-09: F6 copies prev keyframe (independent). E3 [BLUEPRINT Part 15.5] our two-op model.
SEMANTICS (our model)
| Op | Key (ours) | Semantics |
|---|---|---|
| **Expose same drawing** (share) | D + click frame | frame references a Library drawing; edit updates all exposures |
| **Duplicate to new drawing** (independent) | F6 (default) | copy into a new drawing; edits local |
| **Edit drawing** | double-click | drawing editor (in place) |
DATA MODEL
```jsonc
{ "type":"drawing","id":"d_012","layers":[...] }      // Library asset
"frames":[ { "type":"keyframe","drawingId":"d_012" } ] // frame exposes a drawing
```
LIMITATIONS: L.1 Animate's F6-only model (E1) → ours supersets it. L.2 drawing edits propagate (surprising) → ours: clear "shared" badge on exposed frames.
EDGE: M.1 expose across scenes · M.2 edit shared drawing → all update · M.3 duplicate-then-edit (independent) · M.4 broken drawingId (warn).
TESTS: TS-01 expose-same shares · TS-02 edit propagates · TS-03 duplicate-new independent · TS-04 shared badge · TS-05 across scenes · TS-06 broken ref warn · TS-07 undo · TS-08 reload.
## AUDITS (both)
No contradiction. Self-challenge: overlooked = F6-copy-vs-expose distinction (W1) + hold-N automation + shared-drawing propagation surprise — covered.
```
FEATURE COMPLETE: F-15-05/06 — Exposure & cel/drawing reuse — AUDITED
```
