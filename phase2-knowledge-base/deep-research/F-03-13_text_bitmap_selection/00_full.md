# F-03-13 — TEXT & BITMAP SELECTION
```
SOURCE BLUEPRINT: Part 03 §3.4.5, §3.4.6 · DEEP FEATURE: F-03-13 · STATUS: AUDITED
DEPENDS ON: F-03-01/02/03
```
## A. IDENTITY
1. Official name: (text-block selection / bitmap selection). 4. Purpose: select text blocks and bitmaps as atomic objects; text has a second **text-edit** mode (caret); bitmaps have **break-apart** region editing. 8. Status: current.

## EVIDENCE
E1 [OFFICIAL] Text blocks need **enclosure** to marquee-select (F-03-01 E2). E2 [OFFICIAL] Click text = select block; double-click = text-edit (caret) [OBSERVED + Part 22]. E3 [OFFICIAL] Break Apart bitmap → shape fill → Magic Wand/lasso region select (F-03-06 E9). E4 [OFFICIAL] Bitmap hit = bounding rect; alpha-precise not documented (F-03-01 L.7). E5 [OFFICIAL] Text break-apart: once = per-character blocks; twice = shapes (Part 22).

## D. INTERACTIONS
Text: click = block; double-click/click-inside = caret edit; Shift+click = toggle; marquee = enclosure. Bitmap: click = rect select; break-apart → region/lasso/wand.

## E. STATES
Text block selected vs text-edit (caret) — distinct modes. Bitmap intact (atomic) vs broken-apart (region-editable). Locked/hidden excluded.

## F. COMPATIBILITY
Text block: atomic `{nodeId}` + `editMode.scope:'text'`. Bitmap: atomic; broken-apart = shape-like sub-regions.

## L. LIMITATIONS
L.1 Bitmap rect-hit selects transparent pixels (F-03-01 L.7) → alpha-precise toggle. L.2 Text marquee enclosure (E1) → hint. L.3 Break-apart is one-way (loses original bitmap link) → warn + keep Library original.

## M. EDGE CASES
M.1 click transparent PNG corner (rect hit) · M.2 text caret vs block selection boundary · M.3 break-apart text twice · M.4 wand on flipped broken bitmap (F-03-06 E10) · M.5 empty text block (zero width) selection.

## O/P/Q/R/S/Y
Data: `{nodeId}` (+ `editMode.scope:'text'`); broken bitmap = shape node. Events: `selection:changed`, `editMode:*`. Undo: selection none; text edits coalesced (Part 02b); break-apart = one command. Serialization: text/bitmap persisted; editMode not. Mobile: double-tap text = keyboard edit. Implementation: text hit = box; caret via text engine; bitmap = rect (alpha toggle).

## TESTS
TS-01 click text block · TS-02 double-click = caret edit · TS-03 marquee enclosure text · TS-04 click bitmap rect · TS-05 alpha-precise OFF transparent corner selects · TS-06 ON misses · TS-07 break-apart → wand region · TS-08 text break-apart ×2 = shapes · TS-09 undo text edit coalesced · TS-10 flipped bitmap wand (ours fixed) · TS-11 mobile double-tap text · TS-12 empty text block.

## AUDITS
No contradiction. Self-challenge: overlooked = caret-vs-block mode split + transparent-pixel hit + break-apart one-way — covered. Version stable.
```
FEATURE COMPLETE: F-03-13 — Text & bitmap selection — AUDITED
```
