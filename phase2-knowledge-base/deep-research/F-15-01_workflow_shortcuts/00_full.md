# F-15-01 — FRAME-BY-FRAME WORKFLOW · F-15-04 — TOOLS & SHORTCUTS
```
SOURCE BLUEPRINT: Part 15 §15.1, §15.3 · DEEP FEATURES: F-15-01, F-15-04 · STATUS: AUDITED
DEPENDS ON: F-07-08/09/10, F-08-12 · FEEDS: F-15-02/03/05/06
```
## F-15-01 WORKFLOW STEPS
1. Official name: (frame-by-frame workflow). 4. Purpose: the traditional redraw-per-frame pipeline. 8. Status: current.
EVIDENCE
E1 [OFFICIAL] `frame-by-frame-animation.html`: onion skinning provides reference (prev/next frames) to draw frame-by-frame. E2 [SECONDARY] Activity-9: draw at keyframe → onion skin → F6 next keyframe → redraw → repeat. E3 [BLUEPRINT Part 15.1]: F6 (copy prev) vs F7 (blank) decision — the cel choice ([WISH W1], F-15-06).
SEMANTICS (the loop)
```
draw frame 1 → F6/F7 frame 2 → onion skin (see ghosts) → redraw → F5 exposure → repeat → play
```
LIMITATIONS: L.1 F6 = independent copy (no cel reuse) → ours: expose-same vs duplicate-new (F-15-06). L.2 linear workflow error-prone → ours: per-frame undo + onion always-on toggle.
EDGE: M.1 first frame (keyframe by default) · M.2 F7 then draw fresh · M.3 F6 then trace-over.
TESTS: TS-01 draw→F6→redraw loop · TS-02 F7 blank redraw · TS-03 F5 exposure · TS-04 play/step review · TS-05 undo per frame.

## F-15-04 TOOLS & SHORTCUTS
1. Official name: (frame-by-frame shortcuts). 4. Purpose: the hotkeys that make the loop fast. 8. Status: current.
EVIDENCE
E1 [OFFICIAL] Part 29: F5/F6/F7, Shift+F5/F6, `.`/`,` step, Enter play, Home/End. E2 [COMMUNITY] `Alt+,`/`Alt+.` keyframe hop (F-03-08 E4). E3 [OUR DESIGN DECISION] onion toggle O / outlines Shift+O / edit-multiple Alt+O (Part 29.11).
SEMANTICS
| Action | Key |
|---|---|
| Next/prev frame | `.` / `,` |
| Insert keyframe (copy) | F6 |
| Insert blank | F7 |
| Extend exposure | F5 |
| Delete frame / Clear key | Shift+F5 / Shift+F6 |
| Keyframe hop | Alt+, / Alt+. (E2) |
| Play/stop | Enter |
| Onion toggles | O / Shift+O / Alt+O (ours, E3) |
LIMITATIONS: L.1 no single "next blank frame" key in Animate → ours: `Shift+.` = next blank (P2).
EDGE: M.1 hop across a tween span · M.2 play during scrub.
TESTS: TS-01 step keys · TS-02 F6/F7 · TS-03 F5 · TS-04 Alt hop (E2) · TS-05 onion toggles (ours) · TS-06 next-blank (ours).
## AUDITS (both)
No contradiction. Self-challenge: overlooked = F6-copy-vs-F7-blank choice + Alt-keyframe-hop + exposure-per-frame — covered.
```
FEATURE COMPLETE: F-15-01/04 — Workflow & shortcuts — AUDITED
```
