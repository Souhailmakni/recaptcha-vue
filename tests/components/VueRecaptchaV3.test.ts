import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import VueRecaptcha from '../../src/components/VueRecaptcha.vue'

function mockV3(token = 'v3-token') {
  const execute = vi.fn((_sitekey: string, opts: { action: string }) => {
    ;(window as any).__lastAction = opts.action
    return Promise.resolve(token)
  })
  ;(window as any).grecaptcha = {
    ready: (cb: () => void) => cb(),
    execute,
    render: vi.fn(),
    reset: vi.fn(),
    getResponse: vi.fn(),
  }
  return { execute }
}

function removeV3Scripts() {
  document
    .querySelectorAll('script[id^="google-recaptcha-v3-script"]')
    .forEach((s) => s.remove())
}

describe('VueRecaptcha (v3)', () => {
  let wrapper: VueWrapper<any> | null = null

  beforeEach(() => {
    removeV3Scripts()
    delete (window as any).grecaptcha
    delete (window as any).__lastAction
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    delete (window as any).grecaptcha
    removeV3Scripts()
    vi.useRealTimers()
  })

  it('loads the v3 script with render=SITE_KEY (not explicit)', () => {
    wrapper = mount(VueRecaptcha, { props: { sitekey: 'key-123', version: 'v3' } })
    const script = document.querySelector(
      'script[id^="google-recaptcha-v3-script"]'
    ) as HTMLScriptElement
    expect(script).toBeTruthy()
    expect(script.src).toContain('render=key-123')
    expect(script.src).not.toContain('render=explicit')
  })

  it('does not render a visible widget', () => {
    mockV3()
    wrapper = mount(VueRecaptcha, { props: { sitekey: 'key-123', version: 'v3' } })
    expect((window as any).grecaptcha.render).not.toHaveBeenCalled()
  })

  it('execute(action) resolves the token and emits verify + update:modelValue', async () => {
    const { execute } = mockV3('the-v3-token')
    wrapper = mount(VueRecaptcha, { props: { sitekey: 'key-123', version: 'v3' } })
    await nextTick()

    const token = await wrapper.vm.execute('login')
    expect(token).toBe('the-v3-token')
    expect(execute).toHaveBeenCalledWith('key-123', { action: 'login' })
    expect(wrapper.emitted('verify')?.[0]).toEqual(['the-v3-token'])
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['the-v3-token'])
    expect(wrapper.vm.getResponse()).toBe('the-v3-token')
  })

  it('falls back to the action prop when execute() has no argument', async () => {
    const { execute } = mockV3()
    wrapper = mount(VueRecaptcha, {
      props: { sitekey: 'key-123', version: 'v3', action: 'checkout' },
    })
    await nextTick()

    await wrapper.vm.execute()
    expect(execute).toHaveBeenCalledWith('key-123', { action: 'checkout' })
  })

  it('emits error and rejects when grecaptcha.execute fails', async () => {
    ;(window as any).grecaptcha = {
      ready: (cb: () => void) => cb(),
      execute: vi.fn(() => Promise.reject(new Error('boom'))),
      render: vi.fn(),
      reset: vi.fn(),
      getResponse: vi.fn(),
    }
    wrapper = mount(VueRecaptcha, { props: { sitekey: 'key-123', version: 'v3' } })
    await nextTick()

    await expect(wrapper.vm.execute('x')).rejects.toThrow('boom')
    expect(wrapper.emitted('error')).toBeTruthy()
  })

  it('reset clears the last token', async () => {
    mockV3('tok')
    wrapper = mount(VueRecaptcha, { props: { sitekey: 'key-123', version: 'v3' } })
    await nextTick()

    await wrapper.vm.execute('a')
    expect(wrapper.vm.getResponse()).toBe('tok')
    wrapper.vm.reset()
    expect(wrapper.vm.getResponse()).toBe('')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([''])
  })

  it('injects a badge-hiding style when hideBadge is set', () => {
    mockV3()
    wrapper = mount(VueRecaptcha, {
      props: { sitekey: 'key-123', version: 'v3', hideBadge: true },
    })
    const style = Array.from(document.querySelectorAll('style')).find((s) =>
      s.textContent?.includes('.grecaptcha-badge')
    )
    expect(style).toBeTruthy()
  })

  it('becomes ready via script onload when grecaptcha appears after mount', async () => {
    wrapper = mount(VueRecaptcha, { props: { sitekey: 'key-123', version: 'v3' } })
    const script = document.querySelector(
      'script[id^="google-recaptcha-v3-script"]'
    ) as HTMLScriptElement
    mockV3('tok')
    script.onload?.(new Event('load'))
    await nextTick()
    expect(wrapper.vm.isLoaded).toBe(true)
  })

  it('emits error when the v3 script fails to load', () => {
    wrapper = mount(VueRecaptcha, { props: { sitekey: 'key-123', version: 'v3' } })
    const script = document.querySelector(
      'script[id^="google-recaptcha-v3-script"]'
    ) as HTMLScriptElement
    script.onerror?.(new Event('error'))
    expect(wrapper.emitted('error')).toBeTruthy()
  })

  it('polls for grecaptcha when a v3 script already exists', () => {
    vi.useFakeTimers()
    const existing = document.createElement('script')
    existing.id = 'google-recaptcha-v3-script-key-123'
    document.head.appendChild(existing)

    wrapper = mount(VueRecaptcha, { props: { sitekey: 'key-123', version: 'v3' } })
    mockV3('tok')
    vi.advanceTimersByTime(100)
    expect(wrapper.vm.isLoaded).toBe(true)
  })
})
