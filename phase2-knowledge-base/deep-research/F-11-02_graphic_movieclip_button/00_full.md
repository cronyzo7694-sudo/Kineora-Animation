# F-11-02 — GRAPHIC SYMBOL · F-11-03 — MOVIE CLIP · F-11-04 — BUTTON SYMBOL · F-11-05 — FONT SYMBOL
```
SOURCE BLUEPRINT: Part 11 §11.1.1–11.1.4 · DEEP FEATURES: F-11-02/03/04/05 · STATUS: AUDITED
DEPENDS ON: F-11-01
```
## F-11-02 GRAPHIC SYMBOL
1. Official name: Graphic symbol. 4. Purpose: static art + reusable animation **synchronized to the main timeline**. 8. Status: current.
EVIDENCE
E1 [OFFICIAL] `symbols.html`: graphic symbols for static images + reusable animation "tied to the main Timeline… operate in sync with the main Timeline"; **interactive controls and sounds won't work** in a graphic symbol's animation. E2 [OFFICIAL] same: graphic symbols add **less file size** than buttons/movie clips ("no timeline" overhead — i.e., no independent clock). E3 [OFFICIAL] `symbol-instances.html`: graphic loop options (Loop/Play Once/Single Frame) + first frame; **Frame Picker** only for graphics.
SEMANTICS: parent-driven playback (F-11-08); no interactivity/sound (E1); lighter (E2).
LIMITATIONS: L.1 no interactivity/sound inside (E1) → use movie clip. L.2 loop mapping = main-frame → internal-frame (F-11-08).
EDGE: M.1 graphic shorter than span (loops) · M.2 single-frame graphic (static).
TESTS: TS-01 graphic syncs to parent · TS-02 sound inside graphic ignored (E1) · TS-03 loop/once/single (E3) · TS-04 frame picker (E3) · TS-05 lighter file (E2).

## F-11-03 MOVIE CLIP
1. Official name: Movie clip symbol. 4. Purpose: self-contained animation with an **independent clock** (loops on its own); interactive + scriptable. 8. Status: current.
EVIDENCE
E1 [OFFICIAL] `symbols.html`: movie clips have "their own multiframe Timeline that is **independent** from the main Timeline… nested… can contain interactive controls, sounds, and even other movie clip instances"; scriptable (instance name). E2 [COMMUNITY] "I never put a graphic symbol on the main stage unless static… movie clips give much more control." E3 [COMMUNITY] nested clip animation won't show on main timeline (must test movie) — the sync gotcha.
SEMANTICS: independent clock; instance name for scripting; loop default.
LIMITATIONS: L.1 internal anim invisible on main timeline (E3) → ours: live preview toggle. L.2 independent clock = harder to scrub-sync → use graphic when parent must drive.
EDGE: M.1 30-frame clip on 1-frame main timeline (still plays) · M.2 clip inside graphic (graphic rules win at that level).
TESTS: TS-01 clip loops independent (E1) · TS-02 sound/interactivity inside (E1) · TS-03 nested clips (E1) · TS-04 preview toggle (ours) · TS-05 instance name scripting.

## F-11-04 BUTTON SYMBOL
1. Official name: Button symbol. 4. Purpose: interactive button with 4 states on its own timeline. 8. Status: current.
EVIDENCE
E1 [OFFICIAL] `creating-buttons.html`: button states **Up, Over, Down, Hit** (Hit = invisible hit area); buttons **disabled by default** while authoring (Enable Simple Buttons toggle); to select a button, drag a rectangle (F-03-03 E9). E2 [OFFICIAL] `symbols.html`: button tracking (as button / as **menu item**); animated buttons = movie clips inside button states.
SEMANTICS
- 4 frames = 4 states; Hit = clickable region (invisible).
- Authoring: disabled (selectable); Enable Simple Buttons = live preview (E1).
- Tracking: "as menu item" = drop-down behavior.
LIMITATIONS: L.1 click-select blocked when live (E1) → Alt+click force-select (carried). L.2 Hit frame required or button unclickable → ours: warn if missing.
EDGE: M.1 no Hit frame → invisible clickable area issues · M.2 animated button (movie clip in a state) · M.3 menu-item tracking.
TESTS: TS-01 4 states · TS-02 Hit = invisible area (E1) · TS-03 disabled default (E1) · TS-04 enable simple buttons · TS-05 marquee to select · TS-06 menu-item tracking · TS-07 missing Hit warn (ours).

## F-11-05 FONT SYMBOL
1. Official name: Font symbol. 4. Purpose: embed/export a font for reuse. 8. Status: niche/legacy.
EVIDENCE
E1 [OFFICIAL] `symbols.html`: font symbols "export a font and use it in other Animate documents."
SEMANTICS: font as a Library asset. LIMITATIONS: niche → ours: font embedding = asset setting (Part 22), no separate type.
TESTS: TS-01 (ours) font embedding via text asset setting; no font-symbol type.

## AUDITS (all four)
No contradiction. Self-challenge: overlooked = graphic-no-sound (E1) + clip-independent-clock + Hit-frame-invisible + buttons-disabled-default — covered.
```
FEATURE COMPLETE: F-11-02/03/04/05 — Graphic/Movie clip/Button/Font symbols — AUDITED
```
