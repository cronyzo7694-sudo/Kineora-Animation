# 00_ENGINEERING_DECISIONS — DECISION LOG

| ID | Problem | Options | Chosen | Reason | Trade-offs | Affected modules |
|---|---|---|---|---|---|---|
| ENG-001 | App runtime (web vs native) | A: pure web (WASM/Canvas) B: Electron/Tauri hybrid C: native per-OS | **B: single codebase (TS/Canvas+WebGL) shipped as PWA + Tauri/Electron wrappers** | Phase-1 W7 (offline cross-platform) + W4 (web demand); one codebase, two input adapters (F-31) | native perf via wrapper only; heavy GPU work still in renderer | MOD-SHELL, MOD-RENDER, MOD-INPUT |
| ENG-002 | Renderer backend | A: Canvas2D only B: WebGL only C: dual (Canvas2D fallback + WebGL primary) | **C dual** | gradients/filters/mesh-warp need GPU; Canvas2D fallback for compatibility (F-32-01) | dual-path maintenance | MOD-RENDER |
| ENG-003 | Vector representation | A: cubic Bézier only B: quadratic C: both | **A cubic canonical** (importers convert) | Phase-1 Part 05.1.8 | conversion cost at import | MOD-VECTOR |
| ENG-004 | Stroke rendering | A: native line primitives B: outline polygons | **B outline polygons** (width profiles L/R) | variable width + caps/joins + scaling (Part 05.1.3/05.5) | tessellation cost (cached) | MOD-VECTOR, MOD-RENDER |
| ENG-005 | Boolean engine | A: Greiner-Hormann B: Vatti/Clipper C: stencil-trick only | **B Vatti-style polygon clipping (worker)** | robustness + used by merge/eraser/combine (Part 06) | worker messaging | MOD-VECTOR, MOD-SHAPE |
| ENG-006 | IK solver | A: 2-bone analytic only B: CCD C: FABRIK | **A+B+C hybrid**: 2-bone analytic (2-segment), FABRIK (N-segment default), CCD (rotation-dominant) | Part 14.4 spec; determinism | three code paths | MOD-IK |
| ENG-007 | Rig coordinate space | A: world-space angles B: local-space + stable IDs | **B local-space** | W2 (copy/paste/re-parent safe) | solver must compose parents | MOD-RIG, MOD-BONE |
| ENG-008 | Playback IK | A: re-solve per frame B: interpolate stored angles | **B** (author-time solve only) | Part 14.4 (Animate model, deterministic) | off-path look; optional re-solve preview P2 | MOD-IK |
| ENG-009 | Color interpolation space | A: RGB B: OKLab | **B OKLab** | perceptual evenness (Part 08.2) | slight cost | MOD-KEYFRAME |
| ENG-010 | Camera zoom interpolation | A: linear B: log-space | **B log-space** | natural push-ins (Part 16.6) | — | MOD-CAMERA |
| ENG-011 | Frame storage | A: dense per-frame B: sparse keyframes + hold rule | **B sparse** | Part 07.3 (file size, speed) | derivation cost O(log n) | MOD-FRAME |
| ENG-012 | Selection model | A: objectIds only B: dual-domain (stage targets + timeline selection) | **B dual-domain** | F-03-02 (explicit, fixes E10 coupling) | two controllers | MOD-SELECTION |
| ENG-013 | Mask rendering | A: boolean only B: stencil (clip) + mask texture (alpha) + SVG boolean fallback | **B** | Part 21.6 | three paths | MOD-MASK, MOD-RENDER |
| ENG-014 | Undo granularity | A: full snapshots B: command diffs/IDs | **B command pattern + prevSelection restore** | Part 36.2/36.9 | more commands to write | MOD-COMMAND |
| ENG-015 | Lip-sync recognizer | A: bundled model only B: pluggable + default English + confidence | **B pluggable** | Part 18.6.5/18.6.6 | default model quality | MOD-LIPSYNC |
| ENG-016 | Project format | A: single JSON inlined binaries B: JSON + assets/ folder (dataRef) | **B** | Part 33 convention | multi-file package | MOD-PERSIST |
| ENG-017 | Autosave strategy | A: timer-only B: debounced dirty + atomic rename + recovery slot | **B** | Part 36.0.10 / W11 | — | MOD-PERSIST |
| ENG-018 | Overlay positioning | A: per-component B: central OverlayManager (flip/shift, 8px margin) | **B** | C-07 | — | MOD-OVERLAY |
| ENG-019 | Z-index | A: arbitrary numbers B: central layers L0–L7 | **B** | C-07/§9 | — | MOD-OVERLAY |
| ENG-020 | Long-op concurrency | A: unlimited parallel B: OperationQueue (one long-op) | **B** | C-34 (§2 during-op rule) | serial long ops | MOD-ASYNC |
| ENG-021 | Break-apart of tweened symbol | A: allow B: block + convert-to-FBF first | **B** | F-06-11 L.3 (Animate "unpredictable") | extra step | MOD-SHAPE |
| ENG-022 | Contact-sensitive default | (source conflict C1) | **ON + visible toggle + status hint** | Phase-2 C1 resolution | differs from one doc reading | MOD-SELECTION |
| ENG-023 | Command palette | A: none B: Cmd+K global palette | **B** | C-04 (discoverability backstop) | — | MOD-UI |
| ENG-024 | Edit-mode exit | A: Back button only B: Esc=1 level, Ctrl+Enter=root, double-click-outside | **B** | F-03-03 L.2 / C-38 | — | MOD-UI, MOD-SYMBOL |
