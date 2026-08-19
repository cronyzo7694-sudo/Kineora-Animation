# F-31-01..10 — MOBILE TRANSLATION (full part)
```
SOURCE BLUEPRINT: Part 31 · DEEP FEATURES: F-31-01..10 · STATUS: AUDITED
DEPENDS ON: (cross-cutting) · FEEDS: F-32 (architecture input engines)
```
## A. IDENTITY
1. Official name: (touch/mobile translation). 4. Purpose: map every desktop interaction to touch/pen — one codebase, two input adapters. 8. Status: our-design (Animate is desktop-first).
## EVIDENCE
E1 [BLUEPRINT Part 31] gesture-bus architecture + 22-row mapping. E2 [COMMUNITY] tablet users want Animate-class tools (Phase-2 discovery). E3 [OUR DESIGN DECISION] gesture set (tap/double-tap/long-press/drag/pinch/twist) + loupe + select-mode.
## F-31-01 ARCHITECTURE
GestureBus + two adapters (desktop: mouse/kbd/stylus; mobile: touch/pen) → Tools consume normalized gestures (Part 32.20/21).
## F-31-02 MASTER MAPPING (22 rows, blueprint Part 31.1)
click→tap(24px) · right-click→long-press(500ms) · shortcut→toolbar button · shift-click→select-mode · marquee→1-finger-drag-empty · timeline-drag→touch-scrub · transform-handles→touch-handles(≥44px) · hover→press-hold-preview · modifiers→modifier-buttons · wheel-zoom→pinch · space-pan→2-finger · text→system-keyboard · undo→2-finger-tap · nudge→nudge-buttons · hover-preview→drag-preview · dbl-click→dbl-tap · dbl-pivot→dbl-tap · marquee-zoom→pinch · pressure/tilt→stylus · file-dialogs→share-sheet · drag-library→tap-place.
## F-31-03 SELECTION MOBILE (F-03-19)
tap/long-press/select-mode/loupe/region-lock.
## F-31-04 DRAWING MOBILE
finger smoothing + stylus pressure/tilt + loupe + brush-size slider.
## F-31-05 TRANSFORM MOBILE
pinch scale, twist rotate, handles, pivot loupe, numeric panel.
## F-31-06 TIMELINE MOBILE
scrub, long-press frame/layer menus, ruler pinch, onion toolbar.
## F-31-07 RIG/CAMERA MOBILE
bone drag loupe, numeric constraints; camera pan/pinch/twist.
## F-31-08 PANELS MOBILE
bottom-sheet Properties; grid Library; swipeable panels.
## F-31-09 PERSISTENT TOOLBAR
Undo/Redo/Select-mode/Constrain/Alt/Onion/Play/Keyframe/Delete + contextual tool options.
## F-31-10 PARITY CHECKLIST
per-feature touch status (blueprint Part 31.4).
## L. LIMITATIONS
L.1 no hover → press-hold preview. L.2 fat finger → loupe + 24px. L.3 no keyboard → toolbar + select-mode.
## M. EDGE CASES
M.1 palm rejection · M.2 two-finger-pan-vs-marquee conflict · M.3 pinch during a drag.
## O/P/Q/R/S/Y
Data: gesture events (view/temp); no new model. Events: gesture → tool. Undo: same commands. Serialization: n/a. Implementation: TouchAdapter/DesktopAdapter → GestureBus (Part 32.20/21).
## TESTS
TS-01 tap selects · TS-02 long-press menu · TS-03 select-mode toggle · TS-04 1-finger marquee · TS-05 2-finger pan · TS-06 pinch zoom · TS-07 twist rotate · TS-08 loupe on anchors · TS-09 toolbar undo · TS-10 stylus pressure · TS-11 palm rejection · TS-12 bottom-sheet panels · TS-13 parity checklist passes.
## AUDITS
No contradiction (our-design, labeled). Self-challenge: overlooked = two-finger-conflict + hover-replacement + parity-checklist — covered.
```
FEATURE COMPLETE: F-31-01..10 — Mobile translation — AUDITED
```
