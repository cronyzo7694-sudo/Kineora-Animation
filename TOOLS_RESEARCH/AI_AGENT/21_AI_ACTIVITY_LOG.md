# 21 — AI ACTIVITY LOG ("AI ne abhi kya kya kiya?")

## Data model (conceptual)

```
AiTransaction {
  id · docId · at (timestamp) · requestText (user msg, trimmed)
  label ("AI — red ball bounce" = composite undo label, 09)
  mode · provider/model · tokens {in,out}
  actions: [{ seq, action, targetSummary, paramsSummary, before→after values, status }]
  verification: { verdict, rows:[{expectation,result,evidence}] } | null
  outcome: applied | rolled-back(reason) | rejected(stage,code) | cancelled
  entityBindings: [{alias, id}]     // feeds reference resolution (15) & memory (19)
  undoStackDepthBefore              // enables the 'revert' affordance below
}
```

Session-only store (MVP); redaction-filtered (12) — no keys, no file paths, no full prompts.

## Display

- **Inline in chat:** each transaction = collapsible card group (header: label + outcome chip + time; expand → action rows with before→after, then verification rows).
- **Dedicated "AI activity" tab** (list across the session, filter by outcome).
- **Row rendering:** icon per action family, one-line human text ("Fill ball → #e11d48", "Keyframe @15 ball y=820") — generated from validated params, NOT the model's prose.
- **Timestamps + duration; provider/model + token chips on the group.**

## User controls

- **Undo this transaction** button — enabled only while the composite is at/near stack-reachable depth (if the user has since done 3 human edits, honest tooltip: "3 newer edits pehle undo honge" — we never reorder history, 09).
- **Retry** (rebuilds the same request fresh) / **Revert** = undo affordance / **Copy report** (support/debug text, redacted).
- Failed/rolled-back groups stay visible (muted red) — hiding AI failures is a trust bug.

## Why it matters (research rationale)

Creative-tool AI studies (and the reference UX pass in 10) converge on the same trust equation: *visibility of action + one-step reversibility ≥ raw capability*. The log also powers three other subsystems cheaply: entity bindings (15), conversation memory summaries (19), and the support story for "AI ne mera project kharab kar diya" reports — we can always answer EXACTLY what it did.
