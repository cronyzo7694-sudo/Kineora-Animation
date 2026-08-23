# 01 — PRODUCT VISION

`[NEW FEATURE — NOT IN BLUEPRINT]` (Adobe Animate has no equivalent assistant; this is Kineora-original, tracked under decision D-0010.)

## The one-sentence product

A chat panel inside Kineora where the user types **"ek red ball banao jo 30 frames mein bounce kare"** — and the AI, using **the user's own API key (BYOK)**, inspects the scene, plans, and executes a validated sequence of the **same editor commands a human's tools would run**: create layer → draw oval → set fill → keyframes at 1/15/30 → classic tween with ease-out → snapshot → verify → report.

## The loop (target experience)

```
USER natural-language request
  → AI understands intent (14)
  → AI inspects current scene via READ-ONLY snapshot (06)
  → AI produces a structured ACTION PLAN (04)
  → Kineora VALIDATES every action (05) against capability (07) + document state + guards
  → User approves (PREVIEW) or safe actions auto-apply within permissions (10)
  → Actions execute as ONE composite command through the EXISTING Command layer (09)
  → Document changes; UI updates through existing bus events
  → AI receives fresh snapshot (06) and VERIFIES (08)
  → AI reports honestly: what it did, what failed, how to undo (21)
```

## Non-negotiable principles

1. **AI is another controlled user, not a parallel engine.** Human UI and AI converge on the same conceptual command layer (`command.rs`). The AI has **no** direct document mutation path — only validated actions that compile into real `Command` objects.
2. **Never trust raw model output.** Parse → validate structure, name, params, target, document state, permissions, capability → preview → execute → verify (05).
3. **Honesty over capability.** If the engine can't do it (Pen, Brush, per-node opacity today), the agent **says so** and offers the nearest alternative (07).
4. **Human stays in control.** Modes ASK / PREVIEW / APPLY (+ AUTO later); destructive actions always need explicit confirmation (10, 12).
5. **One request = one logical undo.** An AI transaction is one undoable unit, rollback-capable on partial failure (09).
6. **Bounded agency.** Step budgets, action budgets, timeouts, cancellation; the agent can never loop forever (12 §Agent-loop safety).
7. **Local-first.** Snapshot building, validation, execution, undo, variables — all local. Only the minimal prompt context leaves the device (12, 20).
8. **BYOK.** Any provider with an API key: OpenAI, Anthropic, Gemini, OpenAI-compatible endpoints. No key ever ships in the repo or bundle (11, 12, 17).

## What this is NOT

- Not a code-generation copilot. Not scripting. Actions are a closed vocabulary (04).
- Not an autonomous animator that owns the document. It assists inside user-granted permissions.
- Not 3D, not video generation, not asset theft pipelines.
- Not a chatbot bolted on: the chat UI is an **animation command center** — plans, previews, progress, verification, activity log are first-class UI (10, 21).

## Success criteria (MVP acceptance)

Given a fresh document (1920×1080 @ 24fps), the user types the red-ball sentence; within one approved transaction the agent produces: new layer `ball`, oval at stage center, keyframes 1/15/30 with y 100→820→100, classic tween ease-out, playhead sweep looks like a bounce, and `Ctrl+Z` removes the whole thing in one step. The activity log shows each action with before→after values. AI reports: "Ball layer banaya, 30-frame bounce lagaya — verify pass."
