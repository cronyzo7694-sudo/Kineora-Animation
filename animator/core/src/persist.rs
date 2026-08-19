use std::path::Path;

use crate::model::Document;

/// Atomic save: write tmp → rename (crash-safe, REQ-PERSIST). JSON via serde.
pub fn save(doc: &Document, path: &Path) -> Result<(), String> {
    let json = serde_json::to_string_pretty(doc).map_err(|e| format!("serialize: {e}"))?;
    let tmp = path.with_extension("tmp");
    std::fs::write(&tmp, json).map_err(|e| format!("write: {e}"))?;
    std::fs::rename(&tmp, path).map_err(|e| format!("rename: {e}"))?;
    Ok(())
}

pub fn load(path: &Path) -> Result<Document, String> {
    let bytes = std::fs::read(path).map_err(|e| format!("read: {e}"))?;
    serde_json::from_slice(&bytes).map_err(|e| format!("deserialize: {e}"))
}
