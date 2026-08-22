# 02 — ADOBE “HOW TO USE THE TIMELINE” → KINEORA

**Source:** Adobe Help — *How to use the timeline in Animate* (user paste, “Last updated on 9 June 2026”).  
**Tag:** **[ADOBE]**.  
**Rule:** Adobe ≠ Kineora requirement. Blueprint wins. Each row: **Kineora target**.

Maintenance-mode note (Adobe will not add features) is **ignored** as a product decision.

---

## A. What Adobe says the timeline IS

| Adobe | Kineora Blueprint | Code today | Target for 2D |
|---|---|---|---|
| Organizes content over time in **layers and frames** | Part 07 §7.0 clock + score | Scene.layers[].keyframes | KEEP |
| Like film: time = frames; layers = stacked strips | 7.0 / 20.0 | `Scene.layers` bottom→top | KEEP |
| Major parts: **layers, frames, playhead** | 7.1 | split across two components | **UNIFY** |
| Shows FBF, tweened animation, motion paths | 7.2 / 09 / 10 | FBF + classic tween only | motion path LATER |
| Layer controls: hide / show / lock / unlock / outline | 7.1.1 / 20.2 | LayersPanel has them; TimelineStrip only name+✕ | **move controls onto unified row** |
| Drag frames to new location **same or other layer** | 7.4.9 | same-layer sequence move; **not** cross-layer drag | P1 after unify (Blueprint required; verify UI) |

---

## B. Modern timeline chrome (Adobe “new timeline”)

| Adobe control | Blueprint | Code | Kineora target |
|---|---|---|---|
| Clearer frame interval | F-07-03 adaptive numbers | `rulerInterval` 1/2/5/10 by cellW | KEEP |
| Better frame/time marker | Adobe shows **seconds + fps** | readout = `frame N / cells` only — **no seconds** | Blueprint 7.1.5 “elapsed time” → **P0 add `frame · time = (frame-1)/fps`** (derived, not stored) |
| Enhanced onion | Part 15 | **none** | LATER (continue pack) |
| Buttons: keyframe / blank | 7.4.2 / 7.4.3 | TimelineStrip Key / Blank | KEEP on unified header |
| Richer header (extra functions upfront) | 7.1.5 bottom row | two toolbars on TimelineStrip | KEEP; do not invent extra Adobe-only groups |

---

## C. Layer view toggle (Adobe: multi-layer vs current-layer-only)

| Adobe | Blueprint | Code | Target |
|---|---|---|---|
| Icon upper-left: all layers vs **active layer only** | **SILENT** | none | **AMB-TL-001** — do not build until decided. Not needed for first 2D ship. |

---

## D. Camera / Layer parenting view / Layer depth (Adobe Advanced Layers)

| Adobe | Blueprint | Code | Target |
|---|---|---|---|
| Camera button on timeline | Part 16 / SYS-25 | none | **OUT** this pack |
| Layer parenting view | 20.5 WISH W2 | `parent_id` = folder only | **OUT** (do not reuse folder parent as transform parent) |
| Layer depth panel | Part 16 zDepth | none | **OUT** |

---

## E. Playhead + “actual fps while playing”

| Adobe | Blueprint | Code | Target |
|---|---|---|---|
| Blue playhead (Adobe) / red (Kineora) | 7.1.3 red line + handle | red `#e33` | KEEP Kineora red (Blueprint, not Adobe color) |
| Click header / drag handle | 7.1.2 / 7.1.3 | implemented | KEEP |
| During play, show **actual** fps (may differ from doc fps) | **SILENT** | not shown | **AMB-TL-002**. Doc fps already on StatusBar. Do not invent a second fps meter this increment. |

---

## F. Onion skinning (Adobe revamp)

Adobe: toggle; range markers; right-click exclude frames; keyframes-only; start opacity; decrease-by; constraints; outline colors.

