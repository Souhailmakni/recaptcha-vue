<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import type { ComponentPublicInstance } from 'vue'
import type { RecaptchaProps, RecaptchaEmits } from '../types'

const props = withDefaults(defineProps<RecaptchaProps>(), {
  version: 'v2',
  action: 'submit',
  theme: 'light',
  size: 'normal',
  tabindex: 0,
  loadingTimeout: 30000,
  language: '',
  badge: 'bottomright',
  hideBadge: false,
  isolated: false,
})

const emit = defineEmits<RecaptchaEmits>()

const containerRef = ref<HTMLDivElement | null>(null)
function setContainerRef(el: Element | ComponentPublicInstance | null) {
  containerRef.value = el as HTMLDivElement | null
}
const widgetId = ref<number | null>(null)
const isLoaded = ref(false)
const hasError = ref(false)
const lastToken = ref('')
let timeoutHandle: ReturnType<typeof setTimeout> | null = null
let pollHandle: ReturnType<typeof setInterval> | null = null
let scriptEl: HTMLScriptElement | null = null
let styleEl: HTMLStyleElement | null = null
// Resolves a pending v2 execute() when the next verify fires.
let pendingExecute: ((token: string) => void) | null = null
// Resolves once grecaptcha is ready in v3 mode.
let resolveV3Ready: () => void = () => {}
let v3Ready: Promise<void> = new Promise((resolve) => {
  resolveV3Ready = resolve
})

// Unique callback names so multiple instances don't conflict.
const instanceId = Math.random().toString(36).slice(2)
const onLoadCallbackName = `__recaptchaOnLoad_${instanceId}`
const onVerifyCallbackName = `__recaptchaVerify_${instanceId}`
const onExpireCallbackName = `__recaptchaExpire_${instanceId}`
const onErrorCallbackName = `__recaptchaError_${instanceId}`

function registerGlobalCallbacks() {
  ;(window as any)[onVerifyCallbackName] = (token: string) => {
    lastToken.value = token
    emit('verify', token)
    emit('update:modelValue', token)
    if (pendingExecute) {
      pendingExecute(token)
      pendingExecute = null
    }
  }
  ;(window as any)[onExpireCallbackName] = () => {
    lastToken.value = ''
    emit('expire')
    emit('update:modelValue', '')
  }
  ;(window as any)[onErrorCallbackName] = () => {
    hasError.value = true
    lastToken.value = ''
    emit('error')
    emit('update:modelValue', '')
  }
}

function removeGlobalCallbacks() {
  delete (window as any)[onLoadCallbackName]
  delete (window as any)[onVerifyCallbackName]
  delete (window as any)[onExpireCallbackName]
  delete (window as any)[onErrorCallbackName]
}

// ---- v2 (visible checkbox) -------------------------------------------------
function renderWidget() {
  if (!containerRef.value || widgetId.value !== null) return

  const w = window as any
  if (!w.grecaptcha || !w.grecaptcha.render) return

  widgetId.value = w.grecaptcha.render(containerRef.value, {
    sitekey: props.sitekey,
    theme: props.theme,
    size: props.size,
    tabindex: props.tabindex,
    badge: props.badge,
    isolated: props.isolated,
    callback: onVerifyCallbackName,
    'expired-callback': onExpireCallbackName,
    'error-callback': onErrorCallbackName,
  })

  isLoaded.value = true
  if (widgetId.value !== null) {
    emit('widget-id', widgetId.value)
  }
  clearTimeout(timeoutHandle!)
}

function loadScript() {
  const w = window as any

  if (w.grecaptcha && w.grecaptcha.render) {
    renderWidget()
    return
  }

  if (document.getElementById('google-recaptcha-script')) {
    waitForGrecaptcha()
    return
  }

  ;(w as any)[onLoadCallbackName] = () => {
    renderWidget()
  }

  const lang = props.language ? `&hl=${props.language}` : ''
  const src = `https://www.google.com/recaptcha/api.js?onload=${onLoadCallbackName}&render=explicit${lang}`

  scriptEl = document.createElement('script')
  scriptEl.id = 'google-recaptcha-script'
  scriptEl.src = src
  scriptEl.async = true
  scriptEl.defer = true
  scriptEl.onerror = () => {
    hasError.value = true
    emit('error')
    clearTimeout(timeoutHandle!)
  }

  document.head.appendChild(scriptEl)
}

