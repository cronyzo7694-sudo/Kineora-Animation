# 14 — NATURAL LANGUAGE → ANIMATION INTENT

## Intent taxonomy (mapped to real capability — 04/07)

| Intent class | Example (user phrasing, Hinglish/English) | Vocab realization |
|---|---|---|
| create-shape | "ek red ball banao" | layer.create? + shape.create |
| create-content-named | "ghaas bana do" | parametric approximation: multiple ovals/thin rects, or symbol duplication; model must state the approximation in `expected`/`report` (honesty rule) |
| style-change | "iska color blue kar do" | node.setStyle on resolved selection (15) |
| transform | "100px right move karo", "isko aadha chhota" | node.transform (absolute/relative→resolved client-side) |
| animate | "30 frames me bounce kare" | keyframes + tween.classic (`ease` semantics explained below) |
| timeline-ops | "is frame ko duplicate karo", "ulat do in frames ko" | frames.* / keyframe.* set |
| organize | "naya layer / folder me daalo / rename" | layer.* |
| symbols | "isko symbol banao" | symbol.convert |
| doc-settings | "animation 5 seconds ka karo" → duration intent | frames.insert/remove spans +/or doc.setSettings(fps) — **length changes confirmed (tier B)** |
| duplicate | "3 copies banao" | node.duplicate ×n (≤ caps) with offset |
| inspect | "scene me kya kya hai?" | scene.inspect (ASK-style answer, no plan) |
| unsupported | "pen se sketch karo" / "fade out karo" | capability refusal + alternative (07) — fade = opacity unsupported today |

## Interpretation rules (bindings for the model)

1. **Time math:** seconds→frames at live fps ("2 seconds @24fps = frames 1..49"); "30 frames" = literal frames; milliseconds never accepted (say so).
2. **Defaults (all disclosed in the plan card):** position default = stage center; size default = 10% of stage min-dimension unless implied; no color ⇒ ask if material to the request ("red ball" gives red), else current tool fill; tween default ease = 0 (linear), "bounce"-like asks ease-out positive (ease semantics: positive=ease-out per engine `ease_classic`); "slowly" = ≥2× baseline durations; "jump/bounce" vertical unless told otherwise.
3. **Relative vs absolute:** "move 100px right" = relative (dx resolution client-side from live geometry); "center karo" = absolute; ambiguous magnitude ("thoda upar") → default 5% stage height and disclosed.
4. **Selection references:** "this/ye/selected" resolve via selection snapshot (15); no selection ⇒ ask, never guess a random node.
5. **Multi-clause requests** ("banao, bounce karo, phir fade") plan sequentially; any clause unsupported → whole plan returns with that clause flagged + user choice (drop clause / cancel), never silent-drop (08).
6. **Ambiguity policy:** ask a clarifying question **only when the ambiguity changes the outcome materially** (which object, which color, how long). Otherwise apply defaults + disclose in plan card. Clarifications are free-text answers folded into the same conversation turn (19).

## Failure behaviors (per 16)

Unparseable intent → ASK-style restatement ("kya aap chahte ho ki main…?"); conflicting params ("static banner, jumping logo" on same node) → surface conflict and defer to user.

## Prompt-shape implications (19/26)

System prompt carries: intent taxonomy, defaults table, honesty rules, capability manifest, and *"when unsure, ask; never invent ids or capabilities"*. Few-shot examples: the red-ball plan, a selection-relative color change, a refusal-with-alternative. (Production prompt text is written during engineering, per spec.)
