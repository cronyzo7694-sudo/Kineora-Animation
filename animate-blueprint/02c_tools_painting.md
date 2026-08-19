# PART 02c — EVERY TOOL: PAINTING & STROKE TOOLS
### Deep 27-field specification. This file covers: Pencil, Brush, Paint Brush (art/pattern), Fluid Brush (legacy), Eraser, Width.

> Same 27-field schema as `02a`. Painting tools share a **freehand-stroke contract**: `down → move(s) → up` produces a **stroke** (Pencil = stroke path; Brush = filled brush-stamp path; Paint Brush = pattern-on-path; Eraser = boolean subtraction). All must support **pressure** and **tilt** (stylus) and a **smoothing pipeline** — the single most-requested improvement from animators *[WISH W5]*: no preset-only sizes, a **free size slider**, and smooth strokes without angular artifacts.

### Stroke capture & smoothing (shared foundation)

Every freehand tool runs the same input pipeline (Part 32 Vector Engine):

```
pointermove events (60–240 Hz)
  → downsample/resample points to ~0.5–2 px spacing
  → apply smoothing:
      - Ramer–Douglas–Peucker (removes collinear noise)
      - moving-average / one-euro filter (jitter removal)
      - optional "straighten" (recognize near-straight runs → snap)
  → attach per-point attributes: pressure, tilt, velocity (for width)
  → build a variable-width stroke skeleton
  → commit on pointerup as one DrawCommand
```

The **smoothing amount** is a per-tool setting (0–100) exposed as a slider — this satisfies *[WISH W5]*. The pipeline is identical on desktop (mouse/stylus) and mobile (finger/stylus): only pressure/tilt sources differ.

---

## T2C.1 — PENCIL TOOL

**1. Official name:** Pencil tool.
**2. Purpose:** Freehand drawing of **strokes** (line-art) with automatic straightening/smoothing assist.
**3. Location:** Tools panel.
**4. Icon conceptual description:** a pencil (concept).
**5. Shortcut:** `Shift+Y` (current Animate); `Y` in older versions. (Our app: `P` is Pen, so keep Pencil distinct — see Part 29.)

**6. Mouse interaction:** press-drag to draw; release ends the stroke. No pressure (mouse) → constant width; stylus → variable width.
**7. Touch interaction:** finger/stylus drag; finger input gets stronger smoothing (jitter); stylus gets pressure→width.
**8. Selection behavior:** the new stroke becomes selected on commit.
**9. Drag behavior:** freehand path with live preview.
**10. Double-click behavior:** n/a.
**11. Right-click/context behavior:** convert to fill, edit points, apply stroke style.
**12. Tool Options:** drawing mode (merged/object) + **three assist modes**:
- **Straighten** — recognize near-straight/near-arc runs; snap them to straight lines & circular arcs (good for loose technical drawing).
- **Smooth** — simplify wobble into clean smooth curves (default for most line art).
- **Ink** — keep the raw path with minimal processing (faithful to hand).
Plus: smoothing strength slider (our app), snap toggle.
**13. Properties affected:** creates a stroke path with current stroke style { color, thickness, cap, join, style, widthProfile }.
**14. What it can modify:** creates strokes.
**15. What it cannot modify:** fills; existing objects.
**16–17. Timeline/keyframe:** standard draw-target rules (02b T2B.1 fields 16–17).
**18. Vector interaction:** the stroke is a path; editable afterward (Subselection/Width/Selection reshape).
**19. Bitmap interaction:** none.
**20. Symbol interaction:** none (convert after).
**21. Shape interaction:** merged mode merges with other strokes/shapes; object mode isolates.
**22. Common mistakes:** expecting a fill; wrong assist mode (Ink looks wobbly, Straighten looks stiff); stroke thickness set wrong beforehand.
**23. Professional use:** rough sketching, hand-drawn animation lines, gestural drawings.
**24. Example workflow:** Pencil + Ink → sketch a key pose loosely → refine with Subselection → ink clean pass with Smooth.
**25. Equivalent in our app:** `PencilTool` = freehand stroke tool with the 3 assist modes mapping to smoothing-strength presets + straighten recognizer. Reuses the shared smoothing pipeline.
**26. Mobile implementation:** finger smoothing always on (heavy); stylus pressure/tilt; the 3 modes as a segmented control; "undo last stroke" via two-finger tap or a floating button.
**27. Desktop implementation:** high-frequency pointer sampling → smoothing → path commit; live preview; Shift = straighten constrain.

