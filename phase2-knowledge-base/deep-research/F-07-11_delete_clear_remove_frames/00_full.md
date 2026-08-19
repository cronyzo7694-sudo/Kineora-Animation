# F-07-11 — DELETE / CLEAR / REMOVE FRAMES
```
SOURCE BLUEPRINT: Part 07 §7.4.4–7.4.6 · DEEP FEATURE: F-07-11 · STATUS: AUDITED
DEPENDS ON: F-07-06/07
```
## A. IDENTITY
1. Official names: Delete Frame (Shift+F5) / Clear Keyframe (Shift+F6) / Remove Frames (context menu). 4. Purpose: three **distinct** removals — shorten the timeline, strip keyframe status, or delete with a gap. 8. Status: current.

## EVIDENCE
E1 [OFFICIAL] `frames-keyframes.html`: keyframe ops + delete via context menu. E2 [COMMUNITY] reddit "how do i delete these excess blank keyframes": right-click → **Remove Frames**, shortcut **Shift+F5**. E3 [COMMUNITY] "How to remove a single keyframe": **Shift+F6** = Clear Keyframe; and the quirk: right-click "Clear Keyframe" without left-clicking first removes **all** keyframes in the timeline (span-selection issue). E4 [OFFICIAL] `animation-basics.html`: dashed line = broken classic tween when endpoint removed. E5 [COMMUNITY] Auto-Keyframe mode changes Delete behavior (deletes only from playhead forward → inserts blank keyframe).

## D. SEMANTICS MATRIX (the three-way distinction)
| Op | Shortcut | Effect | Timeline length |
|---|---|---|---|
| **Delete Frame** | Shift+F5 | removes frame(s); **later frames shift left** | shortens |
| **Clear Keyframe** | Shift+F6 | removes **keyframe status**; frame reverts to held (content collapses into previous hold) | unchanged |
| **Remove Frames** | (context; also Shift+F5 per E2) | deletes frames **leaving a gap** (later frames stay put) | unchanged (gap) |

> Note: Shift+F5 maps to both "Delete Frame" (menu) and "Remove Frames" (community) — treat as **configurable**; ours ships distinct, clearly-labeled commands (L.1).

## E. STATES
Clearing a keyframe mid-hold → the hold before it extends. Deleting a tween endpoint → broken tween (dashed, E4). Removing a middle range → gap (empty frames).

## L. LIMITATIONS
L.1 Delete-vs-Remove naming confusion (E1/E2) → ours: two buttons with tooltips ("Delete: shift left" / "Remove: leave gap"). L.2 Clear-keyframe span-selection quirk (E3) → ours: require explicit keyframe selection before clearing (no implicit "all"). L.3 Auto-keyframe delete surprise (E5) → ours: auto-key toggle OFF by default.

## M. EDGE CASES
M.1 clear the ONLY keyframe → layer empties · M.2 delete a tween endpoint → broken (E4) · M.3 remove gap then play → blank gap · M.4 delete frames across layers (multi-select) · M.5 clear keyframe with a label → label lost · M.6 undo each op.

## O/P/Q/R/S/Y
Data: frame records removed / span extents recomputed. Events: `timeline:changed`. Undo: one command per op. Serialization: persisted. Mobile: long-press → Delete/Clear/Remove. Implementation: three commands with distinct shift behaviors; broken-tween re-render.

## TESTS
TS-01 Delete shifts left (shortens) · TS-02 Clear keeps length, collapses hold · TS-03 Remove leaves gap · TS-04 clear-only-keyframe empties · TS-05 delete tween endpoint → dashed (E4) · TS-06 span-selection quirk avoided (ours) · TS-07 multi-layer delete · TS-08 undo each · TS-09 reload · TS-10 mobile menu.
## AUDITS
No contradiction (E2/E1 ambiguity documented as L.1). Self-challenge: overlooked = three-way distinction + clear-all quirk (E3) + auto-key delete (E5) — covered.
```
FEATURE COMPLETE: F-07-11 — Delete / Clear / Remove frames — AUDITED
```
