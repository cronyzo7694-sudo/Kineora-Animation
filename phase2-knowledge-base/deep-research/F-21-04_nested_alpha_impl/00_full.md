# F-21-04 — NESTED MASKS · F-21-05 — ALPHA MASKS · F-21-06 — IMPLEMENTATION
```
SOURCE BLUEPRINT: Part 21 §21.4–21.6 · DEEP FEATURES: F-21-04/05/06 · STATUS: AUDITED
DEPENDS ON: F-21-02/03, F-11-12
```
## F-21-04 NESTED MASKS
1. Official name: (nested masking). 4. Purpose: masks inside symbols; outer mask clips the composited result. 8. Status: current.
EVIDENCE
E1 [OFFICIAL] `using-mask-layers.html`: mask can't be applied to another mask (within one timeline); movie-clip masks via ActionScript (legacy). E2 [BLUEPRINT Part 21.4]: nested = symbol's internal masks apply inside first, then outer mask clips the symbol's composite.
SEMANTICS: masks nest cleanly because each timeline = self-contained render scope (F-11-12).
LIMITATIONS: L.1 no mask-on-mask within one timeline (E1) → ours: multiple mask groups per timeline. L.2 AS-only clip masks legacy (E1).
EDGE: M.1 symbol-with-mask inside masked layer · M.2 outer mask over animated symbol.
TESTS: TS-01 inner mask first · TS-02 outer clips composite · TS-03 multiple mask groups (ours).

## F-21-05 ALPHA MASKS
1. Official name: (alpha mask — ours). 4. Purpose: soft/feathered masks via the mask's alpha channel. 8. Status: our-design (Animate is hard-edged, E1).
EVIDENCE: E1 [OFFICIAL] Animate ignores transparency in masks (F-21-02 E1). E2 [BLUEPRINT Part 21.5]: two modes — clip (binary, Animate-compatible) vs alpha (soft).
SEMANTICS
| Mode | Clip |
|---|---|
| clip | binary in/out (mask fill geometry) |
| alpha | mask alpha scales content opacity (gradient reveals, soft edges) |
LIMITATIONS: L.1 Animate has no soft masks → ours adds alpha mode (P1). L.2 alpha masks costlier (mask texture).
EDGE: M.1 gradient mask → soft wipe · M.2 feathered circle.
TESTS: TS-01 clip mode binary · TS-02 alpha mode soft · TS-03 gradient reveal · TS-04 perf.

## F-21-06 IMPLEMENTATION (ours)
SPEC (blueprint Part 21.6)
- Render: masked layers → offscreen B; mask fills → stencil/mask texture M; compose = B clipped by M (destination-in / stencil test).
- Web/GPU: stencil buffer (clip) or mask texture (alpha); per-layer render targets + caching.
- Vector fallback (SVG export): boolean intersection of content paths with mask path.
- Cache: mask group buffer invalidates when any member changes.
DATA: `layers[]`: mask layer `{type:'mask', maskMode:'clip|alpha'}`, masked `{type:'masked', maskId}`.
LIMITATIONS: L.1 vector boolean fallback heavy → cache. L.2 alpha mask memory.
EDGE: M.1 mask group caching · M.2 SVG export fallback.
TESTS: TS-01 stencil clip · TS-02 alpha texture · TS-03 cache invalidation · TS-04 SVG boolean fallback.
## AUDITS (all three)
No contradiction. Self-challenge: overlooked = no-mask-on-mask (E1) + alpha-mode-ours + SVG-boolean-fallback — covered.
```
FEATURE COMPLETE: F-21-04/05/06 — Nested masks, alpha masks, implementation — AUDITED
```
