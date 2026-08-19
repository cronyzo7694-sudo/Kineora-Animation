# F-03-01 — B. UI LOCATION · C. CONTROLS · G. OPTION MATRIX

---

## B. EXACT UI LOCATION

Hit testing is **implicit** — it has no dedicated panel. It is invoked whenever the Selection tool is active and the pointer is over the Stage. The *controlling* surfaces are:

```
Application
 └─ Tools panel
     └─ Selection tool (V)                ← the tool whose clicks/marquees resolve hits
 └─ Edit > Preferences (Win) / Animate > Preferences (Mac)   [Ctrl+U / Cmd+U]
     └─ General category
         └─ "Contact-Sensitive Selection and Lasso tools"  ← checkbox (E9)
 └─ Timeline
     └─ Layer rows (eye / padlock)         ← visibility & lock participate in exclusion (E7)
     └─ Frame cells (click)                ← selects that layer's content between keyframes (E8)
 └─ Stage
     └─ (pointer position)                 ← the hit-test input itself
```

- **9. Main location:** Stage (the pointer resolves against stage content).
- **10. Menu path:** none for hit testing itself (Edit > Select All is a related bulk action).
- **11. Toolbar path:** Tools panel → Selection tool.
- **12. Panel path:** none (contact-sensitivity lives in Preferences, not a panel).
- **13. Context-menu path:** none (hit testing is not a menu command).
- **14. Keyboard shortcut:** `V` activates the tool; `Ctrl/Cmd+A` bulk-select; `Shift` = add-to-selection modifier.
- **15. Workspace dependency:** none (works in any workspace).
- **16. Visibility conditions:** active whenever the Selection tool is the current tool (or temporarily while `V`/`Ctrl`-held from another tool — see D.45).
- **17. Disabled conditions:** not disabled as a tool; individual targets are unreachable when their layer is locked/hidden (see E-state matrix).
- **18. Context-sensitive conditions:** the *result* of a hit depends on the object type at that point (fill vs stroke vs group vs instance — F matrix), the contact-sensitivity preference, and the stacking order.

---

## C. EVERY CONTROL (controls that alter hit-testing behavior)

### C.1 Contact-Sensitive Selection (checkbox)

| # | Field | Value |
|---|---|---|
| 19. Name | Contact-Sensitive Selection and Lasso tools |
| 20. Purpose | Decide whether a marquee must **fully enclose** an object (drawing objects) or merely **touch** it to select it. |
| 21. Icon concept | (checkbox — no icon) |
| 22. Label | "Contact-Sensitive Selection and Lasso tools" |
| 23. Tooltip | (none documented) |
| 24. Default value | **ON** (checked) in current Animate [INFERENCE from docs phrasing "To select partially enclosed objects… select Contact-Sensitive"; Animate historically defaults ON] |
| 25. Allowed values | boolean (checked / unchecked) |
| 26–28. Min/Max/Step | n/a |
| 29. Enabled state | always enabled |
| 30. Disabled state | never disabled |
| 31–34. Hover/Active/Selected/Pressed | standard checkbox states; no special behavior |
| 35. Error state | none |
| 36. Visibility rules | Preferences dialog → General, always visible |

**Effect matrix (E9):**
| State | Marquee (Pointer/Subselection) | Lasso |
|---|---|---|
| ON (checked) | selects objects **partially enclosed/touched** | selects partially covered objects |
| OFF (unchecked) | selects **only fully enclosed** objects | selects only fully enclosed objects |
| (always) | anchor **points** that lie **inside** the area are selected regardless | same |

**Scope note:** the official text ties this to **Object Drawing mode** objects (E9). Raw merge shapes **always** behave "contact-sensitively" — a marquee selects the intersected **region** of a raw shape (E13); the preference does **not** change raw-shape region selection. *[INFERENCE + COMMUNITY REPORT — see 04_limits_edges.md L.1]*

### C.2 Shift modifier (add-to-selection)

- 19. Name: Shift (keyboard modifier) — not a button.
- 20. Purpose: add to (or toggle within) the existing selection during click or marquee (E6).
- 24. Default: n/a (modifier). 25. Allowed: held/not held.
- 36. Visibility: always available (desktop). Mobile: replaced by "Select mode" (see 06_mobile file).

### C.3 Layer visibility / lock (per-layer eye & padlock)

- Not hit-testing "controls" per se, but **exclusion inputs**: locked/hidden layers are skipped by hit tests and Select All (E7). Detailed in F-03-15 (Locked & hidden) — referenced here for completeness.

---

## G. OPTION MATRIX

| Option | Default | ON/enabled behavior | OFF/disabled behavior | Dependencies | Conflicts | Interaction with other options | Limitations | Edge cases |
|---|---|---|---|---|---|---|---|---|
| Contact-Sensitive Selection | ON | marquee selects touched objects | marquee selects only enclosed objects | Object Drawing mode objects | none | Subselection/Lasso share it (E9) | does not affect raw-shape region selection (L.1) | a huge marquee with OFF selects nothing if objects straddle the edge |
| Shift-add | (held) | click/marquee adds; click-on-selected removes | replaces selection | none | none | works with lasso + subselection too | — | Shift+marquee over mixed raw shapes merges regions |
| Layer visible | ON (per layer) | layer participates in hits | layer skipped entirely (invisible + unselectable) | layer state | — | affects Select All (E7) | — | hidden layer content still exports if "export hidden" on (Part 20) |
| Layer locked | OFF (per layer) | layer is **rendered** but **not hit-testable** | — | layer state | — | Select All skips locked (E7) | — | locked symbols still show but can't be accidentally moved |

*(Per-object-type support lives in the F matrix, 03_compatibility.md.)*
