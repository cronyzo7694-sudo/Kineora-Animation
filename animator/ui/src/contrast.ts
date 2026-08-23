/** Relative luminance 0..1 (sRGB). */
export function luminance(hex: string): number {
  const c = hex.trim()
  let r = 0
  let g = 0
  let b = 0
  if (/^#([0-9a-f]{3})$/i.test(c)) {
    r = parseInt(c[1] + c[1], 16)
    g = parseInt(c[2] + c[2], 16)
    b = parseInt(c[3] + c[3], 16)
  } else if (/^#([0-9a-f]{6})$/i.test(c)) {
    r = parseInt(c.slice(1, 3), 16)
    g = parseInt(c.slice(3, 5), 16)
    b = parseInt(c.slice(5, 7), 16)
  } else {
    return 0.5
  }
  const lin = (v: number) => {
    const x = v / 255
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

/** True when two colors are too close to tell apart (e.g. white on white). */
export function tooClose(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false
  return Math.abs(luminance(a) - luminance(b)) < 0.18
}

/**
 * Pick a fill that stays readable on `bg`. White text on a white stage
 * (default Adobe fill + default document bg) becomes ink-black.
 */
export function contrastOn(preferred: string | null | undefined, bg = '#ffffff', dark = '#111111', light = '#f4f4f4'): string {
  const want = preferred && preferred.length > 0 ? preferred : dark
  if (tooClose(want, bg)) return luminance(bg) > 0.5 ? dark : light
  return want
}
