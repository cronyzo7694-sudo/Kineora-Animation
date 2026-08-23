# 18 — VISION / IMAGE UNDERSTANDING RESEARCH

**Verdict: valuable, explicitly POST-MVP.** Structured snapshots (06) + structured verification (08) carry the entire MVP; pixels add cost, privacy surface, and failure ambiguity without unlocking the core loop.

## What vision would add later

- **Visual verification:** canvas PNG of frame f → model compares against the request ("ball neeche gayi thi frame 15 pe?"). Complements (never replaces) structured checks — structured is deterministic and free.
- **Reference-image understanding:** "make grass like THIS image" — user-attached reference analyzed for palette/composition heuristics feeding parametric creation.
- **Selected-object close-ups:** crop capture when geometry questions exceed snapshot detail.
- **Storyboard/import assist:** rough frames → keyframe placement suggestions.

## Mechanism (researched, not built)

Stage canvas already rasterizes via the shared renderer; capturing = offscreen canvas render of `evaluate(f)` at 1×/2× → downscale (≤1024px long edge, JPEG/PNG) → provider image block alongside the structured snapshot. Cost discipline: images are the single biggest token multiplier — sent **only** on user toggle ("👁 is request me canvas bhi dikhao") or verifier escalation; never by default, never multiple frames until budgeted batch storyboard features.

## Privacy/cost implications (ties to 12/20)

- Frame pixels ARE user artwork → sent to provider only on explicit per-request opt-in; consent dialog extends with vision line when the feature ships.
- Public-deploy proxy should pass through images untouched (no logging).
- Model vision accuracy on precise geometry ("is it exactly at y=820?") is poor — structured verification remains authoritative; vision answers qualitative questions only ("does this look like grass?") and is labeled as such.

## Explicit non-goals

No screen recording streams, no continuous watching, no visual self-correction loops in MVP+. Image **generation** (text-to-image filling library assets) is a separate future consideration (25), out of research scope here.
