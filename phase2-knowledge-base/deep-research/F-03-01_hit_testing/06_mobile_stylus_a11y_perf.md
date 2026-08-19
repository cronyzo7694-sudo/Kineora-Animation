# F-03-01 — S. MOBILE · T. STYLUS · U. ACCESSIBILITY · V. PERFORMANCE

---

## S. MOBILE (desktop → mobile equivalents)

Do NOT shrink the desktop UI; re-map the *gesture* (blueprint Part 31).

| Desktop | Mobile equivalent | Notes |
|---|---|---|
| Click | **Tap** | hit tolerance enlarged to ~20–24 px (finger, not a 1-px cursor) |
| Click (select) + Shift | **Select mode toggle** (toolbar): each tap toggles membership | no keyboard Shift |
| Marquee (drag on empty) | **One-finger drag on empty** | two-finger = pan, so no conflict |
| Lasso | Lasso tool finger trace | — |
| Double-click (group/symbol drill) | **Double-tap** | also a "Descend" toolbar button |
| Double-click fill (grab fill+stroke) | **Double-tap the fill** | keep same semantics |
| Right-click | **Long-press (~500 ms)** → context menu at the hit target | — |
| Hover (see what's under cursor) | **Press-and-hold preview** (highlight before commit) | replaces hover affordance |
| Select All (Ctrl+A) | toolbar **Select All** button | — |
| Deselect (click empty) | **Tap empty** | — |
| Ctrl/Cmd temp-Selection | not needed (V button is always reachable) | — |
| Nudge selection | **Nudge buttons** (bottom toolbar) | replaces arrows |

**Precision:** hit testing near anchors/edges uses the **finger-offset loupe** so the finger never covers the target (blueprint Part 31.2.1). A "**region-select lock**" toggle (L.1) prevents marquee from splitting raw shapes on touch, where accidental partial drags are common.

---

## T. STYLUS

| Aspect | Behavior |
|---|---|
| Tap/drag | identical to mouse (hit test unaffected by pressure/tilt) |
| Pressure | **no** effect on hit testing (only on stroke width when drawing) |
| Tilt | no effect on hit testing |
| Hover (in-range) | shows cursor; **no** selection happens on hover |
| Barrel button | = right-click → context menu at the hit target |
| Palm rejection | must be enabled so palm contact doesn't marquee-select or tap-select |
| Precision | stylus uses the **desktop** (1-px) hit tolerance, not the 20–24 px finger tolerance |

**Status:** hit testing is fully stylus-compatible on Windows (Wacom/Windows Ink) and macOS; Linux depends on the tablet stack (libinput/Wacom driver) — our app must verify pressure/tilt availability and **degrade gracefully** (constant width if unsupported).

---

## U. ACCESSIBILITY

| Concern | Requirement |
|---|---|
| Keyboard navigation | `Ctrl/Cmd+A` select-all; arrow nudge; a **keyboard "walk selection"** (Tab through selectable objects in z-order) — our addition (P2) because Animate lacks it |
| Focus | selected object gets a **focus ring** distinct from the selection box |
| Labels/tooltips | every selectable affordance has an accessible name; hit-feedback announced (ARIA live region for "3 objects selected") |
| Screen reader relevance | selection count + object type announced on change |
| Touch target size | ≥ 44 px for selection-mode controls (not for canvas content itself) |
| Contrast | selection highlight color meets WCAG AA against the stage background; user-configurable (Animate allows custom bounding-box colors — E/blueprint) |
| Reduced motion | marquee/preview animations disabled under `prefers-reduced-motion` |

---

## V. PERFORMANCE

| Scenario | Cost | Mitigation |
|---|---|---|
| Large object count (10k+) | per-click O(n) naive | **spatial index** (R-tree/quadtree per layer); O(log n) query; rebuild on content dirty only |
| Click during playback | re-resolve at current frame | index per frame-cache; only changed frames rebuild |
| Marquee over many objects | O(n) bounds test | index range query + precise test only for candidates |
| Deep symbol nesting | recursion per hit | early-out: containers hit-tested as bounds first; descend only on edit-in-place |
| Many keyframes | no cost (hit = current frame only) | — |
| Heavy rigs (bones) | bones are few (≤ dozens) | linear scan is fine |
| High-res assets | bitmap bounds test O(1) | alpha-precise test (L.7) only when enabled |
| Mobile | touch tolerance → larger candidate sets | same index; candidate expansion by tolerance |
| Transformed-bounds cache | recompute on change | cache per node; invalidate on transform write |

**Budget:** hit test < 1 ms at 10k objects (blueprint Part 36.1).
