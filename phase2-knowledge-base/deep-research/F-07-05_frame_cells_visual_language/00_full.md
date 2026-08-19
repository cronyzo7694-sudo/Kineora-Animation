# F-07-05 — FRAME CELLS & VISUAL LANGUAGE
```
SOURCE BLUEPRINT: Part 07 §7.1.4, §7.2 · DEEP FEATURE: F-07-05 · STATUS: AUDITED
DEPENDS ON: F-07-01/06
```
## A. IDENTITY
1. Official name: (frame cells / timeline visual indicators). 4. Purpose: encode each frame's **type** and **state** visually in the layer×frame grid. 8. Status: current.

## EVIDENCE (the complete visual language)
E1 [OFFICIAL] `time.html`: frames after a **content** keyframe appear **gray**; after a content-less keyframe appear **white**. E2 [OFFICIAL] `time.html`: **black dot** = single keyframe; light-gray held frames end with a **vertical black line + hollow rectangle** at the last frame of the span. E3 [OFFICIAL] `time.html`: **black dot + black arrow + blue background** = classic tween. E4 [OFFICIAL] `time.html`: **solid diamond** = property keyframe; **empty/filled circle** = standard keyframe (don't confuse them). E5 [OFFICIAL] `animation-basics.html`: **blue span + black dot start + black diamond keys** = motion tween; **hollow dot first frame** = target removed. E6 [OFFICIAL] same: **green span + diamond poses** = IK pose layer. E7 [OFFICIAL] same: **light-green span + arrow** = shape tween; **dashed line** = broken/incomplete classic tween. E8 [OFFICIAL] same: small **"a"** = frame action; **red flag** = frame label. E9 [OFFICIAL] `time.html`: **gray frames** = content visible; **white frames** = no content (blank keyframe span).

## F. VISUAL LANGUAGE TABLE (implement as a style sheet)
| Cell | Visual | Meaning |
|---|---|---|
| Keyframe (content) | solid black dot | authored content (E2) |
| Blank keyframe | hollow dot | explicit empty (E2 white) |
| Held frame (content) | light gray | repeats keyframe content (E1/E2) |
| Held frame (empty) | white | repeats nothing (E1) |
| End of span | vertical line + hollow rectangle | last held frame (E2) |
| Motion tween | blue span, black dot start, black diamonds | tween + property keys (E5) |
| Motion tween (no target) | hollow dot start | target removed (E5) |
| Classic tween | blue span + arrow | interpolated (E3) |
| Broken classic tween | dashed line | missing endpoint (E7) |
| Shape tween | light-green span + arrow | morph (E7) |
| IK pose | green span + diamonds | armature poses (E6) |
| Property keyframe | solid diamond | per-property key (E4) |
| Frame action | small "a" | script/behavior (E8) |
| Frame label | red flag | named frame (E8) |

## E. STATES
Cell appearance varies by: frame type, has-content, tween kind, label/action presence, playhead position (current-frame highlight), selection (frame selection highlight), onion range (tinted bracket zone).

## L. LIMITATIONS
L.1 Diamond-vs-circle confusion (property vs standard keyframe, E4) → ours: tooltip on hover + legend. L.2 Colorblind users can't distinguish blue/green spans → ours: shape-based differentiation (span texture + pattern, not color-only).

## M. EDGE CASES
M.1 broken tween (dashed, E7) · M.2 target-removed motion span (hollow dot, E5) · M.3 labeled+actioned frame (flag + "a") · M.4 onion range overlapping a span · M.5 very short span (1 frame = just the keyframe).

## O/P/Q/R/S/Y
Data: cells derived from `frames[]` (sparse) — no per-cell storage. Events: none (render). Undo: n/a. Serialization: none (derived). Mobile: same glyphs (enlarged); hover tooltips → long-press. Implementation: a `FrameCellStyle` resolver mapping (frame, layer, playhead, selection, onion) → style; cached per cell-rect.

## TESTS
TS-01 content keyframe = black dot · TS-02 blank = hollow dot · TS-03 held gray (E1) · TS-04 held white (E1) · TS-05 end-of-span hollow rect (E2) · TS-06 motion span blue (E5) · TS-07 classic arrow blue (E3) · TS-08 shape light-green (E7) · TS-09 pose green (E6) · TS-10 dashed broken (E7) · TS-11 label flag + action "a" (E8) · TS-12 diamond property key (E4) · TS-13 colorblind pattern mode (ours) · TS-14 tooltip legend (ours).
## AUDITS
No contradiction. Self-challenge: overlooked = diamond-vs-circle (E4) + hollow-dot target-removed (E5) + colorblind differentiation — covered. Version stable.
```
FEATURE COMPLETE: F-07-05 — Frame cells & visual language — AUDITED
```
