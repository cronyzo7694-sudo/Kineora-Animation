# §13–§14: DATA / ENGINE SYSTEM INVENTORY · UI→ENGINE CONNECTION MAP

---

## 13. DATA / ENGINE SYSTEM INVENTORY  [03_document_model.md · 02_module_architecture.md · 04_state_machines.md · 01_requirements.md]

### 13.1 Data entities (ENT-*) — 20+ [03_document_model.md · Part 33]

| Entity | Key fields |
|---|---|
| **ENT-project/document** | id · formatVersion · meta{title,author,createdAt,modifiedAt} · settings{width,height,units,fps,backgroundColor,backgroundAlpha} · scenes[] · library[] · brushes[] · preferences{contactSensitive,autoKey} |
| **ENT-scene** | id · name · timeline · backgroundOverride |
| **ENT-timeline** | layers[] · duration (derived) |
| **ENT-layer** | id · name · type(11) · visible · locked · outline · outlineColor · parentId · transformParentId · zDepth · attachedToCamera · maskMode · frames[] · height |
| **ENT-frame** (discriminated) | keyframe{content[],label,actions[],sound} · blankKeyframe · tween{kind:'motion',targetId,start,duration,properties,path} · classicTween{start,end,ease,customEase,rotate} · shapeTween{start,end,ease,customEase,shapeHints} · pose{pose:{boneStates[]}} |
| **ENT-keyframe** (property) | frame · property · value · ease · orientation · rotations · roving |
| **ENT-node** (discriminated) | shape · drawingObject · rectPrimitive · ellipsePrimitive · polyStar · group · symbolInstance · text · bitmap · warpAsset · brushStroke |
| **ENT-transform** | x,y,scaleX,scaleY,rotation,skewX,skewY,pivotX,pivotY |
| **ENT-symbol** | id · name · symbolType · registrationPoint · timeline |
| **ENT-asset** | id · name · kind(bitmap/sound/video/symbol/brush/component) · folderId · order + kind fields |
| **ENT-bone/armature** | bones[{id,parentId,length,rotation,translationX/Y,minRot,maxRot,rotationLocked,xEnabled,yEnabled,jointSpeed,spring}] · bindings[] |
| **ENT-pose/rig/clip/character** | pose{parts[],bones[]} · rig{type,chain,constraints} · clip{symbolId,duration,loop} · character{rootSymbolId,parts[],rigs[],poses[],clips[]} |
| **ENT-audio** | asset{durationMs,sampleRate,channels,dataRef} · attachment{assetId,sync,loop,trimStartMs,trimEndMs,volume,envelope[]} |
| **ENT-mouth/lipsync** | mouthPoses[{frame,viseme}] · lipSync{mouthSymbolId,audioAssetId,audioLayerId,visemeMap,result[],leadMs,blend} |
| **ENT-camera** | enabled,x,y,z,zoom,rotation,tint,filters[] |
| **ENT-effect** | colorEffect{mode:none/brightness/tint/alpha/advanced,value} · filter{type:dropShadow/blur/glow/bevel/gradientGlow/gradientBevel/adjustColor,params} |
| **ENT-selection/workspace/command/history** (non-persisted) | selection{kind,targets,anchorIds,bounds,commonType,timeline} · workspace(prefs) · command{id,label,do,undo,prevSelection} · historyEntry |

### 13.2 Modules (MOD-*) — 54 [02_module_architecture.md]
- **Foundation:** MOD-BUS · MOD-STATE · MOD-VECTOR · MOD-COLOR · MOD-EASING · MOD-COMMAND · MOD-IK
- **Domain:** MOD-DOC · MOD-SCENEGRAPH · MOD-HITTEST · MOD-SELECTION · MOD-XFR · MOD-DRAWING · MOD-SHAPE · MOD-TIMELINE · MOD-FRAME · MOD-KEYFRAME · MOD-TWEEN · MOD-PATH · MOD-SYMBOL · MOD-INSTANCE · MOD-LIBRARY · MOD-RIG · MOD-BONE · MOD-POSE · MOD-WARP · MOD-FBF · MOD-FACIAL · MOD-VISEME · MOD-AUDIO · MOD-CAMERA · MOD-MASK · MOD-TEXT · MOD-SCENE · MOD-LAYER
- **Services:** MOD-RENDER · MOD-CACHE · MOD-ONION · MOD-LIPSYNC · MOD-IMPORT · MOD-EXPORT · MOD-INPUT · MOD-KBD · MOD-TOUCH · MOD-PERSIST · MOD-AUTOSAVE · MOD-NOTIFY
- **UI:** MOD-SHELL · MOD-WORKSPACE · MOD-PANEL · MOD-OVERLAY · MOD-MODAL
- **Cross:** MOD-A11Y · MOD-TEST · MOD-PLUGIN

