# F-25-01..06 — SCENES (full part)
```
SOURCE BLUEPRINT: Part 25 · DEEP FEATURES: F-25-01..06 · STATUS: AUDITED
DEPENDS ON: F-07 (timeline), F-12 (library)
```
## A. IDENTITY
1. Official name: Scene / Scene panel. 4. Purpose: named self-contained main timelines in one document, sharing the Library. 8. Status: current.
## EVIDENCE
E1 [OFFICIAL] Part 25 blueprint + `selecting-objects.html`: "layers not on the current Timeline" (scene-scoped selection). E2 [OFFICIAL] `symbols.html`: library shared document-wide. E3 [COMMUNITY] "wish I could have multiple scenes open" → [WISH W12] tabs.
## F-25-01 SCENE CONCEPT
Document = ordered scenes + shared Library; playback plays in order.
## F-25-02 SCENE OPS
Create (Scene panel + / Insert > Scene) / Duplicate (deep-copy timeline) / Delete (prompt; assets stay) / Rename (ID-stable) / Reorder (playback order).
## F-25-03 SCENE PROPERTIES
Duration = timeline extent; bg = doc-level (per-scene override P1); fps = doc-level (per-scene P2 + warn).
## F-25-04 PER-SCENE TIMELINE/CAMERA/AUDIO
Each scene: own timeline + own camera + own audio layers; Library shared; optional master audio track above scenes (ours, P1).
## F-25-05 NAVIGATION
Scene panel click / Edit bar breadcrumb / View > Go To (first/prev/next/last); Enter = active scene; Test = all in order.
## F-25-06 SCENE TABS [WISH W12]
Tabs + split view (P2) — view state, not data.
## L. LIMITATIONS
L.1 no multi-scene view in Animate → ours: tabs. L.2 delete scene with shared assets → use-count recompute (not delete).
## M. EDGE CASES
M.1 last scene delete (blocked) · M.2 cross-scene symbol reuse · M.3 camera per scene (F-16-07).
## O/P/Q/R/S/Y
Data: `scenes[]` + `sceneOrder` (Part 33). Events: `scene:changed`. Undo: scene ops = commands. Serialization: persisted. Mobile: scene dropdown/tabs. Implementation: `SceneManager` with active-scene switch (timeline+stage rebind).
## TESTS
TS-01 create · TS-02 duplicate deep-copy · TS-03 delete prompt (assets stay) · TS-04 reorder playback · TS-05 navigate panel/breadcrumb/GoTo · TS-06 shared library use-count · TS-07 per-scene camera · TS-08 tabs + split (ours) · TS-09 last-scene block · TS-10 undo.
## AUDITS
No contradiction. Self-challenge: overlooked = shared-library-across-scenes + last-scene-block + tabs (W12) — covered.
```
FEATURE COMPLETE: F-25-01..06 — Scenes — AUDITED
```
