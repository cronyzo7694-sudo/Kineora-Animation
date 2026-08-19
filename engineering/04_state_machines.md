# 04_STATE_MACHINES — STATE & TRANSITIONS

Registry: `MOD-STATE` owns `StateMachine` instances; each machine = states + triggers + guards + side-effects. UI reads machine state (never drives it directly).

## STM-PLAYBACK (Transport)
States: **IDLE → PLAYING → PAUSED ⇄ ; PLAYING → STOPPED→IDLE; (loop) PLAYING→PLAYING**
| From | Trigger | To | Side effects |
|---|---|---|---|
| IDLE | play() | PLAYING | emit playback:started; start rAF tick |
| PLAYING | pause() | PAUSED | emit playback:paused |
| PAUSED | play() | PLAYING | resume |
| PLAYING | stop()/seek(first) | IDLE | emit playback:stopped; playhead=first |
| PLAYING | seek(f) | PLAYING | emit playhead:moved; scrub audio |
| any | timeline:changed(duration) | IDLE | clamp playhead |
Invalid: play on empty doc → no-op + status. Loop=ON: tick wraps to first.

## STM-EXPORT (long op)
States: **IDLE → PREPARING → RENDERING → ENCODING → COMPLETE | CANCELLED | FAILED**
| From | Trigger | To | Side effects |
|---|---|---|---|
| IDLE | export(settings) | PREPARING | validate settings; build frame list |
| PREPARING | valid | RENDERING | worker pool frames |
| PREPARING | invalid | FAILED | inline error |
| RENDERING | progress | RENDERING | progress % |
| RENDERING | cancel() | CANCELLED | discard partial + cleanup temp |
| RENDERING | all frames done | ENCODING | mux (video/audio) |
| ENCODING | done | COMPLETE | write file; toast + open-folder |
| ENCODING | cancel() | CANCELLED | cleanup |
| any | error | FAILED | log + retry/cancel |
| FAILED | retry() | PREPARING | re-validate |
UI: status bar progress; cancel button enabled in RENDERING/ENCODING; buttons disabled during op (C-§2 during-op rule). Navigation away: op continues in worker; return shows progress. Reload: op lost → FAILED (no resume) [ASSUMPTION — resume out of scope P2].

## STM-JOB (generic async: import/lip-sync/boolean/optimize)
States: **QUEUED → RUNNING → SUCCEEDED | CANCELLED | FAILED | TIMED_OUT | RETRYING**
| Trigger | Side effects |
|---|---|
| enqueue | QUEUED; OperationQueue ensures one long-op at a time (ENG-020) |
| start | RUNNING; progress events |
| cancel | CANCELLED (safe partial + cleanup) |
| timeout | TIMED_OUT → retry or FAILED |
| error(retryable) | RETRYING (backoff) |
Idempotency: job has `idempotencyKey`; duplicate enqueue returns existing job handle. UI: spinner→progress→done/error; cancel always available (never frozen).

## STM-MODAL
States: **CLOSED → OPENING → OPEN → SUBMITTING → ERROR | CLOSING → CLOSED**
| From | Trigger | To | Side effects |
|---|---|---|---|
| CLOSED | open(modal) | OPENING | register with ModalManager (queue if incompatible) |
| OPENING | mounted | OPEN | focus trap; emit overlay:opened |
| OPEN | primary() | SUBMITTING | run command; disable primary |
| SUBMITTING | success | CLOSING | emit; close |
| SUBMITTING | failure | ERROR | inline error; enable primary |
| OPEN | cancel()/Esc/outside | CLOSING | revert (no command) |
| CLOSING | anim end | CLOSED | restore focus; emit overlay:closed |
Invariants: focus trapped (Tab cycles inside); Esc=cancel; one modal at a time.

## STM-TOOL (gesture lifecycle — all tools share)
States: **INACTIVE → ACTIVE → DRAGGING → COMMITTING | CANCELLING → (back)**
| From | Trigger | To | Side effects |
|---|---|---|---|
| INACTIVE | activate(tool) | ACTIVE | emit tool:changed; options render |
| ACTIVE | pointerdown(hit) | DRAGGING | setPointerCapture (C-§22); temp preview state |
| DRAGGING | pointermove | DRAGGING | live preview (throttled) |
| DRAGGING | pointerup | COMMITTING | build Command |
| COMMITTING | valid | ACTIVE | command.execute(); undo push; emit document:changed |
| DRAGGING | Esc/pointercancel | CANCELLING | discard preview (no command) |
| ACTIVE | deactivate/switch | INACTIVE | options hide |
Invariants: mode chip shows active tool (C-§18); Esc always cancels; lostpointercapture ⇒ CANCELLING.

## STM-EDIT (symbol/group edit depth)
States: **DOCUMENT → IN_SYMBOL(level) → … → DOCUMENT**
| Trigger | Side effects |
|---|---|
| double-click instance/group | push level; dim scope; breadcrumb; emit editMode:entered |
| Back/Esc | pop one level; emit editMode:exited |
| Ctrl+Enter / breadcrumb-scene | pop to DOCUMENT |
| double-click outside | pop one level |
Guard: max depth 32 (RSK-002). Dimmed content excluded from hit-test (REQ-SEL-001).

## STM-FIELD (property editor)
States: **IDLE → EDITING → COMMITTED | REVERTED**
| Trigger | Side effects |
|---|---|
| focus/type | EDITING; live preview (where set) |
| Enter/blur | COMMITTED: validate → command (one undo) or inline error |
| Esc | REVERTED: restore previous value |
| invalid input | inline error + revert on commit attempt (never silent) |

## STM-DIRTY (save state)
States: **CLEAN → DIRTY → SAVING → CLEAN | ERROR**
| Trigger | Side effects |
|---|---|
| command.execute() | DIRTY (dirty flag on touched entities) |
| save()/autosave timer | SAVING; status "Saving…" |
| write success | CLEAN; status "Saved hh:mm" |
| write failure | ERROR; keep DIRTY; retry + .autosave slot safe |
Reload guard: navigation/close with DIRTY → confirm (C-§31).

## Forbidden transitions (enforced by machine registry)
- PLAYING→IDLE without stop()/pause (seek keeps playing).
- SUBMITTING→OPEN (double-submit blocked; primary disabled).
- DRAGGING→INACTIVE (must COMMIT or CANCEL first).
- DIRTY→CLEAN without a successful write.
