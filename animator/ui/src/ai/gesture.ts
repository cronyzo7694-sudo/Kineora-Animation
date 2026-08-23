// Honest Stage occupancy for A5 APPLY. Stage sets this while a pointer
// gesture is live; the orchestrator never guesses from hover or tool id.

let active = false

export function setGestureActive(next: boolean): void {
  active = next
}

export function isGestureActive(): boolean {
  return active
}
