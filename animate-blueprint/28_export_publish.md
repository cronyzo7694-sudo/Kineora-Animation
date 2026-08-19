# PART 28 — EXPORT / PUBLISH
### Every export/publish option: image, PNG/JPEG sequence, animated GIF, video, HTML5/Web, audio, project file — with resolution, FPS, compression, transparency, audio, quality, dimensions.

---

## 28.0 The two concepts

- **Export** = one-shot output of the current frame/scene (image, GIF, sequence, video, audio).
- **Publish** = the configured **pipeline** that produces platform output (HTML5/Web bundle, WebGL, etc.) from the whole document, driven by **Publish Settings** (a saved profile).

**Universal rule:** every exporter renders the document by **sampling the timeline** (the same evaluator as playback — Part 01 §1.16), so authoring = output. The camera (Part 16) applies identically in all exporters.

---

## 28.1 Image export

| Setting | Meaning |
|---|---|
| **Format** | PNG (lossless + alpha), JPEG (lossy, no alpha), SVG (vector), WebP (our app). |
| **Resolution / Dimensions** | Match Movie (stage size) or custom W×H; **Scale** (1×/2×/4× — supersampling for crisp output). |
| **Transparency** | PNG alpha preserved (stage background = transparent if "no color" — Part 01 §1.7). |
| **Quality** | JPEG 0–100 (compression). |
| **Which frame** | Current frame (or a named frame — Animate exports the `#Static`-labeled frame; our app: current frame or chosen frame). |

---

## 28.2 PNG / JPEG sequence

- Exports **every frame** (or a range: `#First`–`#Last` labeled frames in Animate; our app: a frame-range field) as `name_0001.png`, `name_0002.png`, …
- **Settings:** format, scale/resolution, transparency (PNG), quality (JPEG), **FPS** (stored in a sidecar for later video mux).
- Use: video editing pipelines, sprite sources, frame-by-frame delivery.

---

## 28.3 Animated GIF

| Setting | Meaning |
|---|---|
| **Playback** | Static (single frame) or Animated. |
| **Loop** | Loop continuously / N times. |
| **Dimensions** | Match Movie or custom; scale. |
| **FPS** | Frame rate of the GIF (often 12/24/30). |
| **Colors** | Palette size (256 max; **optimize colors** removes unused); **dither** (ordered/diffusion/none); **interlace**. |
| **Transparency** | Optional transparent background. |
| **Range** | All frames or `#First`–`#Last`. |
| **Audio** | **None — GIF is silent** (warn the user). |

---

## 28.4 Video export

| Setting | Meaning |
|---|---|
| **Format** | MP4 (H.264) — and our app: WebM (VP9). |
| **Resolution** | Stage size or custom; scale. |
| **FPS** | Output frame rate (default = document fps). |
| **Quality / bitrate** | CRF/bitrate for the encoder. |
| **Audio** | Include the audio track; **codec** (AAC), **bitrate** (kbps). Audio is muxed **sample-exact per frame** (Part 17.6). |
| **Range** | Whole document / scene / frame range. |
| **Motion blur** (our app, P2) | Frame-blend for smoother motion. |

---

## 28.5 HTML5 Canvas publish (the web target)

Produces an **HTML + JavaScript + asset folder** bundle:

| Setting | Meaning |
|---|---|
| **Output** | Output name + folder; **include JavaScript in HTML** vs external `.js`; **overwrite HTML** toggle. |
| **Preloader** | Default or custom GIF preloader. |
| **Assets** | Export images/assets to a subfolder (or root); **spritesheet** combining (format PNG/JPEG/both, quality 8/24/32-bit, size constraints). |
| **Texture export** | Export vector animation as **textures** (rasterized) for performance. |
| **Transparency** | Stage color "no color" → transparent canvas. |
| **Loop** | Loop playback on/off. |
| **Audio** | Audio asset settings (bitrate, format). |
| **Libs** | Hosted vs local JS libraries (our app: self-contained local bundle). |

---

## 28.6 Web / other targets

| Target | What it produces |
|---|---|
| **WebGL/glTF** (Animate's newer target) | 3D-compatible export (for Animate's WebGL doc type). Our app: optional glTF/WebGL bundle (P2). |
| **SWF (legacy)** | Flash player format — **historical only**; not implemented in our app (Flash is dead; note in docs). |
| **OAM (legacy)** | Widget package — historical. |
| **AIR (legacy)** | Desktop/mobile app package — historical. |

---

## 28.7 Audio-only export

- Export the project's **audio tracks** as WAV/MP3 (dialogue stems, music) — our app (P1).

---

## 28.8 Project file (save)

- The **project file** (our format: JSON + `assets/` folder — Part 33) is the lossless master. Exports (PNG/GIF/MP4/HTML) are **derived**; the project preserves everything (layers, symbols, tweens, audio refs, camera).
- **Autosave + crash recovery** *[WISH W11]*: periodic autosave to a `.autosave` slot + recovery prompt on launch.

---

## 28.9 Publish profiles

- A **publish profile** = a named, saved bundle of all publish settings (e.g., "web-720p", "video-4k"). Switch profiles to re-target without reconfiguring. (Animate has Publish Profiles; our app extends with per-target profiles.)

---

## 28.10 The universal settings matrix

| Setting | Image | Sequence | GIF | Video | HTML5 |
|---|---|---|---|---|---|
| Resolution | ● | ● | ● | ● | ● (canvas size) |
| Scale | ● | ● | ● | ● | — |
| FPS | — | ● (sidecar) | ● | ● | ● |
| Compression/quality | ● | ● | ● (palette/dither) | ● (bitrate) | ● (textures) |
| Transparency | ● (PNG/SVG) | ● (PNG) | ● | — | ● |
| Audio | — | — | — | ● | ● |
| Loop | — | — | ● | — | ● |
| Range | frame | range | range | range | whole doc |

---

## 28.11 BUILD CHECKPOINT M3 (export slice)

- [ ] Image export (PNG/JPEG/SVG/WebP) with scale + transparency + quality.
- [ ] PNG/JPEG sequence with range + sidecar fps.
- [ ] Animated GIF (loop/palette/dither/transparency/range) + silent-audio warning.
- [ ] Video (MP4/WebM) with sample-exact audio mux + bitrate/quality.
- [ ] HTML5 bundle (JS + assets + spritesheets + preloader + transparency + loop + audio).
- [ ] Audio-only export; project save + autosave/recovery; publish profiles.

*Next: `29_shortcuts.md` — the complete keyboard reference grouped by navigation/drawing/selection/transform/timeline/playback/frames/layers/symbols/tools/editing/view.*
