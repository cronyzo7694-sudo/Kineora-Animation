# 05 — ACTION VALIDATION RESEARCH

**Rule zero: raw model output is untrusted input** — same class as a pasted file. It is parsed defensively and passed through a fixed pipeline. Any stage failure aborts the plan (not just the action) and produces a structured error (16).

## The 12-stage pipeline

```
LLM text
 1. PARSE            JSON.parse w/ size cap (≤256KB); reject parse errors (→1 auto-repair retry, 16)
 2. SHAPE            top-level {plan[], expected[], report} shape check; unknown keys ignored, missing keys fail
 3. ACTION NAME      must be in MVP vocabulary (04) — unknown/renamed actions fail closed
 4. PARAM STRUCTURE  per-action schema: types, required, enums, no extra params (closed schemas)
 5. PARAM VALUES     bounds & formats — color ^#[0-9a-fA-F]{6}$; w/h 0.01..100000; frame ≥1 int
                     ≤200000; ease −100..+100; fps 1..240; names ≤120 chars (no control chars);
                     counts ≤ caps (selection.size ≤ 1000)
 6. VARIABLE RESOLVE $vars substituted (13) → re-run stage 5 on resolved values
 7. REFERENCE RESOLVE refs/lastCreated/names → concrete ids against LIVE doc (15);
                     model-supplied numeric ids must exist — invented ids fail here
 8. DOCUMENT STATE   per-action predicates vs live doc (target layer exists & not folder;
                     tween endpoints are keyframes; frame in range; symbol use-count rules;
                     nodes live on the asserted layer/frame)
 9. PERMISSIONS      guards: locked/hidden (incl. ancestors) targets reject edit actions;
                     tier-B actions require the current mode to allow/confirm (10)
10. CAPABILITY       action status in manifest (07) must be supported; partial → only the
                     supported parameter subset allowed (e.g. named easings rejected today)
11. POLICY/BUDGET    plan length ≤64; total plan mutations ≤256 objects; rate: ≤1 in-flight
                     plan; destructive-mass heuristic (delete >20 nodes or >50% of doc
                     content) forces explicit confirmation even in APPLY mode
12. DRY-RUN COMPILE  each action compiles to its Command via facade op-args WITHOUT
                     executing (pure arg check) → produces preview rows for UI + the
                     verifier's expected-effects list
```
Then: PREVIEW/APPLY per mode (10) → execute (09) → verify (08).

## Validation is re-run at apply time

Planning can take seconds; the user may edit meanwhile. Stage 8/9 predicates are evaluated **again** immediately before execution against live state, never against a cached snapshot. Snapshot = advisory; document = authority.

## Design decisions

- **Fail closed.** Any doubt (unknown action, out-of-range, ambiguous ref, missing capability) = whole plan rejected with a fix-hint; the orchestrator may feed the error back to the model once (self-correction loop, max 1) then surfaces to user (16).
- **Closed schemas.** Extra/unknown parameters are rejected rather than coerced — silent coercion is how "w=60" becomes "h=600" bugs.
- **No expression language.** Params are literals or `$vars` resolved client-side. No arithmetic evaluation of model text, ever (kills whole injection classes).
- **Normalization at one place.** Colors lowercased, hex-expanded; degrees kept CW/Y-down (engine convention); seconds→frames converted at one documented point (fps from live settings — 14).
- **Preview = stage-12 output**, not a re-derivation: what the user approves is exactly what runs.
- **Determinism.** Validation is pure TS, fully unit-testable with fixture docs (27 §tests); fuzz targets: malformed plans, hostile ids, unicode names, boundary numbers.

## Failure taxonomy handoff

Each stage emits `{stage, code, message, offendingActionId?, hint?}` — codes stable (`E_PARSE`, `E_SCHEMA`, `E_RANGE`, `E_REF`, `E_STATE`, `E_GUARD`, `E_TIER`, `E_CAPABILITY`, `E_BUDGET`, `E_COMPILE`) so the UI can localize and the feedback-to-model repair loop can cite exact problems (16).
