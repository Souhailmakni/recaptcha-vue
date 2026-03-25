import { ref, type Ref } from 'vue'

interface UseRecaptchaReturn {
  /** Reactive token updated on verify / expire / error */
  token: Ref<string>
  /** Reactive boolean: true once a valid token exists */
  isVerified: Ref<boolean>
  /** Call when @verify fires */
  onVerify: (token: string) => void
  /** Call when @expire fires */
  onExpire: () => void
  /** Call when @error fires */
  onError: () => void
  /** Resets state (does NOT reset the widget — call recaptchaRef.reset() for that) */
  reset: () => void
}

/**
 * Composable that tracks reCAPTCHA verification state.
 *
 * @example
 * ```vue
 * <script setup>
 * import { useRecaptcha } from 'recaptcha-vue'
 * const { token, isVerified, onVerify, onExpire, onError } = useRecaptcha()
 * </script>
 *
 * <template>
 *   <VueRecaptcha sitekey="..." @verify="onVerify" @expire="onExpire" @error="onError" />
 *   <button :disabled="!isVerified" @click="submit">Submit</button>
 * </template>
 * ```
 */
export function useRecaptcha(): UseRecaptchaReturn {
  const token = ref('')
  const isVerified = ref(false)

  function onVerify(t: string) {
    token.value = t
    isVerified.value = true
  }

  function onExpire() {
    token.value = ''
    isVerified.value = false
  }

  function onError() {
    token.value = ''
    isVerified.value = false
  }

  function reset() {
    token.value = ''
    isVerified.value = false
  }

  return { token, isVerified, onVerify, onExpire, onError, reset }
}
