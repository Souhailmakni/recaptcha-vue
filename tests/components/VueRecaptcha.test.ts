import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import VueRecaptcha from '../../src/components/VueRecaptcha.vue'

function mockGrecaptcha(widgetId = 1) {
  const render = vi.fn().mockReturnValue(widgetId)
  const reset = vi.fn()
  const execute = vi.fn()
  const getResponse = vi.fn().mockReturnValue('mock-response')
  ;(window as any).grecaptcha = { render, reset, execute, getResponse }
  return { render, reset, execute, getResponse }
}

describe('VueRecaptcha', () => {
  let wrapper: VueWrapper<any> | null = null

  beforeEach(() => {
    mockGrecaptcha()
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    delete (window as any).grecaptcha
    document.getElementById('google-recaptcha-script')?.remove()
    vi.useRealTimers()
  })

  it('renders the widget via grecaptcha.render on mount with default props', () => {
    const { render } = window.grecaptcha as any
    wrapper = mount(VueRecaptcha, { props: { sitekey: 'test-sitekey' } })

    expect(render).toHaveBeenCalledTimes(1)
    const [container, params] = render.mock.calls[0]
    expect(container).toBeInstanceOf(HTMLElement)
    expect(params.sitekey).toBe('test-sitekey')
    expect(params.theme).toBe('light')
    expect(params.size).toBe('normal')
    expect(params.tabindex).toBe(0)
    expect(params.badge).toBe('bottomright')
    expect(params.isolated).toBe(false)
  })

  it('passes custom prop values through to grecaptcha.render', () => {
    const { render } = window.grecaptcha as any
    wrapper = mount(VueRecaptcha, {
      props: {
        sitekey: 'k',
        theme: 'dark',
        size: 'compact',
        tabindex: 5,
        badge: 'inline',
        isolated: true,
      },
    })

    const [, params] = render.mock.calls[0]
    expect(params.theme).toBe('dark')
    expect(params.size).toBe('compact')
    expect(params.tabindex).toBe(5)
    expect(params.badge).toBe('inline')
    expect(params.isolated).toBe(true)
  })

  it('emits widget-id with the id returned by grecaptcha.render', () => {
    mockGrecaptcha(42)
    wrapper = mount(VueRecaptcha, { props: { sitekey: 'k' } })

    expect(wrapper.emitted('widget-id')).toEqual([[42]])
  })

  it('emits verify and update:modelValue when the verify callback fires', () => {
    const { render } = window.grecaptcha as any
    wrapper = mount(VueRecaptcha, { props: { sitekey: 'k' } })

    const params = render.mock.calls[0][1]
    ;(window as any)[params.callback]('user-token')

    expect(wrapper.emitted('verify')).toEqual([['user-token']])
    expect(wrapper.emitted('update:modelValue')).toEqual([['user-token']])
  })

  it('emits expire and clears modelValue when the expired-callback fires', () => {
    const { render } = window.grecaptcha as any
    wrapper = mount(VueRecaptcha, { props: { sitekey: 'k' } })

    const params = render.mock.calls[0][1]
    ;(window as any)[params['expired-callback']]()

    expect(wrapper.emitted('expire')).toHaveLength(1)
    expect(wrapper.emitted('update:modelValue')).toEqual([['']])
  })

  it('emits error and clears modelValue when the error-callback fires', () => {
    const { render } = window.grecaptcha as any
    wrapper = mount(VueRecaptcha, { props: { sitekey: 'k' } })

    const params = render.mock.calls[0][1]
    ;(window as any)[params['error-callback']]()

    expect(wrapper.emitted('error')).toHaveLength(1)
    expect(wrapper.emitted('update:modelValue')).toEqual([['']])
  })

  it('exposes reset/execute/getResponse that delegate to the grecaptcha API', () => {
    const { reset, execute, getResponse } = window.grecaptcha as any
    wrapper = mount(VueRecaptcha, { props: { sitekey: 'k' } })

    wrapper.vm.reset()
    wrapper.vm.execute()
    const response = wrapper.vm.getResponse()

    expect(reset).toHaveBeenCalledWith(1)
    expect(execute).toHaveBeenCalledWith(1)
    expect(getResponse).toHaveBeenCalledWith(1)
    expect(response).toBe('mock-response')
  })

  it('re-renders the widget when the sitekey prop changes', async () => {
    const { render } = window.grecaptcha as any
    wrapper = mount(VueRecaptcha, { props: { sitekey: 'first' } })

    await wrapper.setProps({ sitekey: 'second' })

    expect(render).toHaveBeenCalledTimes(2)
    expect(render.mock.calls[1][1].sitekey).toBe('second')
  })

  it('emits error if the script never loads before loadingTimeout elapses', () => {
    delete (window as any).grecaptcha
    vi.useFakeTimers()

    wrapper = mount(VueRecaptcha, { props: { sitekey: 'k', loadingTimeout: 1000 } })
    vi.advanceTimersByTime(1000)

    expect(wrapper.emitted('error')).toHaveLength(1)
  })

  it('no-ops reset/execute/getResponse when the widget has not rendered yet', () => {
    delete (window as any).grecaptcha
    wrapper = mount(VueRecaptcha, { props: { sitekey: 'k' } })

    expect(() => wrapper!.vm.reset()).not.toThrow()
    expect(() => wrapper!.vm.execute()).not.toThrow()
    expect(wrapper.vm.getResponse()).toBe('')
  })

  it('injects the script with the language param when grecaptcha is not yet loaded', () => {
    delete (window as any).grecaptcha
    wrapper = mount(VueRecaptcha, { props: { sitekey: 'k', language: 'fr' } })

    const scriptEl = document.getElementById('google-recaptcha-script') as HTMLScriptElement
    expect(scriptEl).not.toBeNull()
    expect(scriptEl.src).toContain('&hl=fr')
    expect(scriptEl.async).toBe(true)
    expect(scriptEl.defer).toBe(true)
  })

  it('renders the widget once the injected script calls its own onload callback', () => {
    delete (window as any).grecaptcha
    wrapper = mount(VueRecaptcha, { props: { sitekey: 'k' } })

    const scriptEl = document.getElementById('google-recaptcha-script') as HTMLScriptElement
    const onloadName = scriptEl.src.match(/onload=([^&]+)/)?.[1] as string

    const { render } = mockGrecaptcha()
    ;(window as any)[onloadName]()

    expect(render).toHaveBeenCalledTimes(1)
  })

  it('no-ops if the onload callback fires before grecaptcha is actually ready', () => {
    delete (window as any).grecaptcha
    wrapper = mount(VueRecaptcha, { props: { sitekey: 'k' } })

    const scriptEl = document.getElementById('google-recaptcha-script') as HTMLScriptElement
    const onloadName = scriptEl.src.match(/onload=([^&]+)/)?.[1] as string

    expect(() => (window as any)[onloadName]()).not.toThrow()
    expect(wrapper.emitted('widget-id')).toBeUndefined()
  })

  it('emits error when the injected script itself fails to load', () => {
    delete (window as any).grecaptcha
    wrapper = mount(VueRecaptcha, { props: { sitekey: 'k' } })

    const scriptEl = document.getElementById('google-recaptcha-script') as HTMLScriptElement
    scriptEl.onerror?.(new Event('error'))

    expect(wrapper.emitted('error')).toHaveLength(1)
  })

  it('waits for an in-flight script instead of injecting a second one', () => {
    delete (window as any).grecaptcha
    const existingScript = document.createElement('script')
    existingScript.id = 'google-recaptcha-script'
    document.head.appendChild(existingScript)

    wrapper = mount(VueRecaptcha, { props: { sitekey: 'k' } })

    expect(document.querySelectorAll('#google-recaptcha-script')).toHaveLength(1)
  })

  it('renders the widget once polling detects grecaptcha became available', () => {
    delete (window as any).grecaptcha
    const existingScript = document.createElement('script')
    existingScript.id = 'google-recaptcha-script'
    document.head.appendChild(existingScript)

    vi.useFakeTimers()
    wrapper = mount(VueRecaptcha, { props: { sitekey: 'k' } })

    // First poll tick: grecaptcha still isn't ready, interval keeps waiting
    vi.advanceTimersByTime(100)

    const { render } = mockGrecaptcha()
    vi.advanceTimersByTime(100)

    expect(render).toHaveBeenCalledTimes(1)
  })

  it('stops polling harmlessly if the component unmounts before grecaptcha becomes available', () => {
    delete (window as any).grecaptcha
    const existingScript = document.createElement('script')
    existingScript.id = 'google-recaptcha-script'
    document.head.appendChild(existingScript)

    vi.useFakeTimers()
    const localWrapper = mount(VueRecaptcha, { props: { sitekey: 'k' } })
    localWrapper.unmount()

    const { render } = mockGrecaptcha()
    expect(() => vi.advanceTimersByTime(100)).not.toThrow()
    expect(render).not.toHaveBeenCalled()
  })

  it('does not emit widget-id when grecaptcha.render fails to return an id', () => {
    mockGrecaptcha()
    ;(window.grecaptcha as any).render = vi.fn().mockReturnValue(null)

    wrapper = mount(VueRecaptcha, { props: { sitekey: 'k' } })

    expect(wrapper.emitted('widget-id')).toBeUndefined()
  })

  it('getResponse falls back to an empty string if grecaptcha becomes unavailable', () => {
    wrapper = mount(VueRecaptcha, { props: { sitekey: 'k' } })
    delete (window as any).grecaptcha

    expect(wrapper.vm.getResponse()).toBe('')
  })

  it('does not re-emit error from loadingTimeout once the widget already loaded', () => {
    vi.useFakeTimers()
    wrapper = mount(VueRecaptcha, { props: { sitekey: 'k', loadingTimeout: 1000 } })

    vi.advanceTimersByTime(1000)

    expect(wrapper.emitted('error')).toBeUndefined()
  })
})
