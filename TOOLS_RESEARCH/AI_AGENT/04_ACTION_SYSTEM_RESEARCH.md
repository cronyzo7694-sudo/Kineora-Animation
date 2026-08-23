# 04 — ACTION SYSTEM RESEARCH

## Derivation method

The action vocabulary is **derived from the real command layer**, one action ↔ one existing Command/facade op (audit `02` Q2). We do not invent engine capability; we wrap it. An action that has no backing Command is NOT in the vocabulary (capability `07` enforces this at validation time too).

Conceptual wire shape (protocol illustration, not implementation):

```json
{
  "plan": [
    {"id": "a1", "action": "layer.create", "params": {"name": "ball"}},
    {"id": "a2", "action": "shape.create", "params": {
      "shape": "oval", "x": 930, "y": 100, "w": 60, "h": 60,
      "fill": "#e11d48", "stroke": null, "strokeWidth": 1,
      "layer": {"ref": "a1"}}},
    {"id": "a3", "action": "keyframe.insert", "params": {"frame": 15, "layer": {"ref": "a1"}}},
    {"id": "a4", "action": "node.transform", "params": {"node": {"lastCreated": "a2"}, "y": 820}},
    {"id": "a5", "action": "tween.classic.set", "params": {"layer": {"ref": "a1"}, "start": 1, "end": 30, "ease": 60}}
  ],
  "expected": ["layer 'ball' exists", "oval a2 y=100@1 → y=820@15 → y=100@30", "tween 1..30 ease 60"],
  "report": "Red ball layer + 30-frame bounce"
}
```

## Action anatomy (all actions)

`action identity` (client-uuid + plan-local alias) · `target` (resolved ids or reference — `15`) · `params` (typed, validated — `05`) · `validation requirements` (state predicates) · `permission tier` (safe / confirm / never — `10`) · `expected result` (for verifier — `08`) · `failure conditions` (`16`) · `undo boundary` (always inside enclosing transaction — `09`) · `affected objects/frames` (declared for preview + verification).

## MVP vocabulary (derived, tiered)

Tier A = safe · Tier B = confirmation required · (never = excluded from MVP)

| Action | Maps to (command.rs / session / wasm) | Params (conceptual) | Tier |
|---|---|---|---|
| `scene.inspect` | read paths (status/evaluate/snapshot E-AI-2) | level: status\|summary\|detail, frame? | A |
| `layer.create` | CreateLayer / create_layer | name? | A |
| `folder.create` | create_folder | name? | B(≈A) |
| `layer.rename` | RenameLayer | layer, name | A |
| `layer.delete` | DeleteLayer (DeleteLayerGroup for folders) | layer, recursive? | **B** |
| `layer.setVisible` / `setLocked` / `setOutline` (+color) | SetLayer* | layer, value | A |
| `layer.duplicate` | DuplicateLayer | layer | A |
| `layer.reorder` / `layer.setParent` | ReorderLayer / SetLayerParent | layer, to/parent | B |
| `shape.create` | DrawRect via `drawShape` (rect/oval + fill/stroke/strokeWidth) | shape, rect, fill, stroke?, width?, layer?, frame? | A |
| `node.delete` | DeleteSelection (selection harness w/ E-AI-3 set-by-ids) | nodes[] | **B** |
| `node.duplicate` | duplicate_objects (harness) | nodes[], offset? | A |
| `node.transform` | patch_transforms (TransformPatch) / rotate / flip / remove_transform | node(s), x?,y?,scaleX?,scaleY?,rotation?, flip?, reset? | A |
| `node.setStyle` | set_node_props (NodePropsPatch) | node(s), width?, height?, fill?, stroke (tri-state)?, strokeWidth? | A |
| `node.arrange` / `node.align` | arrange_selection / align_selection | nodes[], op, space? | A |
| `keyframe.insert` / `insertBlank` / `clear` | InsertKeyframe / InsertBlankKeyframe / ClearKeyframe | layer?, frame | A (clear=B) |
| `frames.insert` / `delete` / `remove` | InsertFrames / DeleteFrames / RemoveFrames | layer, at/start, end/count | B |
| `keyframe.move` / `duplicate` | MoveKeyframe / DuplicateKeyframe | layer, from, to | A |
| `frames.reverse` / `convertToKeyframes` / `convertToBlank` / `duplicate` | ReverseFrames / Convert* / DuplicateFrames | layer, start, end | B |
| `frames.setLabel` | SetFrameLabel | layer, frame, label | A |
| `tween.classic.set` / `tween.remove` | SetClassicTween / RemoveClassicTween (ease −100..+100) | layer, start, end, ease (0 default) | A |
| `symbol.convert` | ConvertToSymbol | name, type, registration | B |
| `symbol.create` / `place` / `rename` / `swap` / `setLoop` / `delete` | symbol commands | … | A/B (delete=B) |
| `doc.setSettings` | SetDocumentSettings (SettingsPatch) | width?, height?, fps?, background?, backgroundAlpha? | **B** |
| `selection.set` / `clear` | E-AI-3 set-by-ids / clear_selection | node ids | A |
| `playback.play/stop/gotoFrame` | UI-side (not engine) | frame? | A |

Explicitly **NOT in MVP vocabulary** (capability=unsupported, see 07): any freehand `path.*` draw (Pen/Pencil/Brush — no path node kind), `text.*`, `eraser.*`, per-node `opacity`, gradients, motion/shape tween, masks, camera, audio, `doc.open/close/new/save` (document lifecycle stays human-only in MVP).

## Execution model decision

- **Sequential, atomic per action, grouped per plan (transaction).** Researched alternatives: (a) atomic-only (no grouping) → chatty undo, rejected; (b) nested/parallel actions → engine is single-threaded, timeline ops are index/position-sensitive; parallelism buys nothing and risks order bugs, rejected; (c) **flat ordered action list inside ONE composite command** → matches engine reality, minimal new machinery (E-AI-1), chosen.
- Actions within a plan may reference prior results (`{"ref": "a1"}`, `{"lastCreated": "a2"}`) resolved by the runner at execution time — never by the model with invented numeric ids (05 rejects unknown ids).
- Plan size cap: **≤ 64 actions** per transaction (budget table in 12/26); larger asks are split by the orchestrator into sequential user-visible transactions.

## Guards inherited (already enforced by engine — validator re-checks for early failure)

Draw/edit blocked on folder layers, hidden layers, locked layers (incl. ancestor folders). Frame indices ≥ 1 and within sane extension (insert auto-extends exactly as Session does). Classic tween requires keyframes at both ends. Symbol delete requires use-count semantics (break_apart). All guards produce structured failure reasons, not exceptions (16).
