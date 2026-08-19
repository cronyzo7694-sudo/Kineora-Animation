# Manual Test Reports — Kineora Animation

Protocol §11 format. One entry per manual test run on the Linux PC.

## Template
```
TEST-ID:   MT-001
Feature:   <e.g. Selection / WASM bridge>
Environment: <distro, desktop shell, commit>
Steps:     1. … 2. …
Expected:  <per step>
Actual:    <observed>
Result:    PASS | FAIL
Bug-ID:    <if FAIL>
Notes:     <screenshot/video path if any>
```

## Log
<!-- newest first -->

## Automated suites (latest)
| Suite | Command | Passed/Failed | Env |
|---|---|---|---|
| Rust core | `cargo test` (animator/core) | — | GitHub CI / Linux PC |
| Rust lint | `cargo fmt --check && clippy` | — | GitHub CI |
| WASM build | `cargo build --target wasm32-unknown-unknown` | — | GitHub CI |
| UI | `npm test` (animator/ui) | — | GitHub CI |
| UI build | `npm run build` | — | GitHub CI |
