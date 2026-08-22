# KINEORA — FOUNDATION FINAL FORENSIC REPORT (P0/P1)

> Resolves FND-001. Audits the 7 foundation modules as ONE contract. Companion to `FOUNDATION_CONTRACT.md`.

---

## 1. Modules audited

MOD-BUS · MOD-STATE · MOD-COMMAND · MOD-VECTOR · MOD-COLOR · MOD-EASING · MOD-DOC.

## 2. Sources used

Blueprint Part 05 (vector/stroke) · Part 06 (shape) · Part 09.4 (easing) · Part 23 (color) · Part 33 (schema) · Part 36 (golden rules) · engineering 02/03/04/05/06/13/15/17 · SYS-01 §27 (locked events) · SYS-02 H00 (undo/dirty constitution) · SYS-03 H00/H01 (command engine) · code evidence (`command.rs`, `session.rs`, `easing.rs`, `id.rs`).

## 3. Contracts created

`FOUNDATION_CONTRACT.md` (§1–§7 per module + §8 adversarial audit + §9 gate).

## 4. Dependencies (verified — no upward/circular edges)

```
BUS  STATE  VECTOR  COLOR  EASING  COMMAND      (P0, leaves + COMMAND)
                 \        |        /            (COMMAND mutates DOC)
                     DOC                        (P1, core state)
```

- COMMAND → DOC (writes); DOC ↛ COMMAND (DOC is pure data; REQ-SYS-002 is a rule, not a code dependency).
- No circular dependency found.

## 5. Ownership matrix

| Module | Owns | Does NOT own |
|---|---|---|
| BUS | delivery/transport/event defaults | event names + semantics (producers) |
| STATE | machine registry + forbidden transitions | specific machines (SYS owners) |
| COMMAND | Command interface + History + undo/redo | individual commands (tools) + History panel UI (SYS-03) |
| VECTOR | path/boolean/tessellation geometry | shape-model semantics (SYS-20) + rendering (SYS-14) |
| COLOR | RGBA canonical + gradients + OKLab | color panel UI (SYS-21) + color effect (SYS-19) |
| EASING | easeFunction + Penner + slider | tween spans + graph editor UI (SYS-23) |
| DOC | ENT-* entities + validation + identity | persistence mechanics (SYS-28) + rendering + commands |

## 6. Command matrix (foundation-level)

| Command engine contract | Owner |
|---|---|
| `Command { id, label, do, undo, canCoalesce, coalesce, prevSelection, affected[] }` | MOD-COMMAND |
| `History.execute/undo/redo` (bounded 100) | MOD-COMMAND |
| Individual `CMD-xxx` (MOVE/DRAW/IMPORT/…) | producing SYS |

No duplicate command IDs; the ENGINE owns no CMD-xxx (they belong to systems).

## 7. Event matrix (foundation-level)

| Event | Producer | Payload (canonical) | Foundation role |
|---|---|---|---|
| `document:changed` | Command post-do | `{type, targets}` | BUS delivers; COMMAND emits |
| `selection:changed` | MOD-SELECTION (SYS-14) | `{prevTargets, targets, kind, commonType, bounds}` | BUS delivers |
| (all locked SYS-01 §27.1 events) | per producer | single-sourced | BUS delivers only |

No payload drift; BUS owns no event names.

## 8. State matrix

| State machine | Owner SYS | Foundation role |
|---|---|---|
| STM-DIRTY | SYS-02 H04 | STATE registry hosts it |
| STM-PLAYBACK | SYS-09 | hosted |
| STM-EXPORT/STM-JOB | SYS-27 | hosted |
| STM-MODAL | SYS-01 | hosted |
| STM-TOOL | SYS-13 | hosted |
| STM-EDIT | SYS-19 | hosted |
| STM-FIELD | SYS-17 | hosted |

No state drift; the registry enforces forbidden transitions (eng 04).

## 9. ID matrix

