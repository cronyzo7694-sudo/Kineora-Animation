# SYS-04 H01 — ZOOM / PAN / ROTATE-VIEW

## 0. Document Status

SPECIFICATION STATUS: **REVISION REQUIRED** (AMB-S04-002 zoom step open)  
IMPLEMENTATION STATUS: **PARTIAL** (evidence in H08)

Revision: **SYS-04-H01** · Constitution: **H00**

---

## 1. Scope

H01 owns the **viewport transform**: Zoom In / Out / 100% / Fit in Window,
wheel zoom, and the **state** of pan + rotate-view. It does **not** own the
Hand / Zoom / Stage Rotate **tools** (SYS-13) or the camera (SYS-25).

---

## 2. Authority / Evidence Map

| Source | Establishes |
|---|---|
| Part 01 §1.2.3 | Zoom In / Out / Magnification / Fit / 100%; “Viewport scale (never content)” |
| Part 01 §1.4.1 | View transform on top; never stored in the document; camera is separate |
| Part 01 §1.17 | Pan = spacebar-drag / Hand; zoom = Ctrl+=/- **and wheel** |
| Part 29 §29.9 | Ctrl+= / Ctrl+- / Ctrl+1 / Ctrl+0 |
| Part 29 §29.1 | Hand = H; Zoom = Z; Stage Rotate = Shift+H; temporary Hand = hold Space |
| Part 32 §32.1 | Renderer takes view state (zoom/pan/rotate) |
| SYS-01 §10 | Wheel on stage = SYS-14 host / View — not SYS-01 |

---

## 3. State

```
Viewport {
  zoom: number,     // 1.0 = 100%
  panX: number,     // document-space offset of the view
  panY: number,
  rotateView: number // degrees; view-only, not object rotation (Part 04)
}
```

- Boundary: SESSION (INV-VIEW-1). Reload / Open → default 100%, identity pan/rotate.
- Per-open-document vs global: SOURCE DOES NOT ESTABLISH (H00 §9.1). Either
  reset-on-switch or remember-per-tab is legal. Do not invent a third behavior.
- Orthogonal to camera (`ENT-camera` / SYS-25).

**Min / max zoom:** SOURCE DOES NOT ESTABLISH numeric bounds. Implementation
MUST clamp to a finite range (no NaN/Inf) and MUST register the chosen bounds
as impl-evidence, not as spec. Not an AMB — “finite clamp” is required; the
numbers are not.

---

## 4. Commands

| Control | commandId | Trigger | Action | Mutation | Undo | Dirty | Event | testId |
|---|---|---|---|---|---|---|---|---|
| Zoom In | `view.zoomIn` | Ctrl+= / menu / palette / Zoom-tool click+ / **wheel** (see §6) | increase zoom by **[AMB-S04-002]** about view center (Fit/100% ignore AMB) | VIEW | no | no | none (re-read) | T-zoom-in |
| Zoom Out | `view.zoomOut` | Ctrl+- / menu / palette / Zoom-tool Alt? / wheel | decrease zoom **[AMB-S04-002]** | VIEW | no | no | none | T-zoom-out |
| 100% | `view.zoom100` | Ctrl+1 / menu / palette | `zoom = 1.0`; pan/rotate unchanged | VIEW | no | no | none | T-zoom-100 |
| Fit in Window | `view.zoomFit` | Ctrl+0 / menu / palette | set zoom+pan so the **stage rectangle** fits the stage host (pasteboard may clip) | VIEW | no | no | none | T-zoom-fit |

Four commandIds (four semantic actions). Wheel is **not** a fifth command —
it invokes `view.zoomIn` / `view.zoomOut` (INV-CMD-4 / §30 single-commandId).

**Zoom-tool click behavior** (SYS-13 owns the tool; H01 owns the resulting
command): click = `view.zoomIn`; the Blueprint does not specify Alt-click =
zoom out. Alt-click zoom-out is `[ADOBE FEATURE — NOT IN BLUEPRINT]` — do
**not** implement unless decided. Wheel still maps to the two commandIds.

---

## 5. Semantics (binding)

### 5.1 Zoom In / Out

