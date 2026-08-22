# RESEARCH 01 — WORKSPACE / STAGE — INDEX

> Goal: Adobe Animate jaisa Stage + Workspace banana, par sirf 2D animation ke liye minimal. Coding ke time sochna na pade — is research me hi sab likha ho ki kya kaha hoga, click se kya hoga, shortcut kya hai.

## Kyu Stage sabse pehle?

- Stage = woh jagah jaha cartoon banta hai. Agar stage hi kharab hoga to brush, layer, timeline sab fail.
- Current Kineora me stage hai par: pasteboard fixed gray, rulers incomplete, zoom/pan basic, stage properties Properties panel me scattered.
- Adobe me stage = published frame, pasteboard = infinite work area, view transform = alag, camera = alag.

## Is folder me kya hai?

| File | Content |
|------|---------|
| 00_INDEX.md | Ye file — overview + goals |
| 01_ADOBE_EVIDENCE.md | Adobe official docs se nikala hua sach — stage kya hai, pasteboard kya hai, workspace kya hai |
| 02_CURRENT_IMPL_AUDIT.md | Hamari current implementation me kya hai, kya kami hai, line-by-line |
| 03_STAGE_DEFINITION.md | Stage ka exact definition — size, origin, coordinates, background, border, render order |
| 04_PASTEBOARD.md | Pasteboard / Work Area ka full spec — infinite canvas kaise karna hai |
| 05_WORKSPACE_LAYOUT.md | Workspace layout — Essentials jaisa, panels kaha honge, Adobe ki tarah layer+timeline ek sath kaise |
| 06_VIEWPORT.md | Zoom, Pan, Fit, Rulers, Grid, Guides, Snapping ka spec |
| 07_INTERACTIONS.md | Har click, drag, double-click, wheel, middle-click, right-click pe kya hoga — state machine |
| 08_SHORTCUTS.md | Saare shortcuts — Adobe + hamare |
| 09_STATE_EVENTS.md | Kaunse events fire honge, kaun sunega, kaunsa command banega |
| 10_IMPLEMENTATION_BLUEPRINT.md | Coding blueprint — koi sochna nahi, seedha code likhna hai — file structure, types, functions, tests |

## Non-Goals (abhi nahi karna)

- Camera system (ye alag research 02 me)
- Advanced export (PNG sequence, video — ye research 06 me)
- Tools (brush etc — research 02)
- Timeline old ko naya banana (research 04)

## Success Criteria for Stage Research

1. Ek naya dev Stage.tsx khol ke samajh jaye ki stage kya hai bina Adobe docs padhe
2. Pasteboard infinite lage, stage clear dikhe
3. Zoom/pan 100% Adobe jaisa lage
4. Workspace me layer panel aur timeline panel Adobe ki tarah merged lage (abhi alag hai)
5. Properties panel me stage select karne pe document properties aaye (W/H, bg, fps)

## Adobe Base Files Used

- `animate-blueprint/01_application_map.md` §1.1.1, §1.4
- `FORENSIC_SPECS/SYS-01_application_workspace.md` v5
- `phase2.5-ui/contracts/C-02_shell_workspace.md`
- `animator/ui/src/render/canvasRenderer.ts` — PASTEBOARD_COLOR, STAGE_BORDER, render()
- `animator/ui/src/components/Stage.tsx` — current gesture handling
- Official: helpx.adobe.com/animate/using/using-stage-tools-panel.html
- Official: helpx.adobe.com/animate/using/timeline.html

## Research Method

1. Adobe docs padh ke sach nikala
2. Current code padh ke gap nikala
3. Gap ko spec me likha — har field ke saath: ID, label, location, shortcut, commandId, event, undo, persist, testId
4. Implementation ke liye exact TS/Rust types likhe

> Next: 01_ADOBE_EVIDENCE.md padho
