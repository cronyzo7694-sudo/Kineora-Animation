// ============================================================================
// SYS-28 PERSISTENCE — MOD-PERSIST (TS boundary layer)
//
// Owner: SYS-28 (AI-D). This module is the WRITE/READ boundary between the
// SYS-02 triggers (file.ts — H10 §5.1/§5.2 handoff seams) and the stored
// project bytes. It owns:
//
//   • `formatVersion` — stamped ON WRITE by SYS-28 (H10 §6; closes the P-9
//     SPEC-vs-IMPL gap at the persistence boundary). Part 33 §33.1 places
//     formatVersion at the top level of the project schema.
//   • `migrate(from, to)` — PURE migration seam (eng 13 MOD-DOC:
//     "formatVersion monotonic; migrate(from,to) pure; loader: validate →
//     migrate → … → integrity check"). Unmigratable (newer than the app)
//     → REFUSE the load (H10 §6 "unmigratable → refuse" — H06 failure path;
//     an error OUTCOME, never a lifecycle state).
//   • `checksumHex` — content checksum for the `.autosave` slot envelope
//     (eng 13 "checksum stored"; H10 §10 "corrupt .autosave on recovery →
//     skip + toast"). FNV-1a 64-bit — deterministic, dependency-free.
//     [ENGINEERING DECISION — SYS-28 internal, mirrors eng 13's own
//     "[ENGINEERING DECISION]" latitude for MOD-PERSIST internals; algorithm
//     choice is not user-visible product behavior.]
//
// NOT owned here: save/open TRIGGERS + UI feedback (SYS-02, file.ts) ·
// the native atomic tmp→rename write (desktop shell `atomic_write`,
// commands.rs — the Rust half of MOD-PERSIST) · document content semantics
// (MOD-DOC). INV-PERS-1 direction is preserved: SYS-02 calls INTO this
// module; this module never reaches into SYS-02 lifecycle.
//
// NOTE (evidence, FL-0017): the WASM engine's Document serializer does not
// yet carry formatVersion (P-9). serde ignores unknown fields (verified: no
// `deny_unknown_fields` in animator/core/src), so a stamped file loads
// cleanly; SYS-28 re-stamps CURRENT_FORMAT_VERSION on every write — exactly
// the H10 §6 ownership row ("formatVersion | SYS-28 | on write"). Moving the
// field into MOD-DOC (Rust) is the queued core-parity increment (blocked:
// no Rust toolchain in this worker environment — see BLOCKERS BLK-D-005).
// ============================================================================

/** Current on-disk format version (monotonic — eng 13). v0 = legacy files
 *  written before SYS-28 existed (no formatVersion field). */
export const CURRENT_FORMAT_VERSION = 1

export type LoadFailure = 'corrupt' | 'newer-version'

export type LoadOutcome =
  | {
      ok: true
      /** JSON string handed to the engine (post-migration). */
      content: string
      /** Version found in the file (0 = legacy pre-SYS-28 file). */
      fromVersion: number
      /** True when a migration step ran (fromVersion < CURRENT). */
      migrated: boolean
    }
  | { ok: false; reason: LoadFailure; detail: string }

/** Parse a JSON object; null when the bytes are not a JSON object. */
function parseObject(raw: string): Record<string, unknown> | null {
  try {
    const v: unknown = JSON.parse(raw)
    if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      return v as Record<string, unknown>
    }
    return null
  } catch {
    return null
  }
}

/**
 * Stamp `formatVersion` = CURRENT on a serialized document (SYS-28 write
 * path — H10 §6: writer = SYS-28, when = on write). Idempotent: an already
 * stamped document is re-stamped to CURRENT. Returns null when the input is
 * not a JSON object (nothing is written in that case — the caller surfaces
 * the save error; INV-ERR-1 no silent failure).
 */
export function stampFormatVersion(json: string): string | null {
  const doc = parseObject(json)
  if (!doc) return null
  doc.formatVersion = CURRENT_FORMAT_VERSION
  return JSON.stringify(doc)
}

/**
 * PURE migration step chain (eng 13: `migrate(from,to)` pure). Returns the
 * migrated document object, or null when no migration path exists (from >
 * to — a file written by a NEWER app version; monotonic versions never
 * migrate downward).
 *
 * v0 → v1: structural no-op — v1 only introduces the formatVersion field
 * itself; every legacy field is already readable (serde defaults in
 * MOD-DOC). No content is rewritten.
 */
export function migrate(
  from: number,
  to: number,
  doc: Record<string, unknown>,
): Record<string, unknown> | null {
  if (from > to) return null
  let v = from
  let out = doc
  while (v < to) {
    switch (v) {
      case 0:
        // v0→v1: introduce formatVersion (stamped below); no structural change.
        out = { ...out }
        break
      default:
        // No step registered for this version — unmigratable (refuse, never
        // guess a transformation).
        return null
    }
    v += 1
  }
  out.formatVersion = to
  return out
}

/**
 * SYS-28 read path (eng 13 loader order: validate → migrate → hand off to
 * the engine, which re-links IDs + integrity-checks on its own parse).
 *
 * Outcomes:
 *   ok              → content for `openDocJson` (post-migration)
 *   corrupt         → not JSON / not an object → SYS-02 shows its open-fail
 *                     toast (H06 CASE A/B — state unchanged)
 *   newer-version   → formatVersion > CURRENT → REFUSE (H10 §6), the file is
 *                     from a newer app; never partially loaded
 */
export function prepareForLoad(raw: string): LoadOutcome {
  const doc = parseObject(raw)
  if (!doc) {
    return { ok: false, reason: 'corrupt', detail: 'not a JSON project object' }
  }
  const fvRaw = doc.formatVersion
  const from =
    typeof fvRaw === 'number' && Number.isInteger(fvRaw) && fvRaw >= 0 ? fvRaw : fvRaw === undefined ? 0 : -1
  if (from === -1) {
    return { ok: false, reason: 'corrupt', detail: 'formatVersion is not a non-negative integer' }
  }
  if (from > CURRENT_FORMAT_VERSION) {
    return {
      ok: false,
      reason: 'newer-version',
      detail: `file formatVersion ${from} > supported ${CURRENT_FORMAT_VERSION} — created by a newer Kineora`,
    }
  }
  if (from === CURRENT_FORMAT_VERSION) {
    return { ok: true, content: raw, fromVersion: from, migrated: false }
  }
  const migrated = migrate(from, CURRENT_FORMAT_VERSION, doc)
  if (!migrated) {
    return { ok: false, reason: 'corrupt', detail: `no migration path ${from} → ${CURRENT_FORMAT_VERSION}` }
  }
  return { ok: true, content: JSON.stringify(migrated), fromVersion: from, migrated: true }
}

/**
 * FNV-1a 64-bit checksum (hex) — corruption detection for the `.autosave`
 * envelope (H10 §10: checksum mismatch → refuse/skip; missing checksum ≠
 * mismatch). Deterministic across sessions; not cryptographic (corruption
 * detection only, per eng 13's rollback purpose).
 */
export function checksumHex(content: string): string {
  const PRIME = 0x100000001b3n
  const MOD = 0xffffffffffffffffn
  let h = 0xcbf29ce484222325n
  for (let i = 0; i < content.length; i++) {
    h ^= BigInt(content.charCodeAt(i))
    h = (h * PRIME) & MOD
  }
  return h.toString(16).padStart(16, '0')
}
