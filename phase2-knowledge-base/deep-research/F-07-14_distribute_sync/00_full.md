# F-07-14 — DISTRIBUTE TO LAYERS / KEYFRAMES · SYNCHRONIZE SYMBOLS
```
SOURCE BLUEPRINT: Part 07 §7.4.13–7.4.14 · DEEP FEATURE: F-07-14 · STATUS: AUDITED
DEPENDS ON: F-07-01 · FEEDS: Part 13 (character pipeline step 2)
```
## A. IDENTITY
1. Official names: Distribute To Layers; **Distribute To Keyframes** (new); Synchronize Symbols (legacy). 4. Purpose: split a multi-object selection into one-object-per-layer (or per-keyframe) — the rigging bootstrap. 8. Status: current (Distribute to Keyframes = newer).

## EVIDENCE
E1 [OFFICIAL] `animation-basics.html`: **Distribute To Layers** (Modify > Timeline) moves each selected object to a **new separate layer**; unselected objects stay; works on graphic objects, instances, bitmaps, video, **broken-apart text blocks**. E2 [OFFICIAL] same: new layers inserted **below selected layers**, arranged top→bottom in **creation order**; broken-apart text → layers named per character (F,L,A,S,H with F on top). E3 [OFFICIAL] same: **Distribute To Keyframes** (new) puts each object on a **separate keyframe** (sequence per selection order); unselected stay; new keys start after the last original frame. E4 [OFFICIAL] `time.html`/Part 11: **Synchronize Symbols** (legacy) aligns graphic-instance timelines to main timeline. E5 [OFFICIAL] `animation-basics.html`: motion tween auto-moves an object to its own tween layer.

## D. SEMANTICS
| Op | Result |
|---|---|
| Distribute To Layers | each object → own layer (creation order, top→bottom) (E1/E2) |
| Distribute To Keyframes | each object → own keyframe (selection order) (E3) |
| Synchronize Symbols | nested graphic loops align to main timeline (E4) |

## E. STATES
Selection-driven (objects on one or several layers); text must be broken apart for per-character distribution (E2). Non-contiguous layer selection allowed (E1).

## L. LIMITATIONS
L.1 Layer naming = creation order (not user names) → ours: name from object + side, or let user prefix. L.2 Broken-apart text needed for char distribution → ours: auto-break prompt. L.3 Synchronize Symbols legacy/AS3-scoped → ours: "sync nested graphic loops" command (P2).

## M. EDGE CASES
M.1 single object distribute = one layer · M.2 distribute while playing · M.3 distribute objects from multiple non-contiguous layers · M.4 distribute-to-keyframes after last frame · M.5 undo distribute.

## O/P/Q/R/S/Y
Data: layer creation + content reparent; or keyframe creation per object. Events: `timeline:changed`. Undo: one command. Serialization: persisted. Mobile: long-press selection → Distribute. Implementation: `distributeToLayers(objects)` / `distributeToKeyframes(objects)` — iterate in creation/selection order, create layers/keys, move node refs.

## TESTS
TS-01 each object → own layer (E1) · TS-02 creation order top→bottom (E2) · TS-03 broken text → char layers (E2) · TS-04 to-keyframes selection order (E3) · TS-05 unselected preserved · TS-06 new layers below selected · TS-07 undo · TS-08 single-object no-op-ish · TS-09 sync symbols (E4) · TS-10 mobile.
## AUDITS
No contradiction. Self-challenge: overlooked = creation-order naming (E2) + text break-apart prerequisite + to-keyframes (new, E3) — covered.
```
FEATURE COMPLETE: F-07-14 — Distribute to layers/keyframes — AUDITED
```
