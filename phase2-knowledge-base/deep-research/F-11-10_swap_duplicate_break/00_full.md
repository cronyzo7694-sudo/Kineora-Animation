# F-11-10 — SWAP SYMBOL / DUPLICATE SYMBOL · F-11-11 — BREAK APART HIERARCHY
```
SOURCE BLUEPRINT: Part 11 §11.6–11.7 · DEEP FEATURES: F-11-10, F-11-11 · STATUS: AUDITED
DEPENDS ON: F-11-01/09
```
## F-11-10 SWAP / DUPLICATE SYMBOL
1. Official name: Swap Symbol / Duplicate Symbol. 4. Purpose: replace an instance's symbol keeping its properties; clone the definition for one instance. 8. Status: current.
EVIDENCE
E1 [OFFICIAL] `symbol-instances.html`: **Swap one instance for another** — "display a different instance on the Stage and preserve all the original instance properties, such as color effects or button actions." E2 [OFFICIAL] `symbols.html`: Swap Symbol (with a selected symbol/bitmap); Duplicate Symbol. E3 [COMMUNITY] graphic→movie clip replace trick (right-click → Replace/Swap).
SEMANTICS
- Swap: `symbolId` changes; transform/color/name/loop preserved (E1).
- Duplicate: clone definition (new name); this instance points to the clone.
LIMITATIONS: L.1 Swap is discrete (no blend) → ours: optional cross-fade (Part 18.6.8). L.2 Duplicate doesn't deep-update other instances (by design).
EDGE: M.1 swap keeps tint (E1) · M.2 swap mouth pose (Part 18) · M.3 duplicate then edit clone.
TESTS: TS-01 swap preserves properties (E1) · TS-02 swap mouth pose · TS-03 duplicate symbol · TS-04 clone edit doesn't affect original · TS-05 undo swap.

## F-11-11 BREAK APART HIERARCHY
1. Official name: Break Apart (Ctrl+B). 4. Purpose: flatten one level — instance→content→shapes. 8. Status: current.
EVIDENCE
E1 [OFFICIAL] `symbols.html`/`arranging-objects.html`: Break Apart separates groups/instances/bitmaps into ungrouped editable elements; **not** the same as Ungroup. E2 [OFFICIAL] `arranging-objects.html`: "Breaking apart animated symbols… is not recommended and might have unpredictable results." E3 [BLUEPRINT Part 06.8]: hierarchy map — instance→raw content→shapes; text→chars→shapes; bitmap→fill.
SEMANTICS (the full map)
```
symbol instance ──▶ raw content (copy of symbol art) ──▶ shapes
group ──────────▶ children
text ───────────▶ per-char blocks ──▶ vector shapes
bitmap ─────────▶ bitmap-fill region
drawing object ─▶ raw shape
primitive ──────▶ baked path
```
LIMITATIONS: L.1 one-way (loses symbol link; Library keeps the symbol) → warn. L.2 breaking tweened symbols = unpredictable (E2) → ours: block + suggest convert-to-FBF first.
EDGE: M.1 double break (text) · M.2 break a tweened symbol (block, ours) · M.3 break bitmap → wand region.
TESTS: TS-01 instance→content · TS-02 content→shapes · TS-03 group→children · TS-04 text→chars→shapes · TS-05 bitmap→fill · TS-06 Library symbol survives · TS-07 tweened-symbol block (ours) · TS-08 undo.
## AUDITS (both)
No contradiction. Self-challenge: overlooked = break≠ungroup (E1) + tweened-symbol unpredictable (E2) + one-way (Library keeps symbol) — covered.
```
FEATURE COMPLETE: F-11-10/11 — Swap/Duplicate symbol & Break apart — AUDITED
```
