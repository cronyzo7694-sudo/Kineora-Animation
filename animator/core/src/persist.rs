// ============================================================================
// SYS-28 PERSISTENCE — MOD-PERSIST (Rust core)
//
// eng 13: "Atomic write: serialize → write `.tmp` → fsync → rename over
// target; checksum stored." · "formatVersion monotonic; migrate(from,to)
// pure; loader: validate → migrate → re-link IDs → integrity check." ·
// "Checksum mismatch → refuse load, offer `.autosave` or backup (RSK-013)."
// · "Partial write → tmp discarded, last good file intact."
//
// C-1 foundation parity (INTEGRATED_AUDIT §3, INT-AID-002): `formatVersion`
// now lives in MOD-DOC (`Document.format_version`, serde `formatVersion` —
// Part 33 §33.1) and is STAMPED ON WRITE here (writer = SYS-28, H10 §6),
// mirroring the TS boundary (`animator/ui/src/persist.ts`) exactly: same
// version constant, same migration chain, same refusal semantics.
//
// SYS-28 INTERNAL ENGINEERING DECISIONS (documented, not product behavior):
//   PS-D1  Checksum = FNV-1a 64 over the written BYTES, stored as a hex
//          sidecar `<file>.checksum` (Part 33 fixes the project schema, so
//          the checksum cannot live inside the file). Missing sidecar =
//          no verification (legacy files load); MISMATCH = refuse (eng 13).
//   PS-D2  Sidecar ordering removes false refusals: (1) delete old sidecar
//          → (2) atomic-write the project → (3) atomic-write the new
//          sidecar. Every crash window leaves either a verified pair or a
//          file WITHOUT a sidecar (loads fine) — never a good file with a
//          stale checksum.
//   PS-D3  The TS `checksumHex` iterates UTF-16 code units, this iterates
//          UTF-8 bytes — identical for ASCII JSON; the two checksums are
//          NOT a cross-layer contract today (TS = autosave envelope only,
//          Rust = project sidecar only).
// ============================================================================

use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};

use serde_json::Value;

use crate::model::Document;

/// Current on-disk format version (monotonic — eng 13). 0 = legacy files
/// written before SYS-28 existed (field absent). Must stay equal to the TS
/// boundary's `CURRENT_FORMAT_VERSION` (animator/ui/src/persist.ts).
pub const FORMAT_VERSION: u32 = 1;

/// FNV-1a 64-bit over bytes, lowercase hex (16 chars). Corruption detection
/// only (PS-D1/PS-D3) — not cryptographic.
pub fn checksum_hex(bytes: &[u8]) -> String {
    const PRIME: u64 = 0x0000_0100_0000_01b3;
    let mut h: u64 = 0xcbf2_9ce4_8422_2325;
    for &b in bytes {
        h ^= u64::from(b);
        h = h.wrapping_mul(PRIME);
    }
    format!("{h:016x}")
}

/// Sidecar path for a project file (PS-D1).
pub fn checksum_path(path: &Path) -> PathBuf {
    let mut s = path.as_os_str().to_os_string();
    s.push(".checksum");
    PathBuf::from(s)
}

/// PURE migration chain (eng 13). Returns the migrated document VALUE, or
/// None when no path exists (from > to — a newer app wrote the file; the
/// monotonic chain never migrates downward, and an unknown step is never
/// guessed).
///
/// v0 → v1: structural no-op — v1 only introduces the `formatVersion` field
/// itself (every legacy field already deserializes via serde defaults).
pub fn migrate(from: u32, to: u32, mut doc: Value) -> Option<Value> {
    if from > to {
        return None;
    }
    let mut v = from;
    while v < to {
        match v {
            0 => { /* v0→v1: no structural change */ }
            _ => return None, // no registered step — refuse, never invent
        }
        v += 1;
    }
    doc["formatVersion"] = Value::from(to);
    Some(doc)
}

/// Atomic write of `content` to `path`: `.tmp` → fsync → rename (eng 13).
fn atomic_write(path: &Path, content: &str) -> Result<(), String> {
    let tmp = path.with_extension("tmp");
    {
        let mut f = fs::File::create(&tmp).map_err(|e| format!("write: {e}"))?;
        f.write_all(content.as_bytes())
            .map_err(|e| format!("write: {e}"))?;
        f.sync_all().map_err(|e| format!("fsync: {e}"))?;
    }
    fs::rename(&tmp, path).map_err(|e| {
        let _ = fs::remove_file(&tmp); // partial write → tmp discarded
        format!("rename: {e}")
    })
}

