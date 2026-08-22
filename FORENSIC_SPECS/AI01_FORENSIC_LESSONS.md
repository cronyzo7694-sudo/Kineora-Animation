# AI-01 FORENSIC LESSONS — PERMANENT LEARNING SYSTEM

> This is NOT a product spec. This is AI-01's internal forensic memory.
> Append-only. Never delete; supersede with `STATUS: SUPERSEDED`.
> Only record lessons backed by source / observed failure / approved decision / verified evidence.

---

## Active High-Risk Lessons (P0/P1)

| ID | Rule | Severity | Applies To |
|---|---|---|---|
| FL-0007 | Never use an active-document event to signal an open-set-only mutation. Every state change emits only the event whose semantic state changed. | P0 | all SYS/H (events) |
| FL-0008 | Distinguish active-pointer mutation from open-set mutation. Every externally-visible state change needs a valid propagation path. | P0 | all SYS/H (events/state) |
| FL-0009 | One owner, one source of truth per concern; split view-vs-semantics, never two implementers. | P0 | all SYS/H (ownership) |
| FL-0013 | Document-bound UI must re-read the new active document's source of truth; never render a stale reference. | P0 | H02+ (binding) |
| FL-0016 | Never let a later H-part own another H-part's mechanics. Cross-part = handoff only. | P0 | H03–H14 |
| FL-0017 | Current code is evidence only; never authority; never weakens the spec. | P0 | all |
| FL-0018 | "COMPLETE/READY" requires resolved implementation-critical ambiguity; documentation length ≠ completeness. | P0 | all |
| FL-0001 | Don't add fields/controls not owned by the current part (scope expansion). | P1 | all H |
| FL-0003 | One validation rule per field; no contradictory empty-vs-invalid behavior. | P1 | all H (dialogs) |
| FL-0006 | Every externally-visible state mutation needs a propagation path; a missing event is a connector gap, not "handled elsewhere". | P1 | all H (events) |
| FL-0010 | Unresolved/proposed controls must NOT appear in the approved implementation matrix. | P1 | all H (controls) |
| FL-0011 | Duplicate-ID / same-file-open is an identity contract that must be explicitly resolved before multi-doc. | P1 | H02/H10 (identity) |
| FL-0012 | Accessibility decisions (focus, keyboard) must be explicit or registered — never implicit. | P1 | all H (a11y) |
| FL-0014 | Dirty state is per-document; never transferred/mixed. | P1 | H02+ (dirty) |
| FL-0015 | Undo history is per-document; never merged/mixed. | P1 | H02+ (undo) |
| FL-0020 | Every count must be mechanically reproducible from tables; no stale aggregates. | P1 | all (counting) |
| FL-0021 | Orthogonal state dimensions must not be flattened into one enum. | P1 | all (state) |
| FL-0022 | A quarantined product decision must not be resolved anywhere else in the doc. | P1 | all (decisions) |
| FL-0025 | Every invariant must be cross-checked against every declared state transition; an invariant and its own transition table cannot describe different legal paths. | P1 | all (state) |
| FL-0026 | Cross-document section citations must be re-verified against the CURRENT version of the cited source; a revised source invalidates downstream section pointers. | P2 | all (cross-ref) |
| FL-0027 | An invariant must state the general semantic condition; examples must be labeled as examples, never presented as an exhaustive list of paths. | P1 | all (state) |
| FL-0028 | An unresolved ambiguity (AMB) must never be asserted as authoritative behavior in any normative field; only a labelled "RECOMMENDATION — NOT AUTHORITATIVE" may appear. | P1 | all (decisions) |
| FL-0029 | A path-mutating command (Save As) must enforce the one-path-per-open-document invariant; moving to an already-open path is blocked, never silently allowed. | P1 | H05 (identity/path) |
| FL-0030 | A locked event has ONE canonical payload schema (single-sourced); every H-file must use the identical schema — a payload drift is a defect, not a local shorthand. | P1 | all (events) |
| FL-0031 | A source term with two readings (e.g. "replaces active doc") must be resolved against the same source's OTHER statements; never left uninterpreted to be misread downstream. | P1 | all (terminology) |
| FL-0032 | A single-document-model artifact (e.g. a "save prompt" guarding Open) must NOT leak into a multi-document spec: a safety guard exists only to prevent data loss, and an operation that causes no data loss needs no guard. | P1 | H06/H00/H04/H02 (multi-doc) |
| FL-0033 | Before declaring an ambiguity open, exhaust CROSS-FILE structural evidence (architecture signatures, object-model mechanics, menu-builder inputs) — a feature's own spec section being silent ≠ the behavior being unresolvable. | P1 | all (decisions/ambiguity) |
| FL-0034 | When an ambiguity's status changes (resolved ↔ open), every table/register/matrix/normative field that referenced it must be updated in the SAME pass — a resolution note in one section does not auto-update a stale table elsewhere. | P1 | all (decisions/consistency) |

---

## All Lessons

---

## FL-0001 — Scope expansion: adding fields not owned by the part

- **Category:** Scope
- **Discovered in:** SYS-02 / H01
- **Severity:** P1
- **Original mistake:** Added `dlg-new.title` to the New-document dialog.
- **Why it was wrong:** Title/description/author are Document-Properties (Properties-panel) fields (Blueprint Part 26 §26.1), owned by SYS-06/SYS-17, set AFTER creation. Blueprint §1.2.1 New = "platform/type, size, fps, color" only. Prior accepted SYS-02_file.md also had no title field.
- **Authoritative evidence:** Blueprint Part 01 §1.2.1; Part 26 §26.1.
- **Permanent rule:** Every field/control in an H-part must be owned by that part's scope. Anything owned by another system = handoff or exclusion, never duplication.
- **Pre-flight check:** For each new control, ask "which system owns this data/behavior? Is it in my scope or a handoff?"
- **Affected systems:** cross-system
- **Affected H-parts:** H01 (all future dialog H-parts)
- **Resolution:** removed `dlg-new.title`; added explicit scope note.
- **Status:** ACTIVE

