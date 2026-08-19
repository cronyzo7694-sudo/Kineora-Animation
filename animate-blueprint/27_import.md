# PART 27 — IMPORT
### Supported import categories (images, vector, audio, video, animation assets, libraries) and exactly what happens to each imported asset.

---

## 27.0 Import entry points

| Entry | Does |
|---|---|
| **File > Import > Import to Stage** | Import + **place an instance** at the current frame (current layer). |
| **File > Import > Import to Library** | Import into the Library only (no placement). |
| **File > Import > Open External Library** | Open another project's Library **read-only** to drag assets in (Part 12.2.14). |
| **Drag & drop** | Drop a file onto the stage (import + place) or onto the Library (import only). |
| **Paste** | Paste an image from the clipboard (import as bitmap). |

All imports land in the **Library** as assets (Part 12); "to Stage" additionally places an instance at the current frame.

---

## 27.1 Images (raster)

| Format | What happens |
|---|---|
| **PNG** | Imported as a **bitmap asset** (alpha preserved). Placed as a bitmap instance. |
| **JPEG** | Bitmap asset (no alpha). |
| **GIF** | Bitmap asset (first frame by default; **animated GIF**: our app imports frames as a **sequence** or a movie clip — P1; Animate imports the first frame). |
| **WebP** (our app) | Bitmap asset (alpha + animation support). |
| **PSD** | **Per-layer import** option: each layer → a separate bitmap (named by layer); flattened option → one bitmap. (This powers the character-part import workflow — Part 13.1.) |
| **AI** (Adobe Illustrator, via import) | **Vector** import: paths/artboards → shapes (or per-layer). See 27.2. |

**What a bitmap asset is:** `{kind:'bitmap', width, height, dataRef}` — referenced, not embedded pixel-data-in-JSON (the pixels live in the project's `assets/` folder; the model stores a ref — Part 33).

**What you can do with an imported bitmap:** place it; use it as a **fill** (Part 23.6); **Break Apart** → editable region (Lasso/Magic Wand); **Trace Bitmap** → vectorize; **Swap Bitmap** → replace with another asset.

---

## 27.2 Vector graphics

| Format | What happens |
|---|---|
| **SVG** | Paths → **shapes** (fills + strokes → the shape model, Part 06.9); text → text nodes (or paths); gradients → gradient fills. |
| **AI** | Artboards/layers → shapes (or per-layer). |
| **PDF** (our app, P2) | Pages → shapes. |

**Vector import rules:**
- The importer converts foreign path models (quadratics, arcs, `d` attributes) to our **cubic-Bézier** canonical form (Part 05.1.8).
- Fill rules, gradients, and transforms are mapped to our model; unsupported effects are **flattened or flagged** (an import report lists conversions).
- Imported vectors become **drawing objects** (safe default) or raw shapes (user option).

---

## 27.3 Audio

| Format | What happens |
|---|---|
| **MP3** | Sound asset (Part 17). |
| **WAV / AIFF** | Sound asset (uncompressed or compressed on publish). |
| **OGG / FLAC / M4A** (our app) | Sound asset. |

Imported audio → Library sound asset → placed on audio layers (Part 17.2).

---

## 27.4 Video

| Format | What happens |
|---|---|
| **MP4 (H.264)** | Options: **embed** (convert to a video asset played in a component — legacy) or **link** (reference external). Our app: import the **audio track** separately + place video as a **video asset** on a video layer (P1). |
| **FLV** (legacy) | Embedded video (legacy). |

**Frame extraction** (our app, P1): import a video's frames as a **PNG sequence** (for rotoscoping reference — place on a guide layer).

---

## 27.5 Animation assets (sprite sheets & sequences)

| Asset | What happens |
|---|---|
| **Sprite sheet** (PNG + JSON/XML atlas) | Import as **frames**: each cell → a frame in a new **movie clip symbol** (named). Used for game art. |
| **Image sequence** (PNG_001..PNG_N) | Import as a **frame-by-frame sequence** (one keyframe per image, on twos/ones per option). |
| **Animated GIF** (our app) | Import as a movie clip (frames) — 27.1. |

---

## 27.6 Libraries (reuse across projects)

| Operation | Does |
|---|---|
| **Open External Library** | Open another project's Library read-only → drag symbols/assets into the current document (they're **copied** in). |
| **Symbol reuse** | A dragged symbol becomes a local copy (or a shared reference — our app offers "link" mode, P2). |

---

## 27.7 Import report (our app)

Every import emits an **import report** (Output panel): what was created (asset names/IDs), what was **converted/flattened** (unsupported effects), and warnings (missing fonts, downscaled images). This makes import non-mysterious — a direct usability win.

---

## 27.8 BUILD CHECKPOINT M3 (import slice)

- [ ] Import to Stage / to Library / external library / drag-drop / paste.
- [ ] Raster: PNG/JPEG/GIF/WebP (+ PSD per-layer); bitmap asset + placement.
- [ ] Vector: SVG/AI → shapes with cubic-Bézier conversion + import report.
- [ ] Audio: MP3/WAV/OGG/FLAC → sound assets.
- [ ] Video: embed/link + audio extraction + frame extraction.
- [ ] Sprite sheets + image sequences → movie clips / frame-by-frame.

*Next: `28_export_publish.md` — image, PNG sequence, GIF, video, HTML5, web, audio, project file — with resolution/FPS/compression/transparency/audio/quality/dimensions.*
