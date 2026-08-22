# 11 — WISH W1 (CEL / DRAWING REUSE) + WHAT IS LEFT IN THIS PACK

```
PHASE:     RESEARCH ONLY
AUTHORITY: Blueprint 15.5 [WISH W1] · F-15-06
```

---

## 1. W1 in one page

Animate F6 = **independent copy**. Community wants **shared cels** (edit once → all exposures update).

Blueprint 15.5 adds Library `drawing` assets + `drawingId` on frames.

| Need | Code |
|---|---|
| Library drawings | **no** `Node`/asset type (only Rect + SymbolInstance) |
| Frame.drawingId | **no** — Frame is Keyframe{content ids} \| Blank |
| Shortcut D expose | **no** |

**Blocked on MOD-DOC.** Same class as BLK-D-006 (import needs asset entities).

**First 2D ship: F6 stays independent copy.** Do **not** start W1 in the timeline unify or onion increment.

When W1 is authorized: new Node/asset + SYS-18 library rows + SYS-15 frame field — **INT required**. Not this pack’s coding packet.

---

## 2. Pack completeness checklist

| Slice | File | Status this campaign |
|---|---|---|
| Goal / 2D scope | 01 | DONE |
| Adobe timeline page | 02 | DONE |
| Current split | 03 | DONE |
| Unify contract | 04 | DONE |
| Control matrix | 05 | DONE |
| Gaps / AMBs | 06 | DONE (updated conceptually by 08–10) |
| Unify coding packet | 07 | DONE |
| Onion | 08 | DONE this continue |
| EMF | 09 | DONE — **blocked AMB-TL-020** |
| Exposure / fps / ×2 | 10 | DONE — **AMB-TL-005 closed** |
| W1 cel | 11 | DONE — **out of first ship** |
| Camera on timeline | — | **not this pack** (SYS-25) |
| Properties panel | — | separate (`PROPERTIES_SYSTEM_FORENSIC_RESEARCH.md`) |
| Tools (brush/fill) | — | `TOOLS_SYSTEM_FORENSIC_RESEARCH.md` |
| Export | — | `EXPORT_FORENSIC_RESEARCH.md` |

**Timeline + Layers research for “2D animation kaafi” is now enough to code:**

1. Engine guards B-1…B-5  
2. Unify UI  
3. Time readout  
4. (After) Onion P1  

EMF / W1 / camera / onion-exclude / hold-N stay later.

---

## 3. AMB register (full, this pack)

| ID | Topic | State |
|---|---|---|
| AMB-TL-001 | Active-layer-only view | OPEN — do not build |
| AMB-TL-002 | Actual fps meter | OPEN — do not build |
| AMB-TL-003 | Row height S/M/T | OPEN — keep 22 |
| AMB-TL-004 | Pin color underline | OPEN — do not build |
| **AMB-TL-005** | Scale spans on fps | **RESOLVED** — frames invariant (eng 07) |
| AMB-TL-006 | Bake keys on 1s/2s | OPEN — do not build |
| AMB-TL-007 | Alt+Shift page hop | OPEN — do not bind |
| AMB-TL-008 | Custom toolbar | OPEN — fixed header |
| AMB-TL-009 | Loop in/out range | OPEN — whole-doc loop |
| AMB-TL-010 | Window ▸ Layers after unify | OPEN — keep LayersPanel |
| AMB-TL-011 | Folder grid visual | OPEN — dim or empty OK |
| AMB-TL-012 | Default nameW | rec. 200 |
| AMB-TL-014 | Onion start opacity | rec. 0.5 |
| AMB-TL-015 | Onion decrease-by | rec. 0.2 |
| AMB-TL-016 | Onion tint hex | rec. #ff6666 / #66cc66 |
| AMB-TL-017 | Onion while playing | keep on |
| AMB-TL-018 | Onion all vs active layer | default ALL |
| AMB-TL-019 | Present-frame tint | no |
| **AMB-TL-020** | EMF write semantics (a–f) | **OPEN — blocks EMF** |
| AMB-TL-021 | Expand-span numeric N | OPEN — do not build |
| AMB-TL-022 | Frame 1 = 0s or 1/fps | rec. 0s = (f-1)/fps |
| AMB-L1…L5 | LAYER research | unchanged |

---

## 4. Recommended next **human** message

Pick one:

- **`code start` / `code likho`** → Increment 0 (B-1…B-5 guards) then Increment 1 (unify). Research pack is the contract.  
- **`age badao`** again → only leftover deep-dives (camera-on-timeline, Properties-vs-timeline selection, or EMF if you answer 020a–f).  
- Answer **AMB-TL-010** (Layers menu) and **AMB-TL-020** if you want those in the first code wave.

Do not ask for more Adobe paste on onion/speed — the page + Part 15 + F-15 are exhausted.
