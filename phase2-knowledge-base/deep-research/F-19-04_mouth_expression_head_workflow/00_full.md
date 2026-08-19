# F-19-04 — MOUTH SYSTEM · F-19-05 — EXPRESSION SYSTEM · F-19-06 — HEAD MOVEMENT · F-19-07 — FACIAL WORKFLOW
```
SOURCE BLUEPRINT: Part 19 §19.3–19.7 · DEEP FEATURES: F-19-04..07 · STATUS: AUDITED
DEPENDS ON: F-18 (mouth), F-19-01
```
## F-19-04 MOUTH SYSTEM
1. Official name: (mouth). 4. Purpose: lip-sync (Part 18) + expression poses in the same symbol. 8. Status: current.
EVIDENCE
E1 [BLUEPRINT Part 19.3]: mouth = graphic, frame-per-viseme, driven by auto lip-sync or Frame Picker; expression poses (smile/frown/grin/gritted) as extra frames; jaw nesting for open poses.
SEMANTICS: mouth symbol doubles as viseme set + expression set; swap to expression poses (F-11-10); jaw MC rotates open on A/O.
LIMITATIONS: L.1 viseme vs expression frame mixing → ours: separate frame ranges (viseme 1–12, expression 13+).
EDGE: M.1 smile during speech (expression + viseme priority).
TESTS: TS-01 viseme frames · TS-02 expression frames · TS-03 jaw open · TS-04 swap expression.

## F-19-05 EXPRESSION SYSTEM
1. Official name: (expressions). 4. Purpose: coordinated brows+eyes+mouth presets. 8. Status: current.
EVIDENCE
E1 [BLUEPRINT Part 19.4] expression table (neutral/happy/angry/surprised/sad/scared → brows/eyes/mouth). E2 [BLUEPRINT Part 19.4] two impls: expression symbols (one frame per expression) vs composite presets (bundle of part poses).
SEMANTICS
| Expression | Brows | Eyes | Mouth |
|---|---|---|---|
| Neutral | rest | open | rest |
| Happy | raised | squint | smile |
| Angry | furrowed | narrow | frown/grit |
| Surprised | high | wide | O(ah) |
| Sad | inner up | droopy | frown |
| Scared | raised+inner | wide | E/A |
- Swap (frame-based) vs tween (transform-based) — ours: both; default swap (Animate style).
DATA: `expression = {id, parts:[{partId, pose|transform}]}` preset library.
LIMITATIONS: L.1 frame-based expressions snap → ours: blend option (P2).
EDGE: M.1 expression during lip-sync (mouth priority) · M.2 tween between expressions.
TESTS: TS-01 preset apply · TS-02 swap mode · TS-03 tween mode · TS-04 expression+speech mouth priority.

## F-19-06 HEAD MOVEMENT
1. Official name: (head movement). 4. Purpose: nod/tilt/shake/turn. 8. Status: current.
EVIDENCE
E1 [BLUEPRINT Part 19.5]: nod = rotation around neck pivot; tilt = skew/rotate; shake = rapid small rotations; turn = swap front/¾/side poses; overlap = head leads, hair lags.
SEMANTICS
| Move | Keys |
|---|---|
| Nod | down-up-settle (3 keys + ease) |
| Tilt | rotate/skew |
| Shake | 3–5 fast alternating keys |
| Turn | pose swap + quick ease |
LIMITATIONS: L.1 full 360° turn = advanced rig (P3) · L.2 overlap needs spring/delayed keys.
EDGE: M.1 anticipation before nod · M.2 hair lag (spring, F-14-06).
TESTS: TS-01 nod 3-key · TS-02 tilt · TS-03 shake · TS-04 turn swap · TS-05 overlap delay.

## F-19-07 FACIAL WORKFLOW
1. Official name: (facial pipeline). 4. Purpose: end-to-end facial build. 8. Status: current.
EVIDENCE: E1 [BLUEPRINT Part 19.6] 7 steps (draw → symbolize → nest → pivots → mouth library → blink → animate).
SEMANTICS: draw parts → symbolize → nest under head → pivots → mouth visemes → blink → animate (head+expression+lip-sync+blinks) → layer order (brows>eyes>mouth>face).
LIMITATIONS: L.1 order mistakes → ours: face-rig template.
EDGE: M.1 template reuse across characters.
TESTS: TS-01 pipeline builds · TS-02 layer order · TS-03 template reuse (ours).
## AUDITS (all four)
No contradiction. Self-challenge: overlooked = expression+speech mouth priority + nod-3-key-settle + turn-is-swap-not-rotate — covered.
```
FEATURE COMPLETE: F-19-04..07 — Mouth, expression, head movement, workflow — AUDITED
```
