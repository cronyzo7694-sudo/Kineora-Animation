# F-11-12 — NESTED ANIMATION PLAYBACK · F-11-13 — REGISTRATION POINT EDITING · F-11-14 — SYMBOL DATA MODEL
```
SOURCE BLUEPRINT: Part 11 §11.8–11.10 · DEEP FEATURES: F-11-12/13/14 · STATUS: AUDITED
DEPENDS ON: F-11-01/07
```
## F-11-12 NESTED ANIMATION
1. Official name: (nested timelines). 4. Purpose: the tree-of-timelines playback model (graphic sync vs movie-clip free). 8. Status: current.
EVIDENCE
E1 [OFFICIAL] `symbols.html`: movie clips "nested inside a main Timeline"; graphics sync to main timeline. E2 [COMMUNITY] "a nested animation in a movie clip won't be visible in the main timeline. You have to use test movie to see it." E3 [COMMUNITY] best practice: animate part as movie clip → place anywhere; use graphic when parent must drive.
SEMANTICS (recursive sampling)
```
sample(node, time):
  for each child instance at current frame:
    graphic:   childTime = map(mainTime, instance.loop)   // parent-driven
    movieClip: childTime = own clock                     // independent
    recurse
```
LIMITATIONS: L.1 clip anim invisible on main timeline (E2) → ours: live preview toggle. L.2 deep nesting perf → cache leaf render.
EDGE: M.1 graphic in clip in graphic · M.2 clip on 1-frame main timeline still plays · M.3 sync offsets.
TESTS: TS-01 graphic syncs · TS-02 clip independent · TS-03 clip plays on 1-frame main · TS-04 preview toggle (ours) · TS-05 3-deep nest · TS-06 deterministic sampling.

## F-11-13 REGISTRATION POINT EDITING
1. Official name: (change registration point). 4. Purpose: move the symbol's (0,0) after creation. 8. Status: current.
EVIDENCE
E1 [OFFICIAL] `symbols.html`: "To change the registration point, when you edit a symbol, move the symbol contents in relation to the registration point (the crosshair)." E2 [OFFICIAL] same: crosshair indicates registration point in symbol-editing mode. E3 [COMMUNITY] moving content in isolation mode moves ALL instances' registration (expected); replace-symbol trick for a new registration point.
SEMANTICS: registration point = symbol-local (0,0); moving art relative to crosshair = moving the registration point; instance x/y refers to where it lands (F-11-09 E4).
LIMITATIONS: L.1 moving content shifts all instances' position → ours: "adjust instances to compensate" option (P2). L.2 transform point (pivot) ≠ registration point — keep separate (F-04-07).
EDGE: M.1 registration at joint (rig, Part 13) · M.2 pivot vs registration confusion.
TESTS: TS-01 move content → registration moves (E1) · TS-02 crosshair visible (E2) · TS-03 instance x/y = registration location · TS-04 compensate option (ours) · TS-05 pivot stays independent.

## F-11-14 SYMBOL DATA MODEL
EVIDENCE: [OFFICIAL] carried (E-symbols/symbol-instances).
O. MODEL (Part 33 §33.7 consolidated)
```jsonc
// Library definition
{ "type":"symbol","id":"arm","name":"arm","symbolType":"graphic|movieClip|button",
  "registrationPoint":{"x":0,"y":0}, "timeline": Timeline }
// Instance
{ "type":"symbolInstance","symbolId":"arm","transform":Transform,
  "colorEffect":{"mode":"none|brightness|tint|alpha|advanced","value":{}},
  "filters":[{ "type":"dropShadow","params":{} }],
  "loop":{"mode":"loop|playOnce|singleFrame","firstFrame":1}, "instanceName":null }
```
DOCUMENT vs VIEW: symbol+instance = document; editMode/breadcrumb = view.
TESTS: TS-01 round-trip symbol+instance · TS-02 nested symbols · TS-03 instance loop · TS-04 reload identical · TS-05 rename-safe (ID refs).
## AUDITS (all three)
No contradiction. Self-challenge: overlooked = clip-invisible-on-main (E2) + registration-vs-pivot + move-content-shifts-instances (L.1) — covered.
```
FEATURE COMPLETE: F-11-12/13/14 — Nested animation, registration editing, symbol data model — AUDITED
```
