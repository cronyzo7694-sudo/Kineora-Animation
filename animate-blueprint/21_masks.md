# PART 21 — MASKS
### Mask layers, masked layers, clipping behavior, animated masks, nested masks, alpha behavior — and the original equivalent implementation.

---

## 21.0 The concept

A **mask** = a shape that acts as a **window**: the **masked** layer's content is visible **only where the mask is**, hidden everywhere else. The mask itself is invisible at export (it defines the window, not the artwork).

```
mask layer     ┐ (shape = the window; not rendered itself)
masked layer   ┘ (content = clipped to the mask shape)
```

Use: spotlight reveals, circular portraits, text wipes, iris transitions, hiding parts of a character behind a boundary.

---

## 21.1 Mask layer vs masked layer

| | Mask layer | Masked layer |
|---|---|---|
| Role | Defines the **clip shape** | Provides the **content** being clipped |
| What it contains | A shape (fill defines the window; strokes are ignored as mask — only **fills** count) | Normal content (shapes/instances/text) |
| Visibility | Invisible at export (shown outlined/hatched in authoring) | Visible **only within** the mask |
| Position | Directly **above** its masked layer(s) | Directly **below** the mask |

### Creating a mask (the workflow)
1. Create a layer with the mask shape (e.g., a circle).
2. Create the content layer below it.
3. Right-click the mask layer → **Mask** (converts to mask type; the layer below becomes **masked** — indented).
4. **Lock both layers** to see the mask effect on stage (Animate's quirk: mask preview requires locked layers — our app shows it live without locking, and marks the lock-dependency in a tooltip).

### Linking rules
- One mask layer can mask **one or more** layers directly below it (each becomes masked).
- Unmasking: right-click the masked layer → **Unmask**, or drag it out from under the mask.
- Mask + masked layers can be **folders** too (folder-as-mask works on folder content).

---

## 21.2 Clipping behavior (exact rules)

- The **mask fill** (its filled regions, per the fill rule — Part 05.3.1) defines the window. Mask **strokes are ignored**.
- Masked content shows where it **overlaps the mask fill**; hidden elsewhere.
- **Multiple mask sub-shapes** = union of their fills (multiple windows).
- The mask's **color/alpha is irrelevant** — only its **geometry** (shape outline) matters. (Alpha masks are a separate feature — 21.5.)
- Masked content **keeps its own** colors/effects — the mask only gates visibility.

---

## 21.3 Animated masks

A mask can **animate like any layer** — its shape can move/scale/rotate/morph across keyframes, revealing different parts of the masked content over time.

| Technique | How | Use |
|---|---|---|
| **Moving mask** | Motion-tween the mask shape's position (Part 09) | spotlight following a character; window sliding over a scene |
| **Morphing mask** | Shape-tween the mask between shapes (Part 09.3) | iris open/close, blob reveals |
| **Rotating/scaling mask** | transform keys on the mask | clock-wipe, spiral reveal |
| **Mask + masked both animate** | mask moves + content moves (parallax reveal) | complex reveals |

**Rules:**
- Both mask and masked layers can be tweened independently (mask on its own layer, content on its own).
- On a **tween layer** as mask: the tween's target's **fill** defines the window per frame.
- **Export:** animated masks render per-frame (the clip is re-evaluated at each frame).

---

## 21.4 Nested masks

- A mask can clip a layer that itself contains a **symbol** whose internal timeline has **its own mask** (nested masking).
- Rules: each symbol's internal masks apply **inside** the symbol first; the outer mask then clips the symbol's **composited result**. (Masks nest cleanly because each timeline is a self-contained render scope — Part 11.8.)
- **Limitation (Animate):** a mask layer cannot contain a mask layer (masks don't stack *within* one timeline beyond the one mask/masked pair). **Our app:** allows **multiple mask groups** per timeline (a group = one mask + its masked layers), a direct improvement.

---

## 21.5 Alpha behavior (alpha masks)

- Animate's native mask is **hard-edged** (binary: in or out) — the mask fill's alpha is ignored.
- **Alpha/soft masks** (feathered edges, gradient fades) are achieved via:
  1. A **gradient mask fill** — Animate **does not** soften the clip (gradient mask = still binary window of the gradient's region). Our app **adds true alpha masks** (P1): the mask's **alpha channel** scales the masked content's opacity (soft edges, gradient reveals).
  2. **Filters/blends** on the masked content (Part 11.5) for soft fades inside the window.
- Our app supports **two mask modes**: `clip` (binary, Animate-compatible) and `alpha` (soft, alpha-weighted) — a per-mask-layer setting.

---

## 21.6 Implementation (the original equivalent)

### Rendering pipeline (per frame)
```
for each mask group (mask layer + its masked layers):
  1. Render the masked layers into an offscreen buffer B (their normal composite).
  2. Render the mask layer's fills into a stencil/mask buffer M (geometry only for 'clip';
     alpha channel for 'alpha').
  3. Compose: result = B clipped by M  (destination-in / stencil test).
  4. Draw result into the main framebuffer at the group's stacking position.
```

- **Web/GPU:** use the **stencil buffer** (clip mode) or a **mask texture** (alpha mode); per-layer render targets with caching (Part 32 Renderer).
- **Vector fallback:** boolean **intersection** of masked content's paths with the mask path (Part 06.5 engine) for vector exports (SVG) where stencils aren't available.
- **Cache:** a mask group's composited buffer caches until any member changes (dirty-flag).

### Data model

```jsonc
"layers":[
  { "id":"M1", "type":"mask",     "maskMode":"clip|alpha", "frames":[...] },   // the mask shape
  { "id":"C1", "type":"masked",   "maskId":"M1", "frames":[...] }              // clipped content
]
```

---

## 21.7 BUILD CHECKPOINT M2 (mask slice)

- [ ] Mask/masked layer types + linking (one mask, N masked) + unmask; live preview without lock.
- [ ] Clip semantics: mask fills define window; strokes ignored; multiple windows; content keeps its own color/effects.
- [ ] Animated masks (move/morph/rotate) on both mask and content layers.
- [ ] Nested masks inside symbols (inner-first, then outer clip).
- [ ] Alpha mask mode (soft edges/gradients) as a per-mask setting; stencil/mask-texture rendering + vector boolean fallback for SVG export.

*Next: `22_text.md` — text tool, static/dynamic/input, font, size, alignment, spacing, color, transform, text animation.*
