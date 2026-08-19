# PART 23 — COLOR
### Fill, stroke, color picker, swatches, alpha, linear/radial gradients, custom colors, color replacement — the complete color system.

---

## 23.0 The color model

- **Fill** = the interior style of a shape (solid / gradient / bitmap).
- **Stroke** = the outline style of a shape (solid; + width/cap/join/dash — Part 05.1).
- Every color = **RGBA** (red, green, blue, **alpha**), editable in **RGB** or **HSB**, entered as **hex**, with an **alpha** channel. Gradients store a list of **stops** (offset + color + alpha).
- Animate's fill/stroke controls live in the **Tools panel (Color section)** + the **Color panel**; swatches live in the **Swatches panel**.

### Color data

```jsonc
"color": { "r":63, "g":169, "b":245, "a":1.0 }                      // solid
"fillStyle": {
  "type":"linear|radial|bitmap|solid",
  "stops": [ { "offset":0, "color":{...} }, { "offset":1, "color":{...} } ],   // gradients
  "transform": { "centerX":0,"centerY":0,"scaleX":1,"scaleY":1,"rotation":0,"focal":0 },
  "bitmapAssetId": null }
```

---

## 23.1 The Color controls (Tools panel)

| Control | Icon concept | Does |
|---|---|---|
| **Stroke color chip** | pencil over a color square | sets the **stroke** color for new/selected strokes |
| **Fill color chip** | bucket over a color square | sets the **fill** color for new/selected fills |
| **Swap** | two arrows | swap current fill ↔ stroke |
| **Black & White** | b/w split square | reset fill=white, stroke=black |
| **No Color** | red slash | set fill/stroke to **none** (e.g., fill-only or stroke-only shapes) |
| **Chip click** | — | opens the **color picker** popover |

**Chip rules:**
- Clicking a chip opens the picker; the **currently selected tool's** default style updates (what new drawings will use).
- With a shape **selected**, changing the chip restyles the selection too.
- **No Color** on fill = the shape is stroke-only; on stroke = fill-only. (A shape can't have *both* none — that'd be invisible.)

---

## 23.2 The Color Picker (popover)

| Control | Does |
|---|---|
| **Hue/Saturation field** (2D box) | click to pick hue + saturation |
| **Brightness slider** | vertical luminance |
| **RGB / HSB numeric fields** | exact entry (0–255 RGB, 0–360° H / 0–100 S/B) |
| **Hex field** | `#RRGGBB` entry |
| **Alpha field (A)** | 0–100% — *[WISH W6]* our app also mirrors alpha as a persistent slider outside the picker |
| **Swatch strip** | quick-pick saved swatches |
| **Eyedropper (in-picker)** | sample any color on screen |

**Space:** store one canonical color internally (RGBA); RGB/HSB/hex are **views** of the same value (round-trip exactly; no drift).

---

## 23.3 Swatches panel

- A grid of saved color chips. Operations:
  - **Add current color** (from the picker).
  - **Delete / rename** swatches; **organize into folders**.
  - **Import/export** swatch sets (our format: JSON; optionally ASE-compatible).
  - **Default palette** (a large pre-built set) + per-document custom sets.
- Swatches are **document-level or app-level** (app-level = available in every document — our app default).

---

## 23.4 Alpha (opacity)

- Every color carries **alpha 0–100%**. Applies to fills, strokes, and (separately) to symbol instances via **color effect** (Part 11.5).
- **Where alpha lives in our UI:** top-level opacity slider next to the color chip (always visible) *[WISH W6]*, plus the A field in the picker.
- **Same-style overlap** (merge model): merged same-style fills do **not** double-darken (Part 05.3.5).

---

## 23.5 Gradients

### 23.5.1 Linear gradient
- Two+ **stops** along a **straight axis**. Each stop = offset (0–1) + color + alpha.
- **Transform** (Gradient Transform — Part 02a T2A.4): center, scale (stretch), rotation of the axis.
- Data: `stops[]` + `transform`.

### 23.5.2 Radial gradient
- Two+ stops from **center** outward. Extra property: **focal point** (offset the center of the inner stops → off-center highlights, fake 3D lighting).
- Transform: center, scaleX/Y (elliptical), rotation, focal.

### 23.5.3 Gradient editing UI
- The Color panel shows a **gradient bar** with draggable **stop handles** (double-click a stop = edit its color; drag off = delete; click empty space = add stop).
- **Gradient Transform tool** edits the on-object transform (Part 02a T2A.4).
- **Lock Fill** (Brush/Bucket) shares one gradient space across strokes (Part 02c).

### 23.5.4 Gradient rendering
- Render gradients on GPU: pass `stops` + transform to the shader/`createLinearGradient`/`createRadialGradient`. Radial focal point maps to the two-circle gradient trick (offset inner circle). Exact fidelity at all scales (gradients scale with the shape).

---

## 23.6 Bitmap fills

- A **bitmap asset** used as a **fill** (tile/stretch a texture inside a shape).
- Controls: **scale/tile** the bitmap within the fill (Gradient Transform corner handles); **Lock Fill** continuity.
- Useful for textured backgrounds, pattern fills, screen tones.

---

## 23.7 Custom colors & color replacement

| Feature | Does |
|---|---|
| **Custom color** | Any picked/edited color (RGB/HSB/hex/alpha) — saved to swatches for reuse. |
| **Color replacement (Find & Replace)** | Edit > Find and Replace → **Colors**: replace all uses of color X with color Y across the document (fills and/or strokes). Our app: scoped (document / scene / selection) + preview. |
| **Adjust color (instance filter)** | Per-instance hue/brightness/contrast adjustment (Part 11.5) — recolor without re-authoring. |
| **Swap fill/stroke** | the swap button (23.1). |
| **Eyedropper** | sample + copy styles (Part 02d T2D.1). |

---

## 23.8 Color interactions with the rest of the app

- **Tweens:** colors tween (motion tween tint/alpha; shape tween fill color). Interpolate in **OKLab** for perceptually even fades (Part 08.2).
- **Lip-sync/expressions:** mouth poses reuse the symbol colors; no per-frame color data needed.
- **Export:** colors are exported as-is (RGBA); alpha preserved in PNG/Web/Video; GIF **quantizes** to 256 colors (Part 28 warning).

---

## 23.9 BUILD CHECKPOINT M2 (color slice)

- [ ] Fill/stroke chips + swap/b&w/no-color; picker (HS field + brightness + RGB/HSB/hex + alpha + swatch strip + in-picker eyedropper).
- [ ] Swatches panel (add/delete/folders/import-export/default palette).
- [ ] Alpha everywhere; no double-darkening on same-style merge.
- [ ] Linear + radial gradients (stops editor + focal point + transform tool); GPU rendering.
- [ ] Bitmap fills (tile/stretch + lock fill).
- [ ] Find & Replace colors; adjust-color instance filter; OKLab tween interpolation.

*Next: `24_align_distribute.md` — align left/center/right/top/middle/bottom, distribute H/V, spacing, stage-relative vs object-relative.*
