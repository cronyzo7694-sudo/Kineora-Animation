# F-12-01 — LIBRARY PANEL ANATOMY · F-12-06 — SEARCH · F-12-07 — PREVIEW
```
SOURCE BLUEPRINT: Part 12 §12.0–12.1, §12.2.7–12.2.8 · DEEP FEATURES: F-12-01/06/07 · STATUS: AUDITED
DEPENDS ON: F-11-01
```
## F-12-01 PANEL ANATOMY
1. Official name: Library panel. 4. Purpose: per-document asset database UI (symbols/bitmaps/sounds/video/components). 8. Status: current.
EVIDENCE
E1 [OFFICIAL] `symbols.html`: symbols automatically become part of the library. E2 [OFFICIAL] `symbol-instances.html`: Library panel menu (New Symbol, New Folder…); double-click icon = edit symbol. E3 [OFFICIAL] Part 12 blueprint: preview window, list, search, sort, use-count.
CONTROLS
| Control | Action |
|---|---|
| Asset list | select (click); double-click symbol = edit (E2) |
| Preview window | symbol frame-1 + play; sound waveform + play; bitmap thumb |
| New Symbol (Ctrl+F8) | empty symbol → edit |
| New Folder | folder |
| Properties (i) | metadata (name/type/linkage/export) |
| Delete (trash) | delete (prompt if used) |
| Sort/menu | name/kind/date; icon vs list |
| Use-count column | reference count |

## F-12-06 SEARCH
1. Official name: (Library search). 4. Purpose: filter assets by name substring. 8. Status: current.
SEMANTICS: live substring filter across name (and kind, ours); scope = all vs current folder (ours).
LIMITATIONS: L.1 Animate search = name-only → ours: name+kind+tag (P2).

## F-12-07 PREVIEW
1. Official name: (Library preview). 4. Purpose: show the asset before placing/editing. 8. Status: current.
SEMANTICS
| Kind | Preview |
|---|---|
| Symbol | frame 1 thumb + play (animate) |
| Sound | waveform + play/stop |
| Bitmap | thumbnail + dimensions |
| Button | clickable (roll over/press) |
LIMITATIONS: L.1 symbol preview = frame 1 only in Animate → ours: full scrub preview.
EDGE: M.1 preview a nested symbol · M.2 preview loop · M.3 preview sound duration.
TESTS (F-12-01/06/07): TS-01 list shows assets · TS-02 dbl-click = edit (E2) · TS-03 search filters · TS-04 symbol preview plays · TS-05 sound waveform + play · TS-06 bitmap thumb · TS-07 button clickable · TS-08 use-count · TS-09 folder scope search · TS-10 undo none (view).
## AUDITS
No contradiction. Self-challenge: overlooked = frame-1-only preview (L.1) + use-count column + button clickable preview — covered.
```
FEATURE COMPLETE: F-12-01/06/07 — Library panel, search, preview — AUDITED
```
