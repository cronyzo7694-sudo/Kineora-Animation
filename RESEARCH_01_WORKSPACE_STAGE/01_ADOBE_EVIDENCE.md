# 01 — ADOBE EVIDENCE — Stage / Workspace / Pasteboard

> Source: helpx.adobe.com official, community verified, plus blueprint.

## 1. Stage kya hai Adobe me?

- **Stage = rectangular area jaha graphic content place hota hai jab document banta hai.** Authoring environment me Stage = rectangular space jo Flash Player ya browser me playback ke time dikhega. [OFFICIAL: using-stage-tools-panel]
- **Default black outline** stage ka outline view represent karta hai.
- **Origin (0,0) = top-left of stage.** +X right, +Y down. Ye hamare `model.rs` me bhi same hai.
- **Stage size = document settings (Modify > Document, Ctrl+J).** Width/Height px me. Typical 1920x1080, 550x400 legacy banner. Change karne pe upper-left corner fixed rehta hai, content move nahi hota — layout issues manually fix karne padte hain. [O'Reilly Flash 8 Cookbook]
- **Stage background color = document setting.** #FFFFFF default. Export me stage color use hota hai. 32-bit PNG me transparent ho sakta hai, 24/8-bit me stage color opaque.
- **Only stage content visible in final output.** Pasteboard content final output me nahi aata.

## 2. Pasteboard / Work Area

- **Pasteboard = light gray area jo stage ke charo taraf hai.** View > Pasteboard se show/hide. Isme elements jo partly ya fully outside stage hain dikhte hain. [OFFICIAL]
- **Use case:** Bird ko frame me udake lana hai to pehle pasteboard me stage ke bahar rakho, phir animate karke stage me lao.
- **Pasteboard color:** Pehle fixed tha theme ke basis pe. Jan 2017 se pasteboard ko stage color jaisa bhi kar sakte ho — infinite canvas feature. Only stage content visible in final output. [OFFICIAL]
- **Community myth bust:** "There's no such thing as pasteboard in Flash/Animate. The stage actually includes *everything* on timeline at any given frame, and the stage is just a viewport onto this. All that stuff has performance impact." — Matlab pasteboard bhi document ka part hai, bas export me clip hota hai.

## 3. Workspace Anatomy (Essentials)

Adobe me 8 regions:

| Region | Position | Contents | Kineora current |
|--------|----------|----------|-----------------|
| Menu bar | Top | File, Edit, View, Insert, Modify, Text, Commands, Control, Debug, Window, Help | Partial — File/Edit/View only |
| Stage | Center | Canvas + gray pasteboard | Yes, canvasRenderer |
| Timeline panel | Bottom docked | Layer list + frame ruler + playhead + onion controls | Yes but alag, layer panel alag hai — Adobe me ek hi panel hai |
| Tools panel | Left docked | Selection, Subselection, Free Transform, Lasso, Pen, Text, Line, Rect, Oval, Pencil, Brush, Eraser, Width, Eyedropper, Paint Bucket, Ink Bottle, Bone, Camera etc | Partial — select + rect only |
| Properties panel | Right docked | Contextual inspector — 4 tabs: Tools, Object, Frame, Doc (Animate 2020+) | Yes but Doc tab scattered |
| Library panel | Right/float | Symbol & asset DB | Yes |
| Edit bar | Above stage | Breadcrumb Scene ▸ symbol ▸ nested + Back button + zoom | Partial — zoom readout only |
| Status bar | Bottom | Current frame, fps, elapsed, workspace switcher, zoom | Partial — zoom/pan readout |

## 4. Timeline + Layers — Adobe me ek hi panel

**Critical difference:** Adobe me Timeline panel ke **left half = layer list (columns)**, **right half = frame grid**. Hamare me LayersPanel alag, TimelineStrip alag — isko merge karna hai.

Left columns:
- Show/hide (eye) — Shift+click = opacity
- Lock (padlock)
- Outline (colored square) — outline only render
- Name — double-click rename
- Type icons — folder, mask, guide, tween, pose, camera, audio
- Layer depth (camera)

Right grid:
- Frame ruler / header — numbered 1,5,10,15...
- Playhead — red line + handle, drag to scrub, click number to jump
- Frame cells — solid dot=keyframe, hollow=blank, hollow rect=span end, arrow=classic tween, blue= motion, light-green=shape, green=IK pose
- Onion skin buttons
- Center frame / Play / status

**Layer height:** Short/Medium/Tall — hamburger menu se ya double-click icon ya right-click Properties. Layer Properties dialog me height + outline color + visibility/opacity.

**Resize:** Timeline docked hai to stage se separator drag, floating hai to corner drag. Layer name field width bhi drag se badal sakta hai.

## 5. Properties Panel — 4 Tabs (Animate 2020+)

- **Tool** — current tool properties, agar tool ka PI nahi to Doc PI dikhta hai
- **Object** — stage pe selected object ka properties, kuch select nahi to disabled
- **Frame** — timeline me selected frame ka properties, no frame selected to disabled
- **Doc** — current document properties — W/H, fps, background, ruler units

Hamare me abhi sirf Object + Doc mixed hai — isko 4 tabs me karna hai.

## 6. Edit Bar

- Menu bar ke neeche, stage ke upar.
- Controls: breadcrumb `Scene 1 ▸ Symbol 1 ▸ nested`, Back button, zoom dropdown.
- Edit depth >0 pe visible, depth=0 pe hidden (but hamare me hamesha hidden).

## 7. Stage Rendering Order (Adobe)

1. Stage background color
2. Grid (optional), guides, rulers
3. Layer contents bottom → top. Within layer: display list back→front, groups/symbols recurse
4. Mask clipping per mask/masked pair
5. Onion-skin ghosts
6. Camera transform (screen-space pan/zoom/rotate, z-depth parallax)
7. Selection overlays — bounding boxes, handles, bone glyphs, warp pins, snapping hints — NEVER export

Ye hamare `canvasRenderer.ts` me same order hai — good.

## 8. View Menu — Stage se related

- Go To → First/Prev/Next/Last — playhead move — Home/Ctrl+←/→/End
- Zoom In/Out/Magnification/Fit in Window/100% — view scale, never content — Ctrl+= / Ctrl+- / Ctrl+1 / Ctrl+0
- Preview Mode → Full/Fast/Anti-alias/Outline — render quality
- Work Area (pasteboard) show/hide — Ctrl+Shift+W
- Rulers/Grid/Guides — Ctrl+R / Ctrl+' / Ctrl+;
- Snapping → Objects/Grid/Guides/Pixels + Snap Align
- Hide Edges — selection highlight toggle — Ctrl+Shift+E — WISH W6
- Show Shape Hints — Ctrl+Alt+H

## 9. Tools Panel — 4 Sections

- Tools area — drawing/painting/selection
- View area — Hand, Zoom, Stage Rotate, Time Scrubber
- Colors area — Stroke chip, Fill chip, swap, B/W, no-color
- Options area — active tool ke modifiers — Magnet snap for Selection, Brush modes, Eraser modes etc

## 10. Document Settings Dialog (Ctrl+J)

- Width/Height — stage size
- Ruler units — px/in/cm/mm — px default
- Frame rate fps — timeline speed — time=frame/fps — 24/25/30/60
- Background color
- Platform/doc type — HTML5 Canvas etc
- Advanced — auto-save interval, stroke/fill defaults

**fps is load-bearing:** audio sync, lip-sync, tween sampling, export — frames↔seconds via fps. fps change pe timing rescale — frames same, seconds change.

## 11. Adobe me jo hamare me nahi hai (Stage ke liye)

- Pasteboard same as stage color → infinite canvas toggle
- Rulers drag se guide banana — ruler se drag = cyan/magenta guide line, move/lock/snap
- Grid configurable cell + snap
- Stage border black outline default — hamare me #6a6a6a — ok
- Edit bar breadcrumb + zoom dropdown
- Properties 4 tabs
- Timeline + Layers merged panel with resizable columns
- Work Area toggle Ctrl+Shift+W — hamare me viewPrefs me hai but UI nahi
- Hide Edges Ctrl+Shift+E — hamare me viewPrefs me hai
- Outline preview mode
- Hand tool (spacebar-drag) — hamare me middle-mouse pan hai, Hand tool nahi
- Zoom tool (Z) + Stage Rotate (R) — hamare me nahi

## 12. Summary for Research

Adobe ka stage simple hai par bahut socha hua:
- Stage = published page, pasteboard = staging area, dono document ka part par export me stage clip
- Workspace = panel arrangement, pure UI state, document data kabhi change nahi karta
- Timeline+Layers ek panel, left list right grid, Adobe ka sabse important UX
- Properties contextual — Tool/Object/Frame/Doc tabs
- View transform (zoom/pan) document ko touch nahi karta, sirf view state

Next file: CURRENT_IMPL_AUDIT — hamare code me kya hai