- Changes `zoom` only. Does not mutate nodes, camera, or document settings.
- Anchor: SOURCE DOES NOT ESTABLISH (view center vs pointer).  
  **RECOMMENDATION — NOT AUTHORITATIVE:** shortcut/menu = view center; wheel =
  pointer position. Pointer-anchor is a common expectation but **not** in the
  corpus — if implemented, label it `[INFERENCE]` in the impl report; do not
  write it as a normative H01 field. Registered as part of AMB-S04-002
  (step) — anchor stays a labelled recommendation so AI-02 does not have to
  guess a *required* anchor.
- At clamp bounds the command is FUNCTIONAL and idempotent (no error toast).

### 5.2 100%

`zoom = 1`. Pan and rotate-view are **unchanged** (source silent on reset-all;
only “100%” is named).

### 5.3 Fit in Window

Fit the **stage** (`settings.width` × `settings.height`), not the selection
and not the pasteboard. SOURCE DOES NOT ESTABLISH padding. A non-zero inset
is allowed as impl detail if documented; 0 padding is also legal.

### 5.4 Pan (state owned here; gesture owned by SYS-13)

- Space-drag or Hand tool pans `panX/panY`.
- Not a Command. Not dirty. Not undoable.
- Does not move objects (object move = SYS-22 / SYS-03).

### 5.5 Rotate-view (state owned here; tool = SYS-13 Stage Rotate)

- `rotateView` is a view-only rotation of the canvas.
- Distinct from `Transform.rotation` (Part 04) and camera rotation (Part 16).
- No View-menu item is named for it (only the tool + §1.4.1). No extra menu
  row is invented.

---

## 6. Wheel

Part 01 §1.17: zoom via **wheel**. Host = stage region (SYS-14).  
Delta sign: SOURCE DOES NOT ESTABLISH (wheel-up = in is the usual reading).
**RECOMMENDATION — NOT AUTHORITATIVE:** wheel-up / trackpad-pinch-out =
`view.zoomIn`. Ctrl/Cmd+wheel is **not** specified as distinct from wheel;
do not require a modifier.

---

## 7. Cross-handoffs

| Direction | Contract |
|---|---|
| H01 → SYS-14 | Stage applies viewport when drawing; wheel hits the stage host and runs the same commandIds |
| H01 → SYS-13 | Hand/Zoom/Stage Rotate write this state; they do not store a parallel zoom |
| H01 → SYS-25 | Camera composes **after** (or as a separate matrix) — renderer order §1.4.2 item 6. Do not add camera fields to Viewport |
| H01 → SYS-27 | Export uses document + camera, **not** Viewport (INV-VIEW-4) |

---

## 8. Accessibility

- Commands are menu + shortcut + palette (C-03).
- Zoom factor SHOULD be announced on `st` or aria-live if a cell exists;
  SYS-01 status inventory has **no zoom cell**. Do not invent a 13th cell.
  Palette/toast MAY announce “100%” / “Fit” (non-normative).

---

## 9. Edge cases

| # | Case | Expected | testId |
|---|---|---|---|
| 1 | Ctrl+= twice then Ctrl+1 | back to 100% | T-zoom-100 |
| 2 | Fit then 100% | 100%, not fit | T-zoom-fit-then-100 |
| 3 | Zoom does not dirty | `dirty` unchanged | T-zoom-no-dirty |
| 4 | Zoom not in History | undo stack unchanged | T-zoom-no-undo |
| 5 | Reload / Open | viewport reset (not in file) | T-zoom-reload |
| 6 | Wheel on stage | same commandId as menu | T-zoom-wheel-same-id |
| 7 | Zoom does not change camera | camera fields unchanged | T-zoom-not-camera |
| 8 | No stage host | Fit UNAVAILABLE / toast | T-zoom-fit-no-host |

---

## 10. Ambiguity

| AMB | Status |
|---|---|
| AMB-S04-002 zoom step (+ optional pointer-anchor recommendation) | **OPEN** — blocks a numeric Zoom In/Out implementation from being called spec-complete |

H01 commands other than the **amount** are specified.

---

*H01 done (REVISION REQUIRED on AMB-S04-002). Next: H02.*
