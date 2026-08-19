# PART 17 — AUDIO
### Import, formats, audio layers, waveform, sync modes (Event/Start/Stop/Stream), loop, trim, volume, scrubbing, timeline synchronization, export synchronization.

---

## 17.0 The two kinds of sound (the core concept)

Animate divides sound into **two behaviors** — this distinction drives everything in this part:

| | **Event sound** | **Stream sound** |
|---|---|---|
| **Starts** | After the sound **fully downloads/loads** | As soon as enough data is buffered (begins immediately) |
| **Continues** | Until explicitly stopped (independent of the timeline) | Only while the timeline plays; **stops with the timeline** |
| **Timeline relationship** | Not tied to frames — plays out fully even if the timeline stops | **Synchronized to the timeline**: if the animation can't keep up, frames are **dropped** so audio stays in sync |
| **Duration** | Full sound regardless of the frames it occupies | Can never play longer than the frames it occupies |
| **Use** | Music, UI clicks, ambient loops | **Voice/dialogue** (must match lip-sync), any sound that must sync to picture |

**Rule:** dialogue & lip-sync → **Stream**; music/sfx → **Event**. (Animate's docs explicitly say auto lip-sync works best with Stream — Part 18.)

---

## 17.1 Import & formats

| Category | Formats |
|---|---|
| **Audio** | MP3 (most common), WAV, AIFF. (Our app additionally: OGG, FLAC, M4A/AAC — cross-platform via the platform audio decoder.) |
| **Video (with audio)** | MP4/FLV import → the audio track can be used separately. |

- Import = File > Import to Library, or drag the file into the Library (Part 12).
- Each imported sound becomes a **sound asset** in the Library: `{id, name, durationMs, sampleRate, channels, dataRef}`.
- The Library preview shows the **waveform** + a play button.

---

## 17.2 Placing audio on the timeline (audio layers)

**Best practice: one sound per layer** (so each has independent sync/volume). Steps:

1. Create a layer (audio layers are just normal layers that carry sound).
2. Select a **keyframe** on that layer (sound attaches to a **keyframe**, not a static frame).
3. Drag the sound asset from the Library onto the stage/frame, **or** in the frame's Properties, choose the **Sound** dropdown → pick the asset.
4. The **waveform** appears across the following frames (its horizontal extent = the sound's duration at the current fps).

### Waveform display
- Drawn across the frame grid; **frame ruler** shows the time mapping (`frames = seconds × fps`).
- **Scrubbing** the playhead across the waveform plays the sound at the scrub position (Stream sync; scrubbing Event audio also works in our app — P1).
- Zooming the timeline ruler zooms the waveform.

---

## 17.3 The Sync menu (frame Properties > Sound)

| Sync | Behavior |
|---|---|
| **Event** | Starts when the playhead reaches the keyframe; plays fully; **other Event sounds can overlap** (multiple can play at once). |
| **Start** | Like Event, but **if the same sound is already playing, don't start another** (no overlap). |
| **Stop** | **Silences the specified sound** when the playhead reaches this keyframe (place a keyframe with Sync=Stop + the same sound selected to end it early). |
| **Stream** | Timeline-synchronized; drops animation frames to keep audio in sync; stops when the timeline stops; can't outlast its frames. |

### Loop
- A **Loop** count in the Sound properties (0 = none; N = repeat N times). Stream loops repeat within the occupied frames; Event loops repeat until stopped.
- **Audio loop on timeline** (current Animate): a per-span **loop toggle** for streaming audio over a frame range (used for looping background music under a scene).

---

## 17.4 Trim & volume & effects

| Control | Does |
|---|---|
| **Start/End trim (Edit)** | Edit the sound's **in/out points** (play only a slice). Our app: drag the waveform's trim handles + numeric fields. |
| **Effect** | Prebuilt volume curves: Left channel / Right channel / Fade Left-to-Right / Fade Right-to-Left / Fade In / Fade Out / Custom. |
| **Custom volume envelope** | A **volume curve** (points with volume %) over the sound's duration — our app draws it over the waveform, draggable points (P1; Animate has a modal envelope editor). |
| **Volume (master)** | Per-sound volume % (our app: a slider next to the waveform). |

---

## 17.5 Timeline synchronization (the rules)

- **Sound starts at its keyframe.** Moving the keyframe moves the start.
- **Event sound** plays its full duration regardless of the following frames (the waveform is shown, but the sound won't be cut by a shorter span).
- **Stream sound** is bounded by its span — if the span ends before the sound, the sound **cuts off** (extend the span to hear it all; drop-animation-frames applies on publish).
- **Stop keyframe** (Sync=Stop) ends a sound early at a chosen frame.
- **Scrubbing:** Stream audio plays while scrubbing (scrub-audio toggle). Event audio plays on scrub too in our app (better for reviewing dialogue).
- **Mute** (Control menu / timeline speaker) silences playback without removing data.

### Frame↔time math (fps-dependent)
```
sound frames = ceil(durationSeconds × fps)
frame → ms = frameIndex / fps × 1000
```
Changing fps re-maps the waveform's frame extent (Part 01 §1.7).

---

## 17.6 Export synchronization

| Target | Behavior |
|---|---|
| **HTML5/Web** | Stream audio = timeline-synced playback (the runtime keeps frame/audio sync; may drop frames). Event audio = triggered at keyframes. Audio bitrate/format set in Publish Settings (Part 28). |
| **Video (MP4/MOV)** | Audio is **muxed** into the video container, frame-accurate by construction (the exporter samples audio at each video frame). |
| **GIF** | **No audio** (GIF is silent — warn the user). |
| **PNG/JPEG sequence** | No audio (provide a sidecar WAV option — our app P1). |
| **Project file** | Audio assets + keyframe references saved; re-importable losslessly. |

**Export sync rule (our app):** for video export, encode audio **per frame boundary** (sample-exact), never by "start time + wall clock" — this guarantees A/V sync even after trimming/looping. For web export, ship the audio as a separate asset with `startAt`/`loop`/`sync` metadata so the runtime reproduces Stream/Event semantics.

---

## 17.7 Audio data model

```jsonc
// asset
{ "type":"sound", "id":"s_voice01", "name":"voice01", "durationMs":4200,
  "sampleRate":44100, "channels":1, "dataRef":"assets/voice01.mp3" }

// keyframe attachment
"frames":[ { "type":"keyframe", "sound":{
    "assetId":"s_voice01", "sync":"stream|event|start|stop",
    "loop":0, "trimStartMs":0, "trimEndMs":4200,
    "volume":1.0, "envelope":[{t:0,v:1},{t:1,v:1}] } } ]
```

---

## 17.8 BUILD CHECKPOINT M4 (audio slice)

- [ ] Import MP3/WAV (+ OGG/FLAC) into Library with waveform preview.
- [ ] Attach sound to a keyframe; waveform across frames; scrub-audio playback.
- [ ] Sync modes Event/Start/Stop/Stream with exact semantics (17.3).
- [ ] Loop count + timeline audio loop; trim in/out; volume + custom envelope.
- [ ] fps re-mapping of the waveform; mute toggle.
- [ ] Export: video mux sample-exact; HTML runtime sync metadata; GIF/sequence warnings.

*Next: `18_lip_sync.md` — audio → speech analysis → phonemes/visemes → mouth symbols → frame assignment → manual correction, with the 12-viseme mapping, auto lip-sync workflow, and an improved original version.*
