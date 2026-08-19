# PART 18 — LIP SYNC
### Audio → speech analysis → phonemes/visemes → mouth symbols → frame assignment → manual correction. Adobe Animate's documented Auto Lip-Sync workflow (12 visemes) + the Frame Picker manual workflow + an improved original automatic system.

---

## 18.0 Correction first (accuracy)

Adobe Animate **does** ship an **Auto Lip-Sync** feature (added 2018–2019, Adobe Sensei-assisted): it analyzes an **audio layer**, detects speech, and **auto-places mouth-pose keyframes** on the timeline. It is a **graphic-symbol-driven** system: one symbol holds all mouth poses (visemes); keyframes switch that symbol's shown frame. This part documents that real workflow, then designs an **original, better** system (18.6).

**Note the split:** *Adobe Character Animator* does **real-time** facial/viseme tracking; *Adobe Animate* does **offline** auto lip-sync from an audio layer. Our app implements Animate's offline model (plus improvements).

---

## 18.1 The concept: phonemes → visemes → mouth symbols

- **Phoneme** = a unit of *sound* (the "ah" in "cat", the "ee" in "see"). Speech = a sequence of phonemes with timestamps.
- **Viseme** = a unit of *visual* mouth shape. Multiple phonemes share one viseme (e.g., "p", "b", "m" all look like closed lips — you hear the difference, you don't see it).
- **Mouth symbol** = the artist's drawing of one viseme.
- **Lip sync** = map the audio's phoneme timeline → viseme timeline → mouth-symbol keyframes at the right frames.

The classic animation **mouth chart** (Preston Blair style, ~12 shapes — the basis of Animate's 12 visemes) groups phonemes like this:

| # | Viseme (mouth shape) | Phonemes it covers | Mouth looks like |
|---|---|---|---|
| 1 | **A** | "ah", "hat", "father" | wide open, jaw dropped |
| 2 | **B / M-P** | "m", "p", "b" | closed lips (pressed) |
| 3 | **C / D-G-K-N-R-S-T-Y-Z** | "d","g","k","n","r","s","t","y","z","ch","j" | slightly open, teeth nearly closed |
| 4 | **D** | "den", "they" | open, tongue at top |
| 5 | **E** | "ee", "see", "me" | wide smile, teeth together |
| 6 | **F / V** | "f", "v" | bottom lip under top teeth |
| 7 | **L / TH** | "l", "th" | tongue between/at teeth |
| 8 | **O** | "oh", "go", "no" | round open "O" |
| 9 | **U** | "oo", "you", "do" | pursed small "O" |
| 10 | **W / Q** | "w", "q", "oo-w" | tight small pucker |
| 11 | **Rest / Neutral** | silence, breathing | relaxed, slightly open |
| 12 | (extra/expression) | e.g. "G" growl, or a second "E" | per artist |

*(This is the standard 12-shape mouth chart; Animate's dialog shows 12 default visemes the user maps to their own frames. Our app ships this chart as the default viseme set.)*

---

## 18.2 The mouth library (the mouth symbol)

The whole system is driven by **one graphic symbol** containing one **frame per mouth pose**:

```
symbol "mouth" (graphic)
  frame 1  = pose A     (ah)
  frame 2  = pose B/M   (closed)
  frame 3  = pose C/D   (teeth)
  frame 4  = pose E     (ee)
  frame 5  = pose F/V
  frame 6  = pose L/TH
  frame 7  = pose O
  frame 8  = pose U
  frame 9  = pose W/Q
  frame 10 = pose Rest
```

- Each frame is a full mouth drawing (lips, teeth, tongue, jaw) drawn **in place** (same registration point) so switching frames doesn't shift the mouth.
- Label each frame with the viseme name (Animate recommends labeling frames; our app uses a structured `viseme` field).
- The mouth is placed on the character's face (nested in the head symbol — Part 13.3).

**Why a graphic symbol (not movie clip):** the main timeline must **drive** which frame shows (Frame Picker / First-frame mapping — Part 11.4). A graphic instance's "First frame" = the mouth pose.

---

## 18.3 The Auto Lip-Sync workflow (Adobe Animate, documented)

1. **Prepare the mouth symbol** (18.2) — a graphic symbol with all mouth poses as frames.
2. **Import the audio** into a new layer (Part 17); set its **Sync = Stream** (Animate's docs: auto lip-sync works best with Stream).
3. **Place the mouth symbol** on its own layer, its span covering the audio's length.
4. **Select the mouth instance** → Properties → **Lip Syncing** button → the **Create Lip Syncing** dialog opens showing the **12 default visemes**.
5. **Map each viseme → a mouth-pose frame:** click a viseme → a popup lists the symbol's frames → pick the matching pose. (Animate: click viseme, pick frame; Enter/Space to confirm.)
6. **Choose the audio layer** in the dialog → **Sync**.
7. **Result:** Animate analyzes the audio, detects speech, and **auto-inserts keyframes** across the mouth layer — each keyframe sets the mouth instance's frame to the matched viseme. (You can also pre-select a **frame range** to apply sync only there.)
8. **Preview:** `Ctrl+Enter` — mouth moves in sync with the voice.
9. **Correct manually** (18.5).

---

## 18.4 What the analysis does (phoneme/viseme detection — concept)

1. **Segment the audio** into speech vs silence (energy/VAD — voice activity detection).
2. **Recognize phonemes** with their **time offsets** (speech-recognition / forced alignment produces `[{phoneme, startMs, endMs}, …]`).
3. **Map phonemes → visemes** (18.1 table); **merge** consecutive same-viseme runs (mouth doesn't re-shape mid-"mmmm").
4. **Convert time → frames**: `frame = round(ms / 1000 × fps)` (Part 01 §1.7).
5. **Emit keyframes**: at each viseme boundary frame, set the mouth instance's shown frame to that viseme's pose.
6. **Fast speech → fewer frames than visemes:** when multiple visemes land within one frame, keep the **most prominent** (longest/loudest within that frame).

---

## 18.5 Manual override & frame-by-frame correction

Auto lip-sync is a **starting point**, not the final. Corrections (the tools):

| Tool | Does |
|---|---|
| **Frame Picker panel** (Window > Frame Picker) | Visual browser of the mouth symbol's frames. Select a keyframe on the timeline → click a pose in the picker → that keyframe's mouth frame changes. Pin the symbol to keep it loaded. |
| **Swap (Part 11.6)** | Swap the mouth instance to a different pose symbol at a keyframe. |
| **Drag keyframes** | Move a mouth keyframe earlier/later to fix timing. |
| **Insert/delete keyframes** (F6/F7/Shift+F6) | Add/remove mouth poses manually. |
| **Hold/extend** (F5) | Hold a pose (e.g., hold the "M" closed longer on a plosive). |
| **Scrub with audio** (Part 17.5) | Scrub the playhead to hear + see the sync and fix by ear. |

**Manual workflow (no auto):** place the mouth symbol, scrub the audio, and at each phoneme press the Frame Picker pose → F6 → repeat. Labor-intensive but full control — the fallback our app must also support perfectly.

---

## 18.6 The improved original system (our app's design)

Built on the same graphic-symbol/viseme model, but strictly better:

| Improvement | How |
|---|---|
| **1. Live waveform + phoneme lane** | Show the audio waveform with a **phoneme lane** above the mouth layer (colored blocks = detected phonemes, labeled). Click a block → jump there. |
| **2. Editable detection** | Drag phoneme boundaries to re-time; re-map a phoneme to a different viseme (right-click → set viseme). The auto result is a **first pass you edit**, not a black box. |
| **3. Confidence display** | Each detected phoneme shows a **confidence** value; low-confidence blocks are highlighted for manual review. |
| **4. Per-character timing bias** | A **lead/lag offset** (ms) per mouth symbol (some mouths lead the audio slightly — classic lip-sync trick). |
| **5. Viseme dictionary** | A user-editable phoneme→viseme map (share between projects). Ships with the 12-shape default. |
| **6. Multi-language** | The phoneme recognizer is pluggable; ship an English model, allow custom models (P2). |
| **7. Better VAD** | Silence/energy detection with a **threshold slider** + manual silence marks. |
| **8. Blends** | Optional **cross-fade/morph between mouth poses** (shape-tween the mouth between visemes) for smooth speech (toggle; snaps are default for stylized look). |
| **9. Batch** | Auto lip-sync **multiple characters** from one audio layer (each with its own mouth symbol). |
| **10. Undoable** | The whole auto-pass is **one undoable command**; manual edits are normal commands (Part 36). |

### Improved pipeline (data flow)

```
audio asset (Stream, on audio layer)
  → VAD (silence threshold)
  → phoneme recognition → [{phoneme, startMs, endMs, confidence}]
  → viseme dictionary → [{viseme, startFrame, endFrame, confidence}]
  → merge same-viseme runs; resolve sub-frame collisions (longest wins)
  → write mouth-layer keyframes: {frame, instance.firstFrame = visemePoseFrame}
  → user edits (Frame Picker, drag, re-map) → final
```

---

## 18.7 Lip-sync data model

```jsonc
"lipSync": {
  "mouthSymbolId": "mouth",
  "audioAssetId": "voice01",
  "audioLayerId": "L_audio",
  "visemeMap": { "A":1, "B/M":2, "C/D":3, "E":4, "F/V":5, "L/TH":6, "O":7, "U":8, "W/Q":9, "rest":10 },
  "result": [ { "viseme":"O", "startFrame":12, "endFrame":14, "confidence":0.93 } ],
  "leadMs": 0, "blend": false
}
```

The **mouth layer keyframes** are ordinary keyframes whose instance `firstFrame` = the viseme's pose frame (Part 11.4) — so lip-sync reuses the symbol system, not a parallel one.

---

## 18.8 BUILD CHECKPOINT M4 (lip-sync slice)

- [ ] Mouth symbol = graphic with one frame per viseme; labeled; Frame Picker browses it.
- [ ] Auto lip-sync: select mouth + audio layer → detect → map 12 visemes → auto keyframes (one undoable command).
- [ ] Phoneme lane + waveform + confidence display; drag phoneme boundaries; re-map visemes.
- [ ] Manual override: Frame Picker per keyframe, swap, drag keys, hold/extend, scrub-with-audio.
- [ ] Viseme dictionary (editable, sharable); lead/lag bias; multi-character batch; optional blend.
- [ ] Sync = Stream works end-to-end; Ctrl+Enter preview in sync.

*Next: `19_facial_animation.md` — eyes/eyebrows/mouth/head systems via symbols + keyframes + nested timelines, then blink system, eye direction, mouth system, expression system, head movement system.*
