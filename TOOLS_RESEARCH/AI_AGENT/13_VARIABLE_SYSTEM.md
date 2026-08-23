# 13 — VARIABLE SYSTEM RESEARCH

## What the user asked for (verbatim intent)

"variable and value add ho sake" — configurable named values that (a) the user can tweak without re-prompting, (b) prompts can reference (`$speed`), and (c) generated animations can expose as adjustable parameters.

## Four concepts kept deliberately distinct (spec warning honored)

| Concept | Definition | Scope/Persistence | MVP? |
|---|---|---|---|
| **Prompt variables** (`$color`, `$size`) | user-defined name→value store; composer `$`-autocomplete; substituted **client-side before validation** (05 stage 6) | session store; per-browser "remember" opt-in (prefs pattern) | ✅ |
| **Animation parameters** | after AI generates (e.g. bounce), it may *expose* tunables: `bounceHeight=320px`, `duration=30f`; rendered as sliders/inputs on the result card; editing one re-runs a bounded adjust-plan (reuses transaction machinery) | derived from the last plan's declared `exposed[]` list; session-only | ✅ (lite: re-run adjust plan on change) |
| **Project variables** | named values stored **inside the .kineora doc** (reusable across sessions) | needs a document schema slot — engine has none today; meta field ownership is FIXED | ❌ post-MVP (requires decision + schema addition) |
| **Reusable templates/presets** ("bounce", "float") | named mini-plans with parameters | library feature | ❌ future (25) |

## Types, units, defaults

Types: `number` (with declared unit: `px | frames | seconds | percent | degrees`), `color` (#rrggbb), `string` (names/labels, length-capped), `bool`. Defaults: every declared variable needs a default; prompts using an undeclared `$var` fail at stage 6 with a friendly inline "define karo" affordance (adds it in one click). Units: seconds ↔ frames use live `settings.fps`; percent resolves against stage dimension or source value by declared basis; no implicit guessing.

## Binding rules

- Substitution is textual at composer level AND semantic at plan level (model may emit `$bounceHeight` inside a param only if the manifest tells it the variable exists and its type matches the param schema; resolved values re-pass range checks, 05).
- Model cannot create variables; only users (store) or approved animation-parameter exposure (from its own `exposed[]` proposal, user-visible).
- Name rules: `[a-z][a-zA-Z0-9_]{0,31}`, case-sensitive; `$` reserved prefix; collisions with layer/node names are fine (different namespaces).

## UI

Variables drawer (chat settings tab or `⌘/`): table name→type→value→(unit)→default with inline editors — number (slider+input), color (swatch popover, reuses ToolColors picker pattern), string (input), bool (toggle). Used-by indicator (which open composer/last plan references it). Delete = safe (refs just fail with define-prompt next use). Session-vs-remembered indicator per row.

## Non-goals (MVP)

No expression language (`$x*2+1`), no cascading/computed vars, no per-variable permissions, no project-file persistence (needs schema decision), no sharing/import. These keep substitution dumb and injection-proof.
