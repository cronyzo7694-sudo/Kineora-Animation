# F-13-09 — WALK-CYCLE RECIPE · F-13-10 — REUSABLE CLIPS · F-13-11 — THREE RIG APPROACHES · F-13-12 — CHARACTER DATA MODEL
```
SOURCE BLUEPRINT: Part 13 §13.8–13.10 · DEEP FEATURES: F-13-09/10/11/12 · STATUS: AUDITED
DEPENDS ON: F-13-06/07/08, F-11-12, F-14
```
## F-13-09 WALK-CYCLE RECIPE
1. Official name: (walk cycle). 4. Purpose: the canonical looping walk. 8. Status: current.
EVIDENCE
E1 [OFFICIAL] Adobe walk-cycle: **contact → recoil(down) → passing → high point(up) → return to contact**; loop = last frame returns to first; vertical torso motion; **arm swing opposite to legs**; foot-slide troubleshoot (match foot backward speed to body forward speed). E2 [OFFICIAL] same: "save your walk cycle as a reusable motion preset or **Animate symbol**."
SEMANTICS (recipe)
1. 4–5 contact poses (or 8 with down/passing/up), 12–24 fps feel.
2. Body bob (torso y) offset half a step from legs.
3. Arm swing opposite to legs (E1).
4. **Foot doesn't slide**: foot backward speed = body forward speed on contact (E1).
5. Loop inside a movie clip (E2).
LIMITATIONS: L.1 foot-slide is the classic bug → ours: ground-contact lock helper (P2). L.2 loop seam pop → identical first/last pose.
EDGE: M.1 attitude walks (sad/angry — E-Udemy) · M.2 profile vs 3/4 walk.
TESTS: TS-01 4-pose cycle · TS-02 loop seamless · TS-03 arm swing opposite · TS-04 body bob · TS-05 no foot slide · TS-06 ground-contact lock (ours) · TS-07 wrap in symbol (E2).

## F-13-10 REUSABLE CLIPS
1. Official name: (clip library). 4. Purpose: wrap finished animations in movie clips; assemble scenes from clips. 8. Status: current.
EVIDENCE: E1 [OFFICIAL] Adobe: save cycle as reusable symbol (E2 above). E2 [BLUEPRINT Part 13.8]: clip library (idle/walk/run/jump/wave/talk) → place on timelines.
SEMANTICS: each finished anim → movie clip → reuse; scene assembly = placing clips.
LIMITATIONS: L.1 clip params (speed/direction) not exposed → ours: instance params (P2).
EDGE: M.1 clip in clip · M.2 scene assembled from clips.
TESTS: TS-01 wrap walk in MC · TS-02 place in scene · TS-03 clip loops · TS-04 params (ours).

## F-13-11 THREE RIG APPROACHES
1. Official name: (rig approaches). 4. Purpose: hierarchy vs bones/IK vs asset warp — compare. 8. Status: current.
EVIDENCE: E1 [BLUEPRINT Part 13.9] three approaches table. E2 [COMMUNITY] bone+asset-warp incompatible (F-14 E5).
SEMANTICS
| Approach | Model | Pros | Cons |
|---|---|---|---|
| A. Transform hierarchy | nested instances+transforms | robust, copy-safe | FK only |
| B. Bones/IK | armature+pose layer | fast posing, constraints | historically buggy |
| C. Asset Warp | mesh+pins | deform one bitmap | soft only |
Ours: all three + shared rig layer (mix per part).
LIMITATIONS: L.1 B+C incompatible in Animate → ours: separate rig types, never mixed (F-03-14 L.1).
EDGE: M.1 mix A+B per character.
TESTS: TS-01 hierarchy rig · TS-02 bone rig · TS-03 warp rig · TS-04 mix A+B · TS-05 B+C separation (ours).

## F-13-12 CHARACTER DATA MODEL
EVIDENCE: [BLUEPRINT Part 13.10] (our design).
O. MODEL
```jsonc
"character": { "id":"ch_hero","rootSymbolId":"character","name":"Hero",
  "parts":[ { "id":"head","symbolId":"ch_head","parentId":null,"pivot":{"x":20,"y":8},"zOrder":3 } ],
  "rigs":[ { "id":"armR_ik","type":"bones","chain":["armUpper_R","armLower_R","hand_R"],
             "constraints":[{"boneId":"elbow","minRot":-10,"maxRot":130}] } ],
  "poses":[ { "id":"walk_contact","parts":[{"partId":"armUpper_R","transform":{...}}] } ],
  "clips":[ { "id":"walkCycle","symbolId":"walkCycle","duration":24,"loop":true } ] }
```
DOCUMENT vs VIEW: character/parts/rigs/poses/clips = document; current pose/edit = view.
TESTS: TS-01 round-trip character · TS-02 rig chain · TS-03 pose library · TS-04 clips · TS-05 reload identical.
## AUDITS (all four)
No contradiction. Self-challenge: overlooked = 5-pose walk + foot-slide fix (E1) + B+C incompatibility — covered.
```
FEATURE COMPLETE: F-13-09/10/11/12 — Walk cycle, clips, rig approaches, character data model — AUDITED
```
