/** Shared display-row helper for the unified timeline (U-1, U-5, U-6).
 *  ONE copy — LayersPanel and TimelineStrip must not fork this. */

export interface LayerLike {
  id: number
  parent_id?: number
  collapsed?: boolean
}

/** True when any ancestor folder is collapsed (row must hide). */
export function ancestorCollapsed<T extends LayerLike>(layers: T[], layer: T): boolean {
  let pid = layer.parent_id ?? 0
  const seen = new Set<number>()
  while (pid > 0 && !seen.has(pid)) {
    seen.add(pid)
    const p = layers.find((x) => x.id === pid)
    if (!p) break
    if (p.collapsed) return true
    pid = p.parent_id ?? 0
  }
  return false
}

/** Front-at-top display rows, collapsed descendants removed (U-1 / U-5 / U-6). */
export function displayRows<T extends LayerLike>(layers: T[]): Array<T & { engineIndex: number }> {
  return layers
    .map((l, i) => ({ ...l, engineIndex: i }))
    .reverse()
    .filter((l) => !ancestorCollapsed(layers, l))
}
