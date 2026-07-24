export interface RecaptchaProps {
  /** Your reCAPTCHA site key from https://www.google.com/recaptcha/admin */
  sitekey: string

  /**
   * Which reCAPTCHA to use. Default: 'v2' (the visible checkbox).
   * 'v3' is score-based and renders no widget; obtain a token by calling
   * `execute(action)` on the component ref.
   */
  version?: 'v2' | 'v3'

  /**
   * v3 only: the default action name used when `execute()` is called without
   * an argument. Default: 'submit'.
   */
  action?: string

  /** v2 only. Widget color scheme. Default: 'light' */
  theme?: 'light' | 'dark'

  /** v2 only. Widget size. Default: 'normal' */
  size?: 'normal' | 'compact'

  /** v2 only. Tab index of the widget. Default: 0 */
  tabindex?: number

  /** Timeout in ms before emitting an error if the script never loads. Default: 30000 */
  loadingTimeout?: number

  /** Optional BCP 47 language code for the widget, e.g. 'fr', 'ar' */
  language?: string

  /**
   * v2 only. Position of the reCAPTCHA badge (invisible size).
   * Default: 'bottomright'
   */
  badge?: 'bottomright' | 'bottomleft' | 'inline'

  /**
   * v3 only. Hide the floating reCAPTCHA badge. If you hide it you must display
   * the "protected by reCAPTCHA" legal text yourself (Google's terms require it).
   */
  hideBadge?: boolean

  /** v2 only. Whether to isolate this widget from others on the page */
  isolated?: boolean

  /** v-model support: holds the verified token */
  modelValue?: string
}

export interface RecaptchaEmits {
  /**
   * Emitted with the token: on v2 when the user completes the challenge, on v3
   * whenever `execute()` resolves.
   */
  (e: 'verify', token: string): void
  /** v2 only. Emitted when the response token expires */
  (e: 'expire'): void
  /** Emitted when reCAPTCHA encounters an error (network, script load, execute failure) */
  (e: 'error'): void
  /** v2 only. Emitted with the widget ID after the widget is rendered */
  (e: 'widget-id', id: number): void
  /** v-model update */
  (e: 'update:modelValue', value: string): void
}

/** Shape of the grecaptcha global */
export interface Grecaptcha {
  render(container: HTMLElement, params: Record<string, unknown>): number
  reset(widgetId?: number): void
  getResponse(widgetId?: number): string
  /** v3: run the challenge for an action and resolve with a token */
  execute(siteKey: string, options: { action: string }): Promise<string>
  /** v2 invisible: trigger the challenge for a widget */
  execute(widgetId?: number): void
  /** v3: run the callback once grecaptcha is ready */
  ready(callback: () => void): void
}

declare global {
  interface Window {
    grecaptcha?: Grecaptcha
  }
}
