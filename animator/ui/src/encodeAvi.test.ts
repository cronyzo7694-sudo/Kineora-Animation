import { describe, expect, it } from 'vitest'
import { encodeMjpegAvi } from './encodeAvi'

function jpegStub(n: number): Uint8Array {
  const b = new Uint8Array(n)
  b[0] = 0xff
  b[1] = 0xd8
  b[n - 2] = 0xff
  b[n - 1] = 0xd9
  return b
}

describe('encodeMjpegAvi', () => {
  it('writes a RIFF AVI with one video stream and idx1', () => {
    const frames = [jpegStub(64), jpegStub(80), jpegStub(48)]
    const avi = encodeMjpegAvi(frames, 320, 180, 24)
    const ascii = new TextDecoder().decode(avi.subarray(0, 12))
    expect(ascii.startsWith('RIFF')).toBe(true)
    expect(new TextDecoder().decode(avi.subarray(8, 12))).toBe('AVI ')
    const all = new TextDecoder().decode(avi)
    expect(all.includes('hdrl')).toBe(true)
    expect(all.includes('MJPG')).toBe(true)
    expect(all.includes('movi')).toBe(true)
    expect(all.includes('idx1')).toBe(true)
    expect(avi.length).toBeGreaterThan(200)
  })

  it('refuses an empty frame list', () => {
    expect(() => encodeMjpegAvi([], 8, 8, 12)).toThrow(/no frames/)
  })
})
