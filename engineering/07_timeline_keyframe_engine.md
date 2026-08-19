# 07_TIMELINE_KEYFRAME_ENGINE — MOD-TIMELINE · MOD-FRAME · MOD-KEYFRAME

## Frame/time conversion (REQ-DOC-002)
```
time(ms) = frame / fps * 1000          frame = round(ms/1000 * fps)
audioFrames = ceil(durationMs/1000 * fps)      // waveform extent (F-17-07)
```
fps change: frames invariant; durations recomputed (documented, no silent rescale).

## MOD-FRAME — sparse storage + hold rule (REQ-TIM-001)
```
contentAt(layer, f):
  k = binarySearch(layer.frames, f)        // nearest keyframe ≤ f
  case k.kind:
    keyframe → k.content                    // held
    blankKeyframe → empty
    tween → MOD-TWEEN.sample(k, f)
    pose → MOD-POSE.sample(k, f)
  // no keyframe ≤ f → empty
```
- `duration(layer) = max(frameEnd(k))`; `duration(timeline) = max(layers)`.
- Frame ops mutate the sparse array only (insert/delete/move/copy/reverse/convert); held frames derive (never stored).
- Ops implement REQ-TIM-003 semantics (Delete shifts-left / Clear keeps length / Remove leaves gap — three distinct commands).

## MOD-TIMELINE — transport & scrub (REQ-TIM-004)
- rAF tick throttled to fps; `seek` clamps to [1,duration]; scrub throttled ~60Hz + audio sync (Stream plays at scrub position).
- Double-click playhead = select column (F-07-04 E3); Alt+,/. = keyframe hop without selection (F-03-08 E4).

## MOD-KEYFRAME — interpolation (REQ-KF-002)
```
value(t) = lerp(v0, v1, ease(normalize(t)))     // t∈[f0,f1]
rotation: shortest-path (auto) | CW/CCW + rotations*360
color: OKLab lerp (ENG-009) · scale: log-lerp (Part 08.3.3)
symbol swap: discrete (no interp)
camera zoom: log-lerp (ENG-010) · bones: per-joint angle lerp (ENG-008)
```
Per-property key arrays inside motion spans (x/y/scale/rotation/skew/alpha/tint/filter.*); set-value-at-playhead creates/updates (REQ-KF-003).

## Timeline visual language → component (C-08)
`TimelineCell` variant resolver: `(frame, layer, playhead, selection, onion)` → glyph (dot/hollow/diamond/gray/white/hollow-rect/blue/light-green/green/dashed/flag/a) + tooltip (diamond=property key vs dot=standard key, F-07-05 L.1). Colorblind pattern mode (F-07-05 L.2).

## Frame selection (dual-domain; F-03-08)
- frame-based default; span-based opt-in (hamburger) — F-03-04 C2 corrected.
- drag=range, Shift+click=contiguous add, Ctrl/Cmd+click=non-contiguous.
- frame-click selects content (toggle gated, L.1 fix); stage↔timeline sync toggle default OFF (F-03-02 L.2 fix).

## Layer row controls (C-08 / F-07-02)
eye (Alt=others, drag=multiple, Shift=transparent) · lock (Alt=others) · outline (Alt=others) · name (dbl rename) · type icon (dbl = Layer Properties) · attach-dot (camera) · z-depth (advanced layers).

## Undo / persistence
- All frame/layer ops = commands (05 registry). Transport/selection = view state (no undo).
- Serialization: sparse `frames[]` + layer flags persisted; duration/playhead/ruler-zoom not.

## Acceptance (Given/When/Then)
- **REQ-TIM-001-A**: Given doc@24fps with keyframe@1 and keyframe@25; When playhead@13; Then evaluate returns interpolated state and document data unchanged; undo stack unchanged.
- **REQ-TIM-003-A**: Given keyframe@10; When Delete Frame (Shift+F5) on it; Then later frames shift left and duration shrinks by 1; When Undo; Then frame restored and duration restored.
- **REQ-KF-002-A**: Given rotation keys 350°@1 and 10°@25; Then tween rotates 20° shortest-path (not 340°).
- **REQ-KF-003-A**: Given motion span, playhead@13 (non-key); When set x; Then property key created@13 and x/y independent keys (y unchanged).

## Performance
- sparse lookup O(log n); frame-op O(1) per keyframe + shift amortized; tick ≤1ms [ENGINEERING TARGET].