**MODIFIER MATRIX:** Shift = force straight segments (line mode). Alt = temporarily Eyedropper (sample color). Space = pan.
**UNDO GRANULARITY:** one `DrawPathCommand` per stroke.
**MODEL WRITES:** `layers[i].frames[f].content.push({type:'shape', shape:{strokes:[{path, style, widthProfile}]}})`.

---

## T2C.2 — BRUSH TOOL

**1. Official name:** Brush tool.
**2. Purpose:** Paint freehand **fills** (solid blobs/strokes of fill color) with variable size, shape, pressure/tilt, and 5 **paint modes** that constrain where paint lands. Unlike Pencil (strokes), the Brush paints *fill* geometry.
**3. Location:** Tools panel.
**4. Icon conceptual description:** a paintbrush (concept).
**5. Shortcut:** `B`.

**6. Mouse interaction:** drag paints. Stylus pressure/tilt vary width/angle. Single click = a stamp (round cap) of the brush size.
**7. Touch interaction:** finger drag paints (constant size unless stylus); stylus → pressure/tilt.
**8. Selection behavior:** new painted fill selected on commit.
**9. Drag behavior:** continuous paint = a trail of stamps merged into one fill region.
**10. Double-click behavior:** n/a.
**11. Right-click/context behavior:** convert to outline, break apart.
**12. Tool Options:**
- **Brush Mode** (the 5 paint modes):
  1. **Paint Normal** — paint over everything (default).
  2. **Paint Fills** — paint fills only; strokes are left untouched (safe coloring over line art).
  3. **Paint Behind** — paint behind existing content on the same layer (like a background pass; does not cover existing art).
  4. **Paint Selection** — paint only within the currently selected fill's area (masked to selection).
  5. **Paint Inside** — paint only within the region where the stroke started (coloring inside lines without spilling).
- **Brush Size** — free slider (px) *[WISH W5]*.
- **Brush Shape** — round / flat / angled (dab profile).
- **Lock Fill** — keep gradient/bitmap fill continuity across strokes (shared gradient space).
- **Pressure / Tilt** toggles (visible when a stylus/tablet is connected).
**13. Properties affected:** creates fill geometry with current fill style (solid/gradient/bitmap); Lock Fill shares one gradient matrix across strokes.
**14. What it can modify:** creates fills; in Paint Selection/Inside, modifies constrained regions.
**15. What it cannot modify:** strokes (in Fills modes); locked layers; symbols/groups/text/bitmaps (not broken apart).
**16–17. Timeline/keyframe:** standard draw-target rules.
**18. Vector interaction:** the painted trail is a fill outline (closed region); can be reshaped later; Paint Inside/Fills use the existing shapes as implicit clip masks.
**19. Bitmap interaction:** a bitmap can be used as the **fill** (Lock Fill tiles it).
**20. Symbol interaction:** none (edit inside symbol mode).
**21. Shape interaction:** merge-mode fills merge with overlapping same-color fills; Paint Behind/Inside/Selection are mask-constrained painting.
**22. Common mistakes:** Paint Inside started outside the region → nothing paints; mode left on "Paint Behind" and later strokes vanish under art; forgetting Lock Fill → gradient restarts each stroke.
**23. Professional use:** cel shading, coloring line art (Paint Fills/Inside), soft background washes (Paint Behind), texture painting (bitmap fill).
**24. Example workflow:** ink line art → Brush + **Paint Fills** → color the character without touching the ink strokes.
**25. Equivalent in our app:** a `BrushTool` with the 5 modes implemented as **clip masks** over the shape stack (Part 06); pressure→width; Lock Fill = shared gradient coordinate space; size = free slider. Stamps are tessellated as round-cap polygons merged into the fill.
**26. Mobile implementation:** size slider always visible; modes as segmented control; pressure/tilt via stylus API; finger smoothing; two-finger tap = undo stroke.
**27. Desktop implementation:** stamp-based stroke tessellation (round caps) along the pointer path; stylus pressure/tilt; live preview.

