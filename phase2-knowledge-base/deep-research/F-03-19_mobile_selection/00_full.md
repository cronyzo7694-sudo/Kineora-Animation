# F-03-19 — MOBILE SELECTION
```
SOURCE BLUEPRINT: Part 03 §3.11 · Part 31 · DEEP FEATURE: F-03-19 · STATUS: AUDITED
DEPENDS ON: F-03-01…18 · FEEDS: Part 31
```
## A. IDENTITY
1. Official name: (touch selection mapping). Adobe Animate is desktop-first; the mobile mapping is **[OUR DESIGN DECISION]** per the blueprint's mobile translation. 4. Purpose: reproduce every desktop selection interaction via touch/pen. 8. Status: our-design.

## EVIDENCE
E1 [OUR DESIGN DECISION] gesture-bus architecture (Part 31.0): tools consume normalized gestures, not raw events. E2 [COMMUNITY REPORT] tablet users want Animate-class tools on tablets (r/animate thread, Phase-2 discovery). E3 [INFERENCE] Adobe Animate has no first-class touch selection — users route through OS touch→mouse emulation.

## S. MASTER MAPPING (selection-scoped)
| Desktop | Mobile |
|---|---|
| Click | Tap (24 px tolerance) |
| Double-click (drill) | Double-tap |
| Double-click fill (fill+stroke) | Double-tap fill |
| Click empty (clear) | Tap empty |
| Shift+click (toggle) | Select-mode toggle (tap toggles) or long-press = add |
| Marquee | One-finger drag on empty |
| Lasso | One-finger lasso trace |
| Right-click | Long-press (~500 ms) |
| Ctrl+A / Ctrl+Shift+A | toolbar Select All / Deselect buttons |
| Nudge (arrows) | Nudge buttons |
| Ctrl/Cmd temp-Selection | n/a (V always reachable) |
| Frame selection | tap / drag / long-press frame menu |
| Layer selection | tap row / long-press menu |
| Hide Edges | toolbar toggle |
| Subselection anchors | tap path → anchors; drag with loupe |

## E. PRECISION (the key mobile problem)
- **Finger-offset loupe**: magnified bubble ~80 px above the finger for anchors/handles/pivots/bones.
- **Region-select lock**: prevents accidental raw-shape splits on touch (F-03-01 L.1).
- **Select-mode**: the Shift replacement; each tap toggles membership.
- Two-finger = pan (never selection); pinch = zoom.

## T. STYLUS (mobile pen)
Tap/drag = mouse-identical (1-px tolerance); barrel = context menu; pressure/tilt don't affect selection (F-03-01 T). Palm rejection mandatory.

## U. ACCESSIBILITY / V. PERFORMANCE
- Touch targets ≥ 44 px for controls; selection announced via live region.
- Spatial index + 24-px tolerance expansion (F-03-01 V); no per-frame cost.

## L. LIMITATIONS
L.1 No hover → press-and-hold preview replaces it (F-03-01 S). L.2 Fat finger → loupe + tolerance. L.3 No keyboard → persistent toolbar + select-mode.

## W. WORKFLOWS
W.1 Select then move: tap object → drag (offset loupe if precise). W.2 Multi-select: Select-mode ON → tap each. W.3 Drill: double-tap symbol.

## Y. IMPLEMENTATION (OURS)
GestureBus emits tap/double-tap/long-press/drag/pinch/twist; the same SelectionController (F-03-02 Y) consumes them — **zero selection logic duplicated**. Adapters: TouchAdapter (finger+pen), DesktopAdapter (mouse+kbd). Persistent bottom toolbar: Undo/Redo/Select-mode/Constrain/Alt/Onion/Play/Keyframe/Delete.

## TESTS
TS-01 tap selects (24 px) · TS-02 double-tap drills · TS-03 tap empty clears · TS-04 select-mode toggles · TS-05 one-finger marquee · TS-06 two-finger pan (no select) · TS-07 long-press menu · TS-08 loupe on anchors · TS-09 region-lock no split · TS-10 nudge buttons · TS-11 frame tap/long-press · TS-12 layer tap/long-press · TS-13 stylus 1-px + barrel · TS-14 palm rejection · TS-15 live-region announce · TS-16 pinch zoom no select.

## AUDITS
No contradiction (all our-design, labeled). Self-challenge: overlooked = two-finger-pan-vs-marquee conflict + loupe + select-mode — covered. Marked [OUR DESIGN DECISION] throughout.
```
FEATURE COMPLETE: F-03-19 — Mobile selection — AUDITED
```

---
## PART 03 — SELECTION SYSTEM: ALL 19 FEATURES AUDITED ✅
