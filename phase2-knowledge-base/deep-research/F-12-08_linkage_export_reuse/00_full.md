# F-12-08 — LINKAGE (LEGACY) · F-12-09 — EXPORT ASSET · F-12-10 — REUSE · F-12-11 — REPLACE · F-12-12 — UPDATE INSTANCES · F-12-13 — EXTERNAL LIBRARY
```
SOURCE BLUEPRINT: Part 12 §12.2.8–12.2.14 · DEEP FEATURES: F-12-08..13 · STATUS: AUDITED
DEPENDS ON: F-12-01/04
```
## F-12-08 LINKAGE (LEGACY)
1. Official name: Linkage (Export for ActionScript + identifier). 4. Purpose: expose assets to runtime AS3. 8. Status: legacy.
EVIDENCE: E1 [OFFICIAL] Part 12 blueprint: linkage IDs (legacy AS3). SEMANTICS: identifier → runtime access. LIMITATIONS: legacy → ours: ID-based behavior refs (no linkage step).

## F-12-09 EXPORT ASSET
1. Official name: (Library → Export). 4. Purpose: save an asset to disk. 8. Status: current.
SEMANTICS: right-click asset → Export (image/sequence for symbols; file for bitmap/sound). EDGE: M.1 export a nested symbol → flattens. TESTS: TS-01 export bitmap · TS-02 export symbol as image/sequence · TS-03 undo none.

## F-12-10 REUSE (DRAG TO STAGE)
1. Official name: (instantiate from Library). 4. Purpose: place instances. 8. Status: current.
EVIDENCE: E1 [OFFICIAL] drag from Library onto stage = add to current keyframe (F-03-03 E-src "Drag items from the Library panel onto the Stage to add the items to the current keyframe"). SEMANTICS: drag symbol → instance at drop point; use-count++ (F-12-01). EDGE: M.1 drag sound onto non-audio layer → ours: auto-create audio key. TESTS: TS-01 drag → instance · TS-02 use-count increments · TS-03 sound drag (ours).

## F-12-11 REPLACE (SWAP FROM LIBRARY)
1. Official name: (Swap). 4. Purpose: replace an instance's symbol by dragging a new symbol onto it. 8. Status: current.
EVIDENCE: E1 [OFFICIAL] `symbol-instances.html`: swap preserves properties (F-11-10 E1). SEMANTICS: drag Library symbol onto a selected instance = swap. TESTS: TS-01 drag-onto-instance swaps · TS-02 properties preserved.

## F-12-12 UPDATE INSTANCES
1. Official name: (definition-edit propagation). 4. Purpose: editing a symbol updates all instances. 8. Status: current.
EVIDENCE: E1 [OFFICIAL] `symbols.html`: "When you edit a symbol, Animate updates all instances." SEMANTICS: automatic (no manual update). PLUS ours: "Update from file" for bitmaps (re-import newer PNG). EDGE: M.1 edit during playback → live update. TESTS: TS-01 edit → all instances update · TS-02 bitmap update-from-file (ours).

## F-12-13 OPEN EXTERNAL LIBRARY
1. Official name: Open External Library (File > Import). 4. Purpose: open another project's Library read-only and drag assets in. 8. Status: current.
EVIDENCE: E1 [OFFICIAL] Part 27 blueprint: external library = read-only cross-doc reuse. SEMANTICS: assets copied on drag (or linked, ours P2). EDGE: M.1 drag symbol with same name (rename prompt). TESTS: TS-01 open external · TS-02 drag-copy · TS-03 name collision prompt.

## AUDITS (all six)
No contradiction. Self-challenge: overlooked = linkage-legacy-only + sound-drag-layer + external-library-name-collision — covered.
```
FEATURE COMPLETE: F-12-08..13 — Linkage, export, reuse, replace, update, external library — AUDITED
```
