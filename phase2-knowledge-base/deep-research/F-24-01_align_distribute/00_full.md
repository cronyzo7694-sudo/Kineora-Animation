# F-24-01..06 — ALIGN / DISTRIBUTE (full part)
```
SOURCE BLUEPRINT: Part 24 · DEEP FEATURES: F-24-01..06 · STATUS: AUDITED
DEPENDS ON: F-03 (selection) · FEEDS: F-34 (buttons)
```
## A. IDENTITY
1. Official name: Align panel. 4. Purpose: align/distribute/match-size selected objects relative to stage or selection. 8. Status: current.
## EVIDENCE
E1 [OFFICIAL] `arranging-objects.html`: Align panel aligns along H/V axis — right/center/left edges; top/center/bottom edges; **select To Stage** to align relative to Stage dimensions. E2 [BLUEPRINT Part 24] full op set + even-gap (ours) + match-size.
## F-24-01 TWO SPACES
To Stage (stage rect 0,0,w,h) vs To Selection (selection union box). Ours + third: "align to first selected" (P2).
## F-24-02 SIX ALIGN OPS
Left/Center/Right (x) + Top/Middle/Bottom (y); delta = ref edge − object edge; one AlignCommand (undo).
## F-24-03 DISTRIBUTE OPS
Left edges / H centers / Right edges / Top / V centers / Bottom; sort by axis; extremes fixed; gap = span/(N−1).
## F-24-04 SPACING (EVEN GAPS) [ours]
gap = freeSpace/(N−1) (visual gaps, not centers) — the common request Animate lacks.
## F-24-05 MATCH SIZE
Match W/H/both to reference (largest/smallest/stage).
## F-24-06 MATH DETAILS
AABB (rotated bounds option P2); groups align as unit; locked/hidden excluded (F-03-15).
## L. LIMITATIONS
L.1 Animate lacks even-gap → ours. L.2 AABB-only for rotated → ours: OBB option.
## M. EDGE CASES
M.1 single object + To Stage (snap to edge) · M.2 <3 objects distribute (no-op) · M.3 mixed types (bounds union).
## O/P/Q/R/S/Y
Data: positions (transform.x/y). Events: `document:changed`. Undo: one command per op. Serialization: persisted (positions). Mobile: align toolbar buttons. Implementation: `AlignController` computing deltas + `AlignCommand`.
## TESTS
TS-01 align left (stage) · TS-02 align left (selection) · TS-03 center H/V · TS-04 distribute centers · TS-05 even-gap (ours) · TS-06 match size · TS-07 single+stage snap · TS-08 <3 no-op · TS-09 rotated AABB · TS-10 undo · TS-11 mobile buttons.
## AUDITS
No contradiction. Self-challenge: overlooked = To-Stage toggle (E1) + even-gap-missing + <3 no-op — covered.
```
FEATURE COMPLETE: F-24-01..06 — Align/Distribute — AUDITED
```
