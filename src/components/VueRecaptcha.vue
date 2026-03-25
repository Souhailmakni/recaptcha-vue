<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import type { RecaptchaProps, RecaptchaEmits } from '../types'

const props = withDefaults(defineProps<RecaptchaProps>(), {
  theme: 'light',
  size: 'normal',
  tabindex: 0,
  loadingTimeout: 30000,
  language: '',
  badge: 'bottomright',
  isolated: false,
})

const emit = defineEmits<RecaptchaEmits>()

const containerRef = ref<HTMLDivElement | null>(null)
const widgetId = ref<number | null>(null)
const isLoaded = ref(false)
const hasError = ref(false)
let timeoutHandle: ReturnType<typeof setTimeout> | null = null
let scriptEl: HTMLScriptElement | null = null

// ── Unique callback names so multiple instances don't conflict ──────────────
const instanceId = Math.random().toString(36).slice(2)
const onLoadCallbackName = `__recaptchaOnLoad_${instanceId}`
const onVerifyCallbackName = `__recaptchaVerify_${instanceId}`
const onExpireCallbackName = `__recaptchaExpire_${instanceId}`
const onErrorCallbackName = `__recaptchaError_${instanceId}`

function registerGlobalCallbacks() {
  ;(window as any)[onVerifyCallbackName] = (token: string) => {
    emit('verify', token)
    emit('update:modelValue', token)
  }
  ;(window as any)[onExpireCallbackName] = () => {
    emit('expire')
    emit('update:modelValue', '')
  }
  ;(window as any)[onErrorCallbackName] = () => {
    hasError.value = true
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
  emit('widget-id', widgetId.value)
  clearTimeout(timeoutHandle!)
}

function loadScript() {
  const w = window as any

  // Already loaded globally
  if (w.grecaptcha && w.grecaptcha.render) {
    renderWidget()
    return
  }

  // Script already injected by another instance — wait for it
  if (document.getElementById('google-recaptcha-script')) {
    waitForGrecaptcha()
    return
  }

  // Register a global onload callback unique to this instance
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
  const interval = setInterval(() => {
    const w = window as any
    if (w.grecaptcha && w.grecaptcha.render) {
      clearInterval(interval)
      renderWidget()
    }
  }, 100)
}

// ── Public API (exposed via defineExpose) ───────────────────────────────────
function reset() {
  if (widgetId.value === null) return
  ;(window as any).grecaptcha?.reset(widgetId.value)
  emit('update:modelValue', '')
}

function execute() {
  if (widgetId.value === null) return
  ;(window as any).grecaptcha?.execute(widgetId.value)
}

function getResponse(): string {
  if (widgetId.value === null) return ''
  return (window as any).grecaptcha?.getResponse(widgetId.value) ?? ''
}

defineExpose({ reset, execute, getResponse, widgetId, isLoaded })

// ── Lifecycle ───────────────────────────────────────────────────────────────
onMounted(() => {
  registerGlobalCallbacks()

  timeoutHandle = setTimeout(() => {
    if (!isLoaded.value) {
      hasError.value = true
      emit('error')
    }
  }, props.loadingTimeout)

  loadScript()
})

onBeforeUnmount(() => {
  clearTimeout(timeoutHandle!)
  removeGlobalCallbacks()
  widgetId.value = null
})

// Sitekey hotswap — reset widget when sitekey changes
watch(
  () => props.sitekey,
  () => {
    widgetId.value = null
    isLoaded.value = false
    if (containerRef.value) containerRef.value.innerHTML = ''
    renderWidget()
  }
)
</script>

<template>
  <div ref="containerRef" class="vue-recaptcha" />
</template>

<style scoped>
.vue-recaptcha {
  display: inline-block;
}
</style>
