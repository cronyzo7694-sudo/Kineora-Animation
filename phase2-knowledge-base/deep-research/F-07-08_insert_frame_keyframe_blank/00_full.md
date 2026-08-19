# F-07-08 — INSERT FRAME (F5) · F-07-09 — INSERT KEYFRAME (F6) · F-07-10 — INSERT BLANK KEYFRAME (F7)
```
SOURCE BLUEPRINT: Part 07 §7.4.1–7.4.3 · DEEP FEATURES: F-07-08/09/10 · STATUS: AUDITED
DEPENDS ON: F-07-01/06/07
```
## A. IDENTITY
1. Official names: Insert > Timeline > Frame (F5) / Keyframe (F6) / Blank Keyframe (F7). 4. Purpose: the three core frame-insertion ops — extend a hold, copy the previous frame into a new keyframe, or create an empty keyframe. 8. Status: current.

## EVIDENCE
E1 [OFFICIAL] `frames-keyframes.html`: F5 = insert frame; F6 = insert keyframe; F7 = insert blank keyframe (Insert menu + right-click context). E2 [OFFICIAL] `time.html`: keyframe = new symbol instance or code frame; blank keyframe = placeholder or explicit blank. E3 [OFFICIAL] `animation-basics.html`: F6 in a tween span adds a **property keyframe for all property types**. E4 [OFFICIAL] `using-property-keyframes.html`: "To add a property keyframe for all property types to a span… Insert > Timeline > Keyframe, or press F6." E5 [COMMUNITY] F6 duplicates the previous keyframe's content (then edit the copy).

## D. SEMANTICS MATRIX
| Op | Shortcut | Where valid | Result |
|---|---|---|---|
| Insert Frame (F5) | F5 | static/held spans | +1 held frame; shifts later frames right (E1) |
| Insert Keyframe (F6) | F6 | any frame | new keyframe **copying** the previous keyframe's content (E5); in a motion span = property key for all props (E3/E4) |
| Insert Blank (F7) | F7 | any frame | new **empty** keyframe; content disappears from here (E1/E2) |

## E. STATES
| Context | F5 | F6 | F7 |
|---|---|---|---|
| Held frame | extends hold | splits hold (copies) | empties hold |
| Blank keyframe | extends empty hold | copies (still empty→content) | another blank |
| Motion tween span | n/a (blocked) | property key for all props (E3) | n/a (blocked) |
| Classic/shape tween | extends span | new key (3rd state for shape) | blank breaks tween |
| Last frame | extends doc | new key after | blank after |

## L. LIMITATIONS
L.1 F5/F7 on tween spans blocked (Part 09 rules) → ours: clear error + suggestion. L.2 F6 "copy previous" is implicit (users expect blank sometimes) → ours: toast "keyframe copied frame N". L.3 Auto-Keyframe mode changes delete/paste semantics (F-03-08 community) → ours: explicit auto-key toggle.

## M. EDGE CASES
M.1 F6 at frame 1 (already key) → no-op/re-key · M.2 F7 then F6 → content from the pre-blank key (hold rule) · M.3 F6 mid-shape-tween → 3-key morph · M.4 F5 at doc end · M.5 F6 in motion span = all-prop key (E3) vs single-prop edit (Part 09).

## O/P/Q/R/S/Y
Data: `frames[]` insert (keyframe record / span extent). Events: `timeline:changed`. Undo: one command each (InsertFrameCommand / InsertKeyframeCommand / InsertBlankCommand). Serialization: inserted records persisted. Mobile: long-press frame → Insert Frame/Keyframe/Blank; or toolbar buttons. Implementation: `insertFrame/Keyframe/Blank(layer, frame)` with hold-rule recompute + shift-right of later frames.

## TESTS
TS-01 F5 extends hold · TS-02 F6 copies content (E5) · TS-03 F7 empties · TS-04 F6 in motion span = all-prop key (E3) · TS-05 F5 on tween blocked · TS-06 F6 at frame1 no-op · TS-07 F7→F6 restores pre-blank content · TS-08 shift-right of later frames · TS-09 undo each · TS-10 reload identical · TS-11 mobile long-press · TS-12 toast "copied frame N" (ours).
## AUDITS
No contradiction. Self-challenge: overlooked = F6-all-prop-in-span (E3) + F6-copies-implicit + tween-span blocking — covered.
```
FEATURE COMPLETE: F-07-08/09/10 — Insert Frame / Keyframe / Blank Keyframe — AUDITED
```
