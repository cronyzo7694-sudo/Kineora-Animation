# PART 11 — SYMBOL SYSTEM
### Graphic, Movie Clip, Button symbols; instances; nesting; nested animation; registration point; symbol editing modes; swap; break apart; convert to symbol. This is the reuse engine that makes character animation possible.

---

## 11.0 The core idea

A **symbol** is a **reusable, self-contained timeline** stored once in the Library. You place **instances** (references) of it on stage. Edit the symbol once → **every instance updates**. This "define once, reuse everywhere" is the single most important concept in the whole editor — it powers characters, lip-sync, UI, and file size.

```
Library
 └── symbol "arm"  (definition: own timeline, own layers, own artwork)
Stage
 ├── instance of "arm" (left arm — placed, transformed)
 └── instance of "arm" (right arm — flipped, different transform)
```

- **Symbol (definition)** = the master copy in the Library.
- **Instance** = a placed reference; has its **own** transform/color/name but shares the definition's content.
- Editing the **definition** changes all instances; editing an **instance** (transform, tint, alpha) changes only that instance.

---

## 11.1 The three (four) symbol types

### 11.1.1 Graphic symbol
- **Purpose:** static art + reusable animation that stays **synchronized to the main timeline**.
- **Timeline:** has its own frames, but its playback is **driven by the main timeline** — a graphic instance on main-frame N shows the graphic's internal frame mapped by its **loop mode** (11.4).
- **No interactivity/sound** inside (ignored in graphic symbols).
- **Smaller file** than movie clips (no independent timeline overhead).
- Use: repeating visual elements, lip-sync mouth sets (via Frame Picker — Part 18), symbols you need to scrub in sync.

### 11.1.2 Movie Clip symbol
- **Purpose:** self-contained animation that plays **independently** of the main timeline.
- **Timeline:** its own clock — a 30-frame movie clip loops forever regardless of the main timeline, even if the main timeline has 1 frame.
- Supports **interactivity + sound + nested clips**; scriptable (instance name).
- Use: walk cycles, flapping wings, looping effects, buttons' animated states, anything that must run on its own.

### 11.1.3 Button symbol
- **Purpose:** interactive button with **4 built-in states** on its own timeline:
  1. **Up** — resting.
  2. **Over** — pointer hover.
  3. **Down** — pressed.
  4. **Hit** — invisible **hit area** (defines the clickable region; not rendered).
- Use: UI buttons, navigation. (Legacy AS3 buttons run scripts; our app wires them to the event/behavior system — Part 01 §1.12.)

### 11.1.4 Font symbol (niche)
- Embeds a font as a reusable asset for other documents. Our app: font embedding is a **document/asset setting** (Part 22), not a separate symbol type (P3).

---

## 11.2 Convert to Symbol (the #1 command)

**Trigger:** select stage content → **Modify > Convert to Symbol (F8)** (or right-click, or drag into Library).

**Dialog:**
| Field | Meaning |
|---|---|
| Name | Symbol name (unique in Library). |
| Type | Graphic / Movie Clip / Button. |
| Registration point | A **9-point grid** (TL/TC/TR/ML/C/MR/BL/BC/BR) — where the symbol's **origin (0,0)** sits relative to its artwork. |

**What happens:**
1. The selected content is **wrapped** into a new symbol definition (added to Library).
2. The stage selection becomes an **instance** of that symbol.
3. The instance's x/y = where the **registration point** lands on stage.

