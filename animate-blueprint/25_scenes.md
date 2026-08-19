# PART 25 — SCENES
### Scene creation, duplication, ordering, duration, navigation, scene-level timeline/camera/audio — plus multi-scene tabs (a user-requested improvement).

---

## 25.0 What a scene is

A **scene** = a named, self-contained **main timeline** within a document. A document = an **ordered list of scenes** sharing one **Library** (Part 12).

```
document
 ├─ scene "intro"   (timeline: layers × 240 frames)
 ├─ scene "act1"    (timeline: layers × 480 frames)
 └─ scene "credits" (timeline: layers × 120 frames)
```

- Playback plays scenes **in list order** (intro → act1 → credits) unless a behavior jumps to a named scene/frame (Part 01 §1.12).
- Scenes share **all Library assets** (a symbol made in one scene is usable in every scene).
- Use scenes for: shots, chapters, game levels, distinct acts. (Many modern productions instead use **one scene + movie-clip symbols** — both must work.)

---

## 25.1 Scene operations

| Operation | Trigger | Data change | Rules |
|---|---|---|---|
| **Create** | Scene panel + / Insert > Scene | append a scene with a default timeline | named "Scene N"; becomes active. |
| **Duplicate** | Scene panel → Duplicate | deep-copy the scene's timeline (+ optionally its used assets) | assets stay shared; timeline copied. |
| **Delete** | trash | remove the scene | prompt; other scenes unaffected; shared assets stay (use-count recomputed). |
| **Rename** | double-click | scene name | display-only; referenced by ID. |
| **Reorder** | drag up/down | scene order | changes playback order. |
| **Navigate** | click / Edit bar / View > Go To | switch the active scene (which timeline is shown/edited) | stage + timeline re-bind to the new scene. |

---

## 25.2 Scene properties

- **Duration** = the scene's timeline extent (max frame across layers) — edited by extending/shortening frames (Part 07).
- **Background color** — inherited from the document (Part 01 §1.7) by default; our app allows **per-scene background** override (P1).
- **Scene-level settings** — frame rate is **document-level** (all scenes share fps); our app allows per-scene fps override (P2, with a conversion warning).

---

## 25.3 Scene-level timeline / camera / audio

Each scene's timeline is **independent**:

| Subsystem | Per-scene behavior |
|---|---|
| **Timeline** | Own layer stack + frames. The Library is shared; frames are not. |
| **Camera** | **One camera per scene** (the camera layer lives on the scene's timeline — Part 16). Different scenes = different camera moves. |
| **Audio** | Scene audio lives on the scene's audio layers (Part 17). A sound that must span scenes is placed on each scene (or on a top-level "project audio" track — our app's addition, P1: a **master audio track** above scenes for global music). |
| **Onion skin** | Applies within the scene (doesn't ghost across scene boundaries). |

---

## 25.4 Scene navigation (authoring UX)

- **Scene panel** (Window > Scene): the list; click to switch.
- **Edit bar** (above stage): `Scene ▸ symbol ▸ …` breadcrumb (Part 11.3) — clicking the scene name switches scenes; "Back" exits symbol edit.
- **View > Go To**: First / Previous / Next / Last scene.
- **Playback** (`Enter`): plays the **active scene**; **Test** (`Ctrl+Enter`) plays **all scenes in order**.

---

## 25.5 Multi-scene tabs *[WISH W12]* (our improvement)

Users explicitly asked: "I wish I could have multiple scenes open like in Animate." Our app:

- **Tabs for scenes** (like document tabs): open multiple scenes side-by-side in tabs; switch without losing context.
- **Split view** (P2): view two scenes simultaneously (reference one while animating another).
- Scene tabs are **view state** (not saved in the project) — the scene list itself is the data.

---

## 25.6 Data model

```jsonc
"document": {
  "settings": {...},                 // Part 01 §1.7
  "scenes": [
    { "id":"sc1", "name":"intro",  "timeline": { "layers":[...], "duration": 240 } },
    { "id":"sc2", "name":"act1",   "timeline": {...} }
  ],
  "sceneOrder": ["sc1","sc2"],
  "library": [...],                  // shared across scenes
  "masterAudioTrack": null           // optional project-wide audio (our addition)
}
```

---

## 25.7 BUILD CHECKPOINT M5 (scene slice)

- [ ] Scene CRUD + reorder + rename + navigate (panel + edit bar + Go To).
- [ ] Per-scene timeline/camera/audio; shared library with use-count.
- [ ] Playback: active scene (Enter) vs all-scenes-in-order (Test).
- [ ] Scene tabs + split view *[WISH W12]*.
- [ ] Optional per-scene background + master audio track.

*Next: `26_properties_panel.md` — the contextual inspector: object/shape/text/symbol/frame/document/camera/audio property schemas.*
