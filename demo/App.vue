<script setup lang="ts">
import { ref } from 'vue'
import { VueRecaptcha, useRecaptcha } from '../src/index'

// Google's official reCAPTCHA v2 test key (always passes, safe to commit).
// Override by setting VITE_RECAPTCHA_SITE_KEY in a local .env file.
const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'

// ── Demo 1: v-model ──────────────────────────────────────────────────────
const modelToken = ref('')

// ── Demo 2: useRecaptcha composable + exposed ref API ───────────────────
const recaptchaRef = ref<InstanceType<typeof VueRecaptcha> | null>(null)
const { token, isVerified, onVerify, onExpire, onError, reset: resetState } = useRecaptcha()

function submit() {
  alert(`Token captured:\n${token.value}`)
}

function resetWidget() {
  recaptchaRef.value?.reset()
  resetState()
}
</script>

<template>
  <main class="page">
    <h1>recaptcha-vue demo</h1>
    <p class="hint">
      Using Google's public test site key (always passes). Set
      <code>VITE_RECAPTCHA_SITE_KEY</code> in a local <code>.env</code> to try your own.
    </p>

    <section>
      <h2>1. v-model</h2>
      <VueRecaptcha v-model="modelToken" :sitekey="siteKey" />
      <p>Token: <code>{{ modelToken || '(none yet)' }}</code></p>
    </section>

    <section>
      <h2>2. useRecaptcha composable</h2>
      <VueRecaptcha
        ref="recaptchaRef"
        :sitekey="siteKey"
        theme="dark"
        size="compact"
        @verify="onVerify"
        @expire="onExpire"
        @error="onError"
      />
      <p>Verified: <code>{{ isVerified }}</code></p>
      <div class="actions">
        <button :disabled="!isVerified" @click="submit">Submit</button>
        <button @click="resetWidget">Reset</button>
      </div>
    </section>
  </main>
</template>

<style>
body {
  margin: 0;
  font-family: system-ui, sans-serif;
  background: #f7f7f8;
  color: #1a1a1a;
}
.page {
  max-width: 640px;
  margin: 0 auto;
  padding: 2rem 1.5rem 4rem;
}
.hint {
  color: #555;
  font-size: 0.9rem;
}
section {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #ddd;
}
.actions {
  margin-top: 0.75rem;
  display: flex;
  gap: 0.5rem;
}
button {
  padding: 0.5rem 1rem;
  cursor: pointer;
}
button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
</style>
