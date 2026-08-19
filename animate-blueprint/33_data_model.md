# PART 33 — DATA MODEL (JSON SCHEMAS)
### The complete JSON schemas for the original app: Project, Scene, Layer, Character, Body Part, Bone, Symbol, Instance, Frame, Keyframe, Tween, Pose, Audio, Mouth Shape, Camera, Asset, Text, Effect. This is the single source of truth every other part references.

> Conventions: `id` = UUID (stable, rename-safe). `dataRef` = relative path inside the project's `assets/` folder (binary data is NOT inlined in JSON). All fields documented with type + purpose. Schemas shown as JSON-with-comments (strip comments in the real validator).

---

## 33.1 Project

```jsonc
{
  "$schema": "app/project.schema.json",
  "formatVersion": 1,                     // migration version
  "meta": { "title":"My Project", "author":"", "createdAt":"...", "modifiedAt":"..." },
  "settings": {                            // Part 01 §1.7
    "width": 1920, "height": 1080, "units":"px",
    "fps": 24, "backgroundColor": "#ffffff", "backgroundAlpha": 1
  },
  "scenes": [ Scene ],                     // §33.2, in order
  "library": [ Asset ],                    // §33.17 (shared across scenes)
  "brushes": [ Brush ],                    // art/pattern brushes
  "masterAudioTrack": null,                // optional global audio
  "preferences": { "contactSensitive": true, "autoKey": true }
}
```

---

## 33.2 Scene

```jsonc
{ "id":"sc1", "name":"intro", "timeline": Timeline, "backgroundOverride": null }
// Timeline = { "layers":[ Layer ], "duration": 240 }   // duration = max extent (derived)
```

---

## 33.3 Layer

```jsonc
{
  "id":"L3", "name":"arm_R", "type":"normal",     // normal|folder|mask|masked|guide|motionGuide|pose|tween|camera|audio
  "visible":true, "locked":false, "outline":false, "outlineColor":"#ff0000",
  "parentId": null,                    // folder parent (hierarchy) — Part 20.4
  "transformParentId": null,           // layer parenting (transform inheritance) — Part 20.5
  "zDepth": 0, "attachedToCamera": false,          // Part 16
  "maskMode": "clip",                  // 'clip'|'alpha' (Part 21.5), when type==='mask'
  "frames": [ Frame ],                 // sparse — §33.8
  "height": 18
}
```

---

## 33.4 Character

```jsonc
{ "id":"char_hero", "rootSymbolId":"character", "name":"Hero",
  "parts":[ BodyPart ], "rigs":[ Rig ], "poses":[ Pose ], "clips":[ Clip ] }
// Clip = { "id":"walkCycle", "symbolId":"walkCycle", "duration":24, "loop":true }
```

---

## 33.5 Body Part

```jsonc
{ "id":"head", "symbolId":"ch_head", "parentId":null,
  "pivot": { "x":20, "y":8 },           // joint position in the part's local space
  "zOrder": 3 }
```

---

## 33.6 Bone (Armature)

```jsonc
"armature": {
  "bones": [
    { "id":"b0", "parentId":null, "childId":"b1",
      "length":60, "rotation":0, "translationX":0, "translationY":0,
      "minRot":-10, "maxRot":130, "rotationLocked":false,
      "xEnabled":false, "yEnabled":false,
      "jointSpeed":100, "spring": { "strength":0, "damping":0 } | null }
  ],
  "bindings": [
    { "boneId":"b0", "targetNodeId":"armUpper_R" }            // symbol armature
    // or { "boneId":"b0", "controlPoints":[3,4,5] }          // IK shape
  ]
}
```

---

## 33.7 Symbol & Instance

```jsonc
// Library symbol (definition)
{ "type":"symbol", "id":"arm", "name":"arm", "symbolType":"graphic|movieClip|button",
  "registrationPoint": { "x":0, "y":0 },
  "timeline": Timeline }

// Instance (placed on any timeline)
{ "type":"symbolInstance", "symbolId":"arm",
  "transform": Transform,                          // §33.16
  "colorEffect": { "mode":"none|brightness|tint|alpha|advanced", "value": { } },
  "filters": [ { "type":"dropShadow|blur|glow|...", "params":{...} } ],
  "loop": { "mode":"loop|playOnce|singleFrame", "firstFrame":1 },   // graphic only
  "instanceName": null }
```

