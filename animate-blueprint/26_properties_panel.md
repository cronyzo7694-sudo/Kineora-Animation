# PART 26 — PROPERTIES PANEL
### The contextual inspector: the complete property schema for every context — document, shape, drawing object, group, symbol instance, text, frame/tween, camera, audio, bone, warp asset. Plus the context-binding mechanism.

---

## 26.0 The mechanism (context → schema)

The Properties panel **re-binds** to the current context and renders that context's **property schema**. The binding precedence (Part 01 §1.6):

1. **Tool options** (a tool is active and nothing is selected on stage) → tool schema.
2. **Stage selection** (shape / drawing object / group / instance / text / bone / warp pins / camera / multiple) → object schema.
3. **Selected frame(s)** (timeline) → frame/tween schema.
4. **Document** (nothing selected) → document schema.

### Implementation contract

```ts
interface PropertySchema {
  sections: PropertySection[];    // grouped controls
}
interface PropertySection {
  id: string; title: string;
  fields: PropertyField[];        // each: {id, label, type:'number|text|color|select|slider|checkbox|gradient|curve', value, get, set, validate?, min?, max?, unit?}
}
```

Every selectable object type exposes `getPropertySchema(selection)`; the panel renders it and **writes back via Commands** (Part 36 — no direct writes). Fields subscribe to `document:changed` to stay live.

---

## 26.1 Document properties (nothing selected)

| Section | Fields |
|---|---|
| **Document** | Width (px), Height (px), Ruler units, Frame rate (fps), Background color (+ alpha for canvas transparency), Auto-save interval |
| **Platform** | Document type (HTML5 Canvas / WebGL / Video-only / our app types) |
| **Publish** | Publish profile, target folder |
| **Info** | Title, description, author |

---

## 26.2 Shape properties (raw shape / drawing object selected)

| Section | Fields |
|---|---|
| **Position & Size** | X, Y (registration/transform point toggle), W, H (px), constrain-proportions lock |
| **Fill** | Fill color chip + alpha, Fill type (solid/linear/radial/bitmap), gradient stops editor, bitmap asset + tile scale |
| **Stroke** | Stroke color chip + alpha, Stroke width (px), Stroke style (solid/dash/brush), cap (round/square/butt), join (round/miter/bevel + miter limit), width profile selector + save |
| **Shape** | Fill rule (nonzero/even-odd), Corner radius (primitives), Start/end angle + inner radius (oval primitive), Sides/points (polystar) |
| **Display** | (drawing object) — convert to symbol hint, break apart |

---

## 26.3 Group properties

| Section | Fields |
|---|---|
| **Position & Size** | X, Y, W, H |
| **Group** | Type badge ("Group"), Edit-in-place hint, Break Apart button |

---

## 26.4 Symbol instance properties

| Section | Fields |
|---|---|
| **Instance** | Symbol name + Swap button, Instance type (Graphic/Movie Clip/Button), Instance name (scripting handle) |
| **Position & Size** | X, Y, W, H |
| **Color Effect** | Mode (None / Brightness / Tint / Alpha / Advanced) + its value(s) — *[WISH W6]* Alpha shown as a top-level slider |
| **Display** | Blending mode (Normal/Multiply/Screen/Overlay…), (visible) |
| **Filters** | Add filter list (Drop Shadow / Blur / Glow / Bevel / Gradient Glow / Gradient Bevel / Adjust Color) + per-filter params; per-filter enable |
| **Looping** (graphic only) | Loop mode (Loop / Play Once / Single Frame), First frame + **Frame Picker** button (Part 18.5) |
| **Tracking** (button only) | Button tracking mode (as button / as menu item) |
| **Lip Syncing** (graphic, when audio present) | Auto lip-sync button (Part 18.3) |

---

## 26.5 Text properties

| Section | Fields |
|---|---|
| **Text** | Text type (Static/Dynamic/Input), text content (edit in place) |
| **Character** | Font family, size, color + alpha, bold/italic/underline, letter spacing, auto-kern |
| **Paragraph** | Align (L/C/R/justify), line spacing, indent/margins |
| **Behavior** | Selectable, anti-alias (normal/device), embed fonts (glyph subset dialog), border/background (input), max chars (input) |
| **Position & Size** | X, Y, W, H (box width = wrap) |

---

## 26.6 Frame / tween properties (frame(s) selected)

| Context | Sections |
|---|---|
| **Keyframe (frame-by-frame)** | Label (name + type: name/comment/anchor), Sound (asset + sync Event/Start/Stop/Stream + loop + trim + effect), Actions (behavior list) |
| **Classic tween span** | Ease slider + Edit custom ease, Rotate (Auto/CW/CCW + turns), Orient to path, Snap, Sync (graphic), Scale (check), Sound |
| **Shape tween span** | Ease slider + custom ease, Blend (distributive/angular), Shape hints (list), Sound |
| **Motion tween span** | Ease (per-property → opens graph editor), Rotation orientation, View Keyframes submenu (which property keys shown) |
| **Pose span** | Type (Author-time / Runtime — legacy), bone list |

---

## 26.7 Camera properties

| Section | Fields |
|---|---|
| **Camera** | X, Y, Z position; Zoom (%); Rotation (°) — each with a reset button |
| **Color Effects** | Tint (color + amount), Filters |
| **Reset** | Reset pan / zoom / rotation individually |

---

## 26.8 Audio properties (audio keyframe selected)

| Section | Fields |
|---|---|
| **Sound** | Sound asset (dropdown from Library), Sync (Event/Start/Stop/Stream), Loop count, Effect (channel fades), Edit trim (in/out), Volume + envelope editor (our app) |

---

## 26.9 Bone properties (bone selected — Part 14)

| Section | Fields |
|---|---|
| **Bone** | Length, Joint: rotation (enable + min/max), translation (x/y enable), Joint speed, Spring (strength/damping), Parent/Child/Next/Previous navigation buttons |

---

## 26.10 Warp asset properties (warp pins selected — T2D.11)

| Section | Fields |
|---|---|
| **Warp** | Mode (Rigid/Flexible), Envelope toggle, Add/Remove handle, Reset warp, Pin position (x/y) |

---

## 26.11 Multiple / mixed selection

- Shows only **common** fields: X, Y, W, H (Part 03.4.10). Type-specific sections hidden.

---

## 26.12 BUILD CHECKPOINT M5 (properties slice)

- [ ] Context-binding precedence implemented; panel re-renders on selection/tool/frame/document changes.
- [ ] All schemas above render + two-way bind (edit on stage → panel updates; edit in panel → stage updates via Commands).
- [ ] Numeric fields commit on Enter/blur with validation; color/alpha/gradient controls live.
- [ ] Swap, Frame Picker, Lip Syncing, filters, easing controls reachable from the panel.

*Next: `27_import.md` — supported import categories (images, vector, audio, video, animation assets, libraries) and what happens to each imported asset.*
