# 05_COMMAND_SYSTEM — COMMAND REGISTRY & UNDO/REDO MODEL

Every document mutation = a Command. Commands are the ONLY writer to MOD-DOC. Selection/edit-mode/view-state are NOT commands (restored via `prevSelection`).

## Command interface
```ts
interface Command {
  id: CMD-xxx; label: string;            // toast/history label
  do(): void;                            // mutation (validated)
  undo(): void;                          // inverse
  canCoalesce(next): boolean;            // merge rule
  coalesce(next): void;
  prevSelection: SelectionSnapshot;      // for restore
  affected: string[];                    // entity IDs (dirty marking)
}
```

## Undo model (MOD-COMMAND)
- **History**: bounded stack (default 100, configurable — RSK-011). Undo pops top (inverse); Redo re-applies.
- **Coalescing**: typing (per word/session), slider drags (per gesture), numeric field (per commit) merge into one entry via `canCoalesce`.
- **Redo invalidation**: new command after Undo clears the redo stack.
- **Irreversible ops** (allowed, explicit): none in authoring (all undoable); exports/imports are non-mutating or one atomic command.
- **Async commands**: long ops (lip-sync/import/boolean) execute in worker; the command records a **journal** (before/after entities) so Undo is exact even after completion; UI disables Undo for the in-flight command until journal ready.
- **Navigation/save**: undo stack is session-only; save doesn't clear it; reload resets it.
- **Failure**: `do()` throws → no mutation committed (validate-first); partial mutation wrapped in transaction (journal rollback).

## Command registry (exemplars — every tool/op maps here; full list = Phase-2 per-tool UNDO GRANULARITY)
| CMD | Purpose | do() | undo() | Coalesce | Affected |
|---|---|---|---|---|---|
| CMD-MOVE | move selection | set transform.x/y (+split raw-shape region at command time, REQ-SEL-006) | restore prev positions (+re-merge region) | yes (same gesture) | nodes |
| CMD-REShape | edge/anchor reshape | write path | restore path | yes | shape |
| CMD-TRANSFORM | free-transform gesture | write transform fields (all changed) | restore all | no (one per gesture) | node |
| CMD-DRAW | completed stroke/shape | insert node into frame content | remove node | no | layer/frame |
| CMD-ERASE | erase stroke | subtract stamps + split strokes | re-merge removed regions | yes | shapes |
| CMD-INSERT-FRAME | F5 extend | +1 held frame (shift right) | remove | yes (repeat F5) | layer |
| CMD-INSERT-KEY | F6 | copy-prev content → keyframe | revert to held | no | frame |
| CMD-INSERT-BLANK | F7 | blank keyframe | revert | no | frame |
| CMD-DELETE-FRAME | Shift+F5 | remove + shift left | re-insert | yes | frames |
| CMD-CLEAR-KEY | Shift+F6 | strip keyframe status | restore | no | frame |
| CMD-REMOVE-FRAMES | remove + gap | remove (leave gap) | re-insert | yes | frames |
| CMD-PASTE-FRAMES | paste clipboard | insert/overwrite | remove pasted | no | frames |
| CMD-CONVERT-TWEEN | create motion/classic/shape span | wrap/flag | unwrap | no | layer |
| CMD-SPLIT-MOTION | split span | two spans | merge | no | span |
| CMD-CREATE-SYMBOL | F8 | library symbol + instance | remove symbol + restore content | no | library/node |
| CMD-SWAP-SYMBOL | swap instance symbol | change symbolId | restore | no | instance |
| CMD-BREAK-APART | flatten one level | replace node with content | re-wrap | no | node |
| CMD-ADD-BONE | bone tool chain | add bone + pose layer | remove bone/revert layer | no | layer |
| CMD-MOVE-BONE | pose via drag | write pose (bone angles) | restore pose | yes | pose |
| CMD-INSERT-POSE | insert pose | record pose | remove pose | no | frame |
| CMD-SET-PROPERTY | property key write | create/update key | restore/remove key | yes (drag) | span |
| CMD-CHANGE-MOUTH | viseme/frame-picker | set instance firstFrame | restore | yes (same frame) | instance |
| CMD-LIP-SYNC | auto pass | write N mouth keys (journal) | remove N keys | no (one pass) | frames |
| CMD-IMPORT | import assets | add library (+instance) | remove | no | library |
| CMD-LAYER-OP | create/delete/rename/reorder/lock/hide/type | layer mutation | inverse | no | layer |
| CMD-SCENE-OP | scene CRUD/reorder | scene mutation | inverse | no | scenes |
| CMD-ALIGN | align/distribute | write positions | restore | no | nodes |
| CMD-COLOR | fill/stroke/style change | write style | restore | yes | node |
| CMD-EXPRESSION | apply expression | write part poses | restore | no | parts |
| CMD-CAMERA | camera keys/preset | write camera state | restore | no | camera |

## Invariants
1. `do()` validates preconditions (e.g., layer not locked; tween span not drawn on) → throws typed error → MOD-NOTIFY.
2. `prevSelection` captured before `do()`; restored on undo/redo (REQ-SEL-005).
3. Dirty marking from `affected` (STM-DIRTY).
4. Events emitted AFTER successful mutation: `document:changed{type, targets}` → panels/render re-render (dirty-region).
5. Selection-only actions (click/tool-switch/marquee) produce NO command (REQ-SEL-005).
