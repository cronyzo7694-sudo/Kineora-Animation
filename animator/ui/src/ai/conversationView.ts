// A6.8 phase 1 — derive visible history from the authoritative A6.2 window
// without creating a second memory store. Current interaction cards remain the
// source for the in-progress/latest request and are removed from history once.

import type { InteractionSnapshot } from './interaction'
import { MAX_CONVERSATION_TURNS, type PromptConversationTurn } from './prompt'

export function visibleConversationHistory(
  turns: readonly Readonly<PromptConversationTurn>[],
  interaction: InteractionSnapshot,
): readonly Readonly<PromptConversationTurn>[] {
  const bounded = turns.slice(-MAX_CONVERSATION_TURNS)
  const currentUser = interaction.cards.find((card) => card.kind === 'user-message')
  if (currentUser?.kind !== 'user-message') {
    return Object.freeze(bounded.map((turn) => Object.freeze({ ...turn })))
  }

  // A6.3 appends the current request to context only after a provider response
  // has produced an assistant answer or a validated plan. Before that point a
  // repeated request may legitimately match an older turn and must stay visible.
  const currentMaterialized = interaction.cards.some((card) =>
    card.kind === 'assistant-message' ||
    card.kind === 'plan' ||
    card.kind === 'activity' ||
    card.kind === 'verification' ||
    card.kind === 'result',
  )
  if (!currentMaterialized) {
    return Object.freeze(bounded.map((turn) => Object.freeze({ ...turn })))
  }

  let currentIndex = -1
  for (let index = bounded.length - 1; index >= 0; index -= 1) {
    const turn = bounded[index]
    if (turn?.role === 'user' && turn.content === currentUser.text) {
      currentIndex = index
      break
    }
  }
  const history = currentIndex >= 0 ? bounded.slice(0, currentIndex) : bounded
  return Object.freeze(history.map((turn) => Object.freeze({ ...turn })))
}
