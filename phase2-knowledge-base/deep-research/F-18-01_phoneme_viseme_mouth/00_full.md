# F-18-01 — PHONEME→VISEME MAPPING · F-18-02 — MOUTH LIBRARY
```
SOURCE BLUEPRINT: Part 18 §18.1–18.2 · DEEP FEATURES: F-18-01, F-18-02 · STATUS: AUDITED
DEPENDS ON: F-11-02/08 (graphic + frame picker) · FEEDS: F-18-03..07, F-19
```
## F-18-01 PHONEME→VISEME MAPPING
1. Official name: (viseme mapping / 12-viseme set). 4. Purpose: map phonemes (sounds) to visemes (mouth shapes); Animate works with **12 visemes**. 8. Status: current.
EVIDENCE
E1 [OFFICIAL] `symbol-instances.html`: "Animate recognizes and works with **12 visemes**"; auto lip-sync creates keyframes matching audio visemes. E2 [COMMUNITY] UDESCO: label frames with viseme names; 12 visemes. E3 [SECONDARY] Preston Blair mouth chart (12 shapes) — the classic basis.
SEMANTICS (the 12-shape chart)
| # | Viseme | Phonemes | Mouth |
|---|---|---|---|
| 1 | A | ah/hat/father | wide open, jaw dropped |
| 2 | B/M-P | m/p/b | closed lips |
| 3 | C/D-G-K-N-R-S-T-Y-Z | d/g/k/n/r/s/t/y/z/ch/j | slightly open, teeth |
| 4 | D | den/they | open, tongue up |
| 5 | E | ee/see/me | wide smile, teeth |
| 6 | F/V | f/v | lip under teeth |
| 7 | L/TH | l/th | tongue at teeth |
| 8 | O | oh/go/no | round O |
| 9 | U | oo/you/do | pursed |
| 10 | W/Q | w/q | tight pucker |
| 11 | Rest | silence | relaxed |
| 12 | (extra/expression) | growl/2nd-E | per artist |
LIMITATIONS: L.1 12-viseme mapping is language-agnostic-ish (English-centric) → ours: pluggable dictionary (Part 18.6.5). L.2 phoneme→viseme many-to-one (hearing vs seeing).
EDGE: M.1 fast speech collisions (F-18-04) · M.2 silence → rest.
TESTS: TS-01 12 visemes mapped · TS-02 many-to-one · TS-03 rest on silence · TS-04 custom dictionary (ours).

## F-18-02 MOUTH LIBRARY
1. Official name: (mouth symbol). 4. Purpose: one graphic symbol, one frame per mouth pose, labeled; driven by first-frame. 8. Status: current.
EVIDENCE
E1 [OFFICIAL] `symbol-instances.html`: mouth poses drawn inside a graphic symbol; each keyframe sets the instance's shown frame; Frame Picker picks. E2 [COMMUNITY] UDESCO: "Graphic symbol containing all the different Mouth poses"; label frames. E3 [BLUEPRINT Part 18.2]: each frame = full mouth drawing, same registration point; graphic (not movie clip) so parent drives.
SEMANTICS: graphic symbol; frame-per-viseme; label per frame (viseme name); instance firstFrame = pose (F-11-08).
LIMITATIONS: L.1 frame labels vs structured viseme field → ours: `viseme` field + label. L.2 registration shift breaks mouth → ours: joint-snap.
EDGE: M.1 pose frames beyond 20 (picker bug, F-18) → ours unlimited. M.2 extra expression frames in same symbol.
TESTS: TS-01 frame-per-viseme · TS-02 labeled · TS-03 firstFrame drives (F-11-08) · TS-04 registration stable · TS-05 unlimited frames (ours).
## AUDITS (both)
No contradiction. Self-challenge: overlooked = 12-viseme official count (E1) + graphic-not-clip (parent drives) + picker-20-frame bug — covered.
```
FEATURE COMPLETE: F-18-01/02 — Phoneme→viseme & mouth library — AUDITED
```
