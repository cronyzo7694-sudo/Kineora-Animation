// Authentication hook point (desktop task §8).
//
// DEVELOPMENT ONLY — a temporary local identity so the app opens directly into
// the editor with no login block. A real authentication system will be
// supplied later and must replace this module WITHOUT rewriting the editor:
// the editor only ever consumes the `Identity` struct returned by
// `current_identity()`.
//
// Explicitly NOT implemented here (and never faked):
//   • no user database      • no credential collection
//   • no credentials sent   • no production auth claim

use serde::Serialize;

#[derive(Serialize, Clone)]
pub struct Identity {
    pub id: String,
    pub display_name: String,
    /// Always true for the development identity — surfaced (and labeled
    /// DEVELOPMENT ONLY) in the Dev panel; invisible in normal UI.
    pub dev_only: bool,
}

/// Replaceable identity-provider boundary. A future real provider implements
/// this trait (e.g. an offline local profile or an account service).
pub trait IdentityProvider: Send + Sync {
    fn current(&self) -> Identity;
}

/// The temporary development identity.
pub struct DevelopmentIdentity;

impl IdentityProvider for DevelopmentIdentity {
    fn current(&self) -> Identity {
        Identity {
            id: "developer".into(),
            display_name: "Developer (local)".into(),
            dev_only: true,
        }
    }
}

pub fn current_identity() -> Identity {
    DevelopmentIdentity.current()
}
