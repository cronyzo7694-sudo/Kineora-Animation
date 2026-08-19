# 17_BUILD_ORDER — DEPENDENCY GRAPH & IMPLEMENTATION SEQUENCE

## Dependency graph
```
FOUNDATION:   MOD-BUS → MOD-STATE → MOD-VECTOR → MOD-COLOR → MOD-EASING → MOD-COMMAND
CORE STATE:   MOD-DOC (03 entities) → MOD-PERSIST/AUTOSAVE
DOMAIN:       MOD-SCENEGRAPH → MOD-HITTEST → MOD-SELECTION → MOD-XFR
              MOD-FRAME → MOD-TIMELINE → MOD-KEYFRAME → MOD-TWEEN → MOD-PATH
              MOD-LAYER → MOD-MASK → MOD-SYMBOL → MOD-INSTANCE → MOD-LIBRARY
              MOD-RIG → MOD-BONE → MOD-IK → MOD-POSE → MOD-WARP
              MOD-TEXT → MOD-CAMERA → MOD-SCENE
SERVICES:     MOD-RENDER/CACHE → MOD-AUDIO → MOD-LIPSYNC/VISEME → MOD-IMPORT → MOD-EXPORT → MOD-NOTIFY
UI:           MOD-OVERLAY → MOD-MODAL → MOD-PANEL → MOD-SHELL/WORKSPACE → MOD-KBD → palette
PLATFORM:     MOD-INPUT → MOD-TOUCH → MOD-A11Y → MOD-TEST (cross)
```

## Vertical slice first (validate architecture early)
```
Create Document → draw shape → select → transform → timeline → keyframe → play → save → reload → export
```
Gates: AC-SYS (evaluate determinism, command undo, save round-trip, export overlay-clean).

## Build phases
| Phase | Modules | Goal | Gate |
|---|---|---|---|
| P0 Foundation | BUS, STATE, VECTOR, COLOR, EASING, COMMAND | primitives + undo + events | unit green; command invariants |
| P1 Document | DOC, PERSIST, AUTOSAVE | model + save/recover | AC-PERSIST-* |
| P2 Static editor | SCENEGRAPH, HITTEST, SELECTION, XFR, DRAWING, SHAPE, LAYER, MASK, TEXT, COLOR, RENDER, SHELL, PANEL, OVERLAY, MODAL, INPUT | draw/select/transform/edit UI | AC-SEL/AC-XFR/AC-SHP/AC-UI |
| P3 Animation | FRAME, TIMELINE, KEYFRAME, TWEEN, EASING, PATH, FBF, ONION | timeline+keyframes+tweens | AC-TIM/AC-KF/AC-TWN |
| P4 Reuse | SYMBOL, INSTANCE, LIBRARY, SCENE | symbols/library/scenes | AC-SYM/AC-SCN |
| P5 Characters | RIG, BONE, IK, POSE, WARP, FACIAL | rigging | AC-RIG |
| P6 Media | CAMERA, AUDIO, LIPSYNC, VISEME | camera/audio/lip-sync | AC-CAM/AC-AUD/AC-LIP |
| P7 I/O | IMPORT, EXPORT, NOTIFY | import/export | AC-IMP/AC-EXP |
| P8 Platform | TOUCH, KBD, A11Y, TEST(CI), PLUGIN(P2) | mobile/a11y/hardening | AC-MOB/AC-KBD/AC-UI |

## Blockers & parallelism
- **Blockers**: MOD-DOC blocks all domain; MOD-COMMAND blocks all mutating UI; MOD-RENDER blocks UI panels.
- **Parallelizable**: MOD-COLOR ∥ MOD-EASING ∥ MOD-VECTOR; MOD-AUDIO ∥ MOD-LIPSYNC (after DOC); MOD-IMPORT ∥ MOD-EXPORT (after RENDER); C-36/C-37 suites parallel to all UI.
- **Critical path**: FOUNDATION → DOC → SCENEGRAPH/SELECTION → TIMELINE/TWEEN → SYMBOL/RIG → AUDIO/LIPSYNC → EXPORT.
- **High-risk** (RSK): timeline (001), nesting (002), rig (003), lipsync (004) — build early, test hard.

## Status model
`NOT STARTED → DESIGNING → IMPLEMENTING → TESTING → BLOCKED → READY → COMPLETE → REGRESSION`. COMPLETE only after acceptance gates pass (never by visual appearance).