**EVENT SEQUENCE:**
```
pointerdown → begin fill trail (respect mode's mask: selection/inside region captured at down)
pointermove  → append stamps (pressure→width) → live preview
pointerup    → commit DrawFillCommand { path, fillStyle, lockFill }
```
**UNDO GRANULARITY:** one `DrawFillCommand` per stroke.
**MODEL WRITES:** `layers[i].frames[f].content.push({type:'shape', shape:{fills:[{path, style, lockFillMatrix}]}})`.

---

## T2C.3 — PAINT BRUSH TOOL (ART / PATTERN BRUSHES)

**1. Official name:** Paint Brush tool.
**2. Purpose:** Draw stroke-based **Art Brush** and **Pattern Brush** strokes — a piece of brush artwork **stretched (Art)** or **tiled (Pattern)** along the drawn path (Illustrator-style brushes). Added in Animate 2018+; **distinct from the legacy Brush (T2C.2)** which paints plain fills.
**3. Location:** Tools panel.
**4. Icon conceptual description:** a brush with a stylized pattern swatch beside it (concept).
**5. Shortcut:** `Y` (current releases).
**6. Mouse interaction:** drag draws; pressure/tilt modulate width (stylus).
**7. Touch interaction:** drag; stylus pressure/tilt.
**8. Selection behavior:** new stroke selected.
**9. Drag behavior:** paints the brush pattern along the path live.
**10. Double-click behavior:** n/a.
**11. Right-click/context behavior:** convert lines to fills, edit stroke style, remove brush.
**12. Tool Options:** drawing mode (object drawing is recommended/default — heavy vector data); **Stroke Style dropdown** (all brushes in the doc + Brush Library); **Edit Stroke Style** → Art/Pattern brush options:
- Art Brush: name; **Scale Proportionately** / **Stretch to Fit Stroke Length** / **Stretch Between Guides** (head/tail unstretched); overlap handling.
- Pattern Brush: **Stretch to fit / Add space to fit / Approximate path**; **Flip** H/V; **Spacing** (gap between tiles); **At corners** = Center / Flank / Slice / Overlap (corner tile generation).
**13. Properties affected:** stroke style = a **brush definition** (referenced artwork + mapping rules); width; variable width profile.
**14. What it can modify:** creates brush strokes; applies brush style to existing paths.
**15. What it cannot modify:** bitmaps directly (brush artwork can contain bitmaps though).
**16–17. Timeline/keyframe:** standard; brush strokes tween as strokes (shape-tweenable).
**18. Vector interaction:** the stroke spine is a path; the pattern is mapped onto it at render time (stretch/tile).
**19. Bitmap interaction:** brush artwork may include raster content (rendered as part of the brush).
**20. Symbol interaction:** none.
**21. Shape interaction:** object-drawing default → each stroke independent (avoids expensive merging).
**22. Common mistakes:** heavy vector brushes slow playback (use object mode; convert lines to fills only when necessary); confusing with the plain Brush.
**23. Professional use:** textured ink lines, consistent calligraphy, decorative strokes, hair/rope strands.
**24. Example workflow:** select an Art Brush → draw hair strands → convert lines to fills for a stylized painted look.
**25. Equivalent in our app:** a `BrushStrokeNode` referencing a **brush asset** (vector pattern + mapping rules: stretch/tile/guides/spacing/corners) + path + width profile; the renderer tessellates the pattern along the spine (GPU-friendly: precompute tiled geometry, instance along path). Brushes live in the Library (Part 12) and a Brush Library panel.
**26. Mobile implementation:** pressure-aware; brush picker panel (thumbnails); spacing/flip controls in panel.
**27. Desktop implementation:** GPU tessellation of pattern along the spine; caching of tessellated geometry; live preview while drawing.