### Registration point — why it matters (character rigs)
- The registration point is the symbol's **(0,0)**. When you place/transform an instance, `x/y` refers to this point.
- For a **rig**, set the registration point at the **joint** (e.g., an arm's registration at the shoulder) so rotating the instance pivots naturally — even before you touch the transform point (Part 04.7).
- You can **move the registration point** later: edit the symbol and move its artwork relative to the crosshair.

---

## 11.3 Symbol editing modes (how you get inside)

| Mode | How | View | Use |
|---|---|---|---|
| **Symbol edit mode** | Double-click the symbol in the **Library**, or Edit > Edit Symbols (Ctrl+E) | Full-window view of **only** the symbol (crosshair = registration point; breadcrumb shows the symbol name) | Clean focused editing of the definition. |
| **Edit in Place** | Double-click the **instance on stage** | The symbol's contents edit **in context** — other stage content dims but stays visible | Editing with visual reference to the scene. |
| **Edit Selected / Edit All** | Edit menu | Drill into a nested selection / jump out to all | Navigating nesting. |
| **Back button / breadcrumb** | Click "Back" or the breadcrumb level | Exit one level up | Always available. |

**Key behavior:** while editing a symbol, **all instances update live**. The breadcrumb (`Scene ▸ character ▸ head ▸ eye`) shows nesting depth.

---

## 11.4 Graphic instance loop modes & Frame Picker

A **graphic** instance shows which internal frame? Controlled by **Loop** options in Properties:

| Mode | Behavior |
|---|---|
| **Loop** | Repeats the symbol's internal frames, mapped 1:1 with the main timeline (internal frame = (mainFrame - 1) % symbolDuration + 1). |
| **Play Once** | Plays once, then holds the last frame. |
| **Single Frame** | Always shows **one** internal frame (the "First" frame) — static. |

- **First frame** field = which internal frame the instance starts at (set via number or the **Frame Picker** panel — a visual browser of the symbol's frames, core to lip-sync Part 18).
- **This is how Animate does lip-sync and expression switching:** one mouth symbol with 12 viseme frames; each keyframe on the main timeline is the *same instance* with a different **First frame**.

**Movie clips ignore these** — they always play their own clock.

---

## 11.5 Instance properties (what's stored per instance)

```jsonc
{ "type":"symbolInstance",
  "symbolId":"arm",                // which definition
  "transform": {...},              // Part 04
  "colorEffect": { "mode":"none|brightness|tint|alpha|advanced", "value":... },
  "filters": [ { "type":"dropShadow|blur|glow|...", "params":{...} } ],
  "loop": { "mode":"loop|playOnce|singleFrame", "firstFrame": 1 },   // graphic only
  "instanceName": "leftArm"        // for scripting/behaviors
}
```

- **Color effect** — per-instance: brightness (%), tint (color + %), alpha (0–100), advanced (combined). This is how you recolor one instance without touching the symbol (e.g., 3 red balls from one symbol).
- **Filters** — per-instance effects: Drop Shadow, Blur, Glow, Bevel, Gradient Glow, Gradient Bevel, Adjust Color. Filters are tweenable in motion tweens (Part 09.1.4).
- **Instance name** — a scripting/behavior handle (unique per scope).

---

## 11.6 Swap Symbol & Duplicate Symbol

| Command | Does |
|---|---|
| **Swap Symbol** (Properties / right-click) | Replace an instance's symbol with a **different** symbol **while keeping** the instance's transform, color effect, name. (e.g., swap mouth pose symbol A → B without re-placing.) |
| **Duplicate Symbol** | Clone the symbol definition (new name) and point **this instance** at the clone — lets you vary one instance without affecting others. |

**Swap is the heart of lip-sync/expression workflows:** swap the mouth instance to a new pose at a keyframe → the pose changes, position stays.

---

## 11.7 Break Apart (Ctrl+B) on symbols

| Target | Break Apart once | Break Apart twice |
|---|---|---|
| Symbol instance | Detaches the instance → the symbol's art becomes **raw content on this frame** (a copy; the symbol stays in the Library). | (if it was a group inside) → further flatten to shapes. |
| Text | Per-character text blocks | Vector shapes. |
| Bitmap | Bitmap-fill region (editable) | — |
| Group | Its children | (children may be groups/symbols → keep breaking). |

**Rule:** Break Apart flattens **one level**; repeat to go deeper. It **never deletes** the Library symbol — it only detaches this instance from it.

---

## 11.8 Nested animation (how it works — the full mechanism)

Nesting = symbols **inside** symbols. The model is a **tree of timelines**:

```
Main timeline (frame 1..240)
 └─ layer "body" → instance "character" (movie clip, 240 frames internal)
      └─ inside "character":
          ├─ layer "head" → instance "head" (graphic)
          │     └─ inside "head": layer "eye" → instance "blink" (movie clip, 10-frame loop)
          └─ layer "arm" → instance "arm" (movie clip, walk swing)
```

### How playback samples the tree (deterministic rule)
```
sample(node, time):
  for each child instance on the current frame:
    case graphic:  childTime = map(mainTime, instance.loop)   // 11.4
    case movieClip: childTime = instanceInternalClock          // independent
    recurse sample(child, childTime)
```

- **Graphic** nests **synchronize** to the parent clock (driven).
- **Movie clip** nests **run free** (own clock, loop).
- **Button** nests are state-driven (Up/Over/Down/Hit).

### The classic "nested animation not visible" gotcha
A movie clip's internal animation **does not play on the main timeline** (it plays on export/test). A graphic's internal animation **does** scrub with the main timeline. This is the #1 beginner confusion. Our app shows a **live "play nested clips" preview toggle** so users see movie-clip animation while authoring (default ON) — a direct improvement.

### Practical recipe (from Animate community best practice)
1. Animate the part as a **movie clip** (independent loop).
2. Put the movie clip where needed; it loops on its own.
3. Use **graphic symbols** when you need the parent timeline to **drive** the child (lip-sync, expressions, synced repeats).

---

## 11.9 Editing the registration point after creation

- Enter symbol edit → move the artwork relative to the **crosshair** (the crosshair = the registration point). Moving art right = registration point moves left relative to art. Also **Edit > Edit Symbols** then reposition.
- The instance's on-stage position updates accordingly (x/y = registration point's location).

---

## 11.10 Data model (symbols & instances)

```jsonc
// Library entry (definition)
{ "type":"symbol", "id":"arm", "name":"arm", "symbolType":"graphic|movieClip|button",
  "registrationPoint": { "x":0, "y":0 },          // symbol-local (0,0) origin
  "timeline": { "layers":[...], "duration": 30 } }

// Instance (on any timeline)
{ "type":"symbolInstance", "symbolId":"arm", "transform":{...}, "colorEffect":{...},
  "filters":[...], "loop":{"mode":"loop","firstFrame":1}, "instanceName":null }
```

Full schemas: Part 33.

---

## 11.11 BUILD CHECKPOINT M3 (symbol slice)

- [ ] Create symbols from selection (F8) with name/type/registration-grid; drag-to-library.
- [ ] Three types implemented (graphic loop/play-once/single-frame + first-frame; movie clip independent clock; button 4 states).
- [ ] Editing modes: symbol edit + edit-in-place + breadcrumb + back button; live instance updates.
- [ ] Instance properties: transform, color effect, filters, loop, instance name.
- [ ] Swap Symbol / Duplicate Symbol.
- [ ] Break Apart hierarchy (instance → raw content → shapes).
- [ ] Nested playback: graphic sync vs movie-clip free; live preview toggle.
- [ ] Registration point editing.

*Next: `12_library.md` — import, create, rename, duplicate, delete, organize, folders, search, preview, linkage, export, reuse, replace, update instances.*
