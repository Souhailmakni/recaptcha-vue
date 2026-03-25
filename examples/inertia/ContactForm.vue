<script setup lang="ts">
/**
 * Example: Contact form with reCAPTCHA v2 in a Laravel + Inertia.js app.
 *
 * Install in your Laravel project:
 *   npm install recaptcha-vue
 *
 * Set VITE_RECAPTCHA_SITE_KEY in your .env file.
 */
import { ref } from 'vue'
import { useForm } from '@inertiajs/vue3'
import { VueRecaptcha, useRecaptcha } from 'recaptcha-vue'

const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string

const recaptchaRef = ref<InstanceType<typeof VueRecaptcha> | null>(null)
const { token, isVerified, onVerify, onExpire, onError } = useRecaptcha()

const form = useForm({
  name: '',
  email: '',
  message: '',
  recaptcha_token: '',
})

async function submit() {
  if (!isVerified.value) {
    alert('Please complete the reCAPTCHA first.')
    return
  }

  form.recaptcha_token = token.value

  form.post(route('contact.store'), {
    onSuccess: () => {
      form.reset()
      // Reset the reCAPTCHA widget after a successful submission
      recaptchaRef.value?.reset()
      onError() // clears local state too
    },
    onError: () => {
      // Google recommends resetting after every failed attempt
      recaptchaRef.value?.reset()
      onError()
    },
  })
}
</script>

<template>
  <form @submit.prevent="submit" novalidate>
    <div>
      <label for="name">Name</label>
      <input id="name" v-model="form.name" type="text" required />
      <span v-if="form.errors.name">{{ form.errors.name }}</span>
    </div>

    <div>
      <label for="email">Email</label>
      <input id="email" v-model="form.email" type="email" required />
      <span v-if="form.errors.email">{{ form.errors.email }}</span>
    </div>

    <div>
      <label for="message">Message</label>
      <textarea id="message" v-model="form.message" required />
      <span v-if="form.errors.message">{{ form.errors.message }}</span>
    </div>

    <!-- reCAPTCHA widget -->
    <VueRecaptcha
      ref="recaptchaRef"
      :sitekey="siteKey"
      theme="light"
      size="normal"
      @verify="onVerify"
      @expire="onExpire"
      @error="onError"
    />
    <span v-if="form.errors.recaptcha_token" class="error">
      {{ form.errors.recaptcha_token }}
    </span>

    <button type="submit" :disabled="form.processing || !isVerified">
      {{ form.processing ? 'Sending…' : 'Send Message' }}
    </button>
  </form>
</template>
