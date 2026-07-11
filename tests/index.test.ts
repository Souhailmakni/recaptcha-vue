import { describe, it, expect, vi } from 'vitest'
import RecaptchaPlugin, { VueRecaptcha } from '../src/index'

describe('RecaptchaPlugin', () => {
  it('registers VueRecaptcha as a global component when installed', () => {
    const component = vi.fn()
    const app = { component } as any

    RecaptchaPlugin.install(app)

    expect(component).toHaveBeenCalledWith('VueRecaptcha', VueRecaptcha)
  })
})
