export interface RecaptchaProps {
  /** Your reCAPTCHA v2 site key from https://www.google.com/recaptcha/admin */
  sitekey: string

  /** Widget color scheme. Default: 'light' */
  theme?: 'light' | 'dark'

  /** Widget size. Default: 'normal' */
  size?: 'normal' | 'compact'

  /** Tab index of the widget. Default: 0 */
  tabindex?: number

  /** Timeout in ms before emitting an error if widget never loads. Default: 30000 */
  loadingTimeout?: number

  /** Optional BCP 47 language code for the widget, e.g. 'fr', 'ar' */
  language?: string

  /**
   * Position of the reCAPTCHA badge (only applies to invisible size).
   * Default: 'bottomright'
   */
  badge?: 'bottomright' | 'bottomleft' | 'inline'

  /** Whether to isolate this widget from others on the page */
  isolated?: boolean

  /** v-model support: holds the verified token */
  modelValue?: string
}

export interface RecaptchaEmits {
  /** Emitted when the user successfully completes the challenge; token is the response */
  (e: 'verify', token: string): void
  /** Emitted when the response token expires */
  (e: 'expire'): void
  /** Emitted when reCAPTCHA encounters an error (network, script load, etc.) */
  (e: 'error'): void
  /** Emitted with the widget ID after the widget is rendered */
  (e: 'widget-id', id: number): void
  /** v-model update */
  (e: 'update:modelValue', value: string): void
}

/** Shape of the grecaptcha global */
export interface Grecaptcha {
  render(container: HTMLElement, params: Record<string, unknown>): number
  reset(widgetId?: number): void
  execute(widgetId?: number): void
  getResponse(widgetId?: number): string
}

declare global {
  interface Window {
    grecaptcha?: Grecaptcha
  }
}