| Piece | Blueprint | Code | Target |
|---|---|---|---|
| Onion toggle | 7.1.5 / Part 15 | **absent** | **P1 / continue research** — do not fake ghosts |
| Edit Multiple Frames | 7.1.5 / F-15 | **absent** | continue research |
| Onion advanced panel | Part 15 | absent | continue |

**Do not** implement onion in the unify increment.

---

## G. Create Tween button (Adobe long-press menu)

Adobe: hold Create Tween → pick type; click creates last-used type on selected span.

| Type | Blueprint | Code | Target |
|---|---|---|---|
| Classic tween | 7.4.15 / 09.2 | `~ Tween` + engine `SetClassicTween` | KEEP |
| Motion tween | 09.1 | DEFERRED command | honest DEFERRED — no fake |
| Shape tween | 09.3 | DEFERRED | honest DEFERRED |

Unify: keep classic button. Do **not** add Adobe’s grouped long-press until motion/shape exist.

---

## H. Appearance / docking / resize

| Adobe | Blueprint / C-08 | Code | Target |
|---|---|---|---|
| Default **below** document | C-08 bottom, min 96px, max 60% vh | TimelineStrip bottom; Layers left | **Timeline stays bottom**; layer **column is inside it**, not a second dock |
| Float / dock to any panel | SYS-01 docking SPEC-ONLY | not implemented | **OUT** (do not absorb SYS-01 docking) |
| Hide timeline | Window ▸ Timeline / Ctrl+Alt+T | `panel.show/hide('timeline')` | KEEP |
| Resize | C-08 tl.resize | splitter above timeline | KEEP |
| Drag bar between **layer names and frames** | 7.5 implied; Adobe yes | TimelineStrip `NAME_W = 92` **fixed** | **P0** for unify: a **vertical splitter** between name column and grid (min/max clamp, persist in workspace prefs — not document) |
| Frame View menu: Large/Medium/Short rows | 20.0 `height` field | `ROW_H = 22` fixed | **AMB-TL-003** default 22. Persist as **view pref** (Blueprint `height` on layer is per-layer — Adobe per-layer height). Do not invent per-layer heights this increment. |
| Preview thumbnails in cells | Adobe option | none | **NOT REQUIRED** (Blueprint silent) |
| Header top vs footer | Adobe | header is **above** grid | KEEP (already header-top) |
| Timeline zoom slider | F-07-03 | − / + 50/100/200/400% | KEEP discrete steps; Adobe slider not required |

---

## I. Layer coloring and pinning

Adobe: click dot after name → pin + underline in outline color.

| Blueprint | Code | Target |
|---|---|---|
| outline color exists (20.0 / F-20-01 `#ff0000`) | LayersPanel swatch + outline mode | KEEP outline. **Pin/underline** = Adobe-only → **AMB-TL-004**, not P0. |

---

## J. Layer opacity / “Show Others as Transparent”

Adobe: Shift+click eye = opacity; Properties Visibility>Opacity; Show Others as Transparent.

| Blueprint | Code | Target |
|---|---|---|
| F-07-02 E5 Shift+eye transparent + numeric opacity = **L.2 later** | Alt+click others; **no** Shift-transparent; **no** opacity field | **OUT** this pack (already deferred in AI-C report). Do not invent opacity. |

---

## K. Time along with frames

Adobe: timeline shows **seconds** with frame numbers; example 20 fps.

| Blueprint 7.1.5 | Code | Target |
|---|---|---|
| Status: current frame, fps, **elapsed time** | frame number only on strip; fps on StatusBar | **P0:** show `t = (playhead - 1) / fps` as `0.00s` next to frame (view-only). Ruler stays frame numbers (Blueprint 7.1.2). Do **not** replace frame numbers with seconds. |

---

## L. Managing animation speed (Adobe “scale frame spans”)

Adobe:

1. Change fps **without** changing duration (scale spans).
2. Convert span to 1s/2s/3s interval (classic/shape/motion/key/blank).
3. Expand frame span by N.
4. Drag right edge of selection to ×2 / ×3 duration.