| ID namespace | Owner | Spec type | Code type |
|---|---|---|---|
| `NodeId/LayerId/SceneId/SymbolId` + all ENT ids | MOD-DOC (REQ-SYS-004) | **UUID** (Part 33) | `u64` (P-10 gap) |
| `CMD-xxx` | producing SYS | string | n/a |
| `EVT-xxx` | SYS-01 §27 | string | n/a |

**ID-type drift = the single tracked cross-module item** (F-1). Spec settled (UUID); code migration pending (P-10).

## 10. Persistence matrix

| Data | Boundary | Owner |
|---|---|---|
| ENT-* document content | DOCUMENT | SYS-28 (handoff) |
| History / clipboard / selection | SESSION | MOD-COMMAND / SYS-03 / SYS-14 |
| swatches (app-level) | PREFERENCES | SYS-21 |
| workspace layout | PREFERENCES | SYS-01 |
| dirty flag | TEMPORARY | SYS-02 H04 |

No persistence leak; foundation holds no persisted state.

## 11. Error matrix

| Module | Error contract |
|---|---|
| BUS | handler throw → degraded, never crash (SYS-01 §27.0) |
| COMMAND | do() throws → no mutation + toast (validate-first) |
| VECTOR | invalid boolean → no-op + undo (RSK-010) |
| COLOR | invalid input → inline error |
| DOC | integrity fail → warn/skip; orphan → placeholder + warn |
| STATE | forbidden transition → rejected |

## 12. Cross-system dependency matrix

| Foundation module | Depended on by (SYS) |
|---|---|
| BUS | all 28 |
| STATE | 01, 02, 09, 13, 17, 19, 27 |
| COMMAND | all mutating SYS (02, 03, 05, 13, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26) |
| VECTOR | 14, 20, 22 |
| COLOR | 19, 20, 21, 23 |
| EASING | 23 |
| DOC | all 28 (single source of truth) |

## 13. Contradictions found

| # | Contradiction | Verdict |
|---|---|---|
| C-1 | "RGBA canonical" (Part 23) vs "OKLab interpolation" (ENG-009) | NOT a contradiction — RGBA=storage, OKLab=interpolation (two concerns; documented §5) |
| C-2 | UUID (Part 33) vs u64 (code) | SPEC wins (FL-0017); code = gap (P-10) |

## 14. Contradictions fixed

- C-1 clarified in-place (FOUNDATION_CONTRACT §5) — no file conflict existed, only a latent misreading risk (FL-0031).
- C-2 is a SPEC-vs-IMPL gap, not a spec contradiction; recorded, not "fixed" (spec unchanged).

## 15. Unresolved blockers

| Item | Critical? | Status |
|---|---|---|
| F-1 ID-type code migration (u64→UUID or approved override) | NO (spec settled; impl gap) | tracked P-10 |
| F-2 custom-ease Bézier control-point format | NO (evaluator interface fixed; editing detail) | deferred to SYS-23 |
| FND-001 (foundation had no published owner) | WAS critical | **RESOLVED** by this contract |

## 16. New lessons

**None** — no genuinely new failure class surfaced. The RGBA/OKLab clarification is an FL-0031 instance (terminology/dual-reading); the ID drift is FL-0017 (code≠authority); the "two color spaces" distinction is FL-0031 + FL-0030 (single canonical value). All already ACTIVE.

## 17. Final gate

```
FOUNDATION READY =
  ownership conflicts:            0  ✓
  command conflicts:              0  ✓
  event conflicts:                0  ✓
  payload conflicts:              0  ✓
  state conflicts:                0  ✓
  ID conflicts:                   1 tracked (P-10, non-blocking to spec) ✓
  mutation bypasses:              0  ✓
  persistence-boundary conflicts: 0  ✓
  circular dependency:            0  ✓
  hidden implementation-critical ambiguity: 0  ✓
  lessons applied:                FL-0016/0017/0025/0030/0031  ✓
  adversarial reconciliation:     PASS  ✓

FOUNDATION READY = YES
```

**Next step (NOT started — awaiting instruction):** the foundation contract is published; the AI split may proceed (each AI reads this + `AI_ASSIGNMENTS.md` + `CROSS_SYSTEM_CONTRACT.md`). The Leader names the next SYS or the human issues the split command.
