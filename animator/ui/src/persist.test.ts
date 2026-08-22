// SYS-28 MOD-PERSIST boundary tests — formatVersion (P-9), pure migration,
// refusal paths, checksum. Pure unit tests: no engine, no platform.
import { describe, expect, it } from 'vitest'

import { CURRENT_FORMAT_VERSION, checksumHex, migrate, prepareForLoad, stampFormatVersion } from './persist'

const LEGACY = '{"settings":{"width":1920.0},"scenes":[],"nodes":{},"next_id":1}'

describe('SYS-28 persist — formatVersion stamp (write path, H10 §6)', () => {
  it('stamps formatVersion = CURRENT on a legacy document', () => {
    const out = stampFormatVersion(LEGACY)
    expect(out).not.toBeNull()
    const doc = JSON.parse(out!)
    expect(doc.formatVersion).toBe(CURRENT_FORMAT_VERSION)
    expect(doc.settings.width).toBe(1920) // content untouched
  })

  it('is idempotent — an already-stamped document is re-stamped, not duplicated', () => {
    const once = stampFormatVersion(LEGACY)!
    const twice = stampFormatVersion(once)!
    expect(JSON.parse(twice)).toEqual(JSON.parse(once))
  })

  it('refuses non-object JSON (nothing to write — INV-ERR-1 surfaced upstream)', () => {
    expect(stampFormatVersion('not json')).toBeNull()
    expect(stampFormatVersion('[1,2]')).toBeNull()
    expect(stampFormatVersion('42')).toBeNull()
  })
})

describe('SYS-28 persist — migrate(from,to) is pure and monotonic (eng 13)', () => {
  it('migrates v0 → v1 without structural change', () => {
    const doc = JSON.parse(LEGACY)
    const out = migrate(0, 1, doc)
    expect(out).not.toBeNull()
    expect(out!.formatVersion).toBe(1)
    expect((out as { settings: { width: number } }).settings.width).toBe(1920)
  })

  it('never migrates downward (from > to = no path)', () => {
    expect(migrate(2, 1, {})).toBeNull()
  })

  it('does not mutate its input (pure)', () => {
    const doc = JSON.parse(LEGACY) as Record<string, unknown>
    migrate(0, 1, doc)
    expect(doc.formatVersion).toBeUndefined()
  })
})

describe('SYS-28 persist — prepareForLoad (read path: validate → migrate)', () => {
  it('passes a current-version file through unchanged', () => {
    const stamped = stampFormatVersion(LEGACY)!
    const r = prepareForLoad(stamped)
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.content).toBe(stamped)
      expect(r.fromVersion).toBe(CURRENT_FORMAT_VERSION)
      expect(r.migrated).toBe(false)
    }
  })

  it('migrates a legacy (pre-SYS-28, no formatVersion) file to CURRENT', () => {
    const r = prepareForLoad(LEGACY)
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.fromVersion).toBe(0)
      expect(r.migrated).toBe(true)
      expect(JSON.parse(r.content).formatVersion).toBe(CURRENT_FORMAT_VERSION)
    }
  })

  it('REFUSES a newer-version file (unmigratable → refuse, H10 §6)', () => {
    const doc = JSON.parse(LEGACY)
    doc.formatVersion = CURRENT_FORMAT_VERSION + 1
    const r = prepareForLoad(JSON.stringify(doc))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toBe('newer-version')
  })

  it('REFUSES corrupt bytes and a corrupt formatVersion field', () => {
    expect(prepareForLoad('###').ok).toBe(false)
    expect(prepareForLoad('[]').ok).toBe(false)
    const bad = JSON.parse(LEGACY)
    bad.formatVersion = 'abc'
    const r = prepareForLoad(JSON.stringify(bad))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toBe('corrupt')
  })

  it('round-trips deterministically (REQ-PERSIST-B at the boundary): stamp → load → stamp is stable', () => {
    const first = stampFormatVersion(LEGACY)!
    const loaded = prepareForLoad(first)
    expect(loaded.ok).toBe(true)
    if (loaded.ok) {
      const second = stampFormatVersion(loaded.content)!
      expect(second).toBe(first)
    }
  })
})

describe('SYS-28 persist — checksum (autosave envelope integrity, H10 §10)', () => {
  it('is deterministic and 16 hex chars', () => {
    const a = checksumHex('hello kineora')
    expect(a).toBe(checksumHex('hello kineora'))
    expect(a).toMatch(/^[0-9a-f]{16}$/)
  })

  it('changes when the content changes', () => {
    expect(checksumHex('a')).not.toBe(checksumHex('b'))
    expect(checksumHex('')).not.toBe(checksumHex(' '))
  })
})
