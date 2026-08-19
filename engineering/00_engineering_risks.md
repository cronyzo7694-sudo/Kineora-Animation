# 00_ENGINEERING_RISKS — RISK REGISTER

| ID | Risk | Prob | Impact | Detection | Mitigation | Fallback | Modules |
|---|---|---|---|---|---|---|---|
| RSK-001 | Timeline complexity (sparse frames + spans + hold rule + selection) | High | High | unit tests on frame model | strict sparse invariants + REQ-TIM-* acceptance | rewrite frame eval in isolation | MOD-TIMELINE, MOD-FRAME |
| RSK-002 | Nested symbol recursion (deep nesting, sync mapping) | High | High | deterministic `evaluate` tests | early-out bounds + leaf cache + depth cap (32) | flatten warning | MOD-SYMBOL, MOD-SCENEGRAPH |
| RSK-003 | Rig corruption on copy/paste/re-parent | High | High | local-space round-trip tests | ENG-007 (local-space + stable IDs) | rebuild rig from pose library | MOD-RIG, MOD-BONE |
| RSK-004 | Lip-sync accuracy | High | Medium | confidence display + manual lane | pluggable recognizer + confidence + edit lane (Part 18.6) | manual frame-picker fallback | MOD-LIPSYNC |
| RSK-005 | Audio/video desync | Medium | High | sample-exact mux tests | per-frame audio sampling + Stream drop-anim rule (Part 17) | warn + manual offset | MOD-AUDIO, MOD-EXPORT |
| RSK-006 | Large document memory | High | Medium | memory budget tests | sparse storage + layer caches + worker offload | degrade to outline mode | MOD-RENDER, MOD-PERSIST |
| RSK-007 | Mobile memory/GPU | Medium | High | tablet device tests | tile caches + limit undo depth + downscale preview | reduce onion range | MOD-RENDER, MOD-MOBILE |
| RSK-008 | Export reliability (long encodes) | Medium | High | progress + cancel + resume | OperationQueue + cancel + partial cleanup (Part 28) | export in chunks | MOD-EXPORT |
| RSK-009 | UI complexity (overlap/dead controls) | Medium | Medium | C-36/C-37 automated suites | 3-state registry + no-overlap CI | palette fallback (Cmd+K) | MOD-UI |
| RSK-010 | Boolean engine edge cases (self-intersect, holes) | Medium | Medium | fuzz tests | Vatti clipping + winding-rule tests | fallback to no-op + undo | MOD-VECTOR |
| RSK-011 | Undo memory growth | Medium | Low | history size metric | command diffs + depth cap (default 100, configurable) | cap oldest | MOD-COMMAND |
| RSK-012 | Shortcut conflicts | Medium | Low | bind-time conflict detection | context-scoped priority (C-32) | warn + require override | MOD-INPUT |
| RSK-013 | Save corruption | Low | High | checksum + atomic rename | write-temp→rename + .autosave slot + version | recover last good | MOD-PERSIST |
| RSK-014 | Shape-tween morph chaos | Medium | Medium | morph determinism tests | anchor correspondence + hints (Part 09.3) | disable morph + warn | MOD-TWEEN |
| RSK-015 | Camera/parallax render order | Low | Medium | snapshot tests | back-to-front depth sort (Part 16.5) | disable depth | MOD-CAMERA |
