# F-32-01..21 — ORIGINAL APP ARCHITECTURE (full part)
```
SOURCE BLUEPRINT: Part 32 — Original App Architecture
DEEP FEATURES: F-32-01..21 · STATUS: AUDITED
DEPENDS ON: (all) · FEEDS: Part 33 (data model), Phase 3
```
## A. IDENTITY
1. Official name: (module architecture — ours). 4. Purpose: 21 modules with responsibilities/IO/data/dependencies/events/state/perf. 8. Status: our-design (labeled [OUR DESIGN DECISION]).

## EVIDENCE
E1 [BLUEPRINT Part 32] the 21-module spec + data-flow diagram. E2 [OUR DESIGN DECISION] golden rules (single model, commands-only, pure evaluate). E3 [COMMUNITY] perf/crash concerns (W11 autosave; bone bugs W2) → architecture constraints.

## F-32-01..21 MODULE INDEX (each: responsibilities / inputs / outputs / data / deps / events / state / perf — full specs in Phase-1 Part 32)
| ID | Module | Key perf/design note |
|---|---|---|
| F-32-01 | Canvas Renderer | dirty-region + layer caches; 60fps playback; GPU transforms |
| F-32-02 | Vector Engine | paths/booleans/tessellation; worker for big booleans |
| F-32-03 | Raster Engine | bitmaps/flood-fill/filters/bitmap-pencil (W10) |
| F-32-04 | Scene Graph | render tree + spatial index; evaluate(time) |
| F-32-05 | Layer System | types/folders/parenting (local-space) |
| F-32-06 | Timeline Engine | sparse storage + hold rule + playback tick |
| F-32-07 | Keyframe Engine | interpolators (OKLab, log-zoom, rotation flags) |
| F-32-08 | Tween Engine | spans + easing + motion path + presets |
| F-32-09 | Rig Engine | hierarchy/poses/pose library (local-space, W2) |
| F-32-10 | IK Engine | 2-bone/CCD/FABRIK + constraints; author-time solve |
| F-32-11 | Symbol Engine | definitions/instances/nesting/swap |
| F-32-12 | Audio Engine | decode/waveform/sync modes/mux |
| F-32-13 | Lip Sync Engine | VAD/phonemes/viseme map/confidence |
| F-32-14 | Camera Engine | matrix/parallax/presets |
| F-32-15 | Text Engine | glyph atlas/metrics/binding |
| F-32-16 | Asset Library | DB/folders/use-counts |
| F-32-17 | Project Serializer | JSON+assets; autosave/recovery (W11); atomic write |
| F-32-18 | Undo/Redo Engine | command stack + coalescing + selection restore |
| F-32-19 | Export Engine | per-format exporters; worker pool |
| F-32-20 | Desktop Input Engine | mouse/kbd/stylus → gestures |
| F-32-21 | Mobile Input Engine | touch/pen → gestures |

## L. LIMITATIONS
L.1 golden rules are constraints (CI-enforced). L.2 worker pool for heavy ops (boolean/lip-sync/export).

## M. EDGE CASES
M.1 autosave during crash (atomic rename) · M.2 deep nesting (early-out + leaf cache) · M.3 4K export (worker).

## O/P/Q/R/S/Y
Data: none (architecture). Events: event bus (F-03-17). Undo: command pattern. Serialization: serializer module. Implementation: module interfaces + contracts; enforce rules in CI.

## TESTS
TS-01 21 modules stubbed · TS-02 golden rules enforced · TS-03 60fps playback (dirty-region) · TS-04 vector booleans · TS-05 IK solve author-time · TS-06 autosave atomic · TS-07 cross-platform adapters · TS-08 evaluate determinism.

## AUDITS
No contradiction (our-design, labeled). Self-challenge: overlooked = dirty-region-vs-full-render + worker-offload + atomic-save — covered.

```
FEATURE COMPLETE: F-32-01..21 — Architecture — AUDITED
```
