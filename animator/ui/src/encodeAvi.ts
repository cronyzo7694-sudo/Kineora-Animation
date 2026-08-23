/** Motion-JPEG AVI muxer — real playable video, no MediaRecorder. */

function u8(n: number): Uint8Array {
  return new Uint8Array([n & 255])
}

function u16(n: number): Uint8Array {
  const b = new Uint8Array(2)
  new DataView(b.buffer).setUint16(0, n >>> 0, true)
  return b
}

function u32(n: number): Uint8Array {
  const b = new Uint8Array(4)
  new DataView(b.buffer).setUint32(0, n >>> 0, true)
  return b
}

function fourcc(s: string): Uint8Array {
  const b = new Uint8Array(4)
  for (let i = 0; i < 4; i++) b[i] = s.charCodeAt(i) || 32
  return b
}

function concat(parts: Uint8Array[]): Uint8Array {
  let n = 0
  for (const p of parts) n += p.length
  const out = new Uint8Array(n)
  let o = 0
  for (const p of parts) {
    out.set(p, o)
    o += p.length
  }
  return out
}

function chunk(id: string, data: Uint8Array): Uint8Array {
  const pad = data.length & 1 ? u8(0) : new Uint8Array(0)
  return concat([fourcc(id), u32(data.length), data, pad])
}

function list(type: string, data: Uint8Array): Uint8Array {
  return chunk('LIST', concat([fourcc(type), data]))
}

export function encodeMjpegAvi(jpegs: Uint8Array[], width: number, height: number, fps: number): Uint8Array {
  if (jpegs.length === 0) throw new Error('no frames')
  const rate = Math.max(1, Math.min(120, Math.round(fps) || 24))
  const usec = Math.max(1, Math.round(1_000_000 / rate))
  const w = Math.max(1, width | 0)
  const h = Math.max(1, height | 0)
  const n = jpegs.length

  const avih = concat([
    u32(usec),
    u32(w * h * 3 * rate),
    u32(0),
    u32(0x00000010),
    u32(n),
    u32(0),
    u32(1),
    u32(0),
    u32(w),
    u32(h),
    u32(0),
    u32(0),
    u32(0),
    u32(0),
  ])

  const strh = concat([
    fourcc('vids'),
    fourcc('MJPG'),
    u32(0),
    u16(0),
    u16(0),
    u32(0),
    u32(1),
    u32(rate),
    u32(0),
    u32(n),
    u32(0),
    u32(0xffffffff),
    u32(0),
    u16(0),
    u16(0),
    u16(w),
    u16(h),
  ])

  const strf = concat([
    u32(40),
    u32(w),
    u32(h),
    u16(1),
    u16(24),
    fourcc('MJPG'),
    u32(w * h * 3),
    u32(0),
    u32(0),
    u32(0),
    u32(0),
  ])

  const hdrl = list('hdrl', concat([chunk('avih', avih), list('strl', concat([chunk('strh', strh), chunk('strf', strf)]))]))

  const moviParts: Uint8Array[] = [fourcc('movi')]
  const indexParts: Uint8Array[] = []
  let offset = 4
  for (const jpg of jpegs) {
    const rec = chunk('00dc', jpg)
    moviParts.push(rec)
    indexParts.push(concat([fourcc('00dc'), u32(0x00000010), u32(offset), u32(jpg.length)]))
    offset += rec.length
  }
  const moviData = concat(moviParts)
  const movi = chunk('LIST', moviData)
  const idx1 = chunk('idx1', concat(indexParts))
  const riffBody = concat([fourcc('AVI '), hdrl, movi, idx1])
  return concat([fourcc('RIFF'), u32(riffBody.length), riffBody])
}

export function canvasToJpeg(canvas: HTMLCanvasElement, quality = 0.92): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const fail = () => reject(new Error('jpeg encode failed'))
    if (typeof canvas.toBlob === 'function') {
      canvas.toBlob(
        (blob) => {
          if (!blob) return fail()
          void blob.arrayBuffer().then((ab) => resolve(new Uint8Array(ab)), fail)
        },
        'image/jpeg',
        quality,
      )
      return
    }
    try {
      const url = canvas.toDataURL('image/jpeg', quality)
      const comma = url.indexOf(',')
      const bin = atob(comma >= 0 ? url.slice(comma + 1) : url)
      const out = new Uint8Array(bin.length)
      for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
      resolve(out)
    } catch {
      fail()
    }
  })
}
