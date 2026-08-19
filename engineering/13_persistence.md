# 13_PERSISTENCE — MOD-PERSIST · MOD-AUTOSAVE · MOD-DOC

## Save model (ENG-016/017)
- Project = JSON (document model, 03) + `assets/` folder (binaries by dataRef). Compressed; worker; non-blocking.
- **Atomic write**: serialize → write `.tmp` → fsync → rename over target; checksum stored.
- **Dirty detection** (STM-DIRTY): commands mark `affected`; any mark → DIRTY.
- **Manual save**: Cmd+S → SAVING → CLEAN (status "Saved hh:mm").
- **Autosave**: debounced (e.g., 2s after last change + 30s interval [ENGINEERING DECISION]) → `.autosave` slot (never overwrites the user's last manual save).
- **Crash recovery**: on launch, if `.autosave` newer than project → prompt "Recover?" (W11).
- **Reload**: selection/edit-mode cleared (view state); activeLayerId + prefs persisted (F-03-02 R).

## Versioning & migration (MOD-DOC)
- `formatVersion` monotonic; `migrate(from,to)` pure; loader: validate → migrate → re-link IDs → integrity check.
- Integrity: orphan node refs → placeholder + warn (M.15); broken dataRef → warn + skip.

## Corruption detection & rollback
- Checksum mismatch → refuse load, offer `.autosave` or backup (RSK-013).
- Partial write → tmp discarded, last good file intact (atomic rename guarantees).

## Undo/persistence interaction (REQ-SYS-002 / Part 12)
- Save does NOT clear undo stack; undo operates on in-memory model; save persists current model.
- Reload resets undo stack (session-only).
- Command journal (async) not persisted — in-flight jobs do not survive reload (STM-JOB).

## What persists vs not (authoritative)
| Persisted (document) | Persisted (app prefs) | Not persisted |
|---|---|---|
| scenes/layers/frames/content/transforms/styles/symbols/assets/camera/audio-attachments/mouth/lipsync-result | workspaces, shortcuts, highlight colors, contact-sensitive, shift-select, span-based, readoutPoint, brush size, wand threshold | selection, editMode, playhead, marquee, undo stack, ruler zoom, panel temp resize |

## Acceptance
- **REQ-PERSIST-A**: Given DIRTY doc; When kill app mid-edit; Then relaunch offers recovery from `.autosave`; recovered doc equals last autosave state.
- **REQ-PERSIST-B**: Given save; When reload; Then evaluate(time) identical for all frames (deterministic round-trip).
- **REQ-PERSIST-C**: Given rename layer/symbol; Then reload keeps refs intact (ID-based).
