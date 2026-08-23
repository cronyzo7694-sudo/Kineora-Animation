# 10 — FRONTEND CHAT UX (animation command center)

## Placement & shell

Dockable right-side panel (default), collapsible; width 320–480px. **Panel-mount is a cross-lane touch** (`panelLayout.ts` = AI-B lane) — the MVP mounts via a self-contained overlay host in `App.tsx` with a disclosure note in D-0010, and migrates into the real panel system in coordination with AI-B (22). Header shows: `AI · <provider>/<model> · key ✓/✗ · mode chip · ⚙ settings`.

## Anatomy (top→bottom)

1. **Capability banner (collapsible):** "Main kya kar sakta hoon is build me" — from manifest (07). Builds user trust, kills dead-end prompts.
2. **Message stream** (scroll region): user msgs, ai msgs, and first-class non-chat cards:
   - **Plan card** — numbered action list w/ per-action icon + target + params (human-readable: "Keyframe @15 on ball · y=820"), `expected[]` footer, tier-B rows highlighted. Buttons: **Apply / Edit-as-text / Cancel** (PREVIEW mode) — what you approve is the stage-12 compiled list (05), never reinterpreted.
   - **Progress card** — executing… k/n (apply is fast; mostly provider latency), **Stop** (aborts generation; cancellation semantics per 09).
   - **Verification card** — expected-vs-actual rows ✓/✗/?, overall verdict (08).
   - **Result card** — summary ("6 actions, 1 undo group"), **Undo** shortcut, link to activity entry (21).
   - **Error card** — stage + plain-language cause + actions: Retry / Edit request / Details (16).
   - **Confirmation interstitial** — destructive actions: explicit named list ("Layer 'rough' + 214 nodes delete honge"), type-to-confirm when mass threshold hit (11 budgets), Always-ask default.
   - **Activity group cards** — collapsible groups per transaction inline in the stream (21).
3. **Composer:** multiline input (Enter send / Shift+Enter newline), **mode selector** (Ask/Preview/Apply), `$` variable autocomplete (13), `@` reference assist (names of layers/symbols — feeds 15), send/stop toggle, regenerate ↻ on last AI reply, retry on error cards.
4. **Footer:** clear-conversation (with confirm; memory implications 19), context indicator ("scene summary attached · ~1.2k tok" — transparency), tokens/cost this session (20, from `usage` fields).

## Modes (answers the spec's mode question)

| Mode | Behavior | Useful for |
|---|---|---|
| **ASK** | No plan execution; discussion + optional suggested plan (greyed, "switch to Preview to run") | learning, "kaise karun" questions |
| **PREVIEW** (default, DEFAULT-7) | Full pipeline stops at plan card; Apply executes | everything risky/new users |
| **APPLY** | Auto-executes tier-A plans; tier-B still interstitially confirmed | trusted flow, repetitive edits |
| **AUTO** | **Post-MVP only** — unattended multi-step with full budgets (25). Research says: not needed to deliver MVP value; adds trust+cancellation surface |

Confirmation thresholds (tiering): tier-A create/edit = no confirm beyond mode · tier-B (delete/mass/remove/settings) = always confirm regardless of mode · mass-destructive heuristic (>20 nodes or >50% content) = confirm + type-name (12).

## UX references studied (patterns, not UI copies)

Adobe Firefly-in-app panels (contextual, non-modal, history-linked); Figma AI (preview-first, "review before apply", make-undo-easy); Photoshop generative fill (explicit Generate button, variations as reviewable artifacts); animation tools' dope-sheet feedback (what frame range changed matters) and game-engine consoles (collapsed operation groups, color-coded severity). Conclusion for Kineora: **plan card + verification card + inline activity groups + one-step undo** is the professional minimum; avoid freeform "AI is typing…" mystery time.

## Anti-chatbot requirements (binding)

- Every AI claim of document change is backed by an activity entry; if nothing executed the UI says "kuch apply nahi hua".
- Scene-context freshness is surfaced ("stale? ↻" if revision changed mid-composition, 06).
- All cards keyboard-navigable; Stop works at every waiting state; panel never steals canvas focus/shortcuts (shortcut dispatcher already suppresses in inputs).
