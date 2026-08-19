# UI CONTRACT: C-05 — STATUS BAR & STATE VISIBILITY (§19)
```
SOURCE:  00_UI_RELIABILITY_MASTER.md §19 + Phase-2 F-01-29
STATUS:  UI COMPLETE
PARENT:  00_UI_RELIABILITY_MASTER.md
```
## A. ENTRY POINT
Status bar (bottom, ALWAYS-VISIBLE) + ContextChip (top of Properties) + breadcrumb (above stage) + mode chip (when a mode is active).
## B. VISIBLE CONTROLS (all ALWAYS-VISIBLE StatusBar cells)
| ID | Cell | Content |
|---|---|---|
| st.activeTool | tool | icon + name |
| st.selection | selection | count + commonType |
| st.activeLayer | layer | name + lock/hidden icon |
| st.activeFrame | frame | N / total + fps |
| st.activeScene | scene | name |
| st.activeSymbol | symbol | breadcrumb path (edit depth) |
| st.recording | recording | "REC" (red) when recording |
| st.playback | playback | ▶/⏸/loop |
| st.saving | save | "Saving…/Saved hh:mm" |
| st.export | export | progress % |
| st.mode | mode | active transform/rig/camera/text mode |
| st.snap | snapping | snap mode (grid/objects/pixels) |
## C. STATE MAP
| State | StatusBar |
|---|---|
| Idle | tool+layer+frame |
| Selection | + count/type |
| Playing | ▶ → ⏸ |
| Saving/Exporting | spinner + % |
| Mode active | mode chip (persistent) |
| Edit-in-place | breadcrumb + dimmed context |
## D. EXIT / ESCAPE
Status is passive (no exit); breadcrumb click = jump levels (Back).
## E. SHORTCUTS
None (read-only). Mobile: condensed status (tool/frame/play only).
## F. POINTER + TOUCH
Click frame cell → go-to-frame dialog (ours). Tap breadcrumb → jump. Long-press mode chip → exit mode menu.
## G. BUTTON BLOCKS (exemplar)
**st.activeFrame (clickable)** — ID st.activeFrame · Action `goToFrame()` dialog · Twice-click: reopens (idempotent) · No-context: disabled when no doc.
## H. OVERLAYS
Go-to-frame dialog L5.
## I. ERROR & RECOVERY
Status conflicts (e.g., two modes) → mode chip shows highest priority + warning color.
## J. UI RELIABILITY AUDIT
[x] visible (always) [x] stateful (all 12 states) [x] positioned [x] accessible (aria-live for changes) [x] responsive (condensed mobile) [x] tested (every state) [x] wired (event bus).
```
UI COMPLETE  (C-05)
```
