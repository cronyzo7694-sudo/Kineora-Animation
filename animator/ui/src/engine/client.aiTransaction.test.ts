import { beforeEach, describe, expect, it, vi } from 'vitest'
import { bus } from '../bus'
import {
  __attachEngineForTest,
  aiExecuteTransaction,
  hasAiTransactionFacade,
} from './client'
import type { StatusJson } from './wasmTypes'

function status(selection: number[]): StatusJson {
  return {
    playhead: 1,
    selection,
    selection_details: [],
    selection_rects: [],
    undo_len: 0,
    redo_len: 0,
    scene: 'Scene 1',
    layer: 'Layer 1',
    fps: 24,
    doc_width: 800,
    doc_height: 600,
    background: '#ffffff',
    duration: 1,
    clipboard_len: 0,
    event_log: [],
    layers: [],
    active_layer: 0,
  }
}

let restore = () => {}

beforeEach(() => {
  restore()
  restore = () => {}
})

describe('client A5 atomic transaction facade', () => {
  it('probes separately from the A3 seams', () => {
    restore = __attachEngineForTest({ kineora_ai_execute_transaction: () => '{}' }, () => status([]))
    expect(hasAiTransactionFacade()).toBe(true)
    restore()
    restore = __attachEngineForTest({}, () => status([]))
    expect(hasAiTransactionFacade()).toBe(false)
  })

  it('emits one document event plus final selection after successful mutation', () => {
    let selection = [1]
    restore = __attachEngineForTest({
      kineora_ai_execute_transaction: () => {
        selection = [2]
        return JSON.stringify({
          ok: true,
          outcome: 'applied',
          rolledBack: false,
          mutationCount: 3,
          actions: [],
          bindings: [],
        })
      },
    }, () => status(selection))
    const emit = vi.spyOn(bus, 'emit')
    const result = aiExecuteTransaction('{"actions":[]}', 'AI — test')
    expect(result?.ok).toBe(true)
    expect(emit.mock.calls.map(([name]) => name)).toEqual(['document:changed', 'selection:changed'])
    expect(emit.mock.calls[0]).toEqual(['document:changed', { type: 'ai:transaction', targets: [] }])
    expect(emit.mock.calls[1]?.[1]).toEqual(expect.objectContaining({ prevTargets: [1], targets: [2] }))
  })

  it('failure/rollback emits no mutation event and malformed engine JSON fails honestly', () => {
    restore = __attachEngineForTest({
      kineora_ai_execute_transaction: () => JSON.stringify({
        ok: false,
        outcome: 'rolled-back',
        rolledBack: true,
        mutationCount: 0,
        actions: [],
        bindings: [],
        error: { code: 'E_STATE', stage: 8, message: 'stale' },
      }),
    }, () => status([1]))
    const emit = vi.spyOn(bus, 'emit')
    expect(aiExecuteTransaction('{}', 'AI — fail')).toMatchObject({ ok: false, rolledBack: true })
    expect(emit).not.toHaveBeenCalled()

    restore()
    restore = __attachEngineForTest({ kineora_ai_execute_transaction: () => 'not json' }, () => status([]))
    expect(aiExecuteTransaction('{}', 'AI — malformed')).toMatchObject({
      ok: false,
      error: { code: 'E_UNKNOWN' },
    })
  })
})
