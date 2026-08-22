# HANDOFFS

> One file per SYS handoff. When a SYS package is READY FOR AI-02 and the human has issued PASS + "AI-02 HANDOFF = AUTHORIZED", create `HANDOFFS/SYS-XX_<name>.md` here with:

1. The SYS package file paths (spec + reconciliation).
2. The 7 required reading references (MASTER_EXECUTION_PLAN, CROSS_SYSTEM_CONTRACT, AI_ASSIGNMENTS, DECISIONS, BLOCKERS, AI01_FORENSIC_LESSONS, + the package).
3. The canonical command/event/state registries for that SYS.
4. The open ambiguities (should be ZERO before handoff) + resolved decisions used.
5. The acceptance matrix (automated + manual).
6. The implementation-evidence gaps (code vs spec) the implementation AI must NOT silently resolve.

**Status convention:** a handoff file may exist ONLY when `SYS-XX READY FOR AI-02 = YES` has been explicitly authorized by the human reviewer. No handoff file → AI-02 blocked.

*(Currently empty — no SYS is yet authorized for AI-02.)*