| Item | Blueprint | Code | Target |
|---|---|---|---|
| fps change | Settings.fps 1–120, undoable | `set_document_settings` — **does not scale spans** | Changing fps **already** changes real-time speed (playback uses `1000/fps`). That matches “faster/slower playback, same frame count”. Adobe’s **optional** “scale spans to keep wall-clock” is **[ADOBE]** extra. **AMB-TL-005** — do not add a Scale Frame Spans checkbox. |
| Time-interval bake | 7.4.12 convert-to-keys exists | convert exists; **not** “every 1s” | **AMB-TL-006** |
| Expand by N / drag ×2 | 7.4.11 span-edge resize | `resizeSpan` one span | Multi-span ×2 stretch = **not specified** → do not invent |

---

## M. Navigation

| Adobe | Blueprint | Code | Target |
|---|---|---|---|
| Step back/forward 1 frame; hold → first/last | 7.1.5 / 29.6 | `.` `,` Home End; buttons ⏮ ⏭ | KEEP |
| Play | Enter | `timeline.play` | KEEP (Control menu / existing) |
| Keyframe hop Alt+./, | 29.6 | implemented | KEEP |
| Page nav Alt+Shift+./, | **SILENT** | none | **AMB-TL-007** do not add |
| Layer-row left/right keyframe chevrons | Adobe | none | not required |

---

## N. Insert frames/keyframes (Adobe glow)

| Adobe | Blueprint | Code | Target |
|---|---|---|---|
| Header button group: Key / Blank / Frame / Auto Keyframe | 7.4.1–3 | Key, Blank, +Frame, −Frame, Clear | KEEP. **Auto Keyframe** = F-08-12; engine already `ensure_keyframe` silently. Toast-on-auto-key is Blueprint tools T2A.1.16 — **not** a timeline chrome item this pack. |
| Visual glow on insert | **SILENT** | none | optional polish, not a requirement |

---

## O. Active layer only mode

Same as §C. **AMB-TL-001**.

---

## P. Pan timeline from Stage / Time Scrubber

Adobe: Hand slides timeline horizontally; Time Scrubber (grouped with Hand) Space+T, drag on **stage** to scrub.

| Blueprint | Code | Target |
|---|---|---|
| Time Scrubber T2D.7 P2; Hand T2D.4 | middle-button **stage pan** (viewport); no timeline-hand; no Space+T | Tools pack: Hand/Zoom. **Do not** add Time Scrubber in unify. Stage middle-pan stays viewport. |

---

## Q. Customizable Timeline Toolbar

Adobe hamburger → Customize Timeline Tools; grouped Keyframe/Tween buttons; Reset.

| Blueprint | Code | Target |
|---|---|---|
| **SILENT** | fixed two header rows | **AMB-TL-008** — keep fixed toolbar. Do not build a customizer. |

---

## R. Loop range (Adobe)

Adobe: drag a loop section; export that range; loop streaming audio in range.

| Blueprint | Code | Target |
|---|---|---|
| Loop toggle 7.1.5 (on/off, whole duration) | loop ON wraps 1..duration | KEEP whole-doc loop. **In/out loop range** = **AMB-TL-009** (Blueprint silent). |

---

## S. Color of playhead

Adobe blue vs Kineora red: **Blueprint 7.1.3 red wins.**

---

## Translation summary (what coding may do after this pack)

**P0 unify (this campaign’s code phase):**

1. One bottom panel: layer chrome | splitter | frame grid; one row per layer.
2. Shared scroll + shared row height.
3. Time readout `(frame-1)/fps`.
4. Folder/frame-op guards already specified in LAYER research (B-1…B-5).

**Explicitly not from this Adobe page:**

Camera, parenting view, depth, onion, EMF, fps-span-scale, custom toolbar, active-layer-only, Time Scrubber, loop-range, Shift-eye opacity, pin-color, thumbnail preview, per-layer height (until AMB-TL-003).