**MODEL WRITES:** `layers[i].frames[f].content.push({type:'brushStroke', brushAssetId, path, widthProfile})`.

---

## T2C.4 — FLUID BRUSH TOOL (LEGACY — REMOVED)

**1. Official name:** Fluid Brush tool (CS5.5-era; removed in later releases).
**2. Purpose:** Paint with a fluid, pressure-responsive "ink" brush with adjustable size, ink length/volume, and smoothness.
**3. Location:** (historical) Tools panel.
**4. Icon conceptual description:** brush with a droplet (concept).
**5. Shortcut:** (legacy) `Shift+B`.
**12. Tool Options:** size; ink volume/length; smoothness.
**22. Common mistakes:** — (feature removed).
**25. Equivalent in our app:** **do not ship a separate tool.** Fold "fluid" behavior into the Brush tool as a **smoothing + taper + ink-flow** setting (P2). Documented here only for completeness so the blueprint covers every historical tool.

---

## T2C.5 — ERASER TOOL

**1. Official name:** Eraser tool.
**2. Purpose:** Erase strokes and fills by painting a deletion mask; 5 modes limit what is erased; a **Faucet** option deletes an entire fill or stroke segment in one click.
**3. Location:** Tools panel.
**4. Icon conceptual description:** an eraser (concept).
**5. Shortcut:** `E`.

