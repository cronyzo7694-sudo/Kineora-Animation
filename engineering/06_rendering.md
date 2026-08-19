# 06_RENDERING — PIPELINE & OVERLAY SEPARATION

## Pipeline (authoring = playback = export; REQ-SYS-003)
```
evaluate(doc, time, opts) →
  scene = activeScene(doc)
  for layer in scene.layers (bottom→top):
      if !visible: continue
      frame = layer.frameAt(time)              // hold rule (MOD-FRAME)
      content = frameContent(frame)             // keyframe content or tween sample (MOD-TWEEN)
      nodes = resolveNesting(content, time)     // MOD-SYMBOL recursion (graphic-sync / clip-free)
      apply layer transform/parenting           // MOD-LAYER
      if layer masked: clip later               // MOD-MASK
  composite = merge layers (respect zDepth)     // MOD-CAMERA parallax sort back→front
  applyCamera(composite, camera(time))          // MOD-CAMERA
  → RenderTree (draw commands: fill/stroke/text/bitmap/brush/warp mesh)
Renderer(RenderTree, view) → pixels             // MOD-RENDER (view zoom/pan/rotate only)
```

## Render node kinds (MOD-RENDER consumes)
fill(path,style) · stroke(outlinePolygon,style) · textRun(glyphAtlas) · bitmap(buffer,rect) · brushStroke(tessellated) · warpMesh(triangles,uv) · maskGroup · composite(children).

## Authoring overlays vs export (REQ-EXP-002 — hard separation)
| Pass | Contents | Exported |
|---|---|---|
| Content pass | fills/strokes/text/bitmaps/brushes/warp/camera | YES |
| Overlay pass (L1) | selection outline, dotted fill, bounding box, transform handles, anchors, bone glyphs, constraint wedges, warp pins, camera border, guides, grid, onion ghosts, motion path | **NEVER** |
`evaluate(...,{export:true})` skips the overlay pass entirely. Overlays are drawn from `selection`/`editMode`/view state — they have no model presence (REQ-SEL-005), so they cannot leak into export.

## Caching (MOD-CACHE)
- Per-layer offscreen cache keyed by `(layerId, frameRangeHash)`; invalidated on `document:changed` touching that layer.
- Dirty-region: only changed layers re-rasterize; pan/zoom/camera re-composite cached layers (GPU transform).
- Onion ghosts = per-frame cached bitmaps (F-15-03).
- Tessellation cache keyed by path hash (MOD-VECTOR).

## Performance targets [ENGINEERING TARGET]
- Playback: ≤16 ms/frame total (60 fps) on integrated GPU.
- Hit-test: <1 ms @10k objects (spatial index).
- Layer cache invalidation: O(changed layers), not O(layers).
- Depth cap 32 on symbol recursion (RSK-002).

## Failure
- Shader/cache miss → fallback Canvas2D (ENG-002).
- Offscreen memory pressure → evict LRU caches + degrade to outline mode (RSK-006).

## Tests (pointer into 15_testing_acceptance.md)
- TS-RENDER-001: overlay never in export (diff export vs authoring frame).
- TS-RENDER-002: deterministic evaluate (two runs → identical draw-command list).
- TS-RENDER-003: mask stencil/alpha/boolean parity.
- TS-RENDER-004: camera parallax back-to-front order.
- TS-RENDER-005: dirty-region invalidates only touched layers.