---

## 33.8 Frame (sparse — only keyframes & spans are stored)

```jsonc
// whole-frame keyframe (frame-by-frame / classic endpoints)
{ "type":"keyframe", "content":[ nodeIds ], "label":null, "actions":[],
  "sound": SoundAttachment | null }

// blank keyframe
{ "type":"blankKeyframe" }

// motion tween span (on a tween layer)
{ "type":"tween", "kind":"motion", "targetId":"n123", "start":1, "duration":60,
  "properties": {                                   // per-property keyframes
     "x":        [ {frame:1, value:0}, {frame:61, value:320} ],
     "rotation": [ {frame:1, value:0}, {frame:61, value:360, orientation:"CW", rotations:1} ]
  } }

// classic / shape tween span
{ "type":"classicTween"|"shapeTween", "start":1, "end":30, "ease":0,
  "customEase":[{t:0,y:0},{t:1,y:1}], "shapeHints":[{startAnchor:0, endAnchor:2}] }

// IK pose
{ "type":"pose", "pose": { "boneStates":[ { "boneId":"b0", "rotation":0.4, "translationX":0, "translationY":0 } ] } }
```

---

## 33.9 Keyframe (property keyframe)

```jsonc
{ "frame": 10, "property": "x|y|scaleX|scaleY|rotation|skewX|skewY|alpha|tint|...",
  "value": 320, "ease": null,          // null = linear; else {fn:'easeOut', ...}
  "orientation": null, "rotations": 0 }   // rotation only
```

---

## 33.10 Tween (motion preset — reusable)

```jsonc
{ "id":"preset_fadeUp", "name":"Fade Up", "kind":"motion",
  "properties": { "alpha":[ {frame:0,value:0},{frame:24,value:1} ],
                  "y":    [ {frame:0,value:40},{frame:24,value:0} ] } }
```

---

## 33.11 Pose (rig pose — reusable)

```jsonc
{ "id":"walk_contact", "name":"Walk Contact",
  "parts":[ { "partId":"armUpper_R", "transform":Transform } ],
  "bones":[ { "boneId":"b0", "rotation":0.2 } ] }
```

---

## 33.12 Audio

```jsonc
// asset
{ "type":"sound", "id":"s_voice01", "name":"voice01", "durationMs":4200,
  "sampleRate":44100, "channels":1, "dataRef":"assets/voice01.mp3" }

// keyframe attachment
{ "assetId":"s_voice01", "sync":"stream|event|start|stop", "loop":0,
  "trimStartMs":0, "trimEndMs":4200, "volume":1.0,
  "envelope":[ { "t":0, "v":1 }, { "t":1, "v":0.8 } ] }
```

---

## 33.13 Mouth Shape (viseme)

```jsonc
// A mouth symbol = a graphic symbol; each frame = one mouth pose, labeled:
"mouthPoses": [
  { "frame":1, "viseme":"A" }, { "frame":2, "viseme":"B/M" }, { "frame":3, "viseme":"C/D" },
  { "frame":4, "viseme":"E" }, { "frame":5, "viseme":"F/V" }, { "frame":6, "viseme":"L/TH" },
  { "frame":7, "viseme":"O" }, { "frame":8, "viseme":"U" }, { "frame":9, "viseme":"W/Q" },
  { "frame":10, "viseme":"rest" }
]
// lip-sync result
"lipSync": {
  "mouthSymbolId":"mouth", "audioAssetId":"voice01", "audioLayerId":"L_audio",
  "visemeMap": { "A":1, "B/M":2, ... },
  "result": [ { "viseme":"O", "startFrame":12, "endFrame":14, "confidence":0.93 } ],
  "leadMs": 0, "blend": false }
```

---

## 33.14 Camera

