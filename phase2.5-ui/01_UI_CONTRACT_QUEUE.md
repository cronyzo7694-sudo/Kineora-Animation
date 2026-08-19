# 01_UI_CONTRACT_QUEUE — PHASE 2.5
### Major-feature UI contracts, grouped from the Phase-2 feature queue (405 features). Each contract = one file in `contracts/`. Statuses: UNSTARTED → IN PROGRESS → UI COMPLETE | UI GAPS REMAIN.

## Status legend
`UNSTARTED` · `IN PROGRESS` · `UI COMPLETE` · `UI GAPS REMAIN`

## Contract groups (maps Phase-2 feature IDs → contract)

### A. SHELL & NAVIGATION
| ID | Contract | Phase-2 features | Status |
|---|---|---|---|
| C-01 | Selection system UI | F-03-01..19, F-02-01/02/07 | **UI COMPLETE** |
| C-02 | Application shell & workspace | F-01-01/02/03/13/15/16/29 | **UI COMPLETE** |
| C-03 | Menus (File/Edit/View/Insert/Modify/Text/Control) | F-01-04..12 | **UI COMPLETE** |
| C-04 | Command palette & search | §25 + F-01-10/13 | **UI COMPLETE** |
| C-05 | Status bar & state visibility | §19 + F-01-29 | **UI COMPLETE** |

### B. PANELS & LAYOUT
| ID | Contract | Phase-2 features | Status |
|---|---|---|---|
| C-06 | Panel system + docking + resizing | §10/11/12 + F-01-02 | **UI COMPLETE** |
| C-07 | Overlay + modal + z-index system | §7/8/9 + F-30 (context menus) | **UI COMPLETE** |
| C-08 | Timeline panel UI | F-07-01..16, F-03-08/09 | **UI COMPLETE** |
| C-09 | Properties panel UI | F-26-01..12 | **UI COMPLETE** |
| C-10 | Library panel UI | F-12-01..13 | **UI COMPLETE** |
| C-11 | Scene panel UI | F-25-01..06 | **UI COMPLETE** |
| C-12 | Color/Swatches/Align/Transform/Info panels UI | F-23-01..08, F-24-01..06, F-04-10 | **UI COMPLETE** |

### C. EDITING TOOLS
| ID | Contract | Phase-2 features | Status |
|---|---|---|---|
| C-13 | Drawing tools UI (pen/pencil/brush/paintbrush/shapes/eraser/width/eyedropper/bucket/ink) | F-02-08..24, F-05-01..10 | **UI COMPLETE** |
| C-14 | Shape system UI (merge/object/booleans/break-apart) | F-06-01..12 | **UI COMPLETE** |
| C-15 | Transform system UI (free/distort/envelope/numeric/pivot) | F-04-01..14, F-02-03/04 | **UI COMPLETE** |
| C-16 | Text tool UI | F-22-01..08, F-02-09 | **UI COMPLETE** |

### D. ANIMATION
| ID | Contract | Phase-2 features | Status |
|---|---|---|---|
| C-17 | Keyframe editing UI | F-08-01..13 | **UI COMPLETE** |
| C-18 | Tweening UI (motion/classic/shape + easing + graph editor) | F-09-01..08, F-10-01..06 | **UI COMPLETE** |
| C-19 | Frame-by-frame + onion skin UI | F-15-01..06 | **UI COMPLETE** |
| C-20 | Motion path UI | F-10-01..06 | **UI COMPLETE** |

### E. CONTENT & REUSE
| ID | Contract | Phase-2 features | Status |
|---|---|---|---|
| C-21 | Symbol system UI (types/convert/edit-modes/swap/break) | F-11-01..14 | **UI COMPLETE** |
| C-22 | Layers + masks UI | F-20-01..07, F-21-01..06 | **UI COMPLETE** |

### F. CHARACTER & RIGGING
| ID | Contract | Phase-2 features | Status |
|---|---|---|---|
| C-23 | Bone/IK rigging UI | F-14-01..09, F-02-29/30 | **UI COMPLETE** |
| C-24 | Asset Warp UI | F-02-32 | **UI COMPLETE** |
| C-25 | Character pipeline + pose library UI | F-13-01..12 | **UI COMPLETE** |
| C-26 | Facial animation UI | F-19-01..07 | **UI COMPLETE** |
| C-27 | Camera UI | F-16-01..07, F-02-31 | **UI COMPLETE** |

### G. AUDIO & LIP SYNC
| ID | Contract | Phase-2 features | Status |
|---|---|---|---|
| C-28 | Audio UI | F-17-01..09 | **UI COMPLETE** |
| C-29 | Lip sync UI | F-18-01..07 | **UI COMPLETE** |

### H. I/O
| ID | Contract | Phase-2 features | Status |
|---|---|---|---|
| C-30 | Import UI | F-27-01..08 | **UI COMPLETE** |
| C-31 | Export/Publish UI | F-28-01..11 | **UI COMPLETE** |

### I. INPUT & PLATFORM
| ID | Contract | Phase-2 features | Status |
|---|---|---|---|
| C-32 | Shortcuts + conflict manager UI | F-29-01..12 | **UI COMPLETE** |
| C-33 | Mobile/touch interaction system UI | F-31-01..10 | **UI COMPLETE** |
| C-34 | Pointer capture + scroll + feedback/error systems | §20/21/22/23 | **UI COMPLETE** |
| C-35 | Accessibility system | §26 + all controls | **UI COMPLETE** |

### J. GLOBAL GATES
| ID | Contract | Phase-2 features | Status |
|---|---|---|---|
| C-36 | Responsive + no-overlap test suite | §13/28 | **UI COMPLETE** |
| C-37 | UI state matrix + interaction test suite | §29/30 | **UI COMPLETE** |
| C-38 | Product navigation (breadcrumb/back/close/recover) | §31 + F-01-01 | **UI COMPLETE** |

## Review order (dependency-aware)
C-01 (Selection, the exemplar) → C-02/C-05/C-06/C-07 (shell/panels/overlays) → C-08/C-09/C-10/C-12 (main panels) → C-13..C-16 (tools) → C-17..C-20 (animation) → C-21/C-22 (content) → C-23..C-27 (character) → C-28/C-29 (audio/lipsync) → C-30/C-31 (I/O) → C-32..C-35 (input/platform) → C-36/C-37/C-38 (global gates).

## Progress
- 38 / 38 contracts `UI COMPLETE`.
