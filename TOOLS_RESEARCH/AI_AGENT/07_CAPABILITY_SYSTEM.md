# 07 — CAPABILITY SYSTEM

## Purpose

The model must plan only with what Kineora **actually supports on this build**. It must never fake capability ("Pen se draw kar deta hoon" when Pen doesn't exist). The same manifest drives (a) the system prompt, (b) validator stage 10, (c) chat UI honesty messages.

## Model

Four states: `supported` · `partial` (usable subset, restrictions listed) · `unsupported` (planned, not built — tools-lane roadmap) · `deferred` (deliberately excluded, e.g. spec scope-outs). Each entry: `{key, state, params?: subset, notes, roadmap?}`.

**Sources of truth (merge order):** (1) engine build manifest — E-AI-5 `kineora_capabilities()` built from cfg/features until PATH lands, then engine-reported node kinds; (2) tools-lane status machine-mirror (`TOOLS_STATUS_AND_PLAN.md` §1/§2 kept in sync per protocol); (3) runtime facade probes already in client (`hasShapeDrawFacade()` pattern). Merged at session start and after any engine reload.

## Manifest v0 (from audit 02 — this is the real current state)

| Capability | State | Notes for the agent |
|---|---|---|
| shapes.rect / shapes.oval | supported | via `shape.create`; fill always required (no fill-less draws — engine `fill: String`) |
| shapes.stroke | supported | tri-state: color / none / width |
| shapes.pen / pencil / brush / line / eraser / width | **unsupported** | no path node kind; unlocks with PATH model (tools lane E2) |
| shapes.polystar / cornerRadius | **unsupported** | next tools-lane increment (in flight) |
| node.transform (move/scale/rotate/flip) | supported | degrees CW, center pivot |
| node.style fill/stroke/size | supported | NodePropsPatch subset |
| node.opacity / gradients / filters | **unsupported** | no engine field (needs E-AI-6 + decision) |
| layers (create/rename/visible/locked/outline/duplicate/reorder/parent/collapse) | supported | folder-aware guards |
| layers.mask / guide | **unsupported** | LayerKind queued in engine |
| keyframes + frames ops (full set in 04) | supported | |
| tween.classic (ease −100..+100) | supported | quadratic slider only |
| tween.named-easings (bounce/elastic…) | **partial** | Penner lib exists in `easing.rs` but is NOT wired to classic tween eval — validator rejects named easings today |
| tween.motion / tween.shape | **unsupported** | engine pending |
| symbols (convert/create/place/rename/swap/loop/delete) | supported | |
| scenes.create | supported | multi-scene ops beyond create: **partial** (no scene switch/delete/rename session fns) |
| doc.settings (size/fps/bg/alpha) | supported | tier B |
| doc.new/open/save/close | **deferred** | lifecycle stays human-only (MVP) |
| text tool / rich text | **unsupported** | no text node kind |
| camera / onion-skin authoring | **deferred(→AI-B)** | view aids; onion prefs are AI-B lane |
| 3D / rigging / bones | **deferred (permanent)** | scope exclusion (spec) |

## Behavior contract

- Unknown/unsupported request → agent responds: capability + nearest alternative + (if user wants) logs a feature wish. Example: "Pen drawing abhi available nahi hai; main oval/rect shapes se bana sakta hoon, ya PATH model aane par Pen unlock hoga."
- `partial` → the manifest's `params` whitelist is enforced by the validator (e.g. `ease` numeric only).
- Manifest version-stamped; shown in chat settings ("is build me kya kya kar sakta hoon") so users can trust-but-verify.
- New capabilities light up by manifest edit when the tools lane ships them — **no agent code change needed** if the action table (04) already maps to the new Command (otherwise action table + validator schema added in the same PR).
