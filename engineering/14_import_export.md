# 14_IMPORT_EXPORT — MOD-IMPORT · MOD-EXPORT

## Import pipeline (REQ-IMP-001; STM-JOB)
```
select(file) → validate(size≥2px, format) → parse/decode → convert/normalize (cubic Bézier, color) →
store (library asset + dataRef) → place (to-stage instance) → import report
```
| Format | Normalization |
|---|---|
| PNG/JPEG/GIF/WebP | bitmap asset (alpha preserved); GIF anim → frames (ours) |
| PSD | per-layer / flattened / movie-clip + registration + compression (Calculate Bitmap Size) |
| SVG/AI/FXG | paths→shapes (quadratic→cubic); text→text nodes; gradients→fills; report conversions |
| Audio | sound asset |
| Video | embed/link + audio extraction + frame extraction (ours) |
| Sequence/atlas | successive keyframes / movie-clip frames |
Drag-drop transparency loss → warn + suggest Import command (F-27 L.3). Import = one undoable command.

## Export pipeline (REQ-EXP-001/002; STM-EXPORT)
```
prepare(settings) → validate → frame list → render frames (evaluate{export:true}, worker pool) →
encode (per format) → mux audio (video) → package (html) → write → cleanup
```
| Target | Specifics |
|---|---|
| Image PNG/JPEG/SVG/WebP | scale, transparency (PNG/SVG), quality |
| Sequence | range (#First/#Last) + sidecar fps |
| GIF | loop(cont/N), palette 256+optimize, dither, interlace, transparency; silent warn |
| Video MP4/WebM | fps, bitrate, sample-exact audio mux |
| HTML5 | JS bundle + assets/spritesheets(8/24/32-bit) + preloader + transparent canvas + loop + audio |
| Audio-only | WAV/MP3 stems (ours) |
| Project | JSON+assets (lossless master) |
Rules: export = same evaluate as playback; camera applied in all exporters; overlays NEVER exported (06); every exporter cancellable + progress + cleanup; publish profiles.

## Acceptance
- **REQ-IMP-001-A**: Given PSD with 3 layers; When import-to-stage; Then 3 assets created, layers placed per chosen conversion, report lists conversions; Undo removes all.
- **REQ-EXP-002-A**: Given camera push-in; When export PNG@frame N and video frame N; Then both frames identical (authoring=export).
- **REQ-EXP-002-B**: Given authoring with selection box visible; When export; Then no selection overlay in output.
- **REQ-EXP-C**: Given export cancelled mid-render; Then partial files cleaned, doc unchanged, status FAILED/CANCELLED with retry.
