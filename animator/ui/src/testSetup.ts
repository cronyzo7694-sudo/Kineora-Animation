import '@testing-library/jest-dom'

// jsdom lacks ResizeObserver + a real 2D canvas context. Provide minimal stubs
// so the Stage renderer mounts in tests (real drawing is covered by the pure
// geometry tests + the user's browser manual test).
class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
;(globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = ResizeObserverStub

interface CtxStub {
  setTransform: () => void
  clearRect: () => void
  fillRect: () => void
  strokeRect: () => void
  setLineDash: () => void
  beginPath: () => void
  moveTo: () => void
  lineTo: () => void
  closePath: () => void
  stroke: () => void
  fill: () => void
  arc: () => void
  save: () => void
  restore: () => void
  translate: () => void
  rotate: () => void
  fillStyle: string
  strokeStyle: string
  lineWidth: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(HTMLCanvasElement.prototype as any).getContext = function getContext(): CtxStub | null {
  return {
    setTransform: () => {},
    clearRect: () => {},
    fillRect: () => {},
    strokeRect: () => {},
    setLineDash: () => {},
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    closePath: () => {},
    stroke: () => {},
    fill: () => {},
    arc: () => {},
    save: () => {},
    restore: () => {},
    translate: () => {},
    rotate: () => {},
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
  }
}
