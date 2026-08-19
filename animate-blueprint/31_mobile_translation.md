# PART 31 — MOBILE TRANSLATION
### Desktop interaction → mobile equivalent, for every feature. The design principle: **one codebase, two input adapters** (pointer events unified; only the gesture mapping differs).

---

## 31.0 The architecture principle

The tool/command layer (Parts 02–06) is **input-agnostic**: it consumes normalized **gestures** (tap, drag, pinch, twist, long-press, double-tap), not raw events. Two adapters translate:

```
Desktop input (mouse + keyboard + stylus)  ─┐
                                            ├─▶ GestureBus ─▶ Tools/Commands (unchanged)
Touch input (finger + stylus + pen)        ─┘
```

- **Desktop** = Windows / macOS / **Linux** (mouse, Wacom/tablet stylus, keyboard).
- **Mobile** = Android / iOS / ChromeOS tablets (+ phones, degraded), stylus (Apple Pencil / S-Pen / USI).
- **Web** = the same touch adapter (touch laptops, iPads in browser).
- **The canvas is the app** — no OS-native file pickers required for editing; use web/file APIs for open/save.

---

## 31.1 The master mapping table (desktop → mobile)

| # | Desktop interaction | Mobile equivalent |
|---|---|---|
| 1 | Mouse drag | **Finger drag** (with finger-offset loupe when precision needed) |
| 2 | Right-click | **Long-press** (≈500 ms) → context menu (Part 30) |
| 3 | Keyboard shortcut | **Toolbar / action button** (persistent bottom toolbar) + optional on-screen modifier keys |
| 4 | Shift+click (toggle select) | **Select mode** toggle (each tap toggles membership) or long-press to add |
| 5 | Marquee select (drag empty) | **One-finger drag on empty** (two-finger = pan, so no conflict) |
| 6 | Timeline drag (playhead) | **Touch scrub** (drag playhead / stage Time Scrubber) |
| 7 | Transform handles (Free Transform) | **Touch handles** (≥44 px, snap, pinch/twist for scale/rotate) |
| 8 | Hover (cursor feedback, tooltips) | **Tap-and-hold preview** + persistent hint bar (no hover exists) |
| 9 | Modifier keys (Shift/Alt/Ctrl) | **Modifier buttons** in the toolbar (Shift=constrain, Alt=duplicate/center) or multi-finger gestures |
| 10 | Mouse wheel zoom | **Pinch zoom**; double-tap toggle |
| 11 | Middle/space drag pan | **Two-finger drag** |
| 12 | Right-click drag (context drag) | **Long-press then drag** |
| 13 | Keyboard text entry | **System keyboard** (IME-aware) |
| 14 | Undo (Ctrl+Z) | **Two-finger tap** or Undo button |
| 15 | Precise pixel nudges (arrows) | **Nudge buttons** + numeric input (Transform/Info panels) |
| 16 | Hover-preview a tool effect | **Live preview on drag** (the effect shows during the gesture, not before) |
| 17 | Double-click (drill into group/symbol) | **Double-tap** |
| 18 | Double-click pivot (re-center) | **Double-tap pivot** (or a "center pivot" button) |
| 19 | Marquee zoom (Z tool drag) | **Pinch** or double-tap-to-fit |
| 20 | Stylus pressure/tilt | **Stylus pressure/tilt** (Apple Pencil/S-Pen via pointer events) |
| 21 | File dialogs (open/save/export) | **System file/share sheet** (web: file API / download) |
| 22 | Drag asset from Library to stage | **Tap asset → "Place" button → tap stage** (or drag with a held finger) |

---

## 31.2 Per-feature mobile specifics

### 31.2.1 Selection (Part 03)
- Tap = select; long-press = add-to-selection or context menu (configurable).
- **Select mode** (toolbar toggle): tap toggles membership — the Shift replacement.
- Marquee = one-finger drag on empty; lasso = the Lasso tool with finger trace.
- Anchor selection (Subselection): tap path → anchors appear; drag with **loupe**; long-press anchor → add/delete/convert menu.

