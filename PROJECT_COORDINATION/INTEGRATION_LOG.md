# KINEORA — INTEGRATION LOG (cross-system changes)

> Every cross-system change is recorded here: what changed, why, affected systems, evidence, review, status. No silent cross-system drift (FL-0016/FL-0009).

| INT | Date | Changed | Affected | Reason | Evidence | Review | Status |
|---|---|---|---|---|---|---|---|
| INT-0001 | 2026-08-22 | `openSet:changed{change,docId?}` locked event added | SYS-01 (registry), SYS-02 H02/H12/H14 | open-set mutation had no propagation path (reorder/close-inactive) | D-AMB-004 (approved) | Leader | VERIFIED |
| INT-0002 | 2026-08-22 | `saving:changed` payload unified to `{state,time?}` | SYS-01 §27.1, SYS-02 H04/H05/H12 | payload drift `{time}` vs `{state,time}` | SYS-01 §27.1 canonical | Leader | VERIFIED |
| INT-0003 | 2026-08-22 | Open = add+activate (NO dirty guard) — single-doc relic removed | SYS-02 H00/H04/H06, SYS-03 (none) | "Replaces active doc (with save prompt)" misread; multi-doc has no data loss | Blueprint §1.1.3 + D-AMB-001 | Leader | VERIFIED |
| INT-0004 | 2026-08-22 | `file.close()` vs `tab.close(docId)` separated (two commands) | SYS-02 H07/H09, SYS-01 §30 (stale note), SYS-02_file.md §8 (stale note) | inactive-tab close must not close active doc | Blueprint §1.2.1 + D-7 | Leader | VERIFIED (SYS-01/SYS-02_file.md stale notes remain, flagged for revision) |
| INT-0005 | 2026-08-22 | Delete = `edit.delete()` (not "Clear"); "Clear Frames" = SYS-15 handoff | SYS-03 H02/H04 | "Delete" vs "Clear" conflation | Part 03 §3.4.1 | Leader | VERIFIED |
| INT-0006 | 2026-08-22 | clipboard = application-level (shared across docs), SESSION | SYS-03 H02 | cross-doc paste scope | Part 30 ContextMenuBuilder (clipboard ≠ doc-state) | Leader | VERIFIED |
| INT-0007 | 2026-08-22 | Find & Replace = 5 targets, Replace-All = one journal command | SYS-03 H03 | depth + atomicity | Part 01 §1.2.2 + Part 23 + eng 05 | Leader | VERIFIED |
| INT-0009 | 2026-08-22 | Timeline layer-name row shows red ✕ for hidden layers (view projection only) | SYS-15 (Timeline panel), SYS-16 (Layers state) | F-07-02 E4 "red X next to layer name = hidden indicator"; the indicator renders SYS-16 layer state in the SYS-15 panel — no command/event/model change | F-07-02 E4 (deep research), F-20-01 | AI-C → AI-01 | **VERIFIED** (2026-08-22, AI-01: view projection, both SYS = AI-C's range, FL-0009 compliant) |
| INT-0010 | 2026-08-22 | Authorize emitting canonical `layer:changed{layerId, op}` for layer mutations | SYS-16 (producer), SYS-15/17 (consumers) | BLK-AIC-003: `layer:changed` listed in MASTER_EXECUTION_PLAN §C but not emitted; refresh rode `document:changed{type:'layer'}` only | SYS-01 §27.1 (locked: producer MOD-LAYER, payload `{layerId,op}`) | AI-01 | **VERIFIED + IMPLEMENTED** (2026-08-22 AI-C: bus event + facade emission for all layer mutations, per-layer batch events, never on view-state; consumers = App re-read + LayersPanel row flash; tests client.layerEvents +7) |
| INT-0008 | 2026-08-22 | Foundation contract published (BUS/STATE/COMMAND/VECTOR/COLOR/EASING/DOC) — resolves FND-001 | all 28 SYS (cross-cutting) | no single owner-contract existed | engineering 02/03/04/05/06 + Blueprint 05/06/09.4/23/33 | Leader | VERIFIED |
| INT-0011 | 2026-08-22 | SYS-09 adds `playback:paused` bus event (empty payload) — STM-PLAYBACK PAUSED state | SYS-09 (producer/owner), SYS-01 (bus transport), SYS-15 StatusBar (consumer) | STM-PLAYBACK (eng 04) defines IDLE→PLAYING→PAUSED and a PAUSED side effect `emit playback:paused`; bus only had `playback:started/stopped`, so pause had no propagation path (FL-0006) | engineering/04_state_machines.md STM-PLAYBACK; CROSS_SYSTEM_CONTRACT §D | AI-B → AI-01 | **LANDED** (`9064b70`) — payload `Record<string,never>` matches sibling playback events; StatusBar subscribes |
| INT-0012 | 2026-08-22 | SYS-09 emits `playhead:moved{frame}` on USER-initiated transport seeks (first/last/step/keyframe-hop/goto/rewind) — NOT on playback ticks | SYS-09 (producer), SYS-01 (bus), SYS-15/16 (consumers may subscribe) | `playhead:moved` is declared in bus.ts + MASTER_EXECUTION_PLAN §C (SYS-09 event) but was never emitted; seeks had no propagation path | bus.ts BusEvents; MASTER_EXECUTION_PLAN §C SYS-09 | AI-B → AI-01 | **LANDED** (`9064b70`) — payload `{frame:number}` verbatim; playback tick intentionally excluded (per-frame flood); consumers re-read engine |
| INT-0013 | 2026-08-22 | Ctrl+Enter context resolution: inside symbol edit (depth>0) = `edit.exitRoot`; at document root = `control.test` (SYS-27 handoff) | SYS-09 (control.test shortcut), SYS-19 (edit depth), SYS-01 (shortcut dispatch) | D-6 "Ctrl+Enter = context-scoped" (APPROVED) was only wired as the EditBar button tooltip; the key itself was bound to the DEFERRED `control.test`, so it did nothing at depth and nothing at root | DECISIONS.md D-6; EditBar.tsx | AI-B → AI-01 | **LANDED** (`9064b70`) — dispatcher resolves one command per Ctrl+Enter; no duplicate fire; control.test = FUNCTIONAL SYS-27 handoff toast |

---

## Open integration items (awaiting resolution)

| Item | Affected | Status |
|---|---|---|
| SYS-01 §30 "File▸Close → tab.close(id)" stale (should be `file.close()`) | SYS-01 (LOCKED) | OPEN — future controlled SYS-01 revision |
| SYS-02_file.md §8 "tab ctx Close = file.close()" stale (should be `tab.close(docId)`) | SYS-02_file.md (consolidated) | OPEN — future revision |
| Foundation modules (BUS/STATE/COMMAND/VECTOR/COLOR/EASING/DOC) need a published owner-contract | all 4 groups | **RESOLVED** — FOUNDATION_CONTRACT.md |

---

*Every cross-system change = new INT row. Leader verifies before any other AI's files are modified.*

---

## INT-AIA-001 — 2026-08-22 AI-A SYS-03/04/06 landing (rebased onto ca79555)

| Field | Value |
|---|---|
| Change | Object clipboard + view overlays + transform/arrange/align |
| Files | session.rs, edit_ops.rs, wasm.rs, commands.ts, menus.ts, client.ts, canvasRenderer.ts, Stage.tsx, viewPrefs.ts, bus.ts (selection:changed if added) |
| Affects | SYS-01 menus/shortcuts, SYS-02 from_document (does not clear app clipboard), SYS-14 Stage view flags, SYS-15 frame clipboard (not absorbed) |
| Spec | SYS-03 H00/H02, Blueprint 1.2.2/1.2.3/1.2.5, Part 24 |
| Worker | AI-A |
| Status | LANDED — Leader audit pending |

---

## INT-AID-001 — 2026-08-22 AI-D SYS-28 Persistence increment 1 (formatVersion + autosave + recovery)

| Field | Value |
|---|---|
| Change | SYS-28 MOD-PERSIST TS boundary (`persist.ts`: formatVersion P-9 stamp-on-write, pure `migrate(from,to)`, newer-version refusal, FNV-1a checksum) · MOD-AUTOSAVE (`autosave.ts`: 2s debounce + 30s cap → `.autosave` slot, INV-AS-1 manual-save-supersedes, launch recovery scan) · recovery prompt UI (`components/RecoveryDialog.tsx`, H00 T12–T14) |
| Cross-SYS touches (leader-pre-authorized in LEADER_ORDERS AI-D §FIRST deliverable) | `file.ts` (SYS-02): wiring ONLY at the H10 §5.1/§5.2 seams the spec marked "wired when SYS-28 ships" — stamp before write, validate→migrate before `openDocJson` (Open + Open-Recent), `onManualSaveSuccess` after markClean, `adoptDocPathForRecovery` export · `App.tsx` (SYS-01 chrome): initAutosave + launch recovery scan + RecoveryDialog render · `file.test.ts`: ONE assertion updated — `openDocJson` now receives MIGRATED content (spec-anticipated behavior, eng 13 loader order), recorded here per no-silent-drift |
| NOT touched | SYS-02 spec files (FORENSIC_SPECS/SYS-02/) · MOD-DOC/model.rs (formatVersion lives at the SYS-28 boundary — envelope stamp, serde-ignored by the engine; core parity queued, BLK-D-005) · persist.rs / desktop shell Rust (read-verified only, BLK-D-005) |
| Events | `saving:changed` NEVER emitted by autosave (H10 §5.3, FL-0030 payload untouched) · recovery accept emits `openSet:changed{added}` FIRST then `activeDoc:changed` (H02 §14 / D-AMB-004) — verified by test |
| Dirty/undo | autosave never clears DIRTY (FL-0014) · save still never clears undo (untouched) · recovered doc starts CLEAN (H00 T13 / H10 §13 F3) |
| AMBs | AMB-002/AMB-003 remain OPEN (not touched) · NEW: AMB-D-001 (pathless desktop autosave — registered, behavior = no autosave until first save) |
| Tests | +36 new (persist 13, autosave 18, RecoveryDialog 5); full suite 661/661 green; `tsc -b` clean |
| Worker | AI-D |
| Status | LANDED — Leader audit pending |
