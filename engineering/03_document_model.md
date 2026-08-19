# 03_DOCUMENT_MODEL — AUTHORITATIVE DATA ENTITIES

Preserves Part 33 schemas exactly (no redesign). Persistence = JSON + `assets/` folder; binaries by `dataRef`. `formatVersion` gates migration.

## Identity rules
- Every entity: UUID `id` (stable, rename-safe). `name` = display-only.
- Parent/child by ID. Deletes: children cascade or re-parent per entity rules below.
- `formatVersion: 1`; `migrate(from,to)` = pure function.

## Entities
### ENT-project / ENT-document
| Field | Type | Req | Default | Constraint |
|---|---|---|---|---|
| id | uuid | ✓ | — | unique |
| formatVersion | int | ✓ | 1 | — |
| meta{title,author,createdAt,modifiedAt} | obj | ✓ | — | — |
| settings{width,height,units,fps,backgroundColor,backgroundAlpha} | obj | ✓ | 1920×1080, px, 24, #fff, 1 | w/h ≥ 2; fps 1–120 |
| scenes[] | ENT-scene | ✓ | [scene1] | ordered |
| library[] | ENT-asset | ✓ | [] | ids unique |
| brushes[] | ENT-brush | o | [] | — |
| preferences{contactSensitive,autoKey} | obj | o | {true,true} | — |
Lifecycle: created → edited → saved → archived. Migration: `formatVersion` bump + migrate().

### ENT-scene
`{ id, name, timeline: ENT-timeline, backgroundOverride?: color|null }` — duration derived (not stored).

### ENT-timeline
`{ layers: ENT-layer[], duration?: int }` — duration = max layer extent (derived, recomputed on frame ops).

### ENT-layer
`{ id, name, type: normal|folder|mask|masked|guide|motionGuide|pose|tween|camera|audio, visible, locked, outline, outlineColor, parentId?, transformParentId?, zDepth, attachedToCamera, maskMode: clip|alpha, frames: ENT-frame[], height }`
- Sparse: `frames[]` holds ONLY keyframes + span markers (hold rule derives the rest).
- `type` conversion rules (Part 20.3): pose/tween/camera/audio revert to normal when emptied; mask→normal warns.

### ENT-frame (discriminated union)
| kind | Fields |
|---|---|
| keyframe | frame, type:'keyframe', content:[nodeId], label?, actions[], sound? ENT-soundAttachment, drawingId? |
| blankKeyframe | frame, type:'blankKeyframe' |
| tween | type:'tween', kind:'motion', targetId, start, duration, properties:{per-prop key arrays}, path? (derived) |
| classicTween | type:'classicTween', start, end, ease, customEase[], rotate{mode,count}, orientToPath, snap, sync |
| shapeTween | type:'shapeTween', start, end, ease, customEase[], shapeHints[] |
| pose | type:'pose', pose:{boneStates[]} |
Validation: keyframes at distinct frames; tween spans don't overlap keyframes; targetId exists (or hollow-dot state).

### ENT-keyframe (property key)
`{ frame, property, value, ease?, orientation?, rotations?, roving? }` — property ∈ {x,y,scaleX,scaleY,rotation,skewX,skewY,alpha,tint,brightness,filter.*}.

### ENT-node (content, discriminated)
| type | Fields (from Part 33 §33.19) |
|---|---|
| shape | path{anchors[{x,y,h1x,h1y,h2x,h2y,smooth}],closed}, fillRule, fills[{region[],style}], strokes[{path,closed,style,widthProfile[]}] |
| drawingObject | same as shape + atomic flag |
| rectPrimitive/ellipsePrimitive/polyStar | params{w,h,cornerRadius | cx,cy,rx,ry,startAngle,endAngle,innerRadius | sides,isStar,starPointSize,radius} |
| group | children[nodeId] |
| symbolInstance | symbolId, transform, colorEffect, filters[], loop{mode,firstFrame}, instanceName |
| text | text, textType, style{}, box{}, embedFonts[], antiAlias, selectable, binding |
| bitmap | width,height,dataRef |
| warpAsset | sourceNodeId, baseShapeId?, warp{mode,pins[],mesh{verts,triangles}} |
| brushStroke | brushAssetId, path, widthProfile[] |

### ENT-transform
`{ x,y,scaleX,scaleY,rotation,skewX,skewY,pivotX,pivotY }` — matrix = cached derivative.

### ENT-symbol (library definition)
`{ id, name, symbolType: graphic|movieClip|button, registrationPoint{x,y}, timeline }`

### ENT-asset (library)
`{ id, name, kind: bitmap|sound|video|symbol|brush|component, folderId?, order, …kind fields (width/height/dataRef | durationMs/sampleRate/channels/dataRef | symbolType/timeline | brushDef) }`

### ENT-bone / ENT-armature
`{ bones:[{id,parentId?,childId?,length,rotation,translationX,translationY,minRot,maxRot,rotationLocked,xEnabled,yEnabled,jointSpeed,spring?}], bindings:[{boneId,targetNodeId} | {boneId,controlPoints[]}] }`

### ENT-pose / ENT-rig / ENT-clip / ENT-character
pose `{id,name,parts:[{partId,transform}],bones:[{boneId,rotation}]}` · rig `{id,type: bones|warp|hierarchy, chain[], constraints[]}` · clip `{id,symbolId,duration,loop}` · character `{id,rootSymbolId,parts[],rigs[],poses[],clips[]}`.

### ENT-audio (asset + attachment)
asset `{id,name,durationMs,sampleRate,channels,dataRef}` · attachment `{assetId,sync:stream|event|start|stop,loop,trimStartMs,trimEndMs,volume,envelope[{t,v}]}`.

### ENT-mouth / ENT-lipsync
mouthPoses `[{frame,viseme}]` · lipSync `{mouthSymbolId,audioAssetId,audioLayerId,visemeMap{},result[{viseme,startFrame,endFrame,confidence}],leadMs,blend}`.

### ENT-camera
`{ enabled,x,y,z,zoom,rotation,tint?,filters[] }`

### ENT-effect
colorEffect `{mode:none|brightness|tint|alpha|advanced, value}` · filter `{type:dropShadow|blur|glow|bevel|gradientGlow|gradientBevel|adjustColor, params}`.

### ENT-selection / ENT-workspace / ENT-command / ENT-historyEntry (non-persisted / UI)
- selection (view): `{kind, targets[], anchorIds[], bounds, commonType, timeline{selectedLayers,activeLayerId,selectedFrames}}` — not serialized.
- workspace (prefs): panel layout JSON — app prefs.
- command `{id,label,do,undo,prevSelection}` · historyEntry `{commandId,ts,coalesced}` — session-only.

## Validation & lifecycle
- Load-time: schema validate → migrate → re-link IDs → integrity check (orphan refs → warn/placeholder per M.15 rules).
- Runtime: all writes via Commands validate preconditions (05_command_system.md).
- Derived fields (duration, bounds, matrix, path) never stored — recomputed, cached with invalidation.

## Serialization
JSON (compressed, worker) + `assets/` folder; checksum; atomic write-temp→rename (MOD-PERSIST).
