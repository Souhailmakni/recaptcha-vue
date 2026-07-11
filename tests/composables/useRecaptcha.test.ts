import { describe, it, expect } from 'vitest'
import { useRecaptcha } from '../../src/composables/useRecaptcha'

describe('useRecaptcha', () => {
  it('starts with an empty token and unverified state', () => {
    const { token, isVerified } = useRecaptcha()

    expect(token.value).toBe('')
    expect(isVerified.value).toBe(false)
  })

  it('onVerify stores the token and marks as verified', () => {
    const { token, isVerified, onVerify } = useRecaptcha()

    onVerify('test-token')

    expect(token.value).toBe('test-token')
    expect(isVerified.value).toBe(true)
  })

  it('onExpire clears the token and verification state', () => {
    const { token, isVerified, onVerify, onExpire } = useRecaptcha()

    onVerify('test-token')
    onExpire()

    expect(token.value).toBe('')
    expect(isVerified.value).toBe(false)
  })

  it('onError clears the token and verification state', () => {
    const { token, isVerified, onVerify, onError } = useRecaptcha()

    onVerify('test-token')
    onError()

    expect(token.value).toBe('')
    expect(isVerified.value).toBe(false)
  })

  it('reset clears the token and verification state', () => {
    const { token, isVerified, onVerify, reset } = useRecaptcha()

    onVerify('test-token')
    reset()

    expect(token.value).toBe('')
    expect(isVerified.value).toBe(false)
  })

  it('returns independent state across multiple calls', () => {
    const first = useRecaptcha()
    const second = useRecaptcha()

    first.onVerify('first-token')

    expect(first.token.value).toBe('first-token')
    expect(second.token.value).toBe('')
  })
})
