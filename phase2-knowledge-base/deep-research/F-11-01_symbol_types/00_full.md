# F-11-01 — SYMBOL CONCEPT & TYPES
```
SOURCE BLUEPRINT: Part 11 §11.0–11.1 · DEEP FEATURE: F-11-01 · STATUS: AUDITED
DEPENDS ON: (foundation) · FEEDS: F-11-02..14, Parts 13/18
```
## A. IDENTITY
1. Official name: Symbol (definition) vs instance. 4. Purpose: a reusable, self-contained timeline stored once in the Library; instances are placed references. 8. Status: current.

## EVIDENCE
E1 [OFFICIAL] `symbols.html`: "A symbol is a graphic, button, or movie clip that you create once… reuse throughout your document or in other documents… automatically becomes part of the library." E2 [OFFICIAL] `symbol-instances.html`: "Each symbol instance has its own properties that are separate from the symbol." E3 [OFFICIAL] `symbols.html`: editing a symbol updates **all instances**. E4 [OFFICIAL] `symbols.html`: three (four) types: **graphic, button, movie clip** (+ font symbol).

## F. TYPE TABLE
| Type | Playback | Timeline | Sound/interactivity | Use |
|---|---|---|---|---|
| Graphic | **driven by parent timeline** (loop/once/single-frame) | has frames | not supported inside | static + parent-synced anim (mouth sets) |
| Movie clip | **independent clock** (loops on its own) | own timeline | supported | walk cycles, looping effects |
| Button | state-driven (Up/Over/Down/Hit) | 4-frame timeline | supported | interactive UI |
| Font | embeds a font | n/a | n/a | font sharing (niche) |

## E. STATES
Definition (Library) vs instance (stage); editing definition = all instances update (E3); editing instance (transform/tint) = only that instance (E2).

## L. LIMITATIONS
L.1 Graphic-vs-movie-clip sync confusion (nested anim "not visible" on main timeline) → ours: live "play nested clips" preview (carried). L.2 Font symbols niche → ours: font embedding as asset setting (Part 22), no separate symbol type.

## M. EDGE CASES
M.1 symbol containing a symbol (nesting) · M.2 empty symbol (created blank) · M.3 instance of a deleted symbol (broken ref) · M.4 graphic inside movie clip inside button.

## O/P/Q/R/S/Y
Data: Library entry `{type:'symbol', symbolType, timeline}` + instance `{type:'symbolInstance', symbolId}` (Part 33). Events: `library:changed`, `document:changed`. Undo: create/edit/delete = commands. Serialization: symbol+instances persisted; instance edit = only instance. Mobile: Library grid + tap-place. Implementation: SymbolEngine (Part 32.11) — one definition, N instance refs (by ID).

## TESTS
TS-01 create symbol → library entry · TS-02 place 2 instances → same definition · TS-03 edit definition → both update (E3) · TS-04 edit instance transform → other unchanged (E2) · TS-05 graphic driven by parent · TS-06 movie clip independent · TS-07 button 4 states · TS-08 nesting · TS-09 broken ref warn · TS-10 undo create · TS-11 reload · TS-12 mobile place.
## AUDITS
No contradiction. Self-challenge: overlooked = definition-vs-instance edit propagation (E2/E3) + graphic-vs-clip sync — covered.
```
FEATURE COMPLETE: F-11-01 — Symbol concept & types — AUDITED
```