**6. Mouse interaction:** drag erases under the cursor; single click = one eraser stamp.
**7. Touch interaction:** finger drag erases; pressure → eraser size; stylus supported.
**8. Selection behavior:** none.
**9. Drag behavior:** continuous erase along the path.
**10. Double-click behavior:** (legacy) double-click the Eraser tool clears **everything on the stage** (all unlocked layers' current frames). Our app: a "Clear Stage" button with confirmation instead of a hidden double-click.
**11. Right-click/context behavior:** n/a.
**12. Tool Options:**
- **Eraser Mode:** **Erase Normal** (everything), **Erase Fills**, **Erase Lines**, **Erase Selected Fills** (only inside the selected fill), **Erase Inside** (only the region where the drag started).
- **Eraser Shape:** round / square.
- **Faucet:** click = delete an entire fill or connected stroke segment.
- **Size** (slider, *[WISH W5]*).
**13. Properties affected:** removes/trims path & fill geometry; **splits strokes** at the erase boundary (a stroke crossed by the eraser becomes two segments).
**14. What it can modify:** raw shapes (merge shapes): strokes, fills.
**15. What it cannot modify:** symbols, groups, text, bitmaps (must break apart first); locked layers.
**16–17. Timeline/keyframe:** edits current frame/keyframe; erasing on a non-keyframe auto-keys.
**18. Vector interaction:** erasing = **boolean subtraction** applied to path/fill outlines; the eraser's circular stamp is subtracted from the shape's geometry (Part 06 boolean ops).
**19. Bitmap interaction:** none (not broken apart).
**20. Symbol interaction:** none (edit inside).
**21. Shape interaction:** mode masks constrain subtraction (fills-only / lines-only / inside / selection).
**22. Common mistakes:** erasing symbols (no effect — break apart first); Erase Inside started on the wrong region; faucet accidentally deleting a whole fill.
**23. Professional use:** cel cleanup, cutting holes, splitting line art, removing stray marks.
**24. Example workflow:** Eraser + **Erase Lines** → remove stray ink strokes without harming painted fills.
**25. Equivalent in our app:** `EraserTool` = boolean subtraction (vector) or alpha-mask clear (raster layer); Faucet = delete-connected-component hit; modes = mask constraints. Erase is implemented as a series of circular stamps unioned, then subtracted from shape outlines.
**26. Mobile implementation:** finger erase with size slider; faucet via long-press; undo per stroke.
**27. Desktop implementation:** stamp-based boolean ops with path splitting at boundaries.

**EVENT SEQUENCE:**
```
pointerdown → capture mode mask (selected fill / inside region)
pointermove  → subtract eraser stamps from shape geometry (live preview)
pointerup    → commit EraseCommand { shapes[], removedRegions }
```
**UNDO GRANULARITY:** one `EraseCommand` per erase stroke.
**MODEL WRITES:** updates `shape.path` / `shape.fills[]` / `shape.strokes[]` (split/removed).

---

## T2C.6 — WIDTH TOOL

**1. Official name:** Width tool.
**2. Purpose:** Add **variable width** to a stroke by dragging **width points** along it; save/reuse **width profiles**; asymmetric width via one-sided drag.
**3. Location:** Tools panel.
**4. Icon conceptual description:** a line with a bulge/width point and handles (concept).
**5. Shortcut:** `U`.

**6. Mouse interaction:** hover a stroke → width points appear; drag a point to widen/narrow (symmetric); drag a point along the stroke to move it; `Alt/Option`+drag one side of a handle = asymmetric width.
**7. Touch interaction:** drag width handles (enlarged); pinch to adjust symmetric width; numeric width entry in Info panel.
**8. Selection behavior:** operates on the **hovered/active stroke only** (for multiple strokes, only the active one edits).
**9. Drag behavior:** symmetric width by default; asymmetric with Alt; movement constrained between neighboring width points.
**10. Double-click behavior:** n/a.
**11. Right-click/context behavior:** delete width point, reset width, save profile.
**12. Tool Options:** none beyond handles; width profiles saved in Properties (Part 26).
**13. Properties affected:** per-point stroke width values → a **width profile** `stroke.widthProfile = [{t, wL, wR}]`; saved profiles go to a profile list.
**14. What it can modify:** strokes (variable width).
**15. What it cannot modify:** fills, bitmaps, text; only one stroke at a time.
**16–17. Timeline/keyframe:** width data is per-stroke; **shape-tweenable** (variable-width strokes shape-tween; width profiles also tween).
**18. Vector interaction:** the renderer offsets the stroke outline by the interpolated width at each point (left/right independently for asymmetry).
**19. Bitmap interaction:** none.
**20. Symbol interaction:** none (edit inside).
**21. Shape interaction:** works on raw strokes and drawing-object strokes.
**22. Common mistakes:** editing the wrong stroke (only active stroke edits); width points constrained by neighbors (can't push past an adjacent point); forgetting to save the profile for reuse.
**23. Professional use:** tapered hair/limb outlines, calligraphy, anime-style line weight variation.
**24. Example workflow:** draw a leg outline → `U` → widen at the knee, taper at the ankle → save profile → apply the same profile to the other leg.
**25. Equivalent in our app:** stroke `widthProfile` array on the stroke; `WidthTool` edits it via handles; the Vector Engine's stroke outline generator consumes it; profiles are Library-reusable assets.
**26. Mobile implementation:** width handle drag; asymmetric via two-handle loupe; numeric width input.
**27. Desktop implementation:** per-point width gizmo + profile save/apply; live re-render.

**MODEL WRITES:** `shape.strokes[i].widthProfile`.

---

## 02c BUILD CHECKPOINT

- [ ] Freehand pipeline: resample + smooth + straighten + pressure/tilt attributes, with a smoothing slider.
- [ ] Pencil with 3 assist modes (Straighten/Smooth/Ink).
- [ ] Brush with 5 paint modes + free size slider + Lock Fill + pressure/tilt.
- [ ] Paint Brush with Art/Pattern mapping (stretch/tile/guides/spacing/corner tiles) from a brush library.
- [ ] Eraser with 5 modes + Faucet + stroke splitting; undo per stroke.
- [ ] Width tool: per-point width + asymmetric handles + saved profiles.
- [ ] Touch equivalents for all; stylus pressure/tilt on both desktop and tablet.

*Next: `02d_tools_utility.md` — Eyedropper, Paint Bucket, Ink Bottle, Hand, Zoom, Stage Rotate, Time Scrubber, Bone, Bind, Camera, Asset Warp, Deco/Spray (legacy).*
