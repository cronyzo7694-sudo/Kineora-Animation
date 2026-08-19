# F-28-01..11 — EXPORT / PUBLISH (full part)
```
SOURCE BLUEPRINT: Part 28 · DEEP FEATURES: F-28-01..11 · STATUS: AUDITED
DEPENDS ON: F-27 (import), F-16 (camera), F-17 (audio)
```
## A. IDENTITY
1. Official name: Export / Publish. 4. Purpose: render output (one-shot) vs configured pipeline (platform). 8. Status: current.
## EVIDENCE
E1 [OFFICIAL] `publish-settings.html`: GIF settings (Static/Animation, loop count, palette/dither/interlace, #Static/#First/#Last labels); PNG settings; OAM; SWF (legacy) player/quality/window-mode. E2 [OFFICIAL] `creating-publishing-html5-canvas-document.html`: HTML5 publish — JS bundle, spritesheet (PNG/JPEG, 8/24/32-bit), texture export, transparent canvas (No Color), preloader, loop. E3 [OFFICIAL] `classic-text.html`/Part 28: text export per type. E4 [BLUEPRINT Part 28.10] universal settings matrix.
## F-28-01 EXPORT vs PUBLISH
Export = one-shot (image/GIF/sequence/video); Publish = pipeline (HTML5/WebGL) with settings profile.
## F-28-02 IMAGE
PNG/JPEG/SVG/WebP; scale; transparency; quality.
## F-28-03 SEQUENCE
PNG/JPEG per frame + range + sidecar fps.
## F-28-04 ANIMATED GIF
Static/Animated; loop (cont/N); palette (256, optimize); dither; interlace; transparency; range (#First/#Last, E1); silent (warn).
## F-28-05 VIDEO
MP4 (WebM ours); resolution/fps/quality(bitrate)/audio mux (sample-exact, F-17-08); range.
## F-28-06 HTML5
JS bundle + assets + spritesheets + preloader + transparency + loop + audio (E2).
## F-28-07 WEB/OTHER
WebGL/glTF (P2); SWF/OAM/AIR = legacy (not implemented).
## F-28-08 AUDIO-ONLY
WAV/MP3 stems (ours, P1).
## F-28-09 PROJECT FILE
JSON + assets/ folder; autosave + crash recovery [WISH W11].
## F-28-10 PUBLISH PROFILES
Named settings bundles (per-target).
## F-28-11 UNIVERSAL MATRIX
(blueprint Part 28.10) resolution/scale/fps/compression/transparency/audio/loop/range per format.
## L. LIMITATIONS
L.1 GIF silent → warn. L.2 SWF legacy → not implemented (Flash dead). L.3 GIF 256-color quantization → dither options.
## M. EDGE CASES
M.1 transparent canvas → PNG alpha (E2) · M.2 export range labels · M.3 camera applied in all exporters (F-16-07) · M.4 autosave recovery.
## O/P/Q/R/S/Y
Data: export settings + profiles; reads model (evaluate per frame). Events: `export:progress`/`export:done`. Undo: n/a (non-mutating). Serialization: settings persisted (profiles). Mobile: share sheet. Implementation: ExportEngine (Part 32.19) with per-format exporters + worker pool.
## TESTS
TS-01 PNG export scale/transparency · TS-02 sequence range · TS-03 GIF loop/palette/dither · TS-04 GIF silent warn · TS-05 MP4 mux sync · TS-06 HTML5 bundle + spritesheet · TS-07 transparent canvas (E2) · TS-08 project save + autosave · TS-09 profile switch · TS-10 camera identical across targets · TS-11 SWF legacy skipped · TS-12 reload.
## AUDITS
No contradiction. Self-challenge: overlooked = GIF-range-labels (E1) + transparent-canvas (E2) + SWF-legacy + sample-exact-mux — covered.
```
FEATURE COMPLETE: F-28-01..11 — Export/Publish — AUDITED
```
