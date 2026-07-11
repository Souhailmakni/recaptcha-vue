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
})
