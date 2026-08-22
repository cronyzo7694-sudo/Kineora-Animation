# 08 — ONION SKIN (frame-by-frame ghosts)

```
PHASE:     RESEARCH ONLY
AUTHORITY: Blueprint 15.2 > F-15-02/03 > engineering 06 overlay pass > Adobe > C-19 (paper)
CODE:      ZERO onion symbols in animator/ (grep 2026-08-23). C-08/C-19 “FUNCTIONAL” = false.
```

---

## 1. Why this is in the 2D-animation pack

FBF loop (Blueprint 15.1):

```
draw @1 → F6/F7 next → onion (see ghosts) → redraw → F5 hold → play
```

F6/F7/F5/play/step **already exist**. The missing piece that makes in-betweens usable is **onion**. Unify (files 04–07) can ship without onion. **Onion is the next feature after unify**, not inside it.

---

## 2. What onion IS (locked)

Onion = an **authoring render pass** that draws neighboring frames’ **evaluated content** under the current frame, tinted + faded.

| Rule | Source | Coding implication |
|---|---|---|
| Ghosts are **not** document data | 15.2.2 / eng 06 L1 overlay | **view state only** — no `Document` field |
| Ghosts **never export** | 15.2.2 / REQ-EXP-002 | `renderContent` / `exportSvg` must not see them |
| Ghosts **not selectable / not editable** (except EMF, file 09) | 15.2.2 | hit-test / selectAt use **playhead evaluate only** |
| Current frame = full color, on top | 15.2.2 / F-15-02 E1 | draw ghosts first, then `evaluate(playhead)` |
| Past tint ≠ future tint | 15.2.2 | two colors |
| Only **keyframe drawings** need a unique ghost | 15.2.2 | held frames = same content as their key — skip re-evaluate if you want; **showing** the hold is correct (same picture) |
| Tween spans: ghost the **computed** frame | F-15-03 M.2 | call `evaluate(doc, scene, f)` — already interpolates classic tween |
| Hidden layers do not ghost | Part 20.2 + B-1 | same `evaluate` visibility rules |
| Locked layers **do** ghost (they still render) | 20.2 | evaluate already includes locked |
| Folder rows have no content | model | nothing to ghost |

---

## 3. Controls (Blueprint 15.2.1) vs code vs first ship

| Control | Blueprint | F-15-02 | Code | First 2D ship? |
|---|---|---|---|---|
| Onion Skin toggle | YES | E1 | **none** | **YES — P1** |
| Onion Outlines | YES | E2/E5 | none | YES — P1 (reuse stroke-only path already used for layer outline) |
| Edit Multiple Frames | YES | E3 | none | file 09 — **not** in first onion increment |
| Modify Markers (Always / Anchor / Onion 2 / 5 / All) | YES | E3 | none | P1: **Onion 2 default + Anchor + All**. “Always show markers” = visual only |
| Start/End markers on ruler | YES | E3 drag | none | **YES — P1** |
| Ctrl/Cmd+drag both markers | Adobe E3 | E3 | — | YES if cheap (same handler) |
| Shift+drag markers = **loop range** | Adobe E3 | E3 | we have no loop range (AMB-TL-009) | **NO** — do not steal Shift for a feature we refused |
| Right-click frame exclude/include | Adobe E2 | E2 | — | P2 (F-15-03 L.2 persist exclude = P2). First ship: no exclude |
| Starting opacity + decrease-by | Adobe E2 + “our app” slider | E2 | — | **YES — P1** (view prefs) |
| Past / Future tint | 15.2.2 + prefs | E2 | — | **YES — P1** defaults; picker = prefs later |
| Hover span = outline preview | Adobe E2 | TS-12 | — | **NO** first ship (Adobe extra) |
| Shortcut O / Shift+O / Alt+O | 15.3 / F-15-04 E3 **[OUR DESIGN]** | E3 | `O` unused (`Ctrl+O` = Open) | **YES** bind O = toggle, Shift+O = outlines. Alt+O = EMF — only when EMF exists |

---

## 4. State (view / SESSION — not document)

Proposed shape (coding later; **not** a new bus event):

```
onion: {
  on: boolean                 // default false
  outlines: boolean           // default false
  mode: 'follow' | 'anchor'   // follow = markers travel with playhead
  prev: number                // frames before playhead (default 2)
  next: number                // frames after  (default 2)
  // when mode==='anchor':
  start: number               // inclusive frame
  end: number
  startOpacity: number        // 0..1, default — AMB-TL-014
  decreaseBy: number          // 0..1 per step, default — AMB-TL-015
  pastTint: string            // default — AMB-TL-016
  futureTint: string
}
```

Persist: **app prefs** (`kineora.workspace` or `kineora.onion`) — Blueprint 15 does not put onion in Part 33 document. Reload restores toggle/range prefs. **Not** in project JSON.

Playhead move:

- `follow`: `start = playhead - prev`, `end = playhead + next`, clamp to ≥1 (F-15-03 M.1).
- `anchor`: start/end stay put; playhead can leave the range (then no “current” overlap — current still full color).

“Onion All”: `start = 1`, `end = duration`, still skip drawing playhead twice.

“Onion 5”: prev=next=5.

---

