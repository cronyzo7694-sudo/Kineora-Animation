# 10 — EXPOSURE + ADOBE “MANAGE ANIMATION SPEED”

```
PHASE:     RESEARCH ONLY
AUTHORITY: Blueprint 15.4 / 7.3 / 7.4.11 · F-15-05 · engineering 07 · Adobe page §“Managing animation speed”
CODE:      hold rule + F5/Shift+F5 + resizeSpan EXIST. fps-rescale / ×2-span / hold-N dialog DO NOT.
```

---

## 1. Exposure (ones / twos / threes) — already mostly shipped

Blueprint 15.4 = hold length. That **is** Part 07.3.

| Artist words | Engine today |
|---|---|
| On ones | each drawing is a key; no hold (or hold 1) |
| On twos | F5 once after a key, or span-edge +1 |
| On threes | F5 twice / span-edge +2 |

**Exists:**

- Hold rule (`content_at` / `node_states_at`)
- F5 extend hold (shift later keys)
- Shift+F5 shorten
- Span-edge drag (`resize_span`, min exposure 1)
- Convert to keyframes (bake holds → keys)

**Missing vs F-15-05 “ours”:**

| Extra | Source | First 2D? |
|---|---|---|
| “Hold N frames” dialog | F-15-05 L.1 P2 | **NO** — P2 |
| “Apply to all keyframes” | F-15-05 L.1 P2 | **NO** |
| A toolbar chip “twos” | not in Blueprint 7.1 | **NO** — would invent |

**P0 for 2D:** teach the existing span-edge + F5. No new exposure feature required.

---

## 2. fps change — ALREADY DECIDED (closes AMB-TL-005)

[ENGINEERING] `07_timeline_keyframe_engine.md`:

> **fps change: frames invariant; durations recomputed (documented, no silent rescale).**

Playback uses `1000/fps`. Changing 24 → 12 makes the same 24 frames last 2 seconds instead of 1. **Frame numbers do not move.**

Adobe “Scale Frame Spans” (keep wall-clock, rewrite keys) is the **opposite** policy.

| Policy | Who |
|---|---|
| Frames stay; real time changes | **Kineora engineering 07 — LOCKED** |
| Optional checkbox to scale spans with fps | Adobe only |

**AMB-TL-005 → RESOLVED:** do **not** add Scale Frame Spans. Document Settings fps stays a playback-speed control.

If a human later wants Adobe’s checkbox, that is a **new** AMB, not a silent add.

---

## 3. Adobe “animate based on time intervals” (1s / 2s / 3s)

Adobe: turn a span into keys every 1s/2s/3s (works on classic/shape/motion/key/blank).

| Map | Kineora |
|---|---|
| “every N frames” bake | `convert_to_keyframes` on a range — **exists**, but range is **frames**, not seconds |
| “every 1 second” | = every `fps` frames. **No UI**. AMB-TL-006 stays OPEN / not P0 |

Do not add a “1s/2s/3s” menu. User can select 24 frames @24fps and Convert to Keys.

---

## 4. Adobe “Expand frame span” field + drag ×2 / ×3

| Adobe | Blueprint | Code | Target |
|---|---|---|---|
| Type N → add N frames to selection | silent | no numeric field | **NO** (AMB-TL-021) |
| Drag right edge of **selection** to ×2/×3 whole span | 7.4.11 is **one hold’s** edge | `resizeSpan` one anchor | ×2 of a **multi-key selection** is **not** specified → **NO** |
| Compress back after extend | Adobe | undo | Undo is enough |

Span-edge drag **is** the Blueprint exposure tool. Do not add ×2 badges.

---

## 5. Time readout (already in 02 / 04)

`t = (playhead - 1) / fps` seconds next to the frame number.

Engineering 07: `time(ms) = frame / fps * 1000`. Off-by-one: they use `frame/fps` vs our `(frame-1)/fps`.

**AMB-TL-022:** is frame 1 at `0.00s` or `1/fps`?

- Artists think frame 1 = start = **0s**.  
- Engineering formula as written uses `frame/fps` → frame 1 @24fps = 41.7ms.

**Recommendation (not silent close):** display **`(playhead - 1) / fps`** so frame 1 = 0.00s. Matches “elapsed time from start”. If coding, use this unless Leader says otherwise — tag the choice in the time-readout commit.

---

## 6. Loop + streaming audio in a dragged range

Adobe page: drag a loop section; export that range; loop stream audio inside it.

We already refused loop-in/out (**AMB-TL-009**). Audio = SYS-26 **MISSING**.

**OUT.** Playback loop remains 1..duration.

---

## 7. Coding implications (when we code timeline)

| Work | Increment |
|---|---|
| Time readout | Unify increment 1 (file 07) |
| Span-edge / F5 docs in UI tooltips | optional copy, not a feature |
| Hold-N dialog | P2, not now |
| Scale spans with fps | **never** (AMB-TL-005 closed) |
| ×2 selection stretch | never until specified |

---

## 8. Honest status

Exposure for 2D animation = **IMPLEMENTED + TESTED** (span/F5).  
Adobe speed extras = **NOT REQUIRED**.  
AMB-TL-005 closed by engineering 07. AMB-TL-006 / 021 / 022 remain.