---

## FL-0002 — Namespace collision between dialogs

- **Category:** Command / UI
- **Discovered in:** SYS-02 / H01
- **Severity:** P2
- **Original mistake:** Used `dlg-template.*` prefix for BOTH the New-from-Template gallery and the Save-as-Template dialog (same ID, different meanings).
- **Why it was wrong:** Same control-ID namespace for two distinct dialogs → ambiguity for AI-02.
- **Authoritative evidence:** H01 structure.
- **Permanent rule:** Each dialog gets a unique ID namespace; no two dialogs share a control-ID prefix.
- **Pre-flight check:** Grep the part for duplicate control-ID prefixes across dialogs.
- **Affected systems:** cross-system (UI)
- **Affected H-parts:** H01 (all dialog H-parts)
- **Resolution:** split into `tpl-new.*` and `dlg-save-template.*`.
- **Status:** ACTIVE

---

## FL-0003 — Validation contradiction

- **Category:** State / UI
- **Discovered in:** SYS-02 / H01
- **Severity:** P1
- **Original mistake:** fps field stated both "clamp (never invalid)" AND "empty → invalid" with no reconciliation.
- **Why it was wrong:** Two contradictory behaviors for the same field → AI-02 must guess.
- **Authoritative evidence:** engineering 03 (fps clamp 1–120); Blueprint silent on empty-field.
- **Permanent rule:** Each field has exactly one rule per situation; distinguish empty vs out-of-range explicitly.
- **Pre-flight check:** For each numeric field: what happens on empty? on out-of-range? Are they distinct and non-contradictory?
- **Affected systems:** cross-system
- **Affected H-parts:** H01 (all dialog H-parts)
- **Resolution:** empty = invalid (Create disabled); out-of-range = clamp on commit.
- **Status:** ACTIVE

---

## FL-0004 — Undefined ownership of metadata fields

- **Category:** Ownership / Identity
- **Discovered in:** SYS-02 / H01
- **Severity:** P2
- **Original mistake:** `createdAt`/`modifiedAt`/`title`/`author` had no stated owner.
- **Why it was wrong:** AI-02 couldn't know who writes each meta field.
- **Authoritative evidence:** Part 33 §33.1 (meta schema); Part 26 §26.1 (title/author = Properties).
- **Permanent rule:** Every persistent field has exactly one writer (owner) and one lifecycle (when written).
- **Pre-flight check:** For each model field, "who sets it? when? which command?"
- **Affected systems:** cross-system
- **Affected H-parts:** H01, H05
- **Resolution:** createdAt = H01 (New); modifiedAt = H05 (Save); title/author = SYS-06/SYS-17.
- **Status:** ACTIVE

---

## FL-0005 — Dead-control risk from underspecified buttons

- **Category:** Control / Command
- **Discovered in:** SYS-02 / H01
- **Severity:** P2
- **Original mistake:** New-from-Template gallery buttons (open/cancel) underspecified (no states, no disabled reason).
- **Why it was wrong:** A visible button without defined enable/disable + action = dead-control risk.
- **Authoritative evidence:** H00 INV-CMD-1 (FUNCTIONAL ⇒ commandId).
- **Permanent rule:** Every visible control has: ID, commandId/behavior, enabled/disabled + reason, action, result, failure, testId.
- **Pre-flight check:** §7C control checklist (from the global pre-flight).
- **Affected systems:** cross-system
- **Affected H-parts:** all
- **Resolution:** fully specified `tpl-new.list/open/cancel`.
- **Status:** ACTIVE

---

## FL-0006 — Missing event propagation for a state change

- **Category:** Event
- **Discovered in:** SYS-02 / H02
- **Severity:** P1
- **Original mistake:** Close-inactive and tab-reorder had no defined way for the tab strip to learn the open-set changed.
- **Why it was wrong:** A state change with no propagation = UI silently stale.
- **Authoritative evidence:** SYS-01 §4 (locked events); SYS-01 §1 (panels are projections).
- **Permanent rule:** Every externally-visible state mutation has a propagation path (event or a documented re-read trigger). "Handled elsewhere" is not acceptable without the exact owner/handoff.
- **Pre-flight check:** §7E event checklist — for each mutation, is there a propagation path?
- **Affected systems:** cross-system
- **Affected H-parts:** H02 (all)
- **Resolution:** registered AMB-H02-004 (open-set event = product decision).
- **Status:** ACTIVE

---

## FL-0007 — Using the wrong event as a UI refresh hack

- **Category:** Event
- **Discovered in:** SYS-02 / H02
- **Severity:** P0
- **Original mistake:** Emitted `activeDoc:changed` for tab reorder and close-inactive (where activeDocumentId did NOT change) as a "no-op refresh".
- **Why it was wrong:** The event's semantic (active changed) did not match the state change (open-set changed). Consumers re-read the wrong source of truth; downstream logic could act on a false active-change signal.
- **Authoritative evidence:** SYS-01 §4 (activeDoc:changed = active doc switch); explicit review rule "do not misuse activeDoc:changed for a change where activeDocumentId did not change".
- **Permanent rule:** Never use an existing event to signal a DIFFERENT state change. An event must carry exactly the semantic state that actually changed. If no event matches, register a connector gap — do not overload an unrelated event.
- **Pre-flight check:** §7E: for each emitted event, does its semantic equal the mutation? Is any event being reused as a "refresh hack"?
- **Affected systems:** cross-system (all events)
- **Affected H-parts:** all
- **Resolution:** removed fake `activeDoc:changed`; reorder/close-inactive → AMB-H02-004.
- **Status:** ACTIVE

---

## FL-0008 — Open-set mutation vs active-pointer mutation

