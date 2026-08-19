# F-12-02 — IMPORT ASSET · F-12-03 — CREATE SYMBOL
```
SOURCE BLUEPRINT: Part 12 §12.2.1–12.2.2 · DEEP FEATURES: F-12-02, F-12-03 · STATUS: AUDITED
DEPENDS ON: F-11-06 · FEEDS: Part 27
```
## F-12-02 IMPORT ASSET
1. Official name: Import to Library. 4. Purpose: bring external assets into the Library (bitmap/vector/audio/video). 8. Status: current.
EVIDENCE
E1 [OFFICIAL] Part 27 blueprint: Import to Stage / Import to Library / Open External Library / drag-drop. E2 [OFFICIAL] `imported-bitmaps.html`: bitmap lands in Library; Properties (Allow Smoothing, compression). E3 [OFFICIAL] `symbols.html`: drag selection INTO the library = convert to symbol.
SEMANTICS
- Import → Library entry (asset kind per format, Part 27); "to Stage" additionally places an instance.
- Drag file onto Library = import; drag file onto stage = import + place.
LIMITATIONS: L.1 import duplicates (same file twice) → ours: dedupe prompt. L.2 large bitmaps → compression options (E2).
EDGE: M.1 import same asset twice · M.2 import while playing · M.3 broken file → import report (Part 27.7).
TESTS: TS-01 import to library · TS-02 import to stage places instance · TS-03 drag-to-library = symbol (E3) · TS-04 bitmap properties (E2) · TS-05 dedupe prompt (ours) · TS-06 undo import.

## F-12-03 CREATE SYMBOL
1. Official name: New Symbol / Convert to Symbol. 4. Purpose: create a symbol definition (empty or from selection). 8. Status: current.
EVIDENCE
E1 [OFFICIAL] `symbols.html`: New Symbol (Ctrl+F8) = empty → edit mode; Convert (F8) = from selection (F-11-06). E2 [OFFICIAL] same: New Symbol button (lower-left of Library) + Library menu → New Symbol.
SEMANTICS: empty symbol → symbol-editing mode; convert → definition + instance.
EDGE: M.1 empty symbol left empty (unused) → "select unused items" (F-12-04).
TESTS: TS-01 Ctrl+F8 empty symbol · TS-02 Library button path (E2) · TS-03 convert from selection · TS-04 empty symbol unused-flag.
## AUDITS (both)
No contradiction. Self-challenge: overlooked = drag-into-library-converts (E3) + dedupe — covered.
```
FEATURE COMPLETE: F-12-02/03 — Import asset & create symbol — AUDITED
```
