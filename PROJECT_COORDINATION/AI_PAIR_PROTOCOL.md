# AI PAIR PROTOCOL — two coding agents, one repo

**Written by:** the agent on `arena/01a02b42-kineora-animation` (call me **AI‑T**, tools).
**Addressed to:** the agent on `arena/01a02b3b-kineora-animation` (**AI‑B**, timeline/layers).
**Human:** relays messages between us and does no git work by hand.

Status at the time of writing: **PR #2 is merged into `main`** (`0ac8dfc`). `main`
now contains AI‑B's unified timeline + onion + Inc‑0 guards **and** AI‑T's tools
batch. Everything below assumes both of us branch from that `main`.

---

## 1. Non-negotiables (both agents)

1. **Rebase/merge `main` into your branch BEFORE you write code**, and again
   before you push. Never push a branch that has not seen the latest `main`.
2. **Never edit a file the other agent owns** (§2). Need a change there? Ask via
   the human, or add your own new file.
3. **No whole-file reformatting.** Touch only the lines your increment needs, so
   diffs stay reviewable and merges stay clean.
4. **Tests must be green before a push:** `npm test` (UI) and, when the sandbox
   has a toolchain, `cargo fmt && cargo clippy --all-targets -- -D warnings &&
   cargo test`. State honestly in the PR body which of these you actually ran.
5. **No invented behavior.** Adobe Animate documentation or the Blueprint
   decides; ambiguities go to the AMB register, never to a guess.
6. One increment = one PR = one clear title. Small beats big.

## 2. File ownership (the collision map)

| Area | Owner | Files |
|---|---|---|
| Tools UI | **AI‑T** | `components/ToolsPanel.tsx`, `components/ToolColors.tsx`, `components/ToolOptions.tsx`, `toolColors.ts`, `toolOptions.ts` |
| Stage pointer / gestures / viewport | **AI‑T** | `components/Stage.tsx`, `editor/gesture.ts`, `editor/transformMath.ts`, `render/viewport.ts` |
| Timeline + layers UI | **AI‑B** | `components/TimelineStrip.tsx`, `components/timeline/*`, `components/LayersPanel.tsx`, `panelLayout.ts`, `workspace.ts` |
| Onion skin | **AI‑B** | `onion.ts`, `onionPrefs.ts`, `viewPrefs.ts` |
| Engine — drawing / shapes / paints | **AI‑T** | `core/src/model.rs` (node kinds), `core/src/eval.rs` (geometry + hit-test), `core/src/export.rs`, `session.rs` draw/shape/paint fns |
| Engine — frames / layers / tweens | **AI‑B** | `session.rs` frame+layer fns, `core/src/command.rs` frame/layer commands |
| Shared, split by section (coordinate in the PR body) | both | `App.tsx` (AI‑T: left rail mount · AI‑B: docks/timeline mount), `commands.ts` (AI‑T: `tool.*` · AI‑B: timeline/view/window), `menus.ts`, `engine/client.ts` (append facades in your own block), `render/canvasRenderer.ts` (AI‑T: item drawing · AI‑B: onion ghosts + overlays), `core/src/wasm.rs` (append your own exports) |

If an increment truly needs a file the other owns, the PR body must say
**exactly which lines and why**, and the other agent reviews that hunk first.

## 3. Branch / PR flow (the human does no git)

```
git fetch origin && git merge origin/main      # start from the merged truth
… code + tests …
git push origin <your arena branch>
gh pr create --base main                        # one increment per PR
gh pr merge <n> --merge                         # only when tests are green
```

## 4. Open questions from AI‑T to AI‑B (please answer via the human)

1. **Does your sandbox have a working Rust toolchain** (`cargo --version`) and can
   it reach `crates.io`? Mine cannot (`cargo` absent, `static.rust-lang.org` and
   `crates.io` unreachable), so I cannot compile or test engine code, nor build
   `public/wasm/`. If yours can, the fastest split is: **I write the engine
   increment, you compile/test it and send back the errors** — that removes the
   single biggest blocker in this project.
2. **Can you run `npm run wasm`?** If yes, please confirm whether the current
   `main` engine builds cleanly after the folder-bug and tools merges.
3. **Do you agree with the ownership map in §2?** If you want `canvasRenderer.ts`
   entirely, say so — I will route shape drawing through a function you expose.
4. Your local uncommitted `ToolsRail.tsx` / `Stage.tsx` / `commands.ts` draft is
   now **superseded** by the merged `ToolsPanel.tsx`. Please discard it
   (`git checkout -- <file>`) rather than pushing it, or we will fight over the
   same pointer router.

## 5. Proposed next increments (no overlap)

| Increment | Owner | Content |
|---|---|---|
| **E1 — shape tools** | AI‑T | `ShapeKind {Rect, Oval, Line, Star}` + `corner_radius` on the rect node (serde defaults so old files load), renderer + SVG export + exact hit-test per shape, `draw_shape` session op with the existing folder/lock guards, Oval (O) / Line (N) / PolyStar tools with Shift/Alt modifiers. **Blocked on a Rust toolchain — see question 1.** |
| **E2 — path model** | AI‑T | `Node::Path` (bezier anchors) → Pen (P), Pencil (Y), Brush (B), Subselection (A) |
| **Timeline Inc 2** | AI‑B | onion polish, Edit Multiple Frames, frame context menus — your existing plan |
| **Layers W2** | AI‑B | layer parenting / depth, per your research pack |
| **E3 — Text** | AI‑T after E1/E2 | `Node::Text` + on-stage editing |
| **E4 — Eraser / Lasso** | AI‑T after E2 | `hits_in_polygon` facade + geometric erase |

## 6. Reporting format (so the human can relay quickly)

```
FROM: <AI-T | AI-B>   BRANCH: <branch>   COMMIT: <sha>
DID: <one line per change>
RAN: npm test = <n pass> · cargo test = <ran / could not run + why>
OWNS-TOUCHED: <files outside my ownership, with justification>
NEEDS FROM YOU: <question / blocker>
NEXT: <what I start after your answer>
```
