# Stick Studio — Chibi Stick-Figure Rig

Ek doosra character studio: chibi bust (tumhare uploads se) + **stick arms & legs** jo shirt ke
sides se attached hain, **pose clips**, aankhon me **pupil jo blink pe chhupta hai**, aur
**audio-amplitude mouth** jo tumhari file pe chalta hai. Sab kuch code se banta hai — koi
pre-rendered video nahi.

App: `http://localhost:8001/index.html` (ya `./serve.sh`)

---

## 1. Kya bana

### Body
| layer | file | note |
|---|---|---|
| head | `assets/head.png` | bust ka sir, neck ke neeche se cut — alag halka hila sakte ho |
| body | `assets/body.png` | shirt + kandhe (chin ke neeche se) |
| neck | `assets/neck.png` | skin stub, sir ke peeche — sar ghumane par gap nahi dikhta |
| arms / legs | runtime (sticks) | 2-bone IK, `stickW` / `armLen` / `legLen` se control |

Limbs ke anchors (`manifest.rig`): shoulders `[425,750]` / `[884,750]`, hips `[541,1177]` / `[768,1177]`,
segment lengths upperArm 205, foreArm 200, thigh 215, shin 205.

### Eyes (16 frame chart ka shape use ho raha hai)
- Eye ko sprite ki tarah paste nahi kiya — `manifest.eye` me **outer + inner polygons** hain,
  isliye ring aur sclera vector ki tarah crisp rehte hain.
- **Pupil** ek black dot hai jo cursor follow karta hai (chhoti micro-saccade jumps bhi).
- **Blink**: upper + lower lid dono curve hote hue beech me milte hain — `openness 1 → 0`
  par pupil lid ke **peeche chhup jata hai**, ek bhi white pixel nahi bachta.
- Timing asli aankh jaisi: closing ~90 ms (tez shuru, soft landing), band 45 ms, khulna ~165 ms.
- `Hold eyes closed` switch = permanent band. `Pupil size` / `Eye size` / `Eyes position` sliders.

### Mouth
- Chart ke **16 frames** ek aligned sheet me (`assets/mouth_sheet.png`), top edge lip-line pe
  anchor — mouth neeche ki taraf khulta hai, hoth ki jagah nahi hilta.
- `mouth position` sliders **ya seedha drag** (mouth par pakdo aur kheencho).
- **Audio**: `AUDIO FILE` se mp3/wav → 100 Hz RMS envelope → `idx = pow(openness, 1.35) * 15`.
  Play ke saath sync. **Record** dabao to awaaz bhi video me mux hoti hai.

### Stick limbs (asli haath / pair jaisa)
- Har hand/paer **drag** karo → 2-bone IK. Elbow ka **pole** fix hai: elbow bahar
  (thoda sa), knee neeche — kabhi body ke andar nahi mudta.
- **Elbow/knee** par pakad ke ghumao → sirf wahi segment ghumta hai.
- Hand me **palm + angootha** hai (dono haath ke thumb andar ki taraf), pair **flat sole**
  ke saath bahar ki taraf — dono ka art (`drawHand` / `drawFoot`) runtime banta hai.
- `Show joints` se skeleton points dikhte hain, `Stick thickness` / colour / length sliders.

### Aage / peeche (depth layering)
- Har limb ka **`z`** hai: `z > 0` body ke saamne, `z < 0` shirt ke peeche.
- Isliye walk me aage jaata haath shirt ke **upar**, peeche jaata haath shirt ke **peeche**
  se guzarta hai; paer bhi aage jaate waqt shirt ke saamne, peeche jaate waqt chhup jata hai.
- `z` clip ke saath save hota hai, aur dikhne me bhi help karta hai: saamne wala limb thoda
  mota, peeche wala thoda patla.

### Real walk
- `Walk` clip ek **live cycle** hai: `walkPhase` par foot lift, knee bend, arm counter-swing
  aur `z` crossing — sab phase-locked. `Walk speed` slider (0–2×) se speed.
- Beech me do chhote **bobs** + kamar ka halka roll, taaki chalna asli lage, robotic nahi.

### Depth move (andar / bahar)
- Stage par **khaali jagah drag** karo: left/right = character idhar-udhar, **upar = andar
  (chhota)**, **neeche = bahar (bada)**. Ground line fix rehti hai, isliye lagta hai wo
  background me ja raha / bahar aa raha hai. Yehi recording ke waqt bhi chalta hai.
- `Depth move` switch ON karke bhi wahi milta hai (upar/neeche = depth, left/right = move),
  ya `Depth` slider se seedha 0–100 %.
- Saath me halka fade + chhota/faint shadow (atmospheric depth), `Depth` slider 0–100 %.

### Clips (jo tumne maanga)
- Koi bhi pose banao → naam likho → **+ Save pose**. Clip usi waqt save ho jata hai.
- Neeche clip bar me (aur `Clips` card me) sab clips dikhte hain; **record ke waqt seedha
  clip par click** karo — pose 260 ms ke smooth tween se lagta hai, jaisa set kiya tha waisa hi.
- Keyboard `1`–`9` se bhi clip chalti hai (record karte waqt handy).
- 6 built-in clips: Idle, Wave, Think, Point, Stretch, **Walk** (live walk cycle).
- Clips `localStorage` me rehti hain; `×` se delete.

### Stage / export
- Aspect: **9:16 / 16:9 / 1:1 / 4:5**, quality **HD / Full HD / Ultra HD**, fps **24 / 30 / 60**.
  UHD 9:16 = **2160 × 3840**, 16:9 = **3840 × 2160** (canvas ki actual resolution).
- Background: Paper / White / Green / Blue / Black / None + **apni image upload**.
- Character drag se move, scroll se zoom (pointer ke around), `Reset position`.
- Record: `canvas.captureStream(fps)` → mp4 (avc1) / webm (vp9), bitrate `W*H*fps*0.18`
  (cap 90 Mbps). 2160×3840 @30 fps test me theek chala.
- **Pause / Resume (recording ke beech me):** `MediaRecorder.pause()` / `.resume()` — same
  file chalti rehti hai. Pause karke background / pose / depth badlo, Resume dabao:
  sab kuch **ek hi video** me. Test: 2× pause → bg change → resume → mp4 689 KB, koi
  error nahi. Keyboard `P`.

---

## 2. Keyboard
| key | kaam |
|---|---|
| `1`–`9` | clip chalao |
| `B` | blink |
| `C` | eyes closed toggle |
| `Space` | mouth auto ↔ manual |
| `P` | recording pause / resume |
| `D` | depth move on / off (record ke waqt bhi) |

---

## 3. Files

```
chibi/
  index.html            UI (controls + clip bar)
  style.css             look
  app.js                rig, IK, lids, mouth, clips, record
  build_chibi.py        assets banata hai (bust split, eye polygons, mouth sheet)
  lib.py                white-key + defringe
  assets/               head / body / neck / eye_open / mouth_sheet + manifest
  src/                  tumhare 3 uploads
  serve.sh              python3 -m http.server 8001
```

## 4. Rebuild

```bash
cd chibi
python3 build_chibi.py      # assets/*.png + manifest.json + manifest.js
./serve.sh                  # http://localhost:8001
```

## 5. Aage
- Aur poses chahiye to bas naye clip banao aur save kar lo (code chhedne ki zaroorat nahi).
- Chaho to legs/arms ki jagah sketch-style stick hands (fingers) bhi bana sakta hoon.
- Lip-sync ko viseme-based karna ho to mouth frames ko phoneme pe map kar denge.