### 13.3 Requirements (REQ-*) — 68, 24 groups [01_requirements.md]
REQ-SYS(9) · REQ-DOC(3) · REQ-LAY(5) · REQ-SEL(6) · REQ-XFR(4) · REQ-DRW(3) · REQ-SHP(3) · REQ-TIM(4) · REQ-KF(3) · REQ-TWN(6) · REQ-SYM(4) · REQ-LIB(2) · REQ-RIG(1) · REQ-IK(3) · REQ-WARP(1) · REQ-FBF(2) · REQ-CAM(1) · REQ-AUD(2) · REQ-LIP(2) · REQ-TXT/CLR/ALN/SCN/PRP(5) · REQ-I/O(3) · REQ-PLAT(2) · REQ-UI(3) · REQ-PERF(1).
*(Full statements in `engineering/01_requirements.md`, reproduced in §10 of this inventory's source reading.)*

### 13.4 State machines (STM-*) — 8 [04_state_machines.md]
STM-PLAYBACK · STM-EXPORT · STM-JOB · STM-MODAL · STM-TOOL · STM-EDIT · STM-FIELD · STM-DIRTY. *(Transitions in source; forbidden-transition table in §13.4 source.)*

### 13.5 Engineering decisions (ENG-*) — 24 [00_engineering_decisions.md]
ENG-001 hybrid runtime · ENG-002 dual renderer · ENG-003 cubic Bézier · ENG-004 outline-polygon strokes · ENG-005 Vatti booleans · ENG-006 IK hybrid · ENG-007 local-space rig · ENG-008 author-time IK · ENG-009 OKLab color · ENG-010 log-zoom · ENG-011 sparse frames · ENG-012 dual-domain selection · ENG-013 mask rendering · ENG-014 command diffs · ENG-015 pluggable lipsync · ENG-016 JSON+assets · ENG-017 atomic autosave · ENG-018 overlay manager · ENG-019 z-layers L0–L7 · ENG-020 operation queue · ENG-021 break-apart block · ENG-022 contact-sensitive default ON · ENG-023 command palette · ENG-024 edit-mode exit.

### 13.6 Risks (RSK-*) — 15 [00_engineering_risks.md]
Timeline complexity · nested recursion · rig corruption · lipsync accuracy · A/V desync · large-doc memory · mobile GPU · export reliability · UI complexity · boolean edge cases · undo memory · shortcut conflicts · save corruption · shape-morph chaos · camera render order.

### 13.7 WASM facade (implemented, `animator/core/src/wasm.rs` — 50 fns)
`kineora_new/_default` · `draw_rect` · `select_at/_toggle_at/_in_rect/_all` · `clear_selection` · `move_selection` · `transform_selection` · `patch_transforms` · `set_node_props` · `set_document_settings` · `set_playhead` · `insert_keyframe/_blank_keyframe` · `clear_keyframe` · `insert_frame` · `delete_frame` · `move_keyframe/_sequence` · `duplicate_keyframe/_frames` · `copy/cut/paste/remove/reverse_frames` · `convert_to_keyframes/_blank_keyframes` · `set_frame_label` · `set_classic_tween` · `remove_classic_tween` · `resize_span` · `convert_to_symbol` · `new_symbol` · `place_symbol` · `rename_symbol` · `delete_symbol` · `swap_instance` · `set_instance_loop` · `library` · `undo/redo` · `evaluate` · `export_svg/_scaled` · `save/load` · `project_json/load_json` · `set_active_layer` · `create/delete/rename_layer` · `set_layer_visible/_locked` · `move_layer` · `status`.

### 13.8 Evaluator (`eval.rs`)
`evaluate(doc, scene, frame) → Vec<RectItem>` · `hit_test` · `hits_in_rect` · `node_bounds` · `instance_child_frame` (loop modes) · `compose_transforms` (rigid) · MAX_DEPTH=32 · EMPTY_INSTANCE_MARKER=24.

---

## 14. UI → ENGINE CONNECTION MAP  [Part 01 §1.16 · 16_traceability.md · animator/README]

**Universal chain:** UI (gesture) → Command → Session/History → Document Model → evaluate → RenderTree → Renderer. Persistence (save/autosave) reads the model; Export = evaluate with `{export:true}` (overlays skipped).

| System | UI | Command | Session/Engine | Model write | Persist | Export |
|---|---|---|---|---|---|---|
| **Selection** | Selection/Subselection/Lasso tools → hit-test | (none — view state; prevSelection captured) | MOD-HITTEST/SELECTION | — | — | overlays skipped |
| **Move/Transform** | drag handle / marquee | MoveSelection / TransformSelection | MOD-XFR | `node.transform.*` (+per-keyframe override) | yes | yes (final transform) |
| **Draw** | Pen/Rect/Brush… gesture | DrawRect / DrawPath / DrawFill | MOD-DRAWING/VECTOR | `frame.content += node` | yes | yes |
| **Shape ops** | Modify ▸ Combine / Break Apart | (boolean/break) | MOD-SHAPE/VECTOR | `shape.path/fills/strokes` | yes | yes |
| **Timeline frames** | F5/F6/F7 / drag cells | InsertFrames/InsertKeyframe/… | MOD-FRAME/TIMELINE | sparse `frames[]` | yes | yes (sampled) |
| **Tween** | Insert ▸ Motion/Classic/Shape | SetClassicTween / ConvertTween | MOD-TWEEN/KEYFRAME/EASING | span + per-prop keys | yes | yes (interpolated) |
| **Symbol** | F8 / dbl-click / Swap | ConvertToSymbol / SwapInstance | MOD-SYMBOL/INSTANCE | `library[]` + `node` | yes | yes (nested flatten) |
| **Library** | panel drag / buttons | PlaceSymbol / Rename / Delete | MOD-LIBRARY | `library[]` | yes | bundled assets |
| **Layers** | eye/lock/+/drag | SetLayerVisible/Locked / CreateLayer… | MOD-LAYER | `layer.*` | yes | yes (render order) |
| **Rig/IK** | Bone tool drag | AddBone/MoveBone/InsertPose | MOD-BONE/IK/POSE | armature + pose | yes | yes (interp) |
| **Warp** | pin drag | (warp key) | MOD-WARP | `warp.pins[]` | yes | yes |
| **FBF/Onion** | F6/F7 + onion toggle | InsertKeyframe (+ expose) | MOD-FBF/ONION | drawing refs | yes | yes |
| **Camera** | Camera tool drag | (camera key) | MOD-CAMERA | `camera.*` + layer keys | yes | yes (matrix in all exporters) |
| **Audio** | drag onto keyframe | (sound attach) | MOD-AUDIO | `frame.sound` | yes | mux / metadata |
| **Lip-sync** | Lip Syncing dialog | LipSync (one pass) | MOD-LIPSYNC/VISEME | mouth-layer keyframes | yes | yes |
| **Text** | Text tool + type | TextCommand | MOD-TEXT | `text` node | yes | per-type |
| **Color** | chips / picker | SetNodeProps / Color | MOD-COLOR | `fill/stroke style` | yes | yes |
| **Align** | Align panel button | AlignCommand | MOD-XFR(align) | `node.transform.x/y` | yes | yes |
| **Scene** | Scene panel | SceneOp | MOD-SCENE | `scenes[]` | yes | yes |
| **Properties** | fields (Enter commit / Esc) | SetNodeProps / SetDocumentSettings / … | MOD-* (read schema) | varies | yes | yes |
| **Import** | Import menu / drag | Import (atomic) | MOD-IMPORT | `library[] + asset` | yes | yes |
| **Export** | Export menu | (non-mutating) | MOD-EXPORT | — | — | output files |
| **Undo/Redo** | Ctrl+Z / toolbar | History.undo/redo | MOD-COMMAND | restores model + selection | — | — |

**Event bus (MOD-BUS):** `context:changed` · `selection:changed` · `timeline:changed` · `document:changed` · `tool:changed` · `library:changed` · `layer:changed` · `scene:changed` · `playhead:moved` · `playback:started/stopped` · `export:done` · `shortcuts:changed`. Panels subscribe; never read each other.
