import { describe, expect, it } from 'vitest'
import { createInteractionStore } from './interaction'
import { visibleConversationHistory } from './conversationView'
import type { PromptConversationTurn } from './prompt'
import type { ValidatedPlan } from './validate'

function plan(): ValidatedPlan {
  return {
    actions: [],
    expected: [],
    report: 'plan',
    requiresConfirmation: false,
    massDestructive: null,
    budget: { actions: 0, estimatedMutations: 0 },
    validatedAt: {
      docRevision: 1,
      sceneIndex: 0,
      activeLayer: 0,
      playhead: 1,
      selection: [],
      layers: [],
      capabilityEngine: 'kineora-core',
    },
  }
}

describe('A6.8 visible bounded conversation history', () => {
  it('preserves chronological user/assistant history and enforces 12 turns defensively', () => {
    const turns: PromptConversationTurn[] = Array.from({ length: 15 }, (_, index) => ({
      role: index % 2 ? 'assistant' : 'user',
      content: `turn-${index}`,
    }))
    const state = createInteractionStore().get(1)
    expect(visibleConversationHistory(turns, state).map((turn) => turn.content)).toEqual(
      Array.from({ length: 12 }, (_, index) => `turn-${index + 3}`),
    )
  })

  it('removes the current completed ASK exchange because interaction cards render it', () => {
    const interactions = createInteractionStore()
    interactions.begin(1, 'current request')
    interactions.addCard(1, { kind: 'assistant-message', text: 'current answer' })
    interactions.transition(1, 'completed')
    const turns: PromptConversationTurn[] = [
      { role: 'user', content: 'old request' },
      { role: 'assistant', content: 'old answer' },
      { role: 'user', content: 'current request' },
      { role: 'assistant', content: 'current answer' },
    ]
    expect(visibleConversationHistory(turns, interactions.get(1))).toEqual(turns.slice(0, 2))
  })

  it('removes current PREVIEW request and compact plan summary exactly once', () => {
    const interactions = createInteractionStore()
    interactions.begin(1, 'make oval')
    interactions.transition(1, 'awaitingApproval')
    interactions.addCard(1, { kind: 'plan', plan: plan() })
    const turns: PromptConversationTurn[] = [
      { role: 'user', content: 'hello' },
      { role: 'assistant', content: 'hi' },
      { role: 'user', content: 'make oval' },
      { role: 'assistant', content: 'Plan ready: plan (0 actions).' },
    ]
    expect(visibleConversationHistory(turns, interactions.get(1))).toEqual(turns.slice(0, 2))
  })

  it('does not hide an older identical request while the repeated request is still generating', () => {
    const interactions = createInteractionStore()
    interactions.begin(1, 'repeat')
    const turns: PromptConversationTurn[] = [
      { role: 'user', content: 'repeat' },
      { role: 'assistant', content: 'old answer' },
    ]
    expect(visibleConversationHistory(turns, interactions.get(1))).toEqual(turns)
  })

  it('removes only the newest matching current lifecycle and preserves earlier repetition', () => {
    const interactions = createInteractionStore()
    interactions.begin(1, 'repeat')
    interactions.addCard(1, { kind: 'assistant-message', text: 'new answer' })
    interactions.transition(1, 'completed')
    const turns: PromptConversationTurn[] = [
      { role: 'user', content: 'repeat' },
      { role: 'assistant', content: 'old answer' },
      { role: 'user', content: 'repeat' },
      { role: 'assistant', content: 'new answer' },
    ]
    expect(visibleConversationHistory(turns, interactions.get(1))).toEqual(turns.slice(0, 2))
  })

  it('returns immutable defensive turn views', () => {
    const history = visibleConversationHistory([{ role: 'user', content: 'safe' }], createInteractionStore().get(1))
    expect(Object.isFrozen(history)).toBe(true)
    expect(Object.isFrozen(history[0])).toBe(true)
    expect(() => (history as PromptConversationTurn[]).push({ role: 'user', content: 'x' })).toThrow()
  })
})
