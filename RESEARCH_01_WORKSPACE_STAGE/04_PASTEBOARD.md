# 04 — PASTEBOARD / WORK AREA — Full Spec

## 4.1 What is Pasteboard?

- Pasteboard = infinite area surrounding stage. Document coordinates extend beyond stage — objects can have x negative or x > stageW, y negative or y > stageH.
- **Storage:** Nodes have x,y,w,h in doc space — can be outside stage — no validation that they must be inside. Only export clips to stage rect.
- **Render:** When workArea=true, pasteboard drawn as gray rect covering whole view (0,0,viewW,viewH), then stage drawn on top with its background. When workArea=false, whole view filled with stage background (no gray) — mimics final output.
- **Infinite canvas:** When infiniteCanvas=true, pasteboard color = stage background color — so no visual distinction — feels infinite. Adobe 2017+ feature. Toggle in View menu.

## 4.2 Pasteboard Properties

```ts
interface PasteboardPrefs {
  workArea: boolean; // true = show gray pasteboard, false = hide (View > Pasteboard Ctrl+Shift+W)
  infiniteCanvas: boolean; // true = pasteboard same as stage color, false = gray #2b2b2b
}
```

- Persist to viewPrefs (PREFS boundary) — not in document.
- Default: workArea=true, infiniteCanvas=false.

## 4.3 Pasteboard Rendering — Exact

```ts
if (workArea) {
  if (infiniteCanvas) {
    ctx.fillStyle = background; // stage bg
    ctx.fillRect(0,0,viewW,viewH);
  } else {
    ctx.fillStyle = PASTEBOARD_COLOR; // #2b2b2b
    ctx.fillRect(0,0,viewW,viewH);
  }
} else {
  ctx.fillStyle = background;
  ctx.fillRect(0,0,viewW,viewH);
}
// then stage rect
const stage = docRectToScreen(vp, {x:0,y:0,w:stageW,h:stageH});
ctx.fillStyle = background;
ctx.fillRect(stage.x, stage.y, stage.w, stage.h);
ctx.strokeStyle = STAGE_BORDER;
ctx.strokeRect(stage.x+0.5, stage.y+0.5, stage.w-1, stage.h-1);
```

- When workArea=false, pasteboard not drawn, stage still has border? Adobe: when pasteboard hidden, border still visible? Yes — stage border always visible to show page edge. Keep border always.
- Export: `renderContent` never draws pasteboard — only stage rect + items — so pasteboard never leaks.

## 4.4 Pasteboard Interactions

- **Click on pasteboard empty:** same as stage empty — clear selection if no marquee drag.
- **Draw on pasteboard:** Allowed — rect tool can draw outside stage — object stored with outside coords — visible in authoring, clipped in export.
- **Move object to pasteboard:** Drag object outside stage — allowed — previewDelta can move outside.
- **Select objects in pasteboard:** Marquee can include pasteboard area — selectInRect works for any doc coords.
- **Pasteboard is not a separate layer — it's just doc space outside stage.**

## 4.5 Pasteboard Menu Items

| Menu | Item | Shortcut | Command | Behavior |
|------|------|----------|---------|----------|
| View | Pasteboard | Ctrl+Shift+W | view.toggleWorkArea | Toggle workArea bool, save prefs, re-render |
| View | Infinite Canvas | — | view.toggleInfiniteCanvas | Toggle infiniteCanvas bool |

## 4.6 Pasteboard + Camera (future)

- Camera (Part 16) is screen-space transform after layers composite — pasteboard still outside stage, camera can show pasteboard area if zoomed out? Adobe: camera transform applies to stage only? Actually camera is inside stage. Pasteboard not affected by camera. Keep simple for now: pasteboard = view background, camera not yet.

## 4.7 Tests

- T-pasteboard-toggle — Ctrl+Shift+W toggles gray
- T-pasteboard-infinite — toggle makes pasteboard same as stage bg
- T-pasteboard-draw-outside — draw rect outside stage, still selectable, export clipped
- T-pasteboard-move-outside — move object outside, export clipped
- T-pasteboard-export-no-leak — rasterizeContent never includes pasteboard color outside stage rect

## 4.8 Implementation Steps

1. Add `infiniteCanvas` to `viewPrefs.ts` — default false — persist
2. Update `RenderState` to include `infiniteCanvas`
3. Update `canvasRenderer.ts` render() to handle infiniteCanvas
4. Add menu items in `menus.ts` — view.toggleWorkArea, view.toggleInfiniteCanvas
5. Add commands in `commands.ts` — toggle + toast
6. Add shortcuts — Ctrl+Shift+W
7. Tests

Next: 05_WORKSPACE_LAYOUT.md — critical merged timeline
