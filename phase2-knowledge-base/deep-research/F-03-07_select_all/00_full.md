# F-03-07 — SELECT ALL / DESELECT ALL

```
SOURCE BLUEPRINT:  Part 03 — Selection System  (animate-blueprint/03_selection_system.md §3.3.5)
DEEP FEATURE:      Select All / Deselect All (stage + timeline variants)
QUEUE ID:          F-03-07
STATUS:            FULLY RESEARCHED → AUDITED
DEPENDS ON:        F-03-01 Hit testing · F-03-02 Data structure
```

## A. IDENTITY
| Field | Value |
|---|---|
| 1. Official name | Select All / Deselect All (Edit menu). |
| 2. Alternate names | Ctrl+A / Ctrl+Shift+A; "Select All Frames" (timeline). |
| 4. Purpose | Bulk-select or bulk-clear everything selectable in one action. |
| 5. Category | Selection subsystem / bulk command. |
| 8. Status | Current (stable since Flash). |

## EVIDENCE REGISTER
| # | Claim | Status |
|---|---|---|
| E1 | **Select All** (Ctrl/Cmd+A) selects everything on **every layer of a scene**, **except** locked/hidden layers and layers **not on the current timeline**. | [OFFICIAL] `selecting-objects.html` |
| E2 | **Deselect All** = Edit > Deselect All / **Ctrl+Shift+A** (Cmd+Shift+A). | [OFFICIAL] same |
| E3 | Timeline **Ctrl+A selects only frames that have drawings**, not empty frames. | [COMMUNITY REPORT] r/adobeanimate 2023 |
| E4 | **Double-click the playhead** selects the **entire column** of frames (all layers at that frame). | [COMMUNITY REPORT] same thread |
| E5 | Edit > Timeline > **Select All Frames** selects all frames in the timeline. | [OFFICIAL] `frames-keyframes.html` |
| E6 | Deselect individual items = Shift+click (F-03-04 E2). | [OFFICIAL] |

## B. UI LOCATION
```
Edit menu → Select All (Ctrl/Cmd+A) · Deselect All (Ctrl/Cmd+Shift+A)
Edit menu → Timeline → Select All Frames
Timeline → double-click the playhead → select entire column [E4]
```

## D. INTERACTIONS
| Action | UI | State | Doc | Event | Undo |
|---|---|---|---|---|---|
| Ctrl/Cmd+A (stage focus) | all eligible highlight | all unlocked/visible/current-timeline objects selected (E1) | none | `selection:changed` | none |
| Ctrl/Cmd+Shift+A | clear | `kind:'none'` | none | `selection:changed` | none |
| Ctrl/Cmd+A (timeline focus) | frames-with-drawings highlight | only drawn frames (E3) | none | `timelineSelection:changed` | none |
| Edit > Timeline > Select All Frames | all cells | all frames (E5) | none | `timelineSelection:changed` | none |
| Double-click playhead | column highlight | all layers at that frame (E4) | none | `timelineSelection:changed` | none |

## E. STATES
| State | Select All behavior |
|---|---|
| Locked layer(s) present | excluded (E1) |
| Hidden layer(s) present | excluded (E1) |
| Other-scene content | excluded ("not on the current timeline", E1) |
| Inside symbol edit | selects all in the **symbol's** timeline (scope = current timeline) |
| Timeline focus vs stage focus | different targets (frames vs objects) |

## F. OBJECT COMPATIBILITY
Select All includes: raw shapes (fill+stroke regions), drawing objects, groups, instances, text, bitmaps — on eligible layers. Excludes: locked/hidden layers (E1), camera, audio (not stage objects), other scenes.

## L. LIMITATIONS
| # | Limitation | Trigger | Actual | Severity | Source | Better (ours) |
|---|---|---|---|---|---|---|
| L.1 | Stage Ctrl+A ≠ timeline Ctrl+A (context-dependent, same shortcut) | focus confusion | selects objects vs frames | Medium | E1 vs E3 | distinct shortcuts or a focus ring to show context |
| L.2 | Timeline Ctrl+A skips empty frames | bulk frame select | empty frames unselected | Low | [COMMUNITY] E3 | "Select All Frames" menu covers it (E5) |
| L.3 | Select All ignores hidden layers but they still export | pre-publish check | surprise | Low | [INFERENCE] | publish warning "N hidden layers excluded" |

## M. EDGE CASES
M.1 Select All with everything locked → empty selection; M.2 inside symbol edit → scoped to symbol; M.3 Select All then Shift+click to prune (F-03-04 W.2); M.4 double-click playhead on empty column → nothing; M.5 Ctrl+A in timeline with span-based ON → spans selected [F-03-04 E9]; M.6 Select All during playback → live-frame content only.

## O/P/Q/R
- Data: fills `selection.targets` (all eligible) or `timelineSelection` (frames). View state only.
- Events: `selection:changed` / `timelineSelection:changed`.
- Undo: **none** (selection is view state); a subsequent move/delete of the bulk set = one command.
- Serialization: not persisted.

## S/T/U/V
- Mobile: toolbar **Select All / Deselect All** buttons (no keyboard).
- Stylus: n/a (keyboard/menu).
- Accessibility: announce "N objects selected / cleared".
- Performance: O(n) bounds union over all eligible (cached); 10k objects responsive.

## W. WORKFLOWS
W.1 Select everything then prune: Ctrl+A → Shift+click background to remove → edit the rest.
W.2 Select all frames: Edit > Timeline > Select All Frames → copy → paste elsewhere (E5).

## X. ALTERNATIVES
Whole-scene selection: Ctrl+A (fast, excludes locked/hidden) vs marquee-all (manual, same exclusions) vs frame-column double-click (timeline). Best: Ctrl+A for stage; Select-All-Frames for timeline.

## Y. IMPLEMENTATION (OURS)
- Two scoped commands: `selectAllStage()` (walks eligible layers, F-03-01 rules) and `selectAllFrames()` (timeline).
- Distinct UI: stage Ctrl+A; timeline Ctrl+Shift+A **or** menu (avoids L.1 ambiguity); focus ring shows which context the shortcut will hit.
- Emit the respective events; no undo; cached bounds.

## TEST MATRIX
TS-01 Ctrl+A selects all eligible · TS-02 excludes locked (E1) · TS-03 excludes hidden (E1) · TS-04 excludes other scenes · TS-05 Ctrl+Shift+A clears · TS-06 timeline Ctrl+A = drawn frames only (E3) · TS-07 Select All Frames = all (E5) · TS-08 double-click playhead = column (E4) · TS-09 inside symbol = scoped · TS-10 all-locked → empty · TS-11 undo = none · TS-12 mobile buttons · TS-13 playback live-frame · TS-14 perf 10k.

## AUDITS
**Contradiction:** none. **Completeness:** complete; the stage/timeline Ctrl+A divergence (L.1) is the key find. **Self-challenge:** overlooked = the two-domain shortcut collision + empty-frame skip (E3) — covered. **Version:** stable Flash→Animate.

```
FEATURE COMPLETE: F-03-07 — Select All / Deselect All — AUDITED
```
