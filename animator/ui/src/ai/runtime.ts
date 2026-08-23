// A6.6 production composition root. One instance is owned by App so settings,
// orchestration, context, activity, usage and panel rendering share the SAME
// stores across close/reopen and active-document switches.

import { activeDocId, aiCapabilities, aiDocRevision, undo } from '../engine/client'
import { createAdapters, type ProviderAdapter } from './adapters'
import { createDailyTokenCeilingStore, type DailyTokenCeilingStore } from './budget'
import { buildCapabilityRegistry, parseEngineManifest, type CapabilityRegistry } from './capabilities'
import { createConversationContextStore, type ConversationContextStore } from './context'
import { createInteractionStore, type InteractionStore } from './interaction'
import { createKeyVault, type KeyVault, type StorageLike } from './keys'
import { AiOrchestrator } from './orchestrator'
import { createProviderStore, hasConsent, type ProviderStore, type ProviderType } from './providers'
import { createUsageMeter, type UsageMeter } from './usage'
import { hasShapeDrawFacade } from '../engine/client'

export interface AiRuntime {
  storage?: StorageLike
  providerStore: ProviderStore
  keyVault: KeyVault
  adapters: Record<ProviderType, ProviderAdapter>
  usage: UsageMeter
  ceiling: DailyTokenCeilingStore
  context: ConversationContextStore
  interaction: InteractionStore
  orchestrator: AiOrchestrator
  hasConsent(): boolean
  capabilityRegistry(): CapabilityRegistry | null
  activeDocumentId(): number | null
  currentRevision(): number | null
  disposeDocument(documentId: number): boolean
  undo(): boolean
}

function browserStorage(): StorageLike | undefined {
  return typeof localStorage === 'undefined' ? undefined : (localStorage as StorageLike)
}

export function createAiRuntime(storage: StorageLike | undefined = browserStorage()): AiRuntime {
  const providerStore = createProviderStore(storage)
  const keyVault = createKeyVault(storage)
  const adapters = createAdapters()
  const usage = createUsageMeter(storage)
  const ceiling = createDailyTokenCeilingStore(storage)
  const context = createConversationContextStore()
  const interaction = createInteractionStore()
  const consent = () => hasConsent(storage)
  const active = () => {
    const id = activeDocId()
    return id > 0 ? id : null
  }
  const revision = () => aiDocRevision()
  const capabilityRegistry = (): CapabilityRegistry | null => {
    const raw = aiCapabilities()
    if (!raw) return null
    try {
      return buildCapabilityRegistry(parseEngineManifest(raw), {
        hasShapeDraw: hasShapeDrawFacade(),
      })
    } catch {
      return null
    }
  }
  const orchestrator = new AiOrchestrator({
    providerStore,
    keyVault,
    hasConsent: consent,
    usage,
    ceiling,
    context,
    interaction,
    adapters,
    currentDocumentId: active,
    // No pointer heuristic. Until Stage supplies onGestureActiveChange, idle
    // is the honest default (missing callback used to block every APPLY).
    isGestureActive: () => false,
  })
  return {
    storage,
    providerStore,
    keyVault,
    adapters,
    usage,
    ceiling,
    context,
    interaction,
    orchestrator,
    hasConsent: consent,
    capabilityRegistry,
    activeDocumentId: active,
    currentRevision: revision,
    disposeDocument: (documentId) => orchestrator.disposeDocument(documentId),
    undo,
  }
}
