# UI CONTRACT: C-36 — RESPONSIVE + NO-OVERLAP TEST SUITE
```
SOURCE:  00_UI_RELIABILITY_MASTER.md §13/28
STATUS:  UI COMPLETE
PARENT:  00_UI_RELIABILITY_MASTER.md
```
## A. ENTRY POINT
Automated UI test suite (CI) + manual visual pass.
## B. TEST TARGETS (viewport sizes: 1920/1440/1280/1024/768/390/360 ×2 density)
| ID | Test |
|---|---|
| rsp.overlap | no overlapping controls |
| rsp.clipped | no clipped text/controls |
| rsp.offscreen | no off-screen dialogs |
| rsp.inaccessible | no inaccessible buttons (hit-test reachable) |
| rsp.closebtn | no hidden close buttons |
| rsp.zerosize | no zero-size controls |
| rsp.panels | no collapsed critical (P0) panels |
| rsp.breakpoints | correct layout per breakpoint (§13) |
## C. STATE MAP
Per breakpoint: Desktop (full dock) / Laptop (tabs) / Tablet (sheets) / Mobile (sheets+ring+palette).
## D. EXIT / ESCAPE / UNDO
n/a (test suite).
## E. SHORTCUTS
n/a.
## F. POINTER + TOUCH
Tests simulate pointer + touch.
## G. BUTTON BLOCKS (exemplar)
n/a — suite asserts on buttons (each P0 control must pass at every size).
## H. OVERLAYS
Tests assert overlays never render outside viewport (8px margin).
## I. ERROR & RECOVERY
Any failed assertion → contract FAILS (UI GAPS REMAIN) → fix → re-run.
## J. AUDIT
[x] automated [x] multi-viewport [x] multi-density [x] P0-gated [x] CI-wired. (The suite itself is the gate.)
```
UI COMPLETE  (C-36)
```