## 5. Range math (locked)

```
effectiveStart = max(1, mode==follow ? playhead - prev : start)
effectiveEnd   = max(effectiveStart, mode==follow ? playhead + next : end)

for f in [effectiveStart .. effectiveEnd]:
  if f == playhead: skip (drawn in content pass)
  items = evaluate(scene, f)          // existing engine
  alpha = startOpacity * (1 - decreaseBy)^distance
  distance = |f - playhead|
  tint = f < playhead ? pastTint : futureTint
  draw ghost(items, tint, alpha, outlines)
```

If `alpha <= 0`, skip that frame (cheap).

Empty range / onion off → zero extra evaluate.

---

## 6. Where it hooks in code (when we code)

| Place | Job |
|---|---|
| `viewPrefs.ts` or new `onionPrefs.ts` | load/save SESSION prefs |
| `commands.ts` | `view.onion` FUNCTIONAL, shortcut `O`; `view.onionOutlines` Shift+O |
| Timeline header | toggle button + marker handles on **ruler** (same `timeline-ruler`) |
| `Stage.tsx` render effect | if onion.on: for each f ≠ playhead in range, `evaluate(f)` → pass ghosts into renderer |
| `canvasRenderer.ts` `RenderState` | add `onionGhosts?: { items, tint, alpha, outlines }[]` — **editor `render()` only** |
| `renderContent` / `rasterizeContent` / Rust `export_svg` | **untouched** |
| hit-test / `selectAt` | still `evaluate(playhead)` only |

**Do not** add Rust onion. `evaluate(frame)` already exists.

**Do not** emit `document:changed` when toggling onion (view only). Optional: no new bus event; Stage already ticks on playhead.

---

## 7. Visual on the timeline ruler (P1)

When onion ON:

- A **bracket** or shaded band from `effectiveStart` to `effectiveEnd` on the ruler (under frame numbers, above cells).
- Two drag handles (start / end).
- Current playhead stays the red line (Blueprint 7.1.3).

Adobe “blue playhead” does not apply.

Markers are **view**; they are not frame selection.

---

## 8. Interaction with other systems

| System | Rule |
|---|---|
| Playback | onion may stay on; ghosts update each tick. If too slow, **AMB-TL-017** (pause ghosts while playing). Do not invent a freeze until measured. |
| Classic tween | ghost interpolated frames (M.2) |
| Symbols | `evaluate` already expands instances — ghosts show nested graphic at that parent frame |
| Layer outline | ghost uses the same `outline_color` path if that layer is in outline mode |
| View ▸ Outline preview | onion outlines = stroke-only ghosts (independent of layer outline) |
| Hide Edges | hides **selection** overlay, not onion (WISH W6 is selection). Onion stays. |
| Multi-doc | onion prefs are app-level; range follows **active** doc playhead |

---

## 9. Ambiguities (onion)

| ID | Question | Coding until closed |
|---|---|---|
| **AMB-TL-014** | Default start opacity | F-15-02 silent on number. Recommendation **0.5** — not authoritative. Use 0.5 if shipping P1; do not bikeshed. |
| **AMB-TL-015** | Default decrease-by | Adobe has a slider; no number. Recommendation **0.2** per frame step. |
| **AMB-TL-016** | Default hex tints | Blueprint “red-ish / green-ish”. Recommendation past `#ff6666`, future `#66cc66`. Not a product ceremony. |
| **AMB-TL-017** | Onion during Play | unspecified | keep on; drop only if a measured jank bug |
| **AMB-TL-018** | Onion all layers vs active layer only | 15.2.2 “per current layer (or all — our default: all)” | **default ALL**. No toggle until someone asks. |
| **AMB-TL-019** | Present-frame tint (Adobe 3 swatches) | Blueprint: current = full color | **no present tint** |

Recommendations in 014–016 are **implementation defaults**, tagged so they can be changed without a schema fight. They are not new features.

---

## 10. Do not invent

- Onion as a document field / command / undo entry  
- Ghosts in export, GIF, HTML5 publish  
- Selecting a ghost  
- Per-frame exclude in P1  
- Shift+drag markers → loop range  
- Hover-preview  
- Bitmap cache in P1 (only rects today; extra `evaluate` is cheap). Cache is F-15-03 “ours” for long FBF — add when node counts hurt.  
- New `onion:changed` bus event (Stage can read prefs + playhead)

---

## 11. Acceptance (when coded)

1. O toggles ghosts; Stage shows prev/future; current stays opaque.  
2. Export PNG/SVG identical with onion on or off.  
3. Click a ghost on Stage → selects **current-frame** object under it, or miss — **never** a past-frame node.  
4. Default range ±2 (F-15-02 E4).  
5. Drag start marker; ghosts update; no undo entry.  
6. Anchor: scrub playhead; band stays; ghosts stay those frames.  
7. Hidden layer: no ghost of its content.  
8. Classic tween mid-span ghost is interpolated (not the start key).  
9. Shift+O outlines only.  
10. Ctrl+Z after a draw does **not** toggle onion.

---

## 12. Honest status

**SPECIFIED (Part 15 / F-15-02). IMPL = ABSENT. C-19 ≠ shipped.**  
Not COMPLETE. Not in the unify increment.