- **Category:** Event / State
- **Discovered in:** SYS-02 / H02
- **Severity:** P0
- **Original mistake:** Treated "document added/removed/reordered" and "active document changed" as the same kind of change.
- **Why it was wrong:** They are distinct state mutations with distinct consumers. Conflating them corrupts rebind logic.
- **Authoritative evidence:** H00 §6 (active pointer vs open-set); SYS-01 §18 (open-set = SESSION).
- **Permanent rule:** Always separate (A) active-pointer mutation from (B) open-set mutation. Each has its own owner, event, consumers, and UI effect.
- **Pre-flight check:** For each lifecycle operation, classify: does active change? does open-set change? both? Each needs its own propagation.
- **Affected systems:** cross-system (lifecycle)
- **Affected H-parts:** H02, H06, H07
- **Resolution:** §14 event matrix separates the two classes.
- **Status:** ACTIVE

---

## FL-0009 — Ownership collision between two systems

- **Category:** Ownership
- **Discovered in:** SYS-02 / H02 (vs SYS-01)
- **Severity:** P0
- **Original mistake:** SYS-01 registered `tab.activate/close/reorder` as its own controls while H02 owned activation semantics.
- **Why it was wrong:** Two systems could independently implement the same tab behavior → divergence.
- **Authoritative evidence:** SYS-01 §6.3 vs H00 §20 (SYS-02 owns lifecycle).
- **Permanent rule:** One owner, one source of truth per concern. Split into view vs semantics (chrome = render/input; semantics = state + consequences) — never two implementers of the same behavior.
- **Pre-flight check:** §7F ownership checklist — for each concern, is there exactly one owner + one source of truth + a clear handoff?
- **Affected systems:** SYS-01 ↔ SYS-02 (all cross-system)
- **Affected H-parts:** H02 (all)
- **Resolution:** §8 split: SYS-01 = strip chrome; SYS-02 = open-set + activation semantics.
- **Status:** ACTIVE

---

## FL-0010 — Unresolved/proposed controls entering the implementation matrix

- **Category:** Control
- **Discovered in:** SYS-02 / H02
- **Severity:** P1
- **Original mistake:** Ctrl+Tab keyboard navigation appeared in the approved controls matrix despite not being in the Blueprint.
- **Why it was wrong:** AI-02 could implement an unapproved shortcut.
- **Authoritative evidence:** Blueprint §1.2.1 (no tab-nav key); anti-guessing rule.
- **Permanent rule:** PROPOSED/UNRESOLVED items go in a separate register, never in the approved implementation matrix.
- **Pre-flight check:** §7C — is any proposed/ambiguous control listed as approved?
- **Affected systems:** cross-system
- **Affected H-parts:** all
- **Resolution:** Ctrl+Tab moved to PROPOSED (AMB-H02-002).
- **Status:** ACTIVE

---

## FL-0011 — Duplicate Document ID / same-file-open ambiguity

- **Category:** Identity
- **Discovered in:** SYS-02 / H02 (inherited H00 AMB-002)
- **Severity:** P1
- **Original mistake:** Multi-document model didn't resolve what happens when two open docs have the same ID (same file opened twice, or u64 collision).
- **Why it was wrong:** Tab↔doc association and identity uniqueness are load-bearing for multi-doc.
- **Authoritative evidence:** Blueprint §33 (UUID — collision impossible by construction); code uses u64 (P-10 note).
- **Permanent rule:** Identity contracts (uniqueness, collision, same-file-twice) must be explicitly resolved before a multi-entity system is READY.
- **Pre-flight check:** For any multi-entity model, is identity uniqueness + collision behavior defined?
- **Affected systems:** SYS-02 (multi-doc), SYS-28 (identity)
- **Affected H-parts:** H02, H10
- **Resolution:** registered AMB-H02-001.
- **Status:** ACTIVE

---

## FL-0012 — Accessibility decision left implicit

- **Category:** Accessibility
- **Discovered in:** SYS-02 / H02
- **Severity:** P1
- **Original mistake:** Focus destination after tab switch was left unspecified.
- **Why it was wrong:** Keyboard/screen-reader flow became undefined; AI-02 must guess.
- **Authoritative evidence:** Blueprint silent; H00 §17 (a11y must be explicit).
- **Permanent rule:** Every accessibility behavior (focus, keyboard, aria) is explicit or explicitly registered as unresolved. Never implicit.
- **Pre-flight check:** §7J — any keyboard/focus behavior silently invented? registered?
- **Affected systems:** cross-system
- **Affected H-parts:** all
- **Resolution:** registered AMB-H02-003.
- **Status:** ACTIVE

---

## FL-0013 — Stale document-bound UI references

- **Category:** Architecture / UI
- **Discovered in:** manual QA (tab-switch failure) → H00 §9
- **Severity:** P0
- **Original mistake:** Tab switching failed to rebind panels; UI rendered a stale document reference.
- **Why it was wrong:** Document-bound UI read a cached reference instead of the new active document's source of truth.
- **Authoritative evidence:** Blueprint Part 01 §1.1.3 (panels reflect active doc); prior manual QA failure list.
- **Permanent rule:** On `activeDoc:changed`, every document-bound panel re-reads the NEW active document. Never render a reference captured before the switch.
- **Pre-flight check:** §7G — for each document-bound UI, is stale-state prevention specified?
- **Affected systems:** SYS-02 (binding), SYS-14..19
- **Affected H-parts:** H02 (all document-bound H-parts)
- **Resolution:** H00 §9 + H02 §11 rebind matrix with rule 4 (no stale ref).
- **Status:** ACTIVE

---

## FL-0014 — Dirty-state leakage between documents

