# TIMELINE + LAYERS — UNIFIED FORENSIC RESEARCH PACK

```
PHASE:     RESEARCH ONLY (no product code)
DATE:      2026-08-23
HEAD:      29789e5 (origin/main after SYS-13 rect increment)
AUTHORITY: Blueprint > Phase 2/2.5/3 > Engineering > Decisions > Forensic > Adobe > Code
STATUS:    PACK COMPLETE for first 2D code wave (unify + guards + onion P1 specified)
CONTINUE:  optional only (camera-on-timeline / Properties / EMF if AMB-TL-020 answered)
```

## Why this folder exists

Kineora already has **two separate UIs** for one Adobe surface:

| Surface today | File | Where |
|---|---|---|
| Layers list | `LayersPanel.tsx` | left dock |
| Timeline grid | `TimelineStrip.tsx` | bottom strip (tiny name column + frames) |

Adobe Animate (and **Kineora Blueprint Part 07 §7.1.1**) treat the **layer row as the LEFT COLUMN of the timeline**. The human order for 2D animation is: **make them one panel**, like Adobe.

This pack is the implementation contract so a later coding turn does **not** invent layout, events, or layer types.

## How to read (coding agents)

1. `01_GOAL_AND_SCOPE.md` — what “enough for 2D animation” means; what is OUT.
2. `02_ADOBE_TIMELINE_TRANSLATION.md` — official Adobe “How to use the timeline” page, **item by item**, tagged Required / Later / Do-not-invent.
3. `03_CURRENT_KINEORA.md` — what the code actually does (file:line evidence).
4. `04_UNIFIED_PANEL.md` — target one-panel layout + row identity + scroll sync.
5. `05_CONTROL_MATRIX.md` — every control: click / data / undo / owner.
6. `06_GAPS_BUGS_AMBS.md` — bugs already found; open product decisions.
7. `07_CODING_PACKET.md` — exact files/functions/tests when coding starts.
8. `08_ONION_SKIN.md` — ghosts: view-only overlay, never export; P1 after unify.
9. `09_EDIT_MULTIPLE_FRAMES.md` — **blocked** on AMB-TL-020 (write rules missing).
10. `10_EXPOSURE_AND_ADOBE_SPEED.md` — hold/F5 already shipped; AMB-TL-005 **closed**.
11. `11_WISH_W1_CEL_AND_REMAINING.md` — cel reuse OUT of first ship; full AMB list.
12. `12_AUDIT.md` — pre-code re-read vs `animator/`; ship rules U-G7/U-G8 so unify is actually usable.

Existing research this pack **does not replace** (read, do not rewrite):

- `PROJECT_COORDINATION/LAYER_SYSTEM_FORENSIC_RESEARCH.md` (folders, B-1…B-7)
- `animate-blueprint/07_timeline.md` · `20_layers.md`
- Phase-2 `F-07-*` · `F-20-*` · `F-15-*`
- `phase2.5-ui/contracts/C-08_timeline.md` · `C-22_layers_masks.md`  
  ⚠ C-08/C-22 say “UI COMPLETE”. That is **paper**, same class as C-13 tools. Code is evidence.

## Authority reminder

- **[BLUEPRINT]** wins over Adobe.
- **[ADOBE]** is reference (user pasted the official help page, last updated 9 June 2026).
- **[CODE]** is evidence, not a requirement.
- **[INFERENCE]** is never silently promoted.
- **[AMB-TL-…]** = stop, do not guess.

## This turn vs next

**Done:** 00–11. Onion/EMF/speed researched. First code wave = Increment 0 guards + Increment 1 unify + later Increment 2 onion P1. EMF/W1/camera not in that wave.

No `animator/` edits in this research phase.
