# F-03-01 — TEST MATRIX

> Coverage categories (mandatory): Normal, Boundary, Invalid, Empty, Multi-object, Locked, Hidden, Nested, Undo, Redo, Save/Reload, Import, Export, Playback, Mobile, Touch, Stylus, Performance. Each test = `TS-xx`.

## NORMAL
| ID | Test | Expected |
|---|---|---|
| TS-01 | Click a shape's fill | fill selected; stroke unselected (E12) |
| TS-02 | Click a shape's stroke | stroke selected; fill unselected |
| TS-03 | Double-click a fill | fill + stroke selected (E5) |
| TS-04 | Double-click a connected stroke | all connected segments selected (E4/E14) |
| TS-05 | Click a drawing object / group / instance / text / bitmap | whole object selected; bounding box shows (E18) |
| TS-06 | Click empty stage | selection cleared; no undo entry |
| TS-07 | Shift+click a second object | added to selection (E6) |
| TS-08 | Shift+click a selected object | removed from selection |
| TS-09 | Marquee fully enclosing objects (contact OFF) | enclosed selected |
| TS-10 | Marquee touching objects (contact ON) | touched selected (E9) |
| TS-11 | Ctrl/Cmd+A | all visible, unlocked, current-timeline content selected (E7) |

## BOUNDARY
| ID | Test | Expected |
|---|---|---|
| TS-12 | Click exactly on the stroke centerline | stroke selected (edge tolerance ≥ 0) |
| TS-13 | Click 3 px off a stroke (desktop tol=4) | stroke selected; 5 px off → miss |
| TS-14 | Marquee whose edge passes exactly through an object edge (contact ON) | selected |
| TS-15 | Marquee whose edge passes through an object edge (contact OFF) | not selected (must be enclosed) |

## INVALID / EMPTY
| ID | Test | Expected |
|---|---|---|
| TS-16 | Click on a zero-size object | miss (no selection) [M.10] |
| TS-17 | Click on NaN-coordinate object | no crash; miss; NaN clamped [M.8] |
| TS-18 | Marquee with zero area (click without move) | treated as click, not marquee |

## MULTI-OBJECT
| ID | Test | Expected |
|---|---|---|
| TS-19 | Mixed selection (shape + instance) | both selected; Properties shows common fields only |
| TS-20 | Plain click while multi-selected | collapses to the single hit |
| TS-21 | Shift+marquee over mixed shapes | adds to selection; raw-shape regions merge |

## LOCKED / HIDDEN
| ID | Test | Expected |
|---|---|---|
| TS-22 | Click content on a locked layer | nothing selected; no-entry cursor (L.4) |
| TS-23 | Ctrl+A with a locked + hidden layer | excluded (E7) |
| TS-24 | Click a locked *object* (Arrange > Lock) | skipped |
| TS-25 | Marquee over hidden layer content | not selected |

## NESTED
| ID | Test | Expected |
|---|---|---|
| TS-26 | Click a group at top level | group selected, child not |
| TS-27 | Double-click group → click child | child selected (edit-in-place, E11) |
| TS-28 | Double-click blank while in group | exit; group re-selected as one |
| TS-29 | Click a symbol instance | instance selected (never inner frame) |
| TS-30 | 3-deep nested symbol | outermost instance wins; descend per double-click |

## UNDO / REDO
| ID | Test | Expected |
|---|---|---|
| TS-31 | Select → move → undo | move reverted; selection restored to pre-command state |
| TS-32 | Select → move → undo → redo | move re-applied; selection restored |
| TS-33 | Click-click-click selections → undo | selection changes produce **no** undo entries |

## SAVE / RELOAD / IMPORT / EXPORT
| ID | Test | Expected |
|---|---|---|
| TS-34 | Save with a selection → reload | selection cleared (view state, not persisted) |
| TS-35 | Reload → click same object | identical hit result (deterministic) |
| TS-36 | Import a bitmap → click its transparent corner | rect hit (alpha-precise OFF) / miss (ON) [L.7] |
| TS-37 | Export → re-import rendered PNG | re-imported bitmap hit-tests as a rect |

## PLAYBACK
| ID | Test | Expected |
|---|---|---|
| TS-38 | Select an object that vanishes on scrub | selection drops at the frame where it's absent (L.6) |
| TS-39 | Click a tweened instance mid-span | selects the tween target at that frame |

## MOBILE / TOUCH
| ID | Test | Expected |
|---|---|---|
| TS-40 | Tap a small stroke (finger) | selected (24-px tolerance) |
| TS-41 | Long-press an object | context menu for that object |
| TS-42 | One-finger drag on empty | marquee (no pan) |
| TS-43 | Two-finger drag | pan (no selection) |
| TS-44 | Select-mode tap → tap | membership toggles (Shift replacement) |
| TS-45 | Palm contact | rejected (no selection) |

## STYLUS
| ID | Test | Expected |
|---|---|---|
| TS-46 | Stylus tap | 1-px tolerance select |
| TS-47 | Barrel button press | context menu at target |
| TS-48 | Pressure change while hovering | no selection change |

## PERFORMANCE
| ID | Test | Expected |
|---|---|---|
| TS-49 | 10k objects, click | < 1 ms (spatial index) |
| TS-50 | 10k objects, large marquee | bounds pre-filter then precise; responsive |
| TS-51 | Deep nesting (50 levels) | no stack overflow; early bounds rejection |

## FEATURE-SPECIFIC ADDITIONS
| ID | Test | Expected |
|---|---|---|
| TS-52 | Alt+click on overlapping stack (our L.2 fix) | cycles to the object below |
| TS-53 | Region-select lock ON + marquee over raw shape (L.1 fix) | whole shape selected, no split |
| TS-54 | Raw shape partial marquee (lock OFF) + drag | region splits away (preserved merge behavior, E13) |