```jsonc
"camera": { "enabled":true, "x":0, "y":0, "z":0, "zoom":1.0, "rotation":0,
            "tint":null, "filters":[] }
// camera keyframe = a Frame on the camera layer: { "type":"keyframe", "camera":{...} }
```

---

## 33.15 Asset (Library entry)

```jsonc
{ "id":"bmp_01", "name":"hero.png", "kind":"bitmap|sound|video|symbol|brush|component",
  "folderId":null, "order":3,
  // kind-specific:
  "width":512, "height":512, "dataRef":"assets/hero.png",      // bitmap
  "durationMs":4200, "sampleRate":44100,                       // sound
  "symbolType":"graphic", "timeline": Timeline,                 // symbol
  "brushDef": { "mode":"art|pattern", "artRef":"...", "spacing":0, "cornerTile":"flank" } }
```

---

## 33.16 Transform (shared component — Part 04)

```jsonc
{ "x":0, "y":0, "scaleX":1, "scaleY":1, "rotation":0,
  "skewX":0, "skewY":0, "pivotX":0, "pivotY":0 }
```

---

## 33.17 Text

```jsonc
{ "type":"text", "text":"Hello", "textType":"static|dynamic|input",
  "style": { "fontFamily":"Inter", "fontSize":24, "color":"#000000", "alpha":1,
             "bold":false, "italic":false, "underline":false,
             "align":"left", "letterSpacing":0, "lineSpacing":1.2 },
  "box": { "width":null, "height":null, "autoSize":"width" },
  "embedFonts":[], "antiAlias":"normal", "selectable":true, "binding":null }
```

---

## 33.18 Effect (filters / color effects)

```jsonc
// instance color effect
{ "mode":"tint", "color":"#ff0000", "amount":40 }              // amount = %
{ "mode":"alpha", "value":60 }                                  // 0-100
{ "mode":"brightness", "value":-20 }

// filter
{ "type":"dropShadow", "blurX":8, "blurY":8, "distance":5, "color":"#000", "alpha":60, "angle":45 }
{ "type":"glow", "blur":10, "color":"#fff", "strength":2, "inner":false }
{ "type":"adjustColor", "hue":0, "saturation":0, "brightness":0, "contrast":0 }
```

---

## 33.19 Shape (the geometry — Part 06.9, reproduced for completeness)

```jsonc
{ "id":"n123", "type":"shape|drawingObject|rectPrimitive|ellipsePrimitive|polyStar|group",
  "transform": Transform, "fillRule":"nonzero",
  "path": { "anchors":[ { "x":0,"y":0,"h1x":-10,"h1y":0,"h2x":10,"h2y":0,"smooth":true } ], "closed":true },
  "fills":[ { "region":[0,1,2,3],
              "style":{ "type":"solid|linearGradient|radialGradient|bitmap",
                        "color":"#3fa9f5","alpha":1,
                        "stops":[{ "offset":0,"color":"#f00","alpha":1 }],
                        "transform":{ "centerX":0,"centerY":0,"scaleX":1,"scaleY":1,"rotation":0,"focal":0 },
                        "bitmapAssetId":null } } ],
  "strokes":[ { "path":{...},"closed":false,
                "style":{ "color":"#000","alpha":1,"width":2,"cap":"round","join":"miter","miterLimit":4,
                          "dash":null,"brushAssetId":null },
                "widthProfile":[ { "t":0,"wL":2,"wR":2 } ] } ],
  "params": null, "children": null }
```

---

## 33.20 BUILD CHECKPOINT M6 (data slice)

- [ ] All schemas in one JSON Schema set (`formatVersion` + validator).
- [ ] Serializer round-trips every schema exactly (save → load → identical model).
- [ ] `dataRef` indirection for binaries; `assets/` folder packaged with the project.
- [ ] Migration function for `formatVersion` bumps.

*Next: `34_ui_button_spec.md` — the master button table (name, icon concept, panel, purpose, action, required state, shortcut, mobile equivalent, desktop equivalent, dependencies, tooltip, error state).*