function waitForGrecaptcha() {
  pollHandle = setInterval(() => {
    const w = window as any
    if (w.grecaptcha && w.grecaptcha.render) {
      clearInterval(pollHandle!)
      renderWidget()
    }
  }, 100)
}

// ---- v3 (score-based) ------------------------------------------------------
function markV3Ready() {
  ;(window as any).grecaptcha?.ready(() => {
    isLoaded.value = true
    resolveV3Ready()
    clearTimeout(timeoutHandle!)
  })
}

function loadScriptV3() {
  const w = window as any
  const scriptId = `google-recaptcha-v3-script-${props.sitekey}`

  if (w.grecaptcha && typeof w.grecaptcha.ready === 'function') {
    markV3Ready()
    return
  }

  if (document.getElementById(scriptId)) {
    pollHandle = setInterval(() => {
      if (w.grecaptcha && typeof w.grecaptcha.ready === 'function') {
        clearInterval(pollHandle!)
        markV3Ready()
      }
    }, 100)
    return
  }

  const lang = props.language ? `&hl=${props.language}` : ''
  scriptEl = document.createElement('script')
  scriptEl.id = scriptId
  scriptEl.src = `https://www.google.com/recaptcha/api.js?render=${props.sitekey}${lang}`
  scriptEl.async = true
  scriptEl.defer = true
  scriptEl.onload = () => markV3Ready()
  scriptEl.onerror = () => {
    hasError.value = true
    emit('error')
    clearTimeout(timeoutHandle!)
  }

  document.head.appendChild(scriptEl)
}

// ---- Public API (exposed via defineExpose) ---------------------------------
function reset() {
  lastToken.value = ''
  if (props.version === 'v2' && widgetId.value !== null) {
    ;(window as any).grecaptcha?.reset(widgetId.value)
  }
  emit('update:modelValue', '')
}

async function execute(action?: string): Promise<string> {
  if (props.version === 'v3') {
    await v3Ready
    const g = (window as any).grecaptcha
    if (!g) {
      hasError.value = true
      emit('error')
      throw new Error('reCAPTCHA v3 is not loaded')
    }
    try {
      const token: string = await g.execute(props.sitekey, {
        action: action ?? props.action,
      })
      lastToken.value = token
      emit('verify', token)
      emit('update:modelValue', token)
      return token
    } catch (err) {
      hasError.value = true
      emit('error')
      throw err
    }
  }

  if (widgetId.value === null) return ''
  ;(window as any).grecaptcha?.execute(widgetId.value)
  return new Promise<string>((resolve) => {
    pendingExecute = resolve
  })
}

function getResponse(): string {
  if (props.version === 'v3') return lastToken.value
  if (widgetId.value === null) return ''
  return (window as any).grecaptcha?.getResponse(widgetId.value) ?? ''
}

defineExpose({ reset, execute, getResponse, widgetId, isLoaded })

// ---- Lifecycle -------------------------------------------------------------
onMounted(() => {
  timeoutHandle = setTimeout(() => {
    if (!isLoaded.value) {
      hasError.value = true
      emit('error')
    }
  }, props.loadingTimeout)

  if (props.version === 'v3') {
    if (props.hideBadge) {
      styleEl = document.createElement('style')
      styleEl.textContent = '.grecaptcha-badge { visibility: hidden; }'
      document.head.appendChild(styleEl)
    }
    loadScriptV3()
  } else {
    registerGlobalCallbacks()
    loadScript()
  }
})

onBeforeUnmount(() => {
  clearTimeout(timeoutHandle!)
  if (pollHandle) clearInterval(pollHandle)
  if (styleEl) styleEl.remove()
  removeGlobalCallbacks()
  widgetId.value = null
})

// Sitekey hotswap for v2 (reset widget when sitekey changes)
watch(
  () => props.sitekey,
  () => {
    if (props.version === 'v3') return
    widgetId.value = null
    isLoaded.value = false
    if (containerRef.value) containerRef.value.innerHTML = ''
    renderWidget()
  }
)
</script>

<template>
  <div :ref="setContainerRef" class="vue-recaptcha" />
</template>

<style scoped>
.vue-recaptcha {
  display: inline-block;
}
</style>
