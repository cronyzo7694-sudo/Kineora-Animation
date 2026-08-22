// ============================================================================
// MOD-WORKSPACE — workspace save/switch/reset + panel visibility & collapse
// persistence (SYS-01 §7, §15, §18). A workspace = panel layout + visibility +
// collapse state (D-4: panel layout only — shortcuts/menus have own editors).
// Persisted to APP PREFS (localStorage), NEVER into document data.
//
// Corruption contract (C-02 / §20): corrupt prefs → auto-reset to defaults and
// report; a saved workspace referencing an unknown panel is skipped, not fatal.
// ============================================================================

import { DEFAULT_LAYOUT, clampLayout, type PanelLayout } from './panelLayout'

export const WORKSPACE_PREFS_KEY = 'kineora.workspace'
export const DEFAULT_WORKSPACE_NAME = 'Essentials'

export const PANEL_IDS = ['tools', 'layers', 'properties', 'library', 'timeline', 'debug'] as const
export type PanelId = (typeof PANEL_IDS)[number]

export const DEFAULT_VISIBILITY: Record<string, boolean> = {
  tools: true,
  layers: false, // U-G7: unified timeline is the one list; Window ▸ Layers still toggles the dock
  properties: true,
  library: true,
  timeline: true,
  debug: true,
}

export const DEFAULT_COLLAPSED: Record<string, boolean> = {
  tools: false,
  layers: false,
  properties: false,
  library: false,
  timeline: false,
  debug: false,
}

export interface WorkspaceSnapshot {
  layout: PanelLayout
  visibility: Record<string, boolean>
  collapsed: Record<string, boolean>
}

export interface WorkspacePrefs {
  active: string
  workspaces: Record<string, WorkspaceSnapshot>
}

export function defaultSnapshot(): WorkspaceSnapshot {
  return {
    layout: { ...DEFAULT_LAYOUT },
    visibility: { ...DEFAULT_VISIBILITY },
    collapsed: { ...DEFAULT_COLLAPSED },
  }
}

export interface LoadedPrefs {
  prefs: WorkspacePrefs
  /** True when the stored prefs were corrupt and defaults were substituted. */
  corrupt: boolean
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function sanitizeVisibility(raw: unknown): Record<string, boolean> {
  const out: Record<string, boolean> = { ...DEFAULT_VISIBILITY }
  if (isRecord(raw)) {
    for (const id of PANEL_IDS) {
      if (typeof raw[id] === 'boolean') out[id] = raw[id]
    }
  }
  return out
}

function sanitizeCollapsed(raw: unknown): Record<string, boolean> {
  const out: Record<string, boolean> = { ...DEFAULT_COLLAPSED }
  if (isRecord(raw)) {
    for (const id of PANEL_IDS) {
      if (typeof raw[id] === 'boolean') out[id] = raw[id]
    }
  }
  return out
}

function sanitizeLayout(raw: unknown): PanelLayout {
  if (isRecord(raw)) {
    const num = (k: string) => (typeof raw[k] === 'number' ? (raw[k] as number) : DEFAULT_LAYOUT[k as keyof PanelLayout])
    try {
      return clampLayout({ layersW: num('layersW'), propsW: num('propsW'), timelineH: num('timelineH'), libraryH: num('libraryH'), debugH: num('debugH') })
    } catch {
      /* fall through to default */
    }
  }
  return { ...DEFAULT_LAYOUT }
}

function sanitizeSnapshot(raw: unknown): WorkspaceSnapshot {
  if (isRecord(raw)) {
    return {
      layout: sanitizeLayout(raw.layout),
      visibility: sanitizeVisibility(raw.visibility),
      collapsed: sanitizeCollapsed(raw.collapsed),
    }
  }
  return defaultSnapshot()
}

/** Load workspace prefs; corrupt storage → defaults + `corrupt: true`. */
export function loadWorkspacePrefs(): LoadedPrefs {
  try {
    const raw = localStorage.getItem(WORKSPACE_PREFS_KEY)
    if (!raw) return { prefs: emptyPrefs(), corrupt: false }
    const parsed = JSON.parse(raw) as unknown
    if (!isRecord(parsed)) return { prefs: emptyPrefs(), corrupt: true }
    const active = typeof parsed.active === 'string' && parsed.active ? parsed.active : DEFAULT_WORKSPACE_NAME
    const workspaces: Record<string, WorkspaceSnapshot> = {}
    if (isRecord(parsed.workspaces)) {
      for (const [name, snap] of Object.entries(parsed.workspaces)) {
        workspaces[name] = sanitizeSnapshot(snap)
      }
    }
    // A missing active workspace (deleted externally) falls back to default.
    if (!workspaces[active]) workspaces[active] = defaultSnapshot()
    return { prefs: { active, workspaces }, corrupt: false }
  } catch {
    return { prefs: emptyPrefs(), corrupt: true }
  }
}

function emptyPrefs(): WorkspacePrefs {
  return { active: DEFAULT_WORKSPACE_NAME, workspaces: { [DEFAULT_WORKSPACE_NAME]: defaultSnapshot() } }
}

/** Persist a snapshot under `name` and make it the active workspace. */
export function saveWorkspaceSnapshot(name: string, snapshot: WorkspaceSnapshot): void {
  const { prefs } = loadWorkspacePrefs()
  const clean = name.trim() || DEFAULT_WORKSPACE_NAME
  prefs.workspaces[clean] = {
    layout: sanitizeLayout(snapshot.layout),
    visibility: sanitizeVisibility(snapshot.visibility),
    collapsed: sanitizeCollapsed(snapshot.collapsed),
  }
  prefs.active = clean
  try {
    localStorage.setItem(WORKSPACE_PREFS_KEY, JSON.stringify(prefs))
  } catch {
    /* storage unavailable → session-only */
  }
}

/** True when a workspace with `name` already exists (duplicate-name guard). */
export function workspaceExists(name: string): boolean {
  const { prefs } = loadWorkspacePrefs()
  return name.trim() in prefs.workspaces
}

/** All saved workspace names (for the switcher + Window ▸ Workspaces list). */
export function listWorkspaceNames(): string[] {
  const { prefs } = loadWorkspacePrefs()
  return Object.keys(prefs.workspaces)
}

/** Load a named workspace's snapshot (null when absent). */
export function loadWorkspaceSnapshot(name: string): WorkspaceSnapshot | null {
  const { prefs } = loadWorkspacePrefs()
  const snap = prefs.workspaces[name.trim()]
  return snap ? sanitizeSnapshot(snap) : null
}

/** Reset Workspace (C-06 §D): clear prefs and return to the default layout. */
export function resetWorkspacePrefs(): void {
  try {
    localStorage.removeItem(WORKSPACE_PREFS_KEY)
  } catch {
    /* ignore */
  }
}
