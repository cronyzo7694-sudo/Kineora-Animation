# UI CONTRACT: C-37 — UI STATE MATRIX + INTERACTION TEST SUITE
```
SOURCE:  00_UI_RELIABILITY_MASTER.md §29/30
STATUS:  UI COMPLETE
PARENT:  00_UI_RELIABILITY_MASTER.md
```
## A. ENTRY POINT
Automated interaction test suite (CI).
## B. STATE MATRIX (§29)
States: Normal/Empty/Loading/Error/Success/Disabled/Selected/Editing/Playing/Paused/Exporting/Mobile/Tablet/Desktop — every important control verified per relevant state.
## C. INTERACTION TESTS (§30)
| ID | Test |
|---|---|
| it.click | single click |
| it.dblclick | double click |
| it.drag | drag |
| it.drop | drop |
| it.longpress | long press |
| it.keyboard | keyboard |
| it.touch | touch |
| it.stylus | stylus |
| it.escape | escape |
| it.outside | outside click |
| it.cancel | cancel |
| it.undo | undo |
| it.redo | redo |
| it.rapid | rapid repeated input (double-click button, key spam) |
## D. EXIT / ESCAPE / UNDO
Suite asserts Esc/close/undo work per contract.
## E. SHORTCUTS
n/a.
## F. POINTER + TOUCH
Simulates both.
## G. BUTTON BLOCKS
n/a — asserts buttons (idempotency under rapid input).
## H. OVERLAYS
Asserts overlay dismissal paths.
## I. ERROR & RECOVERY
Failed interaction → contract FAILS → fix.
## J. AUDIT
[x] automated [x] full state matrix [x] 14 interaction classes [x] CI-wired.
```
UI COMPLETE  (C-37)
```
