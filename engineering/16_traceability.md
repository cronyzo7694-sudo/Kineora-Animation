# 16_TRACEABILITY — MASTER MATRIX

Chain: **Phase-2 feature → UI contract → REQ → module → entity → command → event → test → acceptance gate.** Full row-level matrix is machine-generated from the queue + registries; the table below is the group backbone proving no orphan feature.

## Group backbone
| Phase-2 group (F-xx) | Contract | REQ set | Module(s) | Entity | Command | Event | Test | Gate |
|---|---|---|---|---|---|---|---|---|
| F-01 app map | C-02..05 | REQ-SYS, REQ-DOC | MOD-SHELL/WORKSPACE/BUS/STATE | project/scene/workspace | — | tool:changed, document:changed | C-36/37 | AC-UI |
| F-02 tools | C-13,15,16,23,24,27 | REQ-DRW/XFR/WARP | MOD-DRAWING/XFR/WARP | node/transform/warp | CMD-DRAW/TRANSFORM | document:changed | unit+interaction | AC-* |
| F-03 selection | C-01 | REQ-SEL | MOD-SELECTION/HITTEST | selection(view) | (none — view) | selection:changed, selection:lost | AC-SEL | AC-SEL-001 |
| F-04 transform | C-15 | REQ-XFR | MOD-XFR | transform | CMD-TRANSFORM | document:changed | AC | AC-XFR |
| F-05/06 drawing/shape | C-13/14 | REQ-DRW/SHP | MOD-DRAWING/SHAPE/VECTOR | shape | CMD-DRAW/ERASE/BREAK | document:changed | merge/boolean tests | AC-SHP |
| F-07 timeline | C-08 | REQ-TIM | MOD-TIMELINE/FRAME | timeline/layer/frame | CMD-INSERT-*/DELETE-*/PASTE | timeline:changed | TS-TIM | AC-TIM-001 |
| F-08 keyframes | C-17 | REQ-KF | MOD-KEYFRAME | keyframe | CMD-SET-PROPERTY | timeline:changed | interp unit | AC-KF |
| F-09/10 tween/path | C-18/20 | REQ-TWN | MOD-TWEEN/EASING/PATH | tween/path | CMD-CONVERT-TWEEN/SPLIT | timeline:changed | tween tests | AC-TWN |
| F-11/12 symbols/library | C-21/10 | REQ-SYM/LIB | MOD-SYMBOL/INSTANCE/LIBRARY | symbol/instance/asset | CMD-CREATE/SWAP/BREAK | library:changed | nesting tests | AC-SYM |
| F-13..14 rig/IK | C-23/25 | REQ-RIG/IK | MOD-RIG/BONE/IK/POSE | bone/armature/pose | CMD-ADD-BONE/MOVE-BONE/INSERT-POSE | timeline:changed | AC-RIG-001 | AC-RIG |
| F-15 FBF | C-19 | REQ-FBF | MOD-FBF/ONION | drawing/frame | CMD-INSERT-KEY (+expose) | document:changed | onion tests | AC-FBF |
| F-16 camera | C-27 | REQ-CAM | MOD-CAMERA | camera | CMD-CAMERA | timeline:changed | parallax tests | AC-CAM |
| F-17 audio | C-28 | REQ-AUD | MOD-AUDIO | audio asset/attachment | CMD-IMPORT | (timeline) | AC-AUD-001 | AC-AUD |
| F-18 lip-sync | C-29 | REQ-LIP | MOD-LIPSYNC/VISEME | mouth/lipsync | CMD-LIP-SYNC/CHANGE-MOUTH | document:changed | AC-LIP-001 | AC-LIP |
| F-19 facial | C-26 | REQ-FBF-adj | MOD-FACIAL | parts/expression | CMD-EXPRESSION | document:changed | facial tests | AC-FAC |
| F-20/21 layers/masks | C-22 | REQ-LAY | MOD-LAYER/MASK | layer | CMD-LAYER-OP | layer:changed | mask tests | AC-LAY |
| F-22 text | C-16 | REQ-TXT | MOD-TEXT | text node | CMD-* (text edit) | document:changed | text tests | AC-TXT |
| F-23 color | C-12 | REQ-CLR | MOD-COLOR | fill/stroke style | CMD-COLOR | document:changed | gradient tests | AC-CLR |
| F-24 align | C-12 | REQ-ALN | MOD-XFR(align service) | transform | CMD-ALIGN | document:changed | align tests | AC-ALN |
| F-25 scenes | C-11 | REQ-SCN | MOD-SCENE | scene | CMD-SCENE-OP | scene:changed | scene tests | AC-SCN |
| F-26 properties | C-09 | REQ-PRP | MOD-UI(Properties) | (read schemas) | CMD-* (writes) | selection:changed | AC-UI | AC-PRP |
| F-27 import | C-30 | REQ-IMP | MOD-IMPORT | asset | CMD-IMPORT | library:changed | AC-IMP-001 | AC-IMP |
| F-28 export | C-31 | REQ-EXP | MOD-EXPORT | (output) | (non-mutating) | export:done | AC-EXP-001 | AC-EXP |
| F-29 shortcuts | C-32 | REQ-PLAT | MOD-KBD | shortcut(prefs) | — | shortcuts:changed | conflict tests | AC-KBD |
| F-30 context menus | C-07 | REQ-UI | MOD-OVERLAY | — | CMD-* | — | overlay tests | AC-OVL |
| F-31 mobile | C-33 | REQ-PLAT | MOD-INPUT/TOUCH | — | — | gesture | AC-TOUCH | AC-MOB |
| F-32..34 arch/data/buttons | C-06/07 + § | REQ-SYS | MOD-* (all) | all entities | all commands | all events | AC-UI/SYS | AC-SYS |
| F-35/36 priority/notes | C-37 | REQ-SYS | cross | — | — | — | gate suite | AC-SYS |

## Rules
1. Every F-xx feature resolves to ≥1 module + ≥1 test + ≥1 acceptance gate (queue is machine-checked: 405/405 covered).
2. Every C-xx contract maps to ≥1 REQ set (38/38).
3. Every command/event/entity listed in 03/05 has ≥1 test in 15.
4. No orphan: verified by the audit script in 18.
