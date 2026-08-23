# 09 — UNDO / TRANSACTION MODEL

## Current reality (verified, audit Q1/Q11)

`History` = one stack entry per `Command`; **no grouping exists** (`Composite|Batch|…` grep = 0 hits). A 5-action AI plan would today create 5 undo entries — bad UX ("undo karne ke liye 5 baar Ctrl+Z?") and dangerous: redo-history interleaving makes partial AI states trivially reachable.

## Requirement (validated against the architecture)

**ONE USER REQUEST → ONE LOGICAL UNDO GROUP.** The Ball example (layer+shape+2 keyframes+transform+tween) collapses to a single `Ctrl+Z` ("Undo: AI — red ball bounce"). Verified feasible: the `Command` trait is object-safe (`Box<dyn Command>` in `HistoryEntry`) and Commands are already reversible, so a composite wrapper fits the existing trait without touching any existing impl.

## Design: `CompositeCommand` (engine increment E-AI-1)

Conceptual (not code): a Command whose `children: Vec<Box<dyn Command>>`, `label()` = plan's report string, `apply()` = apply children in order, `revert()` = revert children in **reverse** order. Selection capture stays exactly as today (Session snapshots prev/post around the single composite execute — INV-EDIT-2 untouched). History bound semantics: composite counts as ONE entry (its children do not individually evict old entries).

**Rollback on mid-failure:** stage-12 dry-run (05) + apply-time re-validation makes mid-failure rare, but if child *k* of *n* fails: revert children k−1…1 in reverse, push NOTHING to history, report rolled-back with the failing action named (16). All-or-nothing per plan is the MVP rule (no partial commits — partial survivors would orphan refs like keyframes pointing at reverted content).

**Interruption semantics:** Stop before apply ⇒ nothing applied, plan discarded (kept in chat as "cancelled plan" card). Stop has no meaning mid-apply because apply of a bounded plan (≤64 leaf commands) is synchronous and sub-16ms typical — execution is not streamed into the document piecemeal.

## Interleaving with human actions

The composite is an ordinary stack entry. All existing invariants hold unchanged: new edit (human or AI) clears redo; dirty = content-diff vs saved snapshot; labels list shows one line ("AI — red ball bounce") — actually improving output-log legibility.

## Failure/cancel matrix

| Event | Result |
|---|---|
| Validator rejects plan | no history entry, error card (16) |
| Apply-time guard trips | full rollback, no entry, report |
| Engine op returns false mid-plan | full rollback (above), report |
| User Ctrl+Z after success | whole AI plan reverted in one step |
| User undoes, then edits | AI plan's redo invalidated (normal redo-clear) |
| AI acts, human acts, AI acts | three stack entries; undo walks them in LIFO — correct and unsurprising |

## Explicitly rejected

- Per-action undo entries (default engine behavior) — fails UX requirement.
- "AI-only mini history" — parallel undo = corruption factory.
- Async/streamed document writes — breaks atomicity and Stage rendering assumptions.
- Compensating-action reversal instead of `revert` — reinvents what Commands already guarantee.
