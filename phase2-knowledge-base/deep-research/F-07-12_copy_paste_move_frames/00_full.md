# F-07-12 — COPY / CUT / PASTE / DUPLICATE / MOVE FRAMES
```
SOURCE BLUEPRINT: Part 07 §7.4.7–7.4.9 · DEEP FEATURE: F-07-12 · STATUS: AUDITED
DEPENDS ON: F-07-01/08
```
## A. IDENTITY
1. Official names: Copy/Cut/Paste Frames; Duplicate (Alt-drag); Move (drag). 4. Purpose: relocate/duplicate animation chunks (keyframe sequences, tweens, labels) across frames and layers. 8. Status: current.

## EVIDENCE
E1 [OFFICIAL] `frames-keyframes.html`: Edit > Timeline > **Copy Frames / Paste Frames**; **Alt-drag (Win)/Option-drag (Mac) a keyframe** to copy it. E2 [OFFICIAL] same: select a keyframe **sequence** → drag to move; paste replaces selection. E3 [OFFICIAL] `using-property-keyframes.html`: **Ctrl/Cmd+drag a property keyframe** moves it to a new frame. E4 [COMMUNITY] copy-paste of layer-parented frames breaks (limbs offset) — [WISH W2] → ours local-space (F-03-14/Part 14). E5 [COMMUNITY] Alt-drag duplicate is the standard mirror-animation trick (duplicate → reverse).

## D. INTERACTIONS
| Action | Result |
|---|---|
| Copy Frames | selected frames (keyframes+spans+labels) → frame clipboard |
| Paste Frames | pastes at playhead (overwrite or insert per option) |
| Cut Frames | copy + remove |
| Alt/Option+drag keyframe | duplicate at drop point (E1) |
| Drag a keyframe/sequence | move (E2) |
| Ctrl/Cmd+drag property key | move property key in a span (E3) |

## E. STATES
Paste over a keyframe → overwrite; paste into empty → insert. Paste spans (tweens) preserves span type. Paste across layers/scenes/files = allowed (E-adjacent, Part 27).

## L. LIMITATIONS
L.1 Paste-overwrite vs insert ambiguity → ours: paste dialog ("overwrite / insert / insert-with-shift"). L.2 Copy-paste of rigged/parented frames corrupts (E4) → ours: local-space + stable IDs (carried). L.3 Frame clipboard is app-internal (no cross-app) → ours: also JSON clipboard (P2).

## M. EDGE CASES
M.1 paste beyond doc end → extends · M.2 paste tween onto non-tween layer → layer converts (Part 09) · M.3 Alt-drag a span (not just keyframe) · M.4 copy empty frames · M.5 undo paste · M.6 cross-scene paste.

## O/P/Q/R/S/Y
Data: frame clipboard (deep copy of records + content refs). Events: `timeline:changed`. Undo: one command per paste/move. Serialization: n/a (clipboard is session state). Mobile: long-press → Copy/Paste; drag-to-move with handles. Implementation: `FrameClipboard` holds deep-copied records; paste resolves ID remaps (symbol refs preserved).

## TESTS
TS-01 copy/paste keyframe sequence · TS-02 Alt+drag duplicates (E1) · TS-03 drag moves (E2) · TS-04 Ctrl+drag moves property key (E3) · TS-05 paste overwrite vs insert · TS-06 paste tween converts layer · TS-07 paste beyond end extends · TS-08 rigged-frame paste no corruption (ours) · TS-09 undo · TS-10 cross-scene paste · TS-11 mobile.
## AUDITS
No contradiction. Self-challenge: overlooked = Alt-drag-copy (E1) + property-key Ctrl+drag (E3) + rigged-paste corruption (E4) — covered.
```
FEATURE COMPLETE: F-07-12 — Copy/Cut/Paste/Duplicate/Move frames — AUDITED
```