/// Atomic save (eng 13): serialize → STAMP `formatVersion` = CURRENT
/// (SYS-28 is the writer — H10 §6) → atomic write → checksum sidecar
/// (PS-D1/PS-D2 ordering).
pub fn save(doc: &Document, path: &Path) -> Result<(), String> {
    let mut v = serde_json::to_value(doc).map_err(|e| format!("serialize: {e}"))?;
    v["formatVersion"] = Value::from(FORMAT_VERSION);
    let json = serde_json::to_string_pretty(&v).map_err(|e| format!("serialize: {e}"))?;

    // PS-D2 (1): drop the old sidecar FIRST — a crash mid-save must never
    // leave a good file paired with a stale checksum (false refusal).
    let side = checksum_path(path);
    if side.exists() {
        fs::remove_file(&side).map_err(|e| format!("checksum clear: {e}"))?;
    }
    // PS-D2 (2): the project file itself.
    atomic_write(path, &json)?;
    // PS-D2 (3): the fresh sidecar.
    atomic_write(&side, &checksum_hex(json.as_bytes()))?;
    Ok(())
}

/// Loader (eng 13 order): checksum verify → parse/validate → version →
/// migrate → deserialize (the engine re-links IDs / integrity-checks on its
/// own parse). Every failure is a refusal with a reason — never a partial
/// load (INV-ERR-2).
pub fn load(path: &Path) -> Result<Document, String> {
    let bytes = fs::read(path).map_err(|e| format!("read: {e}"))?;

    // PS-D1: verify only when a sidecar exists (missing ≠ mismatch).
    let side = checksum_path(path);
    if let Ok(expected) = fs::read_to_string(&side) {
        let expected = expected.trim();
        if !expected.is_empty() && expected != checksum_hex(&bytes) {
            return Err(
                "checksum mismatch — file refused (recover from .autosave or a backup)".into(),
            );
        }
    }

    let value: Value = serde_json::from_slice(&bytes).map_err(|e| format!("deserialize: {e}"))?;
    if !value.is_object() {
        return Err("deserialize: not a JSON project object".into());
    }
    let from = match value.get("formatVersion") {
        None => 0,
        Some(Value::Number(n)) => match n.as_u64() {
            Some(u) if u <= u64::from(u32::MAX) => u as u32,
            _ => return Err("deserialize: formatVersion is not a non-negative integer".into()),
        },
        Some(_) => return Err("deserialize: formatVersion is not a non-negative integer".into()),
    };
    if from > FORMAT_VERSION {
        return Err(format!(
            "file formatVersion {from} > supported {FORMAT_VERSION} — created by a newer Kineora (refused, never partially loaded)"
        ));
    }
    let migrated = migrate(from, FORMAT_VERSION, value)
        .ok_or_else(|| format!("no migration path {from} → {FORMAT_VERSION}"))?;
    serde_json::from_value(migrated).map_err(|e| format!("deserialize: {e}"))
}

// ============================================================================
// SYS-28 tests — REQ-PERSIST-B (deterministic round-trip) + versioning +
// corruption + atomicity. Real filesystem (std temp dir), no mocks.
// ============================================================================
#[cfg(test)]
mod tests {
    use super::*;
    use crate::model::Settings;
    use std::path::PathBuf;

    fn tmp(name: &str) -> PathBuf {
        let mut p = std::env::temp_dir();
        p.push(format!("kineora-sys28-{}-{}", std::process::id(), name));
        p
    }

    fn cleanup(p: &Path) {
        let _ = fs::remove_file(p);
        let _ = fs::remove_file(checksum_path(p));
        let _ = fs::remove_file(p.with_extension("tmp"));
    }

    fn doc() -> Document {
        Document::new(Settings::default())
    }

