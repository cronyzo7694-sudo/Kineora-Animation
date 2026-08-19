# F-11-08 — GRAPHIC LOOP MODES & FRAME PICKER
```
SOURCE BLUEPRINT: Part 11 §11.4 · DEEP FEATURE: F-11-08 · STATUS: AUDITED
DEPENDS ON: F-11-02 · FEEDS: Part 18 (lip sync)
```
## A. IDENTITY
1. Official name: Loop options / Frame Picker. 4. Purpose: control which internal frame a **graphic** instance shows, keyed to the main timeline. 8. Status: current.

## EVIDENCE
E1 [OFFICIAL] `symbol-instances.html`: graphic loop modes **Loop / Play Once / Single Frame** + **First** frame field. E2 [OFFICIAL] same: **Frame Picker** panel — visual preview + choose the first frame for a graphic symbol; **only works with graphic symbols** (disabled for movie clip/button). E3 [OFFICIAL] same: Frame Picker "enhances… workflows such as Lip-Sync"; open via Properties > Looping > Use Frame Picker, or Window > Frame Picker. E4 [OFFICIAL] same: **Pin** current symbol (stays loaded across selection changes); multiple symbols in separate panels.

## D. LOOP SEMANTICS
| Mode | Internal frame at main-frame N |
|---|---|
| Loop | `(N - firstFrame) % duration + 1` — repeats |
| Play Once | plays once then holds last frame |
| Single Frame | always `firstFrame` (static) |

## E. FRAME PICKER STATES
Pinned vs unpinned (E4); graphic-only (E2); picker shows the symbol's frames as thumbnails; click a frame → sets `firstFrame`.

## L. LIMITATIONS
L.1 Frame Picker graphic-only (E2) → movie clips use timeline instead. L.2 First-frame beyond ~20 had a picker bug [COMMUNITY, F-18] → ours: unlimited. L.3 Loop mapping needs main-span length ≥ symbol duration else truncates (Play Once holds).

## M. EDGE CASES
M.1 graphic shorter than span (loops) · M.2 single-frame graphic (static) · M.3 pinned picker while scrubbing · M.4 lip-sync (per-key firstFrame, Part 18).

## O/P/Q/R/S/Y
Data: `loop:{mode, firstFrame}` on the instance (Part 33). Events: `document:changed`. Undo: firstFrame change = one command (coalesced). Serialization: persisted. Mobile: Frame Picker as a grid sheet. Implementation: `graphicFrameAt(instance, mainFrame)` per the loop table; Frame Picker panel reads the symbol's timeline thumbnails.

## TESTS
TS-01 loop repeats (E1) · TS-02 play-once holds · TS-03 single-frame static · TS-04 firstFrame set via picker (E2/E3) · TS-05 picker disabled for movie clip (E2) · TS-06 pin keeps symbol (E4) · TS-07 lip-sync per-key firstFrame · TS-08 undo · TS-09 mobile grid picker · TS-10 unlimited frames (ours).
## AUDITS
No contradiction. Self-challenge: overlooked = graphic-only picker (E2) + pin behavior (E4) + loop-mapping math — covered.
```
FEATURE COMPLETE: F-11-08 — Graphic loop modes & Frame Picker — AUDITED
```
