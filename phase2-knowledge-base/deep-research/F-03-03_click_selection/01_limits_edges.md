# F-03-03 — L. LIMITATIONS · M. EDGE CASES

---

## L. LIMITATIONS

| # | Limitation | Trigger | Expected | Actual | Visible | Severity | Version | Source | Workaround | Preserve? | Better alternative (ours) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| L.1 | Live buttons can't be click-selected | Simple Buttons ON + click button | select button | button activates | no selection | Low | all | [OFFICIAL] E9 | marquee the button; toggle Simple Buttons OFF | Preserve | hold Alt while clicking to force-select a live button |
| L.2 | No single hotkey to exit one nesting level | deep symbol edit | jump back one level | must click Back/breadcrumb or double-click outside | slow navigation | Medium | current | [COMMUNITY] E13 | breadcrumb click | Improve | **Esc** exits one level; **Ctrl+Enter** exits to root |
| L.3 | Double-click tool-scoped | Subselection active | enter symbol edit | nothing | confusion | Low | current | [COMMUNITY] E12 | switch to V | Improve | show tooltip "use Selection tool to edit symbol" |
| L.4 | Double-click stroke ≠ fill+stroke | double-click a stroke | whole shape | connected strokes only | fill left unselected | Low | all | [OFFICIAL] E4 vs E3 | double-click the fill | Preserve (it's correct per-target behavior) | — |
| L.5 | Fill/stroke are separate single-click targets | click near edge | whole shape | whichever sub-object | moving one splits shape | Medium | all | [OFFICIAL] E2 | double-click fill | Preserve | hover highlights which sub-object will be selected |
| L.6 | No "select behind" (carried from F-03-01 L.2) | click overlapping stack | reach lower object | top-most | — | Medium | all | [INFERENCE] | lock/hide/outline | Improve | Alt+click cycles stack |
| L.7 | First click of double-click pre-selects | double-click group | instant edit | brief selection flash then edit | flicker | Low | all | [INFERENCE] | n/a | Preserve (standard) | optionally suppress the flash |

---

## M. EDGE CASES

| # | Case | Behavior |
|---|---|---|
| M.1 | Two slow clicks (≥ double-click time) | two separate single-click selections (re-select same object twice) |
| M.2 | Click-drag just under the move threshold | treated as click (no move); the drag-threshold ~3 px |
| M.3 | Double-click on empty stage | clears selection twice; no drill |
| M.4 | Double-click outside a symbol while edit-in-place | exits edit [E6] |
| M.5 | Double-click blank while group editing | Edit All — exits group edit [E5] |
| M.6 | Click a zero-size object | miss (F-03-01 M.10) |
| M.7 | Click a rotated/negative-scaled object | hit via transformed bounds (F-03-01 M.11/12) |
| M.8 | Click a nested symbol 3 levels deep | selects outermost; double-click descends per level [E6] |
| M.9 | Double-click a nested symbol then Esc | [our app] exits one level (L.2 fix) |
| M.10 | Click during playback | resolves at live frame; selection may drop on scrub (F-03-02 M.18) |
| M.11 | Click a button with Simple Buttons ON then toggle OFF | first click activates, subsequent clicks select |
| M.12 | Shift+click with Shift Select disabled | behaves as plain click (replaces) [E8] |
| M.13 | Shift+double-click | [UNCERTAIN] — not documented; treat as shift-of-double-click result |
| M.14 | Double-click a text block | enters text edit (not a symbol drill) |
| M.15 | Double-click a bitmap | select only (no edit mode) |
| M.16 | Click on a locked object (Arrange > Lock) | skipped (F-03-01 M.6) |
| M.17 | Click a broken-reference instance | [ours] select + warn toast |
| M.18 | Undo/redo after a click | click has no undo entry; selection restored per command capture (F-03-02 Q) |
| M.19 | Save/reload | selection cleared (F-03-02 L.4) |
| M.20 | Double-click the Library symbol icon | enters **symbol-editing mode** (full-window) — different from stage edit-in-place [OFFICIAL F-03-03 E6 src] |
