# F-03-14 — BONE / WARP-PIN / CAMERA SELECTION
```
SOURCE BLUEPRINT: Part 03 §3.4.7–3.4.9 · DEEP FEATURE: F-03-14 · STATUS: AUDITED
DEPENDS ON: F-03-01/02 · FEEDS: Part 14 (bones), Part 02d (warp, camera)
```
## A. IDENTITY
1. Official name: (bone selection / warp-pin selection / camera selection). 4. Purpose: select **rig elements** (bones, warp pins) and the **camera** as special targets. 8. Status: current.

## EVIDENCE
E1 [OFFICIAL] Bone selection: click a bone selects it; **Shift+click multi-select**; **double-click a bone selects the whole armature**; clicking a pose-layer frame selects the whole armature (Part 14 / F-03-01 F). E2 [OFFICIAL] Bound points highlight when a bone selected (Bind tool). E3 [OFFICIAL] Warp pins = small circles; select individually (Part 02d T2D.11). E4 [OFFICIAL] Camera: selecting the Camera tool / camera layer activates it; not a stage hit (Part 16). E5 [COMMUNITY] Bone tool abandoned/half-working per users (F-03-14 → Part 14 [WISH W2]).

## D. INTERACTIONS
Bone: click = bone; Shift+click = multi; double-click = armature; pose-layer frame click = armature. Warp pin: click = pin; drag = deform. Camera: tool click = activate camera layer; no stage hit.

## E. STATES
Bone selected (red) + bound points (yellow, Bind tool). Armature selected (double-click). Warp pin selected vs asset selected. Camera active (overlay) vs inactive.

## F. COMPATIBILITY
Bone: `{nodeId: boneId}` in rig domain. Warp pin: `{nodeId, subPath:'warp.pins[i]'}`. Camera: not a `targets` member (separate camera state). Armature: whole-armature target via pose-layer frame.

## L. LIMITATIONS
L.1 Bone+AssetWarp incompatibility (warp pins show but cursor crosses) [COMMUNITY E5] → ours: bones and warp are **separate rig types**, never mixed on one part. L.2 No stage hit for camera (only layer/tool) → ours: clickable camera outline widget.

## M. EDGE CASES
M.1 double-click bone = armature · M.2 shift-multi bones · M.3 bind-point highlight toggle · M.4 warp pin + bone conflict (avoided in ours) · M.5 camera layer deleted = camera off · M.6 pose-layer frame click selects armature.

## O/P/Q/R/S/Y
Data: bone/pin targets + `camera.enabled` state. Events: `selection:changed`, `camera:activated`. Undo: selection none; bone/pin pose edits = commands. Serialization: armature/pins persisted; camera selection not. Mobile: bone drag via loupe; long-press = bone menu. Implementation: bone/pin = overlay-hit first (F-03-01 pass 1); camera = dedicated widget.

## TESTS
TS-01 click bone · TS-02 shift multi-bone · TS-03 double-click = armature · TS-04 pose-frame click = armature · TS-05 bind-point highlight · TS-06 warp pin select/drag · TS-07 camera tool activates layer · TS-08 bone+warp separation (ours) · TS-09 camera overlay click (ours) · TS-10 mobile bone drag · TS-11 undo pose edit · TS-12 serialization round-trip.

## AUDITS
No contradiction. Self-challenge: overlooked = armature-vs-bone selection granularity + camera-not-a-stage-hit + bone/warp incompatibility — covered. Version: bones changed Flash CS5.5 → Animate (F-03-01 E17 note); warp added 19.0.
```
FEATURE COMPLETE: F-03-14 — Bone / warp-pin / camera selection — AUDITED
```
