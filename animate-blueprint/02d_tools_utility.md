# PART 02d — EVERY TOOL: UTILITY, VIEW, RIGGING & CAMERA TOOLS
### Deep 27-field specification. This file covers: Eyedropper, Paint Bucket, Ink Bottle, Hand, Zoom, Stage Rotate, Time Scrubber, Bone, Bind, Camera, Asset Warp, Deco (legacy), Spray Brush (legacy).

> Same 27-field schema as `02a`. Rigging tools (Bone, Bind, Asset Warp) are expanded in Parts 14 & 02-AW notes; the Camera tool is expanded in Part 16. Here each gets its full 27 fields; the later parts dive into the engine math (IK solving, mesh deformation, camera matrix).

---

## T2D.1 — EYEDROPPER TOOL

**1. Official name:** Eyedropper tool.
**2. Purpose:** Sample a **fill or stroke style** (solid color, gradient, or bitmap fill) from an object so it can be applied elsewhere; combined with Paint Bucket / Ink Bottle it copies styles between objects.
**3. Location:** Tools panel.
**4. Icon conceptual description:** an eyedropper (concept).
**5. Shortcut:** `I`.

**6. Mouse interaction:** click a fill → samples the fill style into the current fill; click a stroke → samples the stroke style into the current stroke. (Legacy flow: after sampling, the tool auto-switches to Paint Bucket/Ink Bottle to apply. *[WISH W6]* Our app: sampling **never** applies/paints on hover or click — it only copies to the style clipboard; a separate explicit action applies. This fixes Animate's "eyedropper paints your whole layer on hover" complaint.)
**7. Touch interaction:** tap to sample → a floating **style chip** appears → tap a target object to apply (or drag chip onto target).
**8. Selection behavior:** none.
**9. Drag behavior:** n/a.
**10. Double-click behavior:** n/a.
**11. Right-click/context behavior:** "Apply sampled style to selection" / "Paste fill style" / "Paste stroke style".
**12. Tool Options:** sample fill only / sample stroke only / sample both (mode toggle).
**13. Properties affected:** the current fill/stroke style in the Color controls (and a **style clipboard** {fill, stroke} in our app).
**14. What it can modify:** copies styles.
**15. What it cannot modify:** geometry.
**16–17. Timeline/keyframe:** none (style copy only).
**22. Common mistakes:** sampling a stroke when meaning to sample a fill; expecting the clicked object itself to change (it doesn't); (Animate) accidentally painting the layer on hover.
**23. Professional use:** matching colors across a scene; copying a complex gradient from one shape to many.
**24. Example workflow:** `I` → click a shaded ball (samples its radial gradient) → select other balls → "Apply fill style" → all match.
**25. Equivalent in our app:** `EyedropperTool` reading the style under the pointer + a **style clipboard** + explicit apply. Also a "Copy/Paste Style" command (works on selection, no tool needed).
**26. Mobile implementation:** tap sample → style chip → tap target to apply; long-press chip for fill/stroke/both options.
**27. Desktop implementation:** hover preview (color under cursor) + click sample + apply via modifier (Alt-click = apply to target).

---

## T2D.2 — PAINT BUCKET TOOL

**1. Official name:** Paint Bucket tool (fills enclosed areas).
**2. Purpose:** Fill an enclosed region with the current fill (solid/gradient/bitmap); a **gap tolerance** lets it fill near-closed shapes.
**3. Location:** Tools panel.
**4. Icon conceptual description:** a tipping paint bucket (concept).
**5. Shortcut:** `K`.

**6. Mouse interaction:** click inside a closed region to fill it.
**7. Touch interaction:** tap a region to fill.
**8. Selection behavior:** none.
**9. Drag behavior:** n/a.
**10. Double-click behavior:** n/a.
**11. Right-click/context behavior:** n/a.
**12. Tool Options:** **Gap Size** — Don't Close Gaps / Close Small / Close Medium / Close Large (how big a gap in the outline the fill can bridge); **Lock Fill** (gradient continuity across fills).
**13. Properties affected:** region's fill style.
**14. What it can modify:** enclosed fill regions of raw shapes.
**15. What it cannot modify:** strokes; symbols/groups/text/bitmaps (not broken apart).
**16–17. Timeline/keyframe:** edits current frame/keyframe (auto-key on static frames).
**18. Vector interaction:** flood-fill over vector regions using winding/even-odd rules; gap tolerance = morphological close on the outline before filling.
**19. Bitmap interaction:** none (bitmap *fill* style is applied to a vector region).
**20. Symbol interaction:** none.
**21. Shape interaction:** merge shapes & drawing objects.
**22. Common mistakes:** region not closed → nothing fills (raise gap tolerance); gradient appearing shifted (Lock Fill off).
**23. Professional use:** flat coloring, quick base colors, filling traced line art.
**24. Example workflow:** trace a character → Paint Bucket (Close Small Gaps) → click each region to drop flat colors.
**25. Equivalent in our app:** `BucketTool` = flood-fill over vector regions + gap tolerance (dilate/close the outline) + Lock Fill (shared gradient matrix). Reuses the fill style system.
**26. Mobile implementation:** tap-to-fill; gap tolerance slider; long-press to pick fill from a palette.
**27. Desktop implementation:** flood fill + gap tolerance; Live Preview highlight of the region under cursor before clicking.

---

## T2D.3 — INK BOTTLE TOOL

**1. Official name:** Ink Bottle tool.
**2. Purpose:** Apply a **stroke** (color/width/style) to an existing shape's outline — the stroke counterpart of the Paint Bucket.
**3. Location:** Tools panel.
**4. Icon conceptual description:** an ink bottle with a nib (concept).
**5. Shortcut:** `S`.

**6. Mouse interaction:** click a shape → applies the current stroke style to its outline.
**7. Touch interaction:** tap a shape → apply stroke.
**8. Selection behavior:** none.
**9. Drag behavior:** n/a.
**10. Double-click behavior:** n/a.
**11. Right-click/context behavior:** n/a.
**12. Tool Options:** none.
**13. Properties affected:** stroke style/width of the clicked outline.
**14. What it can modify:** outlines of raw shapes (add or restyle a stroke).
**15. What it cannot modify:** fills (only outline); symbols/text/bitmaps.
**22. Common mistakes:** confusing with Paint Bucket (stroke vs fill); clicking the fill instead of the outline edge.
**23. Professional use:** adding outlines to fills, re-inking, consistent stroke restyling.
**24. Example workflow:** draw a fill-only shape → Ink Bottle → click it → gets a 2px dark outline.
**25. Equivalent in our app:** `InkBottleTool` = set-stroke-style on hovered shape outline.
**26–27. Mobile/desktop:** tap/click to apply; hover preview.

---

## T2D.4 — HAND TOOL

**1. Official name:** Hand tool.
**2. Purpose:** Pan the viewport (scroll the canvas) — never moves content.
**3. Location:** Tools panel (View section).
**4. Icon conceptual description:** a hand (concept).
**5. Shortcut:** `H` (Spacebar = temporary Hand from any tool).
**6. Mouse interaction:** drag to pan; release stops.
**7. Touch interaction:** two-finger drag pans (app convention); edge rubber-band.
**8–11. Selection/drag/double/context:** n/a (view-only).
**12. Tool Options:** none.
**13. Properties affected:** viewport scroll offset only (view state, not document).
**16–17. Timeline/keyframe:** none.
**22. Common mistakes:** thinking Hand moves objects.
**25. Equivalent in our app:** viewport pan via camera offset; spacebar-drag universal; inertia pan optional.
**26. Mobile implementation:** two-finger pan; pinch zoom; double-tap to fit.
**27. Desktop implementation:** pointer capture + delta pan; spacebar temporary mode.

---

## T2D.5 — ZOOM TOOL

**1. Official name:** Zoom tool.
**2. Purpose:** Zoom the viewport in/out (view-only).
**3. Location:** Tools panel (View section).
**4. Icon conceptual description:** a magnifying glass (concept).
**5. Shortcut:** `Z` (global: Ctrl+= in / Ctrl+- out / Ctrl+1 = 100%).
**6. Mouse interaction:** click = zoom in a step; `Alt/Option`+click = zoom out; drag = zoom to the marquee rectangle.
**7. Touch interaction:** pinch to zoom; double-tap to toggle zoom in/out.
**8–11. Selection/drag/double/context:** n/a.
**12. Tool Options:** Zoom In / Zoom Out toggle.
**13. Properties affected:** viewport zoom only.
**16–17. Timeline/keyframe:** none.
**22. Common mistakes:** confusing view zoom with object scale, and with **camera zoom** (Part 16 — camera is animatable and affects export; view zoom is neither).
**25. Equivalent in our app:** viewport scale (screen transform), independent of the camera layer transform.
**26. Mobile implementation:** pinch + double-tap.
**27. Desktop implementation:** wheel+Ctrl zoom; marquee zoom.

---

## T2D.6 — STAGE ROTATE TOOL

**1. Official name:** Stage Rotate tool (recent addition).
**2. Purpose:** Rotate the **view** of the stage (like turning a drawing desk) — a transient authoring rotation, not an animation property.
**3. Location:** Tools panel (View flyout).
**4. Icon conceptual description:** a rotating-frame icon (concept).
**5. Shortcut:** `Shift+H`.
**6. Mouse interaction:** drag to rotate the view around the viewport center.
**7. Touch interaction:** two-finger twist.
**12. Tool Options:** reset rotation (snap back to 0°).
**13. Properties affected:** view rotation only.
**25. Equivalent in our app:** a "rotate canvas" view feature (very useful on tablets); not persisted to the document.
**26–27. Mobile/desktop:** twist gesture / drag.

---

## T2D.7 — TIME SCRUBBER TOOL

**1. Official name:** Time Scrubber tool (recent addition).
**2. Purpose:** Scrub the playhead by dragging **anywhere on the stage** (horizontal drag = time), instead of grabbing the timeline.
**3. Location:** Tools panel (View flyout).
**4. Icon conceptual description:** a clock-with-scrub-arrow icon (concept).
**5. Shortcut:** `Shift+Alt+H`.
**6. Mouse interaction:** horizontal drag scrubs time; vertical drag (optional) scales scrub sensitivity.
**7. Touch interaction:** one-finger horizontal drag scrubs (great for reviewing on tablets).
**13. Properties affected:** playhead position (view/transport state).
**25. Equivalent in our app:** a scrub gesture/button; also scrubbing the stage edge. Low priority (P2).

---

## T2D.8 — BONE TOOL

*(Engine math & constraints: Part 14. Full 27 fields here.)*

**1. Official name:** Bone tool.
**2. Purpose:** Create **inverse-kinematics armatures**: (a) chain **symbol instances** into a jointed skeleton, or (b) carve bones **inside a raw shape** (IK shape). Then **pose** the armature by dragging bones, and animate poses on a **pose layer**.
**3. Location:** Tools panel.
**4. Icon conceptual description:** a small bone / jointed stick-figure glyph (concept).
**5. Shortcut:** `M`.

**6. Mouse interaction:**
- **Add bones to symbols:** click the first instance to set the **root**; then click-drag from the parent joint to the next instance to add a child bone; repeat to chain (shoulder→elbow→wrist).
- **Add bones to a shape:** select the whole shape; with the Bone tool, click-drag inside the shape to carve the first bone; drag from the previous bone's tail to carve the next.
- **Pose:** drag a bone → the IK solver moves the chain; drag the end bone (e.g. hand) → whole chain follows.
**7. Touch interaction:** drag from joint to joint to add bones; drag a bone to pose; long-press a joint for constraint options.
**8. Selection behavior:** clicking a bone selects it; Shift+click = multi-select bones; **double-click a bone = select all bones in the armature**; clicking a pose-layer frame selects the whole armature.
**9. Drag behavior:** adding = drag out a new bone; posing = drag a bone (IK solver updates downstream joints).
**10. Double-click behavior:** select whole armature.
**11. Right-click/context behavior:** Insert Pose, Remove Bone, Remove Armature, Add Spring, rotation/translation constraints.
**12. Tool Options:** none in Options area; per-bone settings live in Properties (Part 26 bone schema).
**13. Properties affected:** bone graph {parent, child, length, angle}; per-bone **rotation constraint** (min/max °), **translation constraint** (x/y enable), **joint speed**, **spring** (strength/damping); the armature **pose** (all joint angles/positions); pose layer type.
**14. What it can modify:** symbol instances (chained into armature) or a raw shape (carved armature, IK shape); pose layers.
**15. What it cannot modify:** non-instance art without conversion; a too-complex shape (Animate prompts to convert to a movie clip first); **one armature per pose layer**; armatures cannot mix with drawing on the same layer.
**16. Timeline interaction:** creates a **pose layer** (green). **Insert Pose** (right-click frame) records the current armature configuration as a pose; frames **between poses are auto-interpolated** (bone angles/positions tween).
**17. Keyframe interaction:** each pose = a pose keyframe (diamond). Bone angle/translation tween between poses. Two armature types in Properties: **Author-time** (tweened in the timeline) vs **Runtime** (manipulated by script at runtime — legacy AS3).
**18. Vector interaction (IK shapes):** bones deform the shape via **control-point binding** (each bone pulls nearby contour points); adding bones to a shape restricts later editing (no scale/skew, no new strokes, no in-place edit).
**19. Bitmap interaction:** symbols containing bitmaps can be boned (the bitmap deforms via the symbol's transform).
**20. Symbol interaction:** chains instances; moving a bone moves linked instances; `Alt/Option`+drag moves **one** instance alone (bones stretch to follow).
**21. Shape interaction:** carve bones inside a shape; the **Bind tool (T2D.9)** controls point-to-bone weighting.
**22. Common mistakes:** boning an overly complex shape (Animate forces movie-clip conversion); forgetting constraints → joints bend backward (elbow hyperextension); editing shape control points after rigging breaks the IK shape; trying to use bones with classic tweens (Animate's bone tool requires modern motion tweens) — *[WISH W2]* our rig engine is tween-agnostic.
**23. Professional use:** arm/leg rigs, tails, tentacles, mechanical linkages, puppet rigs.
**24. Example workflow:** place shoulder→elbow→wrist instances on stage → Bone: click shoulder, drag to elbow, drag to wrist → select elbow bone → set rotation constraint (−10°..130°) → frame 1: Insert Pose → frame 20: drag the hand → Insert Pose → bones tween between poses.
**25. Equivalent in our app:** a `BoneTool` writing into the **Rig/IK Engine** (Part 32): a bone graph (nodes + joints with local transforms), **2-bone analytic + CCD/FABRIK** solvers, per-joint constraints, pose keyframes on a **rig layer**. *[WISH W2]* All bone math is in **local space** with stable bone IDs, so copy/paste, scaling children, and re-parenting cannot corrupt poses (this is the bug class Animate users complain about — we design it out).
**26. Mobile implementation:** drag-to-add bones; pose by dragging with constraint snapping; numeric constraint panel; magnified joint loupe.
**27. Desktop implementation:** same + constraint visual arcs (min/max angle wedges drawn at joints).

**MODEL WRITES (Part 33):**
```
layers[i].type = 'rigLayer'
layers[i].armature = {
  bones: [ {id, parentId, length, rotation, minRot, maxRot, xEnabled, yEnabled, jointSpeed, spring} ],
  bindings: [ {boneId, targetNodeId} | {boneId, controlPoints[]} ]
}
layers[i].frames[f] = { type:'pose', pose: { boneStates: [{boneId, rotation, translation}] } }
```

---

## T2D.9 — BIND TOOL

**1. Official name:** Bind tool (Bone-tool sub-tool).
**2. Purpose:** Edit which shape control points each bone influences (**weighting**) for IK shapes — so the shape distorts correctly when bones move.
**3. Location:** Tools panel (Bone flyout).
**4. Icon conceptual description:** a bone with linked dots (concept).
**5. Shortcut:** none (sub-tool).
**6. Mouse interaction:** click a bone → its bound points highlight (yellow); **Shift+click** a point = add it to the selected bone; **Ctrl/Option+click** a highlighted point = remove it; click a point → its bound bones highlight.
**7. Touch interaction:** tap-select points/bones; toggle binding.
**8. Selection behavior:** point/bone binding selection (squares = single-bone points, triangles = multi-bone points).
**9. Drag behavior:** Shift+drag = lasso-add multiple points to a bone.
**10. Double-click behavior:** n/a.
**11. Right-click/context behavior:** clear binding.
**12. Tool Options:** none.
**13. Properties affected:** the point→bone binding map (`armature.bindings`).
**14. What it can modify:** IK shape control points.
**15. What it cannot modify:** symbol-instance armatures (they move whole instances, no per-point binding).
**22. Common mistakes:** forgetting to bind → default nearest-bone weighting distorts badly at joints.
**23. Professional use:** fixing joint deformation (e.g., elbow pinch) by re-weighting contour points.
**25. Equivalent in our app:** weight-painting / point-binding mode on the rig engine; heat-map visualization.
**26–27. Mobile/desktop:** tap-to-bind; paint weights with a brush.

---

## T2D.10 — CAMERA TOOL

*(Camera model & depth: Part 16. Full 27 fields here.)*

**1. Official name:** Camera tool.
**2. Purpose:** Enable a **virtual camera** over the stage: **pan** (drag), **zoom** (Shift-drag / slider), **rotate** (Ctrl/Cmd-drag / slider); animate camera via keyframes; apply camera **tint/color effects**.
**3. Location:** Tools panel.
**4. Icon conceptual description:** a video camera (concept).
**5. Shortcut:** `C`.

**6. Mouse interaction:** drag = pan; `Shift`+drag = zoom; `Ctrl/Cmd`+drag = rotate. On-screen zoom/rotate slider + reset buttons also available.
**7. Touch interaction:** one-finger pan; pinch zoom; two-finger twist rotate.
**8. Selection behavior:** selecting the Camera tool activates the camera layer; a camera outline/overlay appears over the stage.
**9. Drag behavior:** maps to pan/zoom/rotate by modifier.
**10. Double-click behavior:** n/a.
**11. Right-click/context behavior:** reset camera, attach/detach layers, create camera tween.
**12. Tool Options:** on-screen zoom/rotate slider + reset per property.
**13. Properties affected:** `camera.transform` { x, y, z, zoom, rotation } + camera color effects (tint, filters).
**14. What it can modify:** the camera (framing of all layers).
**15. What it cannot modify:** layer content (attached layers move **with** the camera — they're pinned, not modified).
**16. Timeline interaction:** creates a **Camera layer**. Keyframes on it store camera states; classic/motion tween between camera keyframes animates the camera.
**17. Keyframe interaction:** camera keyframes hold position/zoom/rotation; interpolated between keys (easing applies).
**18–21. Vector/bitmap/symbol/shape:** the camera transforms the **composited output** of all layers (plus per-layer z-depth parallax with Advanced Layers).
**22. Common mistakes:** confusing camera zoom with viewport zoom; forgetting to **attach** HUD/caption layers (they'll drift with the camera); camera rotate around wrong center.
**23. Professional use:** cinematic push-ins, pans, shake, parallax (Layer Depth panel).
**24. Example workflow:** add Camera → frame 1 keyframe (wide) → frame 100 keyframe (zoom 200% + pan) → classic tween → ease-out.
**25. Equivalent in our app:** a `CameraNode` in the scene graph holding a screen-space transform + a camera layer timeline (Part 16); layer depth → per-layer parallax scale.
**26. Mobile implementation:** gestures map to pan/zoom/rotate; joystick alternative.
**27. Desktop implementation:** modifier-drag + numeric panel + on-screen slider.

**MODEL WRITES (Part 33):** `camera = { x, y, z, zoom, rotation, tint, filters }`; `layers[cameraLayer].frames[f] = { type:'keyframe', camera:{...} }`.

---

## T2D.11 — ASSET WARP TOOL

*(Deformation math: Part 02-AW note below + Part 32 WarpEngine.)*

**1. Official name:** Asset Warp tool (added Animate 19.0).
**2. Purpose:** Deform shapes, drawing objects, and **bitmaps** using a mesh of **warp handles/pins** ("puppet warp"); animate the deformation by keyframing the pins.
**3. Location:** Tools panel.
**4. Icon conceptual description:** a shape with warp pins/handles (concept).
**5. Shortcut:** none by default (assignable).
**6. Mouse interaction:** click on a shape/drawing-object/bitmap to **add a warp handle**; drag handles to deform; hover shows affordance cursors (add vs move).
**7. Touch interaction:** tap to add a pin; drag a pin to warp.
**8. Selection behavior:** warp handles (small circles) selected individually; the object becomes a "warped asset".
**9. Drag behavior:** drag pin = local deformation (rigid or flexible per mode).
**10. Double-click behavior:** (with Selection) double-click a warped shape → edit its **base shape** (vector only; changes propagate to warped instances).
**11. Right-click/context behavior:** add/remove handle, reset warp, rigid/flexible toggle, envelope mode.
**12. Tool Options:** warp mode (**rigid** = stiff, articulated; **flexible** = soft deformation), **envelope**, handle add/delete.
**13. Properties affected:** `warp.handles[]` (positions), mesh triangle list, base-shape link.
**14. What it can modify:** shapes, drawing objects, bitmaps (all grouped into a warped asset when the first handle is added).
**15. What it cannot modify:** symbol instances directly (warp the art inside, or warp then convert).
**16. Timeline interaction:** warped assets animate by keyframing handles; on inserting a keyframe, handles are **copied from the previous keyframe**.
**17. Keyframe interaction:** handle positions are per-keyframe and tweenable (the mesh interpolates between keyframes). *[WISH W3]* Our implementation stores warp as **pure per-keyframe data** (pin positions + derived mesh), eliminating Animate's flicker/loss bugs on duplicate/symbol-link.
**18. Vector interaction:** mesh over a base vector shape; the base shape remains editable.
**19. Bitmap interaction:** mesh over bitmap (deforms pixels).
**20. Symbol interaction:** n/a directly.
**22. Common mistakes:** too few pins → wobble; mixing rigid/flexible unintentionally; expecting symbol-level warp.
**23. Professional use:** flag waves, cloth, hair, breathing bodies, simple full-body puppets without a cut-out rig.
**24. Example workflow:** import a flag PNG → Asset Warp → pin corners + midpoints → drag to ripple → keyframe → loop.
**25. Equivalent in our app:** a `WarpMeshNode` (triangle mesh + pins; **MLS / as-rigid-as-possible** deformation) keyframable per pin; rigid/flexible modes; vector + raster sources.
**26. Mobile implementation:** pin drag with loupe; add/remove pin via long-press; two-finger = pan/zoom.
**27. Desktop implementation:** mesh solve on GPU/worker; per-pin keyframe curves in the graph editor.

**MODEL WRITES (Part 33):**
```
layers[i].frames[f].content.push({
  type:'warpAsset', sourceNodeId, baseShapeId|null,
  warp: { mode:'rigid'|'flexible', pins:[{x,y}], mesh:{verts:[], triangles:[]} }
})
```

---

## T2D.12 — DECO TOOL (LEGACY) & T2D.13 — SPRAY BRUSH TOOL (LEGACY)

**1. Official name:** Deco tool; Spray Brush tool (legacy CS-era; removed).
**2. Purpose:** Deco — procedural pattern/symmetry brushes (Vine Fill, Grid Fill, Symmetry Brush, Tree, Flame, particle systems) for decoration; Spray Brush — spray **symbol instances** randomly (scatter).
**3. Location:** (historical) Tools panel.
**5. Shortcut:** `U` (legacy; now the Width tool).
**12. Tool Options:** Deco: pattern type (Vine/Grid/Symmetry/…), the symbol to stamp, density/rotation/scale/color. Spray: symbol, scatter count, scale/rotation randomness.
**22. Common mistakes:** — (removed).
**23. Professional use:** procedural foliage, repeating decorations, particle scatter.
**25. Equivalent in our app:** optional **generator brushes** (symmetry, particle, vine) as a plugin module; **P3 priority**. Documented for completeness only.

---

## 02d BUILD CHECKPOINT

- [ ] Eyedropper samples fill/stroke (incl. gradients/bitmap fills) to a style clipboard; apply is explicit (no hover-paint bug).
- [ ] Paint Bucket flood-fills regions with gap tolerance + Lock Fill.
- [ ] Ink Bottle applies strokes to outlines.
- [ ] Hand/Zoom/Stage Rotate/Time Scrubber: view-only, no document mutation.
- [ ] Bone tool builds symbol armatures AND IK shapes; poses recorded as pose keyframes; constraints enforced; Bind tool edits point weighting.
- [ ] Camera tool: pan/zoom/rotate + camera layer + keyframable camera + attach layers.
- [ ] Asset Warp: pins + mesh on vector & raster; rigid/flexible; keyframeable pins.
- [ ] Touch equivalents for all rigging/camera tools.

*This completes Part 02 (every tool). Next: `03_selection_system.md`.*
