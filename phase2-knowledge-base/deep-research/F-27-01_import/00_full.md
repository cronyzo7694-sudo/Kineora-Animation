# F-27-01..08 — IMPORT (full part)
```
SOURCE BLUEPRINT: Part 27 · DEEP FEATURES: F-27-01..08 · STATUS: AUDITED
DEPENDS ON: F-12 (library) · FEEDS: F-28 (export)
```
## A. IDENTITY
1. Official name: Import (Import to Stage / Import to Library). 4. Purpose: bring external assets in; land in Library. 8. Status: current.
## EVIDENCE
E1 [OFFICIAL] `placing-artwork.html`: **Import To Stage** (direct into current doc/layer) vs **Import To Library**; imported bitmaps ≥ **2×2 px**; vector (SWF/WMF) → group in current layer; bitmaps → single object, transparency preserved; **image sequences → successive keyframes** of current layer. E2 [OFFICIAL] `photoshop-psd-files.html`: PSD importer — preserves color fidelity; Smart Objects **rasterized**; layers → individual layers/keyframes/single flattened bitmap; **Layer conversion / Text conversion / Convert Layers** options; **import as movie clip** (registration); compression (lossy/lossless); **Calculate Bitmap Size**; layer comps. E3 [OFFICIAL] `imported-bitmaps.html`: bitmap Properties (Allow Smoothing, compression). E4 [OFFICIAL] `placing-artwork.html`: **FXG import** (Illustrator interchange); FreeHand/Fireworks PNG.
## F-27-01 ENTRY POINTS
Import to Stage / to Library / Open External Library (F-12-13) / drag-drop / paste.
## F-27-02 RASTER
PNG/JPEG/GIF/WebP(ours); PSD per-layer (E2) + flattened + movie-clip + registration; transparency preserved (E1).
## F-27-03 VECTOR
SVG/AI/FXG (E4) → shapes (cubic conversion, Part 27.2 blueprint); WMF/SWF legacy (E1).
## F-27-04 AUDIO
MP3/WAV/AIFF (+OGG/FLAC ours) → sound assets (F-17-02).
## F-27-05 VIDEO
MP4/FLV — embed/link; audio extraction + frame extraction (ours).
## F-27-06 SPRITE SHEETS & SEQUENCES
Atlas (PNG+JSON) → movie clip frames; image sequence → successive keyframes (E1).
## F-27-07 LIBRARIES
External library copy (F-12-13).
## F-27-08 IMPORT REPORT [ours]
What created / converted / flattened + warnings.
## L. LIMITATIONS
L.1 Smart Objects rasterized (E2). L.2 <2×2 px rejected (E1). L.3 drag-drop loses transparency (use Import command, E1 note).
## M. EDGE CASES
M.1 PSD layer comps · M.2 sequence as keyframes (E1) · M.3 bitmap smoothing off (crisp) · M.4 broken file → report.
## O/P/Q/R/S/Y
Data: Library assets + (stage) instance placement. Events: `library:changed`. Undo: one command per import. Serialization: assets referenced by dataRef (Part 33). Mobile: file picker + share sheet. Implementation: importer registry per format → asset records + import report.
## TESTS
TS-01 import to stage places instance · TS-02 to library only · TS-03 PSD per-layer (E2) · TS-04 PSD movie clip + registration · TS-05 transparency preserved · TS-06 sequence → keyframes (E1) · TS-07 SVG → shapes · TS-08 audio import · TS-09 <2px rejected · TS-10 drag-drop transparency warn · TS-11 import report (ours) · TS-12 undo.
## AUDITS
No contradiction. Self-challenge: overlooked = sequence→keyframes (E1) + smart-objects-rasterized (E2) + 2px-min + drag-drop-transparency-loss — covered.
```
FEATURE COMPLETE: F-27-01..08 — Import — AUDITED
```
