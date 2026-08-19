# F-34-01..07 — UI BUTTON SPECIFICATION (full part)
```
SOURCE BLUEPRINT: Part 34 — UI Button Specification (master table)
DEEP FEATURES: F-34-01..07 · STATUS: AUDITED
DEPENDS ON: F-26 (properties), F-07 (timeline), F-12 (library)
```
## A. IDENTITY
1. Official name: (button registry). 4. Purpose: master table — every button (name/icon/purpose/action/state/shortcut/mobile/deps/tooltip/error). 8. Status: current.

## EVIDENCE
E1 [BLUEPRINT Part 34] the 7-section master table (Tools/Timeline/Properties/Library/Color-Align/Transport/Registry). E2 [OUR DESIGN DECISION] declarative registry (id/icon/tooltip/action/enabled-predicate).

## F-34-01..07 BUTTON SECTIONS
| ID | Section | Count |
|---|---|---|
| F-34-01 | Tools panel buttons | ~30 tools (F-02) |
| F-34-02 | Timeline panel buttons | eye/lock/outline/add-layer/folder/delete/play/first-last/onion(3)/center/loop/attach/add-camera |
| F-34-03 | Properties buttons | swap/frame-picker/lip-syncing/add-filter/edit-ease/reset/embed |
| F-34-04 | Library buttons | new-symbol/new-folder/delete/properties/search/select-unused |
| F-34-05 | Color/Align/Transform/Info | chips/swap/b&w/no-color/add-swatch/align(6)/distribute(6)/match/constrain/reset/reg-transform-toggle |
| F-34-06 | Transport/Scenes/misc | test/publish/undo/redo/add-scene/dup-scene/delete-scene |
| F-34-07 | Registry contract | declarative: {id, icon, tooltip, action, enabled-predicate} |

## L. LIMITATIONS
L.1 error states must be visible (never silent) — Part 34.7. L.2 no button skipped (even minor) — the spec's core rule.

## M. EDGE CASES
M.1 disabled button (greyed + tooltip reason) · M.2 button during playback · M.3 last-scene delete blocked.

## O/P/Q/R/S/Y
Data: button registry (UI). Events: buttons → commands. Undo: action = one command. Serialization: n/a (UI). Mobile: same registry + toolbar placement. Implementation: declarative registry + enabled-predicates (no hand-wired buttons).

## TESTS
TS-01 every button in registry · TS-02 required-state predicates · TS-03 tooltip present · TS-04 error state visible · TS-05 shortcut mapping · TS-06 mobile equivalent · TS-07 disabled during playback (where applicable).

## AUDITS
No contradiction (our-design, labeled). Self-challenge: overlooked = enabled-predicates + visible-error-states + no-button-skipped — covered.

```
FEATURE COMPLETE: F-34-01..07 — UI button specification — AUDITED
```
