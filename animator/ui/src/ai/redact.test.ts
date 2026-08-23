import { afterEach, describe, expect, it } from 'vitest'
import {
  clearSecretRegistry,
  redactErrorMessage,
  redactText,
  registerSecret,
  unregisterSecret,
} from './redact'

afterEach(() => {
  clearSecretRegistry()
})

describe('redact — provider key shapes', () => {
  it('masks OpenAI legacy + project keys', () => {
    expect(redactText('key: sk-AbCdEfGhIjKlMnOp1234 done')).toBe('key: [REDACTED] done')
    expect(redactText('key: sk-proj-Zz9y8x7W6v5U4t3S2r1Q done')).toBe('key: [REDACTED] done')
  })

  it('masks Anthropic keys', () => {
    expect(redactText('x: sk-ant-api03-aabbccddeeff0011 y')).toBe('x: [REDACTED] y')
  })

  it('masks Gemini keys', () => {
    expect(redactText('g: AIzaSyD4iE2xqvl5L0CZ7yQmGkEwZx8A y')).toBe('g: [REDACTED] y')
  })

  it('masks Bearer tokens but keeps the scheme', () => {
    expect(redactText('authorization: Bearer abcdef1234567890')).toBe(
      'authorization: Bearer [REDACTED]',
    )
  })

  it('masks header transports in JSON-ish error text', () => {
    expect(redactText('{"x-api-key":"abcdef1234567890"}')).toBe('{"x-api-key":"[REDACTED]"}')
    expect(redactText('x-goog-api-key: abcdef1234567890')).toBe('x-goog-api-key: [REDACTED]')
  })

  it('masks query transports', () => {
    expect(redactText('https://x/v1?key=AIzaSyD4iE2xqvl5L0CZ&n=1')).toBe(
      'https://x/v1?key=[REDACTED]&n=1',
    )
  })

  it('masks multiple occurrences', () => {
    const out = redactText('sk-aaaaaaaaaaaaaaaa and sk-aaaaaaaaaaaaaaaa')
    expect(out).toBe('[REDACTED] and [REDACTED]')
  })

  it('leaves innocent text untouched', () => {
    expect(redactText('draw rect at frame 12, fill #ff0000')).toBe(
      'draw rect at frame 12, fill #ff0000',
    )
  })
})

describe('redact — exact-value registry', () => {
  it('masks a registered key even when its shape is non-standard', () => {
    registerSecret('my-local-host-key-00998877')
    expect(redactText('failed with my-local-host-key-00998877 here')).toBe(
      'failed with [REDACTED] here',
    )
  })

  it('refuses to register short values (would corrupt normal text)', () => {
    registerSecret('short')
    expect(redactText('a short note')).toBe('a short note')
  })

  it('unregister keeps masking for a second referrer (refcount)', () => {
    registerSecret('deadbeefcafe001122')
    registerSecret('deadbeefcafe001122')
    unregisterSecret('deadbeefcafe001122')
    expect(redactText('x deadbeefcafe001122 y')).toBe('x [REDACTED] y')
    unregisterSecret('deadbeefcafe001122')
    // Shape is not a known pattern; without the registry it passes through.
    expect(redactText('x deadbeefcafe001122 y')).toBe('x deadbeefcafe001122 y')
  })

  it('extraSecrets win ad-hoc', () => {
    expect(redactText('leak: customtoken-11223344', ['customtoken-11223344'])).toBe(
      'leak: [REDACTED]',
    )
  })
})

describe('redactErrorMessage', () => {
  it('handles Error objects', () => {
    expect(redactErrorMessage(new Error('auth failed for sk-aaaaaaaaaaaaaaaa'))).toBe(
      'auth failed for [REDACTED]',
    )
  })

  it('handles strings and plain objects without throwing', () => {
    expect(redactErrorMessage('plain sk-bbbbbbbbbbbbbbbb')).toBe('plain [REDACTED]')
    expect(redactErrorMessage({ code: 1 })).toBe('{"code":1}')
    expect(redactErrorMessage(undefined)).toBe('undefined')
  })
})