### 31.2.2 Drawing (Part 05)
- Finger drawing gets **stronger smoothing** (jitter); stylus gets pressure/tilt.
- **Brush size** = always-visible slider (also gesture: drag up/down with two fingers while drawing — P2).
- Pen anchors: tap to place; tap-drag for handles; **double-tap to close**; long-press anchor = ops.
- The **finger-offset loupe**: a magnified bubble above the finger (offset by ~80 px) showing what's under it — required for anchors, handles, pivots, bone joints.

### 31.2.3 Transform (Part 04)
- Handles ≥44 px; corner drag = scale; **pinch = scale**, **twist = rotate**; long-press corner = rotate mode.
- Pivot drag via loupe; numeric Transform panel is the precision path.
- Distort/Envelope: drag corner/mesh points with loupe.

### 31.2.4 Timeline (Part 07)
- Scrub = drag playhead (or drag the stage — Time Scrubber).
- Frame ops = **long-press a frame** → menu (insert/delete/copy/paste/clear/tween).
- Layer ops = long-press the layer row → menu.
- **Ruler pinch** = zoom the frame ruler; two-finger horizontal = scroll frames.
- Onion skin = toolbar toggles.

### 31.2.5 Rigging (Part 14) & camera (Part 16)
- Bone: drag joint-to-joint to add; drag bone to pose; constraints via numeric panel.
- Camera: one-finger pan, pinch zoom, twist rotate (matches the tool exactly).

### 31.2.6 Panels
- Panels collapse to a **bottom sheet / side drawer** on small screens; the **Properties panel** becomes a swipeable bottom sheet.
- The **Library** becomes a grid browser with search + tap-to-place.

---

## 31.3 The persistent mobile toolbar (the shortcut replacement)

A bottom toolbar with the most-used actions (configurable):

`Undo | Redo | Select-mode | Constrain(Shift) | Alt | Onion | Play | Add Keyframe | Delete | Color | Brush size`

Plus a **contextual** section that mirrors the active tool's Options (so no keyboard is ever required).

---

## 31.4 Feature-parity checklist (what MUST work on touch)

| Feature | Mobile interaction | Status |
|---|---|---|
| Select/move/marquee/toggle | tap / drag / select-mode | required |
| Free transform (all modes) | handles + pinch/twist | required |
| Draw (all tools) | finger/stylus + smoothing | required |
| Anchor/curve editing | loupe + long-press menu | required |
| Timeline (all frame/layer ops) | long-press menus + scrub | required |
| Symbols/library/swap | tap-to-place, long-press edit | required |
| Tweens/easing | frame menu + properties sheet | required |
| Bones/IK, warp, camera | gestures + numeric panels | required |
| Audio/lip-sync | waveform scrub + menus | required |
| Export/publish | share sheet / save | required |
| Undo/redo | two-finger tap / buttons | required |

---

## 31.5 BUILD CHECKPOINT M5 (mobile slice)

- [ ] GestureBus with the 8 gestures; two input adapters (mouse/kbd, touch).
- [ ] The master mapping table implemented end-to-end.
- [ ] Finger-offset loupe for anchors/handles/pivots/bones.
- [ ] Persistent mobile toolbar (undo/redo/select-mode/constrain/alt/onion/play/keyframe/delete).
- [ ] Bottom-sheet Properties + grid Library; long-press context menus everywhere.
- [ ] Feature-parity checklist passes on a tablet.

*Next: `32_architecture.md` — the original module architecture (renderer, vector/raster engines, scene graph, timeline/tween/rig/IK/symbol/audio/lipsync/camera/text engines, asset library, serializer, undo, export, input engines) with responsibilities, inputs/outputs, data structures, dependencies, events, state, performance.*
