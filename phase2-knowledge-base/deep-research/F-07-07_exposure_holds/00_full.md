# F-07-07 — EXPOSURE, HOLDS & FRAME SPANS
```
SOURCE BLUEPRINT: Part 07 §7.3 · DEEP FEATURE: F-07-07 · STATUS: AUDITED
DEPENDS ON: F-07-01/06 · FEEDS: F-15-05 (timing)
```
## A. IDENTITY
1. Official name: (exposure / held frames / keyframe sequence). 4. Purpose: control **how long** a keyframe's content stays visible (its hold) — the core timing mechanism. 8. Status: current.

## EVIDENCE
E1 [OFFICIAL] `time.html`: "A keyframe and the span of regular frames that follow it are known as a keyframe sequence." E2 [OFFICIAL] `time.html`: content keyframe → gray held frames; content-less → white. E3 [OFFICIAL] `frames-keyframes.html`: **static frame span** = same content for entire duration (E5 in F-07-06). E4 [OFFICIAL] `time.html`: "hollow rectangle at the last frame of the span." E5 [COMMUNITY] F5 = extend (domestika), Shift+F5 = remove (reddit).

## O. HOLD RULE (the semantic)
```
content(layer, f) = content of nearest keyframe ≤ f (hold until next keyframe)
exposure(keyframe) = frames [k, nextKeyframe-1] = its held span
```
- A **blank keyframe** = an explicit empty hold (content disappears there).
- **Frame span** = [keyframe, nextKeyframe−1]; last cell = hollow rectangle (E4).
- Extending = F5 (insert one more held frame); shortening = Shift+F5 (remove one).

## E. STATES
| Operation | Effect on hold |
|---|---|
| Insert Frame (F5) | +1 held frame (content holds longer) |
| Insert Keyframe (F6) | new key copies prev content (hold splits; edit breaks the copy) |
| Insert Blank (F7) | new empty key (hold becomes empty here) |
| Delete Frame (Shift+F5) | −1 frame (timeline shortens) |
| Clear Keyframe (Shift+F6) | keyframe→held (collapses into prev hold) |

## L. LIMITATIONS
L.1 Exposure is per-keyframe, not per-drawing asset (Animate has no "drawing reuse" — [WISH W1]) → ours adds drawing-asset exposure (F-15-06). L.2 Timing on ones/twos/threes = manual F5 repetition → ours: "hold N frames" dialog + span-drag.

## M. EDGE CASES
M.1 hold across a tween (not allowed — tween spans are their own type) · M.2 last keyframe holds to infinity until a later key or doc end · M.3 blank keyframe mid-hold · M.4 hold of 1 (keyframe only) · M.5 delete all held frames → keyframe only · M.6 exposure of a labeled keyframe (label persists through hold).

## O/P/Q/R/S/Y
Data: hold is **derived** (no per-frame storage); only keyframe positions stored. Events: `timeline:changed` on F5/F6/F7/delete. Undo: each insert/delete = one command (F-07-08/11). Serialization: keyframe positions persisted. Mobile: long-press frame → Insert/Delete; span-edge drag. Implementation: `expose(layer, frame)` = binary-search nearest keyframe; span extent = next keyframe − 1 (cached).

## TESTS
TS-01 hold = nearest keyframe ≤ f · TS-02 F5 extends · TS-03 Shift+F5 shortens · TS-04 F6 splits hold (copies content) · TS-05 F7 empties hold · TS-06 blank breaks hold · TS-07 last key holds to doc end · TS-08 hollow-rect at span end (E4) · TS-09 hold-N dialog (ours) · TS-10 undo each op · TS-11 reload identical holds · TS-12 exposure across label persists.
## AUDITS
No contradiction. Self-challenge: overlooked = hold-rule derivation + blank-breaks-hold + F6-copies-vs-F7-empties — covered.
```
FEATURE COMPLETE: F-07-07 — Exposure & holds — AUDITED
```
