import { useEffect, useRef, useState } from 'react'
import { library, projectJson, setNodeProps, statusJson, swapInstance } from '../engine/client'
import {
  editableColorHits,
  editableSymbolHits,
  findColors,
  findSymbols,
  normalizeHex,
  unsupportedTargetReason,
  type ColorScope,
  type FindReplaceDoc,
  type FindTarget,
} from '../findReplace'
import { useFocusTrap } from './useFocusTrap'

interface Props {
  open: boolean
  onClose: () => void
  notify: (msg: string) => void
}

export function FindReplaceDialog({ open, onClose, notify }: Props) {
  const panel = useRef<HTMLDivElement>(null)
  useFocusTrap(open, panel)
  const [target, setTarget] = useState<FindTarget>('color')
  const [find, setFind] = useState('#ff0000')
  const [replace, setReplace] = useState('#00ff00')
  const [scope, setScope] = useState<ColorScope>('document')
  const [fills, setFills] = useState(true)
  const [strokes, setStrokes] = useState(true)
  const [findSym, setFindSym] = useState(0)
  const [replSym, setReplSym] = useState(0)
  const [log, setLog] = useState('Find and Replace — H03 (5 Blueprint targets)')

  useEffect(() => {
    if (!open) return
    const lib = library()
    if (lib[0]) setFindSym((s) => s || lib[0].id)
    if (lib[1]) setReplSym((s) => s || lib[1].id)
    else if (lib[0]) setReplSym((s) => s || lib[0].id)
  }, [open])

  if (!open) return null

  const parseDoc = (): FindReplaceDoc => {
    try {
      return JSON.parse(projectJson() || '{}') as FindReplaceDoc
    } catch {
      return {}
    }
  }

  const runFind = () => {
    const blocked = unsupportedTargetReason(target)
    if (blocked) {
      setLog(`0 matches — ${blocked}`)
      notify('0 matches')
      return
    }
    const doc = parseDoc()
    const st = statusJson()
    if (target === 'color') {
      const hits = findColors(doc, find, {
        scope,
        sceneIndex: 0,
        selection: st?.selection ?? [],
        fills,
        strokes,
      })
      const edit = editableColorHits(hits)
      setLog(
        hits.length === 0
          ? '0 matches'
          : `${hits.length} match(es) (${edit.length} editable; ${hits.length - edit.length} locked/hidden skipped)`,
      )
      if (hits.length === 0) notify('0 matches')
      return
    }
    const hits = findSymbols(doc, findSym)
    const edit = editableSymbolHits(hits)
    setLog(
      hits.length === 0
        ? '0 matches'
        : `${hits.length} instance(s) (${edit.length} editable; ${hits.length - edit.length} locked/hidden skipped)`,
    )
    if (hits.length === 0) notify('0 matches')
  }

  const applyColor = (all: boolean) => {
    const doc = parseDoc()
    const st = statusJson()
    const hits = editableColorHits(
      findColors(doc, find, {
        scope,
        sceneIndex: 0,
        selection: st?.selection ?? [],
        fills,
        strokes,
      }),
    )
    if (hits.length === 0) {
      setLog('0 matches')
      notify('0 matches')
      return
    }
    const to = normalizeHex(replace)
    const slice = all ? hits : hits.slice(0, 1)
    const byId = new Map<number, { fill?: string; stroke?: string }>()
    for (const h of slice) {
      const cur = byId.get(h.nodeId) ?? {}
      if (h.channel === 'fill') cur.fill = to
      else cur.stroke = to
      byId.set(h.nodeId, cur)
    }
    setNodeProps([...byId.entries()].map(([id, p]) => ({ id, ...p })))
    const msg = all ? `replace-all: ${slice.length} color(s) (one undo)` : `replace: 1 color`
    setLog(msg)
    notify(msg)
  }

  const applySymbol = (all: boolean) => {
    if (findSym === replSym) {
      setLog('replace: same symbol — no-op')
      return
    }
    const hits = editableSymbolHits(findSymbols(parseDoc(), findSym))
    if (hits.length === 0) {
      setLog('0 matches')
      notify('0 matches')
      return
    }
    const slice = all ? hits : hits.slice(0, 1)
    let n = 0
    for (const h of slice) {
      if (swapInstance(h.nodeId, replSym)) n += 1
    }
    const msg = all
      ? `replace-all: ${n} instance(s) (${n} undo steps — batch journal not in engine)`
      : `replace: ${n} instance`
    setLog(msg)
    notify(msg)
  }

  const apply = (all: boolean) => {
    const blocked = unsupportedTargetReason(target)
    if (blocked) {
      setLog(`0 matches — ${blocked}`)
      notify('0 matches')
      return
    }
    if (target === 'color') applyColor(all)
    else applySymbol(all)
  }

  const lib = library()

  return (
    <div data-testid="find-replace-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onMouseDown={onClose}>
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label="Find and Replace"
        data-testid="find-replace-dialog"
        onMouseDown={(e) => e.stopPropagation()}
        style={{ width: 420, background: '#1e1e1e', border: '1px solid #444', borderRadius: 8, padding: 16, color: '#ddd', fontSize: 13 }}
      >
        <div style={{ fontWeight: 700, marginBottom: 12 }}>Find and Replace</div>
        <label style={{ display: 'block', marginBottom: 8 }}>
          For
          <select data-testid="fr-target" value={target} onChange={(e) => setTarget(e.target.value as FindTarget)} style={sel}>
            <option value="color">Color</option>
            <option value="symbol">Symbol</option>
            <option value="text">Text</option>
            <option value="font">Font</option>
            <option value="sound">Sound</option>
          </select>
        </label>

        {target === 'color' && (
          <>
            <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
              <label>
                Find <input data-testid="fr-find-color" type="color" value={normalizeHex(find).slice(0, 7)} onChange={(e) => setFind(e.target.value)} />
              </label>
              <label>
                Replace <input data-testid="fr-repl-color" type="color" value={normalizeHex(replace).slice(0, 7)} onChange={(e) => setReplace(e.target.value)} />
              </label>
            </div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
              <label><input type="checkbox" checked={fills} onChange={(e) => setFills(e.target.checked)} /> Fills</label>
              <label><input type="checkbox" checked={strokes} onChange={(e) => setStrokes(e.target.checked)} /> Strokes</label>
            </div>
            <label style={{ display: 'block', marginBottom: 8 }}>
              Scope
              <select data-testid="fr-scope" value={scope} onChange={(e) => setScope(e.target.value as ColorScope)} style={sel}>
                <option value="document">Document</option>
                <option value="scene">Scene</option>
                <option value="selection">Selection</option>
              </select>
            </label>
          </>
        )}

        {target === 'symbol' && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
            <label>
              Find
              <select data-testid="fr-find-sym" value={findSym} onChange={(e) => setFindSym(Number(e.target.value))} style={sel}>
                {lib.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </label>
            <label>
              Replace
              <select data-testid="fr-repl-sym" value={replSym} onChange={(e) => setReplSym(Number(e.target.value))} style={sel}>
                {lib.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </label>
          </div>
        )}

        {(target === 'text' || target === 'font' || target === 'sound') && (
          <p data-testid="fr-unsupported" style={{ color: '#e88' }}>{unsupportedTargetReason(target)}</p>
        )}

        <div data-testid="fr-log" style={{ minHeight: 28, color: '#8ec8ff', margin: '8px 0' }}>{log}</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button data-testid="fr-find" type="button" onClick={runFind} style={btn}>Find All</button>
          <button data-testid="fr-replace" type="button" onClick={() => apply(false)} style={btn}>Replace</button>
          <button data-testid="fr-replace-all" type="button" onClick={() => apply(true)} style={btn}>Replace All</button>
          <button data-testid="fr-cancel" type="button" onClick={onClose} style={btn}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

const sel: React.CSSProperties = { marginLeft: 8, background: '#111', color: '#eee', border: '1px solid #555', borderRadius: 4, padding: '2px 6px' }
const btn: React.CSSProperties = { padding: '4px 10px', borderRadius: 4, border: '1px solid #555', background: '#2a2a2a', color: '#eee', cursor: 'pointer' }
