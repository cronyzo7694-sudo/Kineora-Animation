# 15_TESTING_ACCEPTANCE — TEST ARCHITECTURE & ACCEPTANCE CRITERIA

## Test layers (MOD-TEST)
| Layer | Scope | Examples |
|---|---|---|
| Unit | pure engines | interpolation (rotation flags/OKLab/log-zoom), easing set, hold rule, boolean clipping, anchor correspondence |
| Component | UI components | button 3-state, TimelineCell glyphs, panel min-clamp |
| Integration | module pairs | command→model→event→render; frame ops→hold rule; symbol nesting→sampling |
| State-transition | machines (04) | STM-PLAYBACK/EXPORT/MODAL/TOOL forbidden transitions |
| Interaction | C-37 | click/dbl/drag/long-press/escape/outside/cancel/undo/redo/rapid-repeat |
| Responsive/no-overlap | C-36 | 7 viewports × 2 density: no overlap/clip/off-screen/zero-size/hidden-close |
| Accessibility | C-35 | keyboard-only pass, focus trap, aria-live, contrast, reduced-motion |
| Serialization/persistence | 13 | round-trip, migration, corruption, autosave recovery |
| Async | STM-JOB/EXPORT | progress/cancel/cleanup/idempotency/duplicate-enqueue |
| Visual | snapshot | render determinism, overlay-not-in-export |
| Performance | [TARGETS] | 60fps playback, hit<1ms@10k, sparse memory, export frame-parallel |
| Mobile/touch | C-33 | tap/dbl-tap/long-press/pinch/twist/loupe/palm-rejection |
| Audio | 10 | sync mux sample-exact, scrub-audio, trim/loop |
| Lip-sync | 10 | viseme mapping, longest-wins, editable result, undo pass |
| Rig | 09 | copy/paste/re-parent no corruption, constraint clamp, unreachable straighten |
| Timeline | 07 | sparse invariants, frame-op semantics, determinism |

## Acceptance format (Given/When/Then) — exemplars
- **AC-TIM-001**: Given doc@24fps with keyframe@1 and keyframe@25; When playhead@13; Then evaluate returns interpolated state without modifying document data; playback produces identical visual state at same frame; undo stack unchanged.
- **AC-SEL-001**: Given overlapping stack (raw shape + instance); When click; Then top-most instance selected; When Alt+click (ours); Then selection cycles to the object below.
- **AC-UNDO-001**: Given multi-object move; When Undo; Then all members restored together AND selection restored to pre-command state.
- **AC-UI-001**: Given any screen at any tested viewport; Then no FUNCTIONAL control unbound, no control overlapping, no P0 control unreachable.
- **AC-EXP-001**: Given export with selection visible in authoring; Then output contains zero overlay pixels.
- **AC-RIG-001**: Given rigged arm (copy→paste→re-parent→scale child); Then poses uncorrupted (local-space invariant).
- **AC-LIP-001**: Given auto lip-sync; When Undo; Then entire auto-pass reverts in one step; manual edits remain undoable independently.

## Quality gates (module complete = gates pass; Part 30)
Every MOD-xxx ships a gate: core behavior + persistence + undo + mobile + perf + tests. No visual-only completion.
