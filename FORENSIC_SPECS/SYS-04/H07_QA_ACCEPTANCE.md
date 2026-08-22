# SYS-04 H07 — QA + MANUAL ACCEPTANCE

## 0. Document Status

SPECIFICATION STATUS: **READY FOR IMPLEMENTATION** (criteria defined; AMB-dependent cases BLOCKED)  
IMPLEMENTATION STATUS: **NOT MANUALLY ACCEPTED**

Automated green ≠ acceptance (FL-0019). Native desktop (user Linux Mint) is
authoritative for interaction.

---

## 1. Automated matrix (must exist before anyone says “tested”)

Happy + failure + empty + disabled + boundary + rapid + multi-doc + keyboard
+ a11y + persistence + reload + destructive-N/A + error-recovery.

| testId | Class | AMB? |
|---|---|---|
| T-zoom-in / T-zoom-out | happy | **BLOCKED** numeric assert on AMB-S04-002 |
| T-zoom-100 / T-zoom-fit | happy | no |
| T-zoom-no-dirty / T-zoom-no-undo | invariant | no |
| T-zoom-reload | persist | no |
| T-zoom-wheel-same-id | command-path | no |
| T-zoom-not-camera | ownership | no |
| T-zoom-fit-no-host | failure | no |
| T-prev-full/fast/aa/outline | happy | no |
| T-prev-outline-export | INV-VIEW-4 | no |
| T-prev-vs-layer-outline | INV-VIEW-6 | no |
| T-prev-no-dirty | invariant | no |
| T-workarea / T-workarea-export | happy | no |
| T-pasteboard-color | happy | **BLOCKED** AMB-S04-005 |
| T-hide-edges / T-hide-edges-props | happy | no |
| T-shape-hints | happy | no |
| T-rulers / T-grid | happy | grid size **BLOCKED** AMB-S04-001 |
| T-guides-vis / T-guides-lock / T-guide-need-rulers | happy | persist **BLOCKED** AMB-S04-003 |
| T-guides-not-in-doc | persist | no (assert absence in JSON) |
| T-guides-not-layer-type | ownership | no |
| T-rulers-units | handoff | no |
| T-snap-objects/grid/guides/pixels/align/none | happy | distance **BLOCKED** AMB-S04-004 |
| T-snap-no-dirty / T-snap-status / T-snap-shared / T-snap-not-export | invariant | engine required |
| T-view-prefs-not-in-project | INV-PERS-3 | no |
| T-ctx-rulers-grid-guides-same-id | §30 | no |

---

## 2. Manual desktop matrix (report `1-P 2-F …`)

Do **not** mark COMPLETE without this, even if automated is green.

| # | Action | Expect |
|---|---|---|
| 1 | Ctrl+= / Ctrl+- / Ctrl+1 / Ctrl+0 | viewport scales; content coords unchanged; Ctrl+Z does nothing |
| 2 | Wheel over stage | same zoom as menu (same command) |
| 3 | Save → Reload after zoom | document same; zoom reset (not in file) |
| 4 | View ▸ Outline Preview then File ▸ Export Image | export still Full/filled |
| 5 | View ▸ Hide Edges with a selection | highlight gone; Properties still bound |
| 6 | View ▸ Work Area | gray surround toggles; export unchanged |
| 7 | Ctrl+Shift+Alt+R / Ctrl+' | rulers / grid toggle; **Ctrl+R must Import**, not rulers |
| 8 | Drag from ruler | creates a cyan/magenta guide; not in saved JSON |
| 9 | Snap (once engine exists) | move/draw snap; `st.snap` updates; no dirty |
| 10 | View ▸ Go To ▸ First | playhead moves (SYS-09); not a view-transform change |
| 11 | Two docs: zoom A, switch to B | no crash; viewport isolation per H00 §9.1 legal either way — **record which** |
| 12 | Dirty doc: toggle any View item | ● stays; Close still asks |

AMB-blocked rows (2 numeric zoom, 8 persist, 9 snap, pasteboard color) are
**skipped** until the AMB is decided — do not fail the human for skipping them.

---

## 3. Acceptance rule

A SYS-04 item is accepted only when: SPEC READY (or the item is not AMB-blocked)
∧ IMPL ∧ automated ∧ **this manual matrix P** ∧ export ignores view flags.

---

*H07 done. Next: H08.*
