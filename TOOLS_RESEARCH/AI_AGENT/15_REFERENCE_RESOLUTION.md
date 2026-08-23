# 15 — REFERENCE RESOLUTION ("the ball" → NodeId)

## Problem

Model output must target **stable editor identifiers** (NodeId/LayerId/SymbolId), but users and models speak in names ("ball", "layer 2", "ye wala"). Resolution from language → ids happens **client-side in the validator (stage 7)** against live state — the model emits *reference expressions*, never raw numeric ids it wasn't given.

## Reference expression forms (from → resolved by)

| User/model phrase | Mechanism |
|---|---|
| Plan-local: `{"ref":"a1"}` / `{"lastCreated":"a2"}` | runner's per-plan result map (04) — strongest form, preferred for AI-created things |
| "selected / ye / is object ko" | live selection snapshot (one node) — if 0 or >1, ask |
| "the ball", "red circle" | name match: node/symbol/layer **names** (AI is encouraged to name its creations: `shape.create(name:"ball")` — name is stored where the model supports it: layer/symbol names exist in engine; **nodes have no name field today** → AI-created nodes tracked via the activity log's entity bindings (21); unnamed-doc reality below) |
| "layer 2" / "first layer" | ordinal over the snapshot's bottom→top order (snapshot shows both index and name) |
| "current frame" | live playhead from Tier-0 |
| "last keyframe" | max keyframe of the resolved layer from snapshot |
| "jo abhi banaya" (the thing I just created) | activity-log entity binding: last `shape.create` result id (21) — survives turns within the session |
| bare numeric id echoed from snapshot alias map | validated to exist; ids not present in any snapshot/alias ⇒ rejected (anti-injection) |

## Rules

1. **Resolution is deterministic code, not a model guess.** Model picks the *form*; validator computes the *ids*.
2. Ambiguity (two nodes match "red circle") → fail stage 7 with candidate list → orchestrator asks the user (chat quick-pick chips) — never coin-flip.
3. Resolved ids are re-existence-checked at apply time (05 apply-time revalidation); deleted-mid-plan ⇒ guarded error (16).
4. Snapshot aliases (`n1`,`l3`) prevent the model from memorizing/fabricating large id spaces and shrink tokens (06).
5. **Naming strategy (MVP):** layers and symbols get names (engine supports); nodes don't (engine gap — a future `name` field on Node is listed as E-AI-7 candidate, not assumed). Until then, AI-created-node binding rides the activity log + plan refs; user-created anonymous nodes are addressable via selection, position ("jo 100,100 ke paas hai" — nearest-match within declared radius, disclosed), or type+color uniqueness.

## Edge cases

Multiple scenes: all refs are active-scene scoped (MVP acts only on the active scene — cross-scene ops excluded). Symbol instance vs definition: "edit the symbol" vs "this instance" distinguished by snapshot kinds (T2 expands symbol timelines on request). Empty scene: creation requests unaffected; referencing requests get an honest "scene khaali hai".