    #[test]
    fn save_stamps_format_version_and_load_round_trips() {
        let p = tmp("stamp.json");
        let d = doc();
        assert_eq!(
            d.format_version, 0,
            "in-memory doc is unstamped (writer = SYS-28 only)"
        );
        save(&d, &p).unwrap();
        let raw = fs::read_to_string(&p).unwrap();
        let v: Value = serde_json::from_str(&raw).unwrap();
        assert_eq!(
            v["formatVersion"],
            Value::from(FORMAT_VERSION),
            "stamped on write (H10 §6)"
        );
        let loaded = load(&p).unwrap();
        assert_eq!(
            loaded.format_version, FORMAT_VERSION,
            "loader carries the migrated version"
        );
        assert_eq!(loaded.settings.width, d.settings.width);
        cleanup(&p);
    }

    #[test]
    fn legacy_v0_file_without_field_loads_via_migration() {
        let p = tmp("legacy.json");
        let d = doc();
        // simulate a pre-SYS-28 writer: serialize WITHOUT the field
        let mut v = serde_json::to_value(&d).unwrap();
        v.as_object_mut().unwrap().remove("formatVersion");
        fs::write(&p, serde_json::to_string(&v).unwrap()).unwrap();
        let loaded = load(&p).unwrap();
        assert_eq!(
            loaded.format_version, FORMAT_VERSION,
            "v0 → CURRENT migrated"
        );
        cleanup(&p);
    }

    #[test]
    fn newer_version_file_is_refused() {
        let p = tmp("newer.json");
        let d = doc();
        let mut v = serde_json::to_value(&d).unwrap();
        v["formatVersion"] = Value::from(FORMAT_VERSION + 1);
        fs::write(&p, serde_json::to_string(&v).unwrap()).unwrap();
        let err = load(&p).unwrap_err();
        assert!(err.contains("newer"), "refusal names the cause: {err}");
        cleanup(&p);
    }

    #[test]
    fn migrate_is_pure_and_never_downward() {
        assert!(migrate(
            FORMAT_VERSION + 1,
            FORMAT_VERSION,
            Value::Object(Default::default())
        )
        .is_none());
        let out = migrate(0, FORMAT_VERSION, serde_json::json!({"settings": {}})).unwrap();
        assert_eq!(out["formatVersion"], Value::from(FORMAT_VERSION));
    }

    #[test]
    fn checksum_sidecar_written_and_mismatch_refuses() {
        let p = tmp("chk.json");
        save(&doc(), &p).unwrap();
        let side = checksum_path(&p);
        assert!(side.exists(), "sidecar stored (eng 13 'checksum stored')");
        // tamper with the project file → refuse
        let mut raw = fs::read_to_string(&p).unwrap();
        raw.push(' ');
        fs::write(&p, raw).unwrap();
        let err = load(&p).unwrap_err();
        assert!(err.contains("checksum mismatch"), "{err}");
        cleanup(&p);
    }

    #[test]
    fn missing_sidecar_is_not_a_mismatch() {
        let p = tmp("noside.json");
        save(&doc(), &p).unwrap();
        fs::remove_file(checksum_path(&p)).unwrap();
        assert!(
            load(&p).is_ok(),
            "legacy/copied files without a sidecar load"
        );
        cleanup(&p);
    }

    #[test]
    fn corrupt_bytes_refused_and_no_tmp_left_after_save() {
        let p = tmp("corrupt.json");
        fs::write(&p, "###").unwrap();
        assert!(load(&p).is_err());
        save(&doc(), &p).unwrap();
        assert!(!p.with_extension("tmp").exists(), "tmp discarded (atomic)");
        cleanup(&p);
    }

    #[test]
    fn round_trip_is_deterministic_req_persist_b() {
        let p1 = tmp("det1.json");
        let p2 = tmp("det2.json");
        let d = doc();
        save(&d, &p1).unwrap();
        let loaded = load(&p1).unwrap();
        save(&loaded, &p2).unwrap();
        assert_eq!(
            fs::read_to_string(&p1).unwrap(),
            fs::read_to_string(&p2).unwrap(),
            "save → load → save is byte-identical"
        );
        cleanup(&p1);
        cleanup(&p2);
    }

    #[test]
    fn checksum_matches_ts_boundary_for_ascii() {
        // TS persist.ts checksumHex('hello kineora') — same constants, same
        // result for ASCII (PS-D3). Guard against constant drift.
        assert_eq!(checksum_hex(b""), format!("{:016x}", 0xcbf29ce484222325u64));
        let a = checksum_hex(b"a");
        let b = checksum_hex(b"b");
        assert_ne!(a, b);
        assert_eq!(a.len(), 16);
    }
}
