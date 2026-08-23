# 19 — MEMORY & CONVERSATION CONTEXT

## The running example

"Make the ball red." → "Now make it bounce." — "it" must bind to the same node. Resolution: **conversation window + activity-log entity bindings + fresh snapshot** (not long-term memory).

## Context components per request (assembled fresh)

1. **System prompt** (static prefix: identity, rules, taxonomy, defaults, manifest — cache-friendly layout first, 20).
2. **Snapshot Tier 0+1** — freshly rebuilt every turn (06). Scene context is *never* cached across turns because users edit between messages; staleness guard = docRevision compare with a "scene changed since last reply" note when relevant.
3. **Conversation window** — last N user/AI messages (DEFAULT: N=12, plan cards included as compact summaries, full action JSON elided after execution). Prevents "it"-amnesia without unbounded growth.
4. **Entity bindings** — from the activity log (21): `{alias:"ball", id: NodeId47, createdBy:"turn 3", status:"exists|deleted"}`. Cheap, precise, and survives renames since it tracks ids; dead bindings pruned when verifier/snapshot shows deletion.
5. **Mode + variables** — current mode, resolved `$vars` used recently.

## Policies

- **Selection freshness:** selection block snapshot is per-turn; "selected object" always means *right now*, not last turn (15).
- **Stale-state rule:** any apply-time mismatch (05 revalidation) → guarded error, never force-apply; the model is told "state changed, replan".
- **Reset behavior:** Clear-conversation wipes window + bindings (activity log entries remain for undo reference; bindings from cleared chat marked "chat-cleared" — references then fall back to name/selection resolution).
- **Per-document threads:** conversation keyed to doc id; switching docs switches thread (prevents cross-doc id bleed — ids are doc-scoped).
- **Context limits:** window × snapshot constrained by adapter's model context; overflow policy = drop oldest turns first, never snapshot (safety>history); UI shows "purani baatein context se hat gayi" note.
- **Persistent preferences:** provider/model/mode/price table persist (prefs); **no long-term semantic memory** ("user likes purple") in MVP — unbounded PII surface for near-zero animation value; revisit past MVP with explicit opt-in (25).

## Privacy recap (12)

Context leaves the device only to the chosen provider per request; contents = the five components above, nothing else.