- **Category:** State / Dirty
- **Discovered in:** H00 §7 (INV-MD-7)
- **Severity:** P1
- **Original mistake (risk):** dirty state could transfer on document switch.
- **Why it was wrong:** Dirty is per-document; a switch must never move it.
- **Authoritative evidence:** STM-DIRTY (per-document); H00 INV-MD-7.
- **Permanent rule:** Dirty state is per-document; switching never transfers/mixes it; only DOCUMENT MUTATION sets DIRTY.
- **Pre-flight check:** §7H — does any view-only action dirty a document? any cross-doc dirty transfer?
- **Affected systems:** SYS-02 (multi-doc), SYS-03 (undo)
- **Affected H-parts:** H02, H04
- **Resolution:** H02 §15 isolation tests.
- **Status:** ACTIVE

---

## FL-0015 — Undo/history leakage between documents

- **Category:** Undo
- **Discovered in:** H00 §13 (INV-MD-5)
- **Severity:** P1
- **Original mistake (risk):** undo histories could merge across documents.
- **Why it was wrong:** Each document owns its History; switching must never mix them.
- **Authoritative evidence:** Part 12 (save doesn't clear undo); H00 INV-MD-5.
- **Permanent rule:** Undo history is per-document; switching never merges; switch creates no undo entry.
- **Pre-flight check:** §7H — any cross-doc history mixing?
- **Affected systems:** SYS-02 (multi-doc), SYS-03
- **Affected H-parts:** H02
- **Resolution:** H02 §15.
- **Status:** ACTIVE

---

## FL-0016 — Cross-H scope leakage

- **Category:** Scope
- **Discovered in:** SYS-02 (H02 vs H03/H04/H05/H06/H07)
- **Severity:** P0
- **Original mistake (risk):** H02 could drift into owning dirty-guard/close/save mechanics.
- **Why it was wrong:** Each H-part owns a narrow slice; cross-part behavior = handoff, not ownership.
- **Authoritative evidence:** H00 §20, H02 scope.
- **Permanent rule:** A later H-part reacts to another's lifecycle result via handoff; it never implements the other's mechanics.
- **Pre-flight check:** §7A/F — does this part own only its declared scope? Any cross-H duplication?
- **Affected systems:** SYS-02 (all H)
- **Affected H-parts:** H02..H14
- **Resolution:** H02 §21 handoff table (reacts, does not own).
- **Status:** ACTIVE

---

## FL-0017 — Current code influencing specification authority

- **Category:** Authority
- **Discovered in:** SYS-02 (u64 IDs; downloadBlob save; single Session)
- **Severity:** P0
- **Original mistake (risk):** letting current implementation (u64, downloadBlob, single-Session) shape the spec.
- **Why it was wrong:** Code is evidence only; Blueprint is authority. Code divergences are GAPS, not spec reductions.
- **Authoritative evidence:** authority order (Blueprint > … > code); P-10 note.
- **Permanent rule:** Current code never weakens the spec. Divergence = implementation gap, documented, never promoted to spec.
- **Pre-flight check:** §7B — am I using code as authority? am I weakening spec to match code?
- **Affected systems:** all
- **Affected H-parts:** all
- **Resolution:** `CURRENT IMPLEMENTATION STATUS` label used throughout; gaps listed, not adopted.
- **Status:** ACTIVE

---

## FL-0018 — "COMPLETE" claimed without runtime proof

- **Category:** Testing / Status
- **Discovered in:** manual QA failure list ("green build ≠ complete product")
- **Severity:** P0
- **Original mistake:** treating specification completeness as product completeness.
- **Why it was wrong:** SPECIFIED ≠ IMPLEMENTED ≠ TESTED ≠ MANUALLY ACCEPTED.
- **Authoritative evidence:** H00 §"Completeness Model" (A/B/C/D); manual QA philosophy.
- **Permanent rule:** A spec is READY only when implementation-critical ambiguity is zero. "Complete" requires spec+impl+test+manual-acceptance.
- **Pre-flight check:** §7M — is the status honest? unresolved critical ambiguity ⇒ REVISION REQUIRED.
- **Affected systems:** all
- **Affected H-parts:** all
- **Resolution:** 4-state completeness model (SPEC/IMPL/INTEGRATION/ACCEPTANCE).
- **Status:** ACTIVE

---

## FL-0019 — Test existence mistaken for product acceptance

- **Category:** Testing
- **Discovered in:** manual QA (automated green, desktop broken)
- **Severity:** P2
- **Original mistake:** automated tests treated as proof of working product.
- **Why it was wrong:** Automated pass ≠ manual desktop interaction pass.
- **Authoritative evidence:** manual QA philosophy (H00 §19).
- **Permanent rule:** Manual desktop interaction is authoritative for interaction behavior; visual defects are real failures; prerequisite-fail ⇒ dependent BLOCKED.
- **Pre-flight check:** §7L — does the part distinguish automated from manual acceptance?
- **Affected systems:** all
- **Affected H-parts:** all
- **Resolution:** H00 §19 (7 rules).
- **Status:** ACTIVE

---

## FL-0020 — Counting drift / stale aggregates

- **Category:** Architecture
- **Discovered in:** SYS-02 (multiple count fixes)
- **Severity:** P1
- **Original mistake:** Final counts ("17 controls", "21 features") drifted from actual tables across revisions.
- **Why it was wrong:** Unreproducible counts hide real omissions/duplications.
- **Authoritative evidence:** counting audit requirement.
- **Permanent rule:** Every count (features/controls/commands/shortcuts/states) must be mechanically reproducible from its table/tree; no stale aggregates; distinct counting units defined.
- **Pre-flight check:** Re-derive counts from tables; cross-check all sections agree.
- **Affected systems:** all
- **Affected H-parts:** all
- **Resolution:** counting units defined; cross-check paragraphs added.
- **Status:** ACTIVE

---

## FL-0021 — Orthogonal state dimensions flattened

- **Category:** State
- **Discovered in:** SYS-02 (FAILURE C)
- **Severity:** P1
- **Original mistake:** Presented identity/dirty/lifecycle as one flat mutually-exclusive enum (Untitled/Clean/Dirty as peer states).
- **Why it was wrong:** They are orthogonal dimensions; flattening creates impossible/contradictory combinations.
- **Authoritative evidence:** STM-DIRTY (dirty machine) vs identity (Part 33) vs lifecycle.
- **Permanent rule:** Model orthogonal dimensions separately (identity × dirty × lifecycle); define valid combinations, never a flat enum of non-orthogonal values.
- **Pre-flight check:** §7D — are orthogonal dimensions being flattened?
- **Affected systems:** all (state)
- **Affected H-parts:** all
- **Resolution:** H00 §6 (3 dimensions + valid combinations + transitions).
- **Status:** ACTIVE

---

## FL-0022 — Quarantined decision silently resolved

- **Category:** Decision / Authority
- **Discovered in:** SYS-02 (FAILURE B — P-7 template store)
- **Severity:** P1
- **Original mistake:** P-7 marked "MISSING PRODUCT DECISION" but another section wrote "PREFS (template)", silently resolving it.
- **Why it was wrong:** A quarantined decision must stay consistent everywhere; hardcoding one interpretation breaks the firewall.
- **Authoritative evidence:** product-decision firewall rule.
- **Permanent rule:** If a behavior is `[MISSING PRODUCT DECISION]`, no other section may hardcode an interpretation. Every occurrence references the P-ID. (Then, per SYS-02 finalization: either resolve from authoritative sources, or prove non-blocking — never "quarantine-and-pass".)
- **Pre-flight check:** For each unresolved decision, grep all sections for accidental hardcoding.
- **Affected systems:** all
- **Affected H-parts:** all
- **Resolution:** P-7 → `[P-7]` everywhere; later resolved/proven non-blocking in SYS-02 §24.
- **Status:** ACTIVE

---

## FL-0023 — Quarantine-and-pass loop

- **Category:** Decision / Status
- **Discovered in:** SYS-02 finalization
- **Severity:** P0
- **Original mistake:** Repeatedly marked items "MISSING PRODUCT DECISION" and declared the spec PASS anyway.
- **Why it was wrong:** Unresolved implementation-critical decisions mean AI-02 must guess; PASS was false.
- **Authoritative evidence:** anti-regression rule ("never '[MISSING PRODUCT DECISION] — but approved'"); SYS-02 §22 hard-fail.
- **Permanent rule:** Every unresolved item is classified (BLOCKING / NON-BLOCKING-DEFERRED / EXTERNAL / TRUE-DECISION / CONTRADICTION / IMPL-GAP / RESEARCH-GAP). If AI-02 would have to guess → FAIL, not PASS.
- **Pre-flight check:** §7M — any "quarantined" item that actually blocks implementation?
- **Affected systems:** all
- **Affected H-parts:** all
- **Resolution:** SYS-02 §24 Resolution Register (resolve or prove non-blocking).
- **Status:** ACTIVE

---

## FL-0024 — Contradictory state machine (guard vs transition diagram)

- **Category:** State
- **Discovered in:** SYS-02 (FAILURE A — Close/Clean)
- **Severity:** P0
- **Original mistake:** Transition diagram showed `Dirty/Untitled/Clean → CloseConfirmation` while the guard text said CLEAN closes directly.
- **Why it was wrong:** Two sources of truth for the same guard → AI-02 implements the wrong one.
- **Authoritative evidence:** STM-DIRTY (close with DIRTY → confirm).
- **Permanent rule:** One canonical guard/transition rule; every state table, transition diagram, and prose description must express the SAME rule.
- **Pre-flight check:** §7D/M — cross-check state table vs transition diagram vs prose for the same rule.
- **Affected systems:** all (state)
- **Affected H-parts:** all
- **Resolution:** H00 §6 canonical guard (DIRTY-only) + cross-checked diagram.
- **Status:** ACTIVE

---

## FL-0025 — Contradictory invariant vs transition table (dirty machine)

- **Category:** State / Contradictory Invariant
- **Discovered in:** SYS-02 / H04
- **Severity:** P1
- **Original mistake:** `INV-DIRTY-2` stated "DIRTY→CLEAN only via successful write" while the SAME document's transition table (`T6`) declared "DIRTY→CLEAN when undo/redo returns to the exact saved snapshot". Two different legal paths for the same state change, in the same file.
- **Why it was wrong:** An invariant and its own transition table described contradictory legal paths → AI-02 must guess which is authoritative. The attempted fix was a local note ("INV-DIRTY-2 is about the SAVE path only"), which does NOT repair the invariant — the invariant's wording stays wrong.
- **Authoritative evidence:** the authoritative dirty semantic is "DIRTY = current document state differs from the last-saved snapshot" (H00 §7 table + user-approved definition). Under it, CLEAN is reached exactly two ways: (a) a successful write (Save/Save As) advances the snapshot to current state; (b) a document mutation (undo/redo) moves the state back to the snapshot. STM-DIRTY's "forbidden DIRTY→CLEAN without a successful write" is a protection against ARBITRARY clearing (view/session/workspace/pref must never clear DIRTY), not against snapshot-equality reached via a real document mutation.
- **Permanent rule:** Every invariant must be cross-checked against every declared state transition and every edge-case/exception rule. An invariant and a transition table cannot describe different legal paths. A local explanatory note does not repair a contradictory invariant — rewrite the invariant wording itself so it is internally consistent with all transitions.
- **Pre-flight check:** For each invariant, enumerate ALL transitions that can modify the affected state and verify that NO legal transition violates the invariant's wording.
- **Affected systems:** cross-system (all state machines)
- **Affected H-parts:** H04 (and H00 §7 INV-DIRTY-2 / §6.3 forbidden / §22 INV-008, which carry the same wording and require a matching correction in a future H00 revision)
- **Resolution:** `INV-DIRTY-2` rewritten to "DIRTY clears to CLEAN only when current state == last-saved snapshot, via (a) successful write or (b) a document mutation returning to the snapshot; no VIEW/SESSION/WORKSPACE/PREFERENCE action may clear DIRTY." T6's defensive note removed (no longer needed).
- **Status:** ACTIVE

---

## FL-0026 — Stale cross-document section citations (source renumbered)

- **Category:** Cross-reference / Authority
- **Discovered in:** SYS-02 H00–H04 reconciliation
- **Severity:** P2
- **Original mistake:** H00–H04 cited "SYS-01 §4" (event contract), "§13" (undo model), "§19" (integration contract), "§32" (design tokens), "§11" (error model), and H03 cited "SYS-01 §7" (overlay), but the current SYS-01 v5 has events at §27.1, undo at §17, integration at §31, and §32 = "Internal Consistency Audit", §7 = "Every Menu Item", §11 = "Every Keyboard Interaction", §13 = "Every State", §19 = "Export/Import" — none of which contain the cited content.
- **Why it was wrong:** A stale section pointer sends AI-02 to the wrong section; it may read unrelated content as authoritative, or fail to find the locked contract (events are load-bearing).
- **Authoritative evidence:** the actual SYS-01 v5 section map (verified by reading the file): §4=Additional Research, §11=Keyboard, §13=States, §17=Undo/Redo 4-class, §18=Persistence 4-boundary, §19=Export/Import, §27=Event Contract (27.1 registry), §28=Control Registry, §31=Cross-System Integration, §32=Internal Consistency Audit, §36=Master Template ("Error model 9 outcomes").
- **Permanent rule:** At reconciliation time, every cross-document section citation must be verified against the CURRENT version of the cited source. When a source document is revised/renumbered, all downstream citations become suspect until re-verified. Fix the pointer to the section that actually contains the cited content; never leave a stale pointer.
- **Pre-flight check:** For each cross-document citation, confirm (a) the section exists in the current source, and (b) it actually contains the cited content.
- **Affected systems:** cross-system (all SYS/H referencing SYS-01, Blueprint parts, phase2.5 contracts)
- **Affected H-parts:** H00, H02, H03 (fixed); all future H-parts
- **Resolution:** §4→§27.1, §13→§17, §19→§31, §11→§28/§36, §32→§2/§21, §7→phase2.5 C-07; Citation Drift Report emitted in the reconciliation.
- **Status:** ACTIVE

---

## FL-0027 — Invariant enumerates examples as an exhaustive path list

- **Category:** State / Invariant precision
- **Discovered in:** SYS-02 H00↔H04 freeze pass
- **Severity:** P1
- **Original mistake:** `INV-DIRTY-2` read "DIRTY clears via **exactly two legal paths** — (a) a successful write, or (b) a document mutation **(undo/redo)**". This presented undo/redo as the ONLY mutation path that clears DIRTY.
- **Why it was wrong:** The general semantic is "DIRTY ⇔ state ≠ snapshot; CLEAN ⇔ state == snapshot", so ANY document mutation that reaches the snapshot clears DIRTY. The wording restricted CLEAN to write/undo/redo — an AI-02 following it literally would leave a stuck DIRTY flag when a fresh (non-undo) edit returns a value to its saved value.
- **Authoritative evidence:** the canonical dirty semantic (H00 §7 "differs from snapshot"); undo/redo are examples, not an exhaustive list.
- **Permanent rule:** When an invariant states a general semantic condition, express the GENERAL condition. If examples are given, label them explicitly as examples ("e.g.", "such as") — never as "exactly N paths" or an unqualified enumerated list that can be read as exhaustive.
- **Pre-flight check:** For each invariant phrased "via X or Y" / "exactly N ways", ask: are X/Y the complete set, or examples? If the semantic is general, restate the general condition and demote the enumerated cases to labeled examples.
- **Affected systems:** cross-system (all state semantics)
- **Affected H-parts:** H00 §7/§6.3/§22, H04 §3.1/§6.0/§6.2/§7
- **Resolution:** "exactly two legal paths" removed; "(undo/redo)" → "(any — undo/redo are examples, NOT the only mutations)"; X: 10→20→10 example added.
- **Status:** ACTIVE

---

## FL-0028 — Unresolved ambiguity asserted as authoritative behavior

- **Category:** Decision / Authority
- **Discovered in:** SYS-02 / H01 (AMB-H01-003)
- **Severity:** P1
- **Original mistake:** AMB-H01-003 was registered as unresolved ("seeded doc UNTITLED vs auto-titled"), but §5.3 wrote "Identity: seeded doc is UNTITLED (no path)" — asserting one side of the open ambiguity as authoritative, in the very line that cited the open AMB.
- **Why it was wrong:** AI-02 reads "UNTITLED" as the decided behavior and implements it, silently closing a decision the human never made. A later "auto-titled" decision would then break the implementation.
- **Authoritative evidence:** anti-guessing rule; an AMB stays unresolved until a product decision.
- **Permanent rule:** An unresolved ambiguity (AMB) must NEVER be asserted as an authoritative behavior/requirement in any normative field (Identity:, Result:, State:, Action:, an event, etc.) of the same spec. Only a clearly-labelled "RECOMMENDATION — NOT AUTHORITATIVE" may appear, and every normative reference to the behavior must point to the AMB-ID.
- **Pre-flight check:** For each open AMB, grep every normative field for an assertion of one side of the ambiguity; the ONLY permitted occurrence is a labelled recommendation.
- **Affected systems:** cross-system
- **Affected H-parts:** H01 (all future H-parts)
- **Resolution:** H01 §5.3/§4 "UNTITLED" → "RECOMMENDATION — NOT AUTHORITATIVE" + `[AMB-H01-003 identity]` placeholder; AMB-H01-003 remains open.
- **Related:** sibling of FL-0022 (hardcoding an interpretation of a quarantined decision); the difference is asserting one side of a still-OPEN A-vs-B ambiguity.
- **Status:** ACTIVE

---

## FL-0029 — Path-mutating command collides with open-set identity (Save As)

- **Category:** Identity / Path
- **Discovered in:** SYS-02 / H05
- **Severity:** P1
- **Original mistake:** H05 said "Save As to an existing path = overwrite (no confirm)" without distinguishing a path **already open as another document** from a path merely present on disk. This would have allowed two open documents to share one saved path (A Save As → B's open path).
- **Why it was wrong:** A path-mutating command (Save As) can create the SAME open-set collision that Open can. The one-path-per-open-document invariant (INV-IDENT-4 / D-AMB-001) applies to BOTH the open side and the save side.
- **Authoritative evidence:** H00 §5 INV-IDENT-4 (D-AMB-001): no duplicate Document ID / saved path in the open-set.
- **Permanent rule:** Every command that can change a document's saved path must enforce the one-path-per-open-document invariant: moving to an already-open path is BLOCKED with an explicit error; the source document is left unchanged (dirty/History/session preserved).
- **Pre-flight check:** For any path-mutating command, is the target-path-vs-open-set collision explicitly defined?
- **Affected systems:** SYS-02 (identity), SYS-28 (write target)
- **Affected H-parts:** H05 (all future path-mutating commands)
- **Resolution:** H05 §6 adds "Save As to an already-open path = BLOCKED"; new edge case T-save-as-open-path-block.
- **Related:** the save-side sibling of FL-0011 (duplicate-ID on open).
- **Status:** ACTIVE

---

## FL-0030 — Event payload drift (same event, inconsistent schema)

- **Category:** Event
- **Discovered in:** SYS-02 / H05
- **Severity:** P1
- **Original mistake:** H05 used `saving:changed{saved}` payload `{time}` while H04 and SYS-01 §27.1 used `{state, time?}`. One locked event, two payload schemas.
- **Why it was wrong:** AI-02 must guess which payload shape is authoritative; a consumer written for one shape breaks on the other; serializers/deserializers diverge.
- **Authoritative evidence:** SYS-01 §27.1 canonical `saving:changed{state, time?}`.
- **Permanent rule:** A locked event has ONE canonical payload schema, single-sourced (SYS-01 §27.1 for the locked set). Every H-file must use the identical schema; a drift is a defect to fix, never a tolerated "local shorthand".
- **Pre-flight check:** For each locked event, grep every H-file for the payload; all occurrences must match the single canonical schema.
- **Affected systems:** cross-system (all events)
- **Affected H-parts:** H05 (all future H-parts)
- **Resolution:** H05 §9 aligned to `{state, time?}`.
- **Status:** ACTIVE

---

## FL-0031 — Ambiguous source term left uninterpreted ("replaces active doc")

- **Category:** Terminology / Authority
- **Discovered in:** SYS-02 / H06 (cross-checked with H00 §10)
- **Severity:** P1
- **Original mistake:** Blueprint §1.2.1 says Open "Replaces active doc (with save prompt)". This was left uninterpreted, so H06 could be read as "Open REMOVES the previously-active document" (single-doc model), contradicting H02's ADD model (multi-doc).
- **Why it was wrong:** The same source (§1.1.3) also establishes multi-doc ("multiple documents open in tabs simultaneously… panels reflect the active document"). If Open "replaced" by removing the previous doc, multi-doc could never accumulate via Open. AI-02 could implement the removal reading → a data-loss/UX bug.
- **Authoritative evidence:** Blueprint §1.1.3 (multi-doc) + §1.2.1 ("Replaces active doc… with save prompt"). The consistent reading: "replaces active doc" = the opened doc BECOMES the active doc (the active pointer/status is replaced); the previous doc stays open (inactive). "with save prompt" = the dirty guard.
- **Permanent rule:** When a source term has two readings, resolve it against the SAME source's other statements (and the approved model), choose the reading consistent with both, and document the resolution explicitly in the owning H-part. Never leave an ambiguous term uninterpreted where it could be misread downstream.
- **Pre-flight check:** For each source term that could be misread, is its intended meaning explicitly stated (with the cross-source evidence), or is it left ambiguous?
- **Affected systems:** cross-system
- **Affected H-parts:** H06 (resolved); H00 §10 term renamed "Replace-active-document" → "Open-activates-new-document"
- **Resolution:** H06 §6 adds the binding "Replaces active doc" semantic-resolution note; H00 §10 destructive-table row renamed.
- **Status:** ACTIVE

---

## FL-0032 — Single-document relic leaked into multi-document spec (guard on Open)

- **Category:** Scope / Data-safety
- **Discovered in:** SYS-02 H00–H08 final reconciliation
- **Severity:** P1
- **Original mistake:** The dirty guard (Save/Discard/Cancel) was attached to Open/Open-Recent across H00 (§6.3 T11, §10), H04 (§8), H06, and H02 (edge 8), inherited from Blueprint §1.2.1 "Open: Replaces active doc (with save prompt)". This is a SINGLE-document model relic: in single-doc, Open replaced (and destroyed) the active doc, so a "save prompt" guarded the loss. In multi-doc, Open adds+activates — the previous doc becomes INACTIVE with its dirty state preserved (no loss) — so the guard is pointless and inconsistent with tab-switch (which has no guard).
- **Why it was wrong:** A guard that protects nothing creates a UX inconsistency (Open prompts; tab-click does not) and forces AI-02 to implement a pointless safety dialog. It also contradicts D-AMB-001 (Open = activate-and-preserve) and H02 ST2 (add, A→inactive).
- **Authoritative evidence:** Blueprint §1.1.3 (multi-doc tabs, no replacement) + D-AMB-001 (Open = activate, preserve session) + H02 ST2 (add + activate). "with save prompt" = single-doc relic.
- **Permanent rule:** A safety guard exists ONLY to prevent data loss. If an operation causes no data loss in the current model, it must NOT carry a guard inherited from a different (single-doc) model. When the model changes (single→multi), re-derive every guard from the current model's data-loss properties; do not carry guards forward unexamined.
- **Pre-flight check:** For every guard/confirmation, ask "what data loss does this prevent in the CURRENT model?" If the answer is "none", the guard is a relic — remove it (or register why it stays).
- **Affected systems:** cross-system
- **Affected H-parts:** H00 §6.3/§10, H04 §8, H06, H02 edge 8
- **Resolution:** Open/Open-Recent removed from the guard-trigger set across all files; H00 §6.3 "Open in multi-document" binding note added.
- **Status:** ACTIVE

---

## FL-0033 — Ambiguity left open without exhausting cross-file structural evidence

- **Category:** Decision / Authority (maximum-effort resolution)
- **Discovered in:** SYS-03 (AMB-S03-001/004/005)
- **Severity:** P1
- **Original mistake:** AMB-S03-001 (clipboard cross-doc scope), AMB-S03-004 (Delete), AMB-S03-005 (Find & Replace depth) were declared "unresolved — Blueprint silent" after searching only the feature's OWN spec section (the Edit-menu table §1.2.2). Deeper cross-file evidence actually resolved them.
- **Why it was wrong:** The answer lived elsewhere: the ContextMenuBuilder signature `(hitTarget, selection, tool, clipboard, doc-state)` (Part 30) proves `clipboard` is separate from `doc-state` (⇒ app-level, not per-doc); Part 03 §3.4.1 "move/cut/delete command" proves Delete is required by the merge model; Part 23 (colors) + Part 11.6 (Swap Symbol) + Part 22 (text/font) + Part 17 (audio) ground the five Find & Replace targets. Declaring them open forced an unnecessary product decision.
- **Authoritative evidence:** Blueprint Part 30 (ContextMenuBuilder), Part 03 §3.4.1, Part 23, Part 11.6, Part 22, Part 17.
- **Permanent rule:** "The feature's own spec section is silent" does NOT mean "unresolvable." Before declaring an ambiguity open, exhaust cross-file structural evidence: architecture signatures, menu/context-builder inputs, object-model mechanics, and sibling-system contracts. Resolve by grounding the behavior in what the architecture ALREADY implies.
- **Pre-flight check:** For each candidate AMB, ask: "did I search (a) the feature's own section, AND (b) architecture signatures, AND (c) object-model mechanics, AND (d) sibling contracts — before declaring it open?"
- **Affected systems:** cross-system
- **Affected H-parts:** SYS-03 H02/H03 (resolved); all future systems
- **Resolution:** AMB-S03-001/004/005 RESOLVED from cross-file evidence; AMB-S03-003 (Paste Special format list) remains open (genuinely under-specified: "options (format)" with no list anywhere).
- **Related:** complements FL-0023 (quarantine-and-pass); the difference is the DIRECTION — FL-0023 says "don't mark open and pass anyway"; FL-0033 says "don't mark open before exhausting cross-file evidence."
- **Status:** ACTIVE

---

## FL-0034 — Ambiguity resolution not propagated to every referencing table/field

- **Category:** Decision / Consistency (resolution propagation)
- **Discovered in:** SYS-03 / H02
- **Severity:** P1
- **Original mistake:** AMB-S03-003's Paste-Special STRUCTURE was resolved in H02 §6.3b (confirm = one undoable command, fresh IDs, new selection; cancel = no command), but the §5 command/control table row for `edit.pasteSpecial` still showed `[AMB]` placeholders in its Mutation/Undo/Dirty/Event columns. Two sections of the SAME file described the SAME behavior differently.
- **Why it was wrong:** A resolution written in a prose note does not automatically update a summary table. AI-02 reads the TABLE as the canonical contract and would treat the behavior as unresolved (or invent it), contradicting the resolved prose. This is the mirror of FL-0022 (which guards against silently RESOLVING a quarantine); this guards against failing to PROPAGATE a resolution.
- **Authoritative evidence:** the resolved structure in §6.3b (grounded in INV-UNDO-4 + REQ-SYS-004 + the command model).
- **Permanent rule:** When an ambiguity's status changes (open → resolved, or resolved → open), EVERY normative field, table, register, and matrix that referenced it — in the SAME file AND in every downstream file — must be updated in the SAME pass. A resolution note in prose does not update a stale table; grep every `[AMB]`/`[UNRESOLVED]` placeholder and reconcile each against the register.
- **Pre-flight check:** After resolving (or re-opening) any AMB, grep all files for the AMB-ID and every `[AMB]`/`[UNRESOLVED]` placeholder; verify each occurrence reflects the NEW status (resolved = concrete values; open = placeholder only where genuinely open).
- **Affected systems:** cross-system
- **Affected H-parts:** SYS-03 H02 (fixed); all future systems
- **Resolution:** H02 §5 `edit.pasteSpecial` row filled with the resolved structure (Mutation YES / Undo YES / Dirty →snapshot / Event document:changed+selection:changed, cancel=none); only the genuinely-open FORMAT LIST remains an `[AMB-S03-003]` reference.
- **Status:** ACTIVE

---

## Cross-System Memory Index

**Events:** FL-0006, FL-0007, FL-0008, FL-0030
**Ownership:** FL-0004, FL-0009, FL-0016
**State:** FL-0021, FL-0024, FL-0025, FL-0027
**Identity:** FL-0011, FL-0029
**Controls:** FL-0005, FL-0010
**Dirty/Undo:** FL-0014, FL-0015
**Binding:** FL-0013
**Authority:** FL-0017
**Status/Testing:** FL-0018, FL-0019
**Decisions:** FL-0022, FL-0023, FL-0028, FL-0033, FL-0034
**Scope:** FL-0001, FL-0002, FL-0003
**Counting:** FL-0020
**Accessibility:** FL-0012
**Cross-reference:** FL-0026
**Terminology:** FL-0031
**Scope/Multi-doc:** FL-0032

---

*Append-only. New lessons appended at the bottom with FL-0035+.*
