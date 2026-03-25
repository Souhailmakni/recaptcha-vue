# recaptcha-vue

> Lightweight, zero-dependency Vue 3 component for **Google reCAPTCHA v2 (checkbox)**  
> with full TypeScript support, Vite library build, and first-class Laravel + Inertia.js integration.

[![npm](https://img.shields.io/npm/v/recaptcha-vue)](https://www.npmjs.com/package/recaptcha-vue)
[![license](https://img.shields.io/npm/l/recaptcha-vue)](LICENSE)
[![CI](https://github.com/Souhailmakni/recaptcha-vue/actions/workflows/ci.yml/badge.svg)](https://github.com/Souhailmakni/recaptcha-vue/actions)

---

## Features

- ✅ **Vue 3** Composition API + `<script setup>`
- 🔑 **TypeScript** — full types for props, emits, and the exposed API
- 🧩 **`useRecaptcha` composable** — reactive `token` & `isVerified` state
- 🔁 **v-model** support — bind the verified token directly
- 🌐 **Multiple instances** — safe to use more than one widget per page
- 🎨 **Theming** — `light` / `dark`, `normal` / `compact`
- 🌍 **Language** — pass any BCP 47 code (`hl` param)
- ⏱️ **Load timeout** — emits `error` if the script never loads
- 🔌 **Laravel + Inertia.js** — ready-to-use controller & form examples
- 📦 **ESM + CJS** dual build via Vite

---

## Installation

```bash
npm install recaptcha-vue
# or
yarn add recaptcha-vue
# or
pnpm add recaptcha-vue
```

> **Vue 3.3+** is required as a peer dependency.

---

## Quick start

### 1. Get your reCAPTCHA v2 keys

Register at [https://www.google.com/recaptcha/admin](https://www.google.com/recaptcha/admin).  
Choose **reCAPTCHA v2 → "I'm not a robot" Checkbox**.

> **Test keys** (always pass, never use in production):  
> Site key: `6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI`  
> Secret key: `6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe`

### 2. Add your site key to the environment

```ini
# .env
VITE_RECAPTCHA_SITE_KEY=your_site_key_here
```

### 3. Use the component

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VueRecaptcha, useRecaptcha } from 'recaptcha-vue'

const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY
const recaptchaRef = ref<InstanceType<typeof VueRecaptcha> | null>(null)
const { token, isVerified, onVerify, onExpire, onError } = useRecaptcha()

function submit() {
  console.log('Token to send to server:', token.value)
  // After submit, reset the widget:
  recaptchaRef.value?.reset()
}
</script>

<template>
  <VueRecaptcha
    ref="recaptchaRef"
    :sitekey="siteKey"
    @verify="onVerify"
    @expire="onExpire"
    @error="onError"
  />
  <button :disabled="!isVerified" @click="submit">Submit</button>
</template>
```

### 4. Register globally (optional)

```ts
// main.ts
import { createApp } from 'vue'
import RecaptchaPlugin from 'recaptcha-vue'
import App from './App.vue'

createApp(App).use(RecaptchaPlugin).mount('#app')
```

---

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `sitekey` | `string` | **required** | Your reCAPTCHA v2 site key |
| `theme` | `'light' \| 'dark'` | `'light'` | Widget color scheme |
| `size` | `'normal' \| 'compact'` | `'normal'` | Widget size |
| `tabindex` | `number` | `0` | Tab index |
| `loadingTimeout` | `number` | `30000` | ms before emitting `error` if widget never loads |
| `language` | `string` | `''` | BCP 47 language code, e.g. `'fr'`, `'ar'` |
| `badge` | `'bottomright' \| 'bottomleft' \| 'inline'` | `'bottomright'` | Badge position (invisible size only) |
| `isolated` | `boolean` | `false` | Isolate widget from others on the page |
| `modelValue` | `string` | `''` | v-model — holds the verified token |

---

## Events

| Event | Payload | Description |
|---|---|---|
| `verify` | `token: string` | User completed the challenge; token ready to send to server |
| `expire` | — | Token expired; user must re-verify |
| `error` | — | Widget or network error |
| `widget-id` | `id: number` | Internal widget ID after render |
| `update:modelValue` | `token: string` | v-model update |

---

## Exposed API (via `ref`)

```ts
const recaptchaRef = ref<InstanceType<typeof VueRecaptcha> | null>(null)

recaptchaRef.value?.reset()        // Reset the widget
recaptchaRef.value?.execute()      // Programmatically trigger (compact / invisible)
recaptchaRef.value?.getResponse()  // Get current token string
```

---

## `useRecaptcha` composable

```ts
const {
  token,       // Ref<string>  — current token ('' when expired / error)
  isVerified,  // Ref<boolean> — true when a valid token exists
  onVerify,    // (token: string) => void
  onExpire,    // () => void
  onError,     // () => void
  reset,       // () => void — clears local state (call recaptchaRef.reset() too)
} = useRecaptcha()
```

---

## v-model

```vue
<script setup>
import { ref } from 'vue'
import { VueRecaptcha } from 'recaptcha-vue'

const captchaToken = ref('')
</script>

<template>
  <VueRecaptcha v-model="captchaToken" sitekey="..." />
  <p>Token: {{ captchaToken }}</p>
</template>
```

---

## Laravel + Inertia.js integration

### Front-end — ContactForm.vue

See [`examples/inertia/ContactForm.vue`](examples/inertia/ContactForm.vue) for a full working example using `useForm` from `@inertiajs/vue3`.

Key points:
1. Store the verified token in `form.recaptcha_token`
2. Always reset the widget after a successful **or** failed submission

### Back-end — ContactController.php

See [`examples/laravel/ContactController.php`](examples/laravel/ContactController.php).

Add to **`config/services.php`**:

```php
'recaptcha' => [
    'site_key'   => env('RECAPTCHA_SITE_KEY'),
    'secret_key' => env('RECAPTCHA_SECRET_KEY'),
],
```

Add to **`.env`** (server-side):

```ini
RECAPTCHA_SITE_KEY=your_site_key
RECAPTCHA_SECRET_KEY=your_secret_key

# Expose site key to Vite:
VITE_RECAPTCHA_SITE_KEY="${RECAPTCHA_SITE_KEY}"
```

Verify the token inside your controller:

```php
$response = Http::asForm()->post('https://www.google.com/recaptcha/api/siteverify', [
    'secret'   => config('services.recaptcha.secret_key'),
    'response' => $request->input('recaptcha_token'),
    'remoteip' => $request->ip(),
]);

if (! $response->json('success')) {
    throw ValidationException::withMessages([
        'recaptcha_token' => 'reCAPTCHA verification failed. Please try again.',
    ]);
}
```

---

## Dark theme example

```vue
<VueRecaptcha
  :sitekey="siteKey"
  theme="dark"
  size="compact"
  language="ar"
  @verify="onVerify"
/>
```

---

## Multiple instances on one page

Each `<VueRecaptcha>` instance manages its own unique widget ID and global callback names, so you can safely render multiple widgets:

```vue
<VueRecaptcha :sitekey="siteKey" @verify="handleLoginCaptcha" />
<VueRecaptcha :sitekey="siteKey" @verify="handleSignupCaptcha" />
```

---

## Development

```bash
git clone https://github.com/Souhailmakni/recaptcha-vue.git
cd recaptcha-vue
npm install
npm run build      # produce dist/
npm run typecheck  # vue-tsc
```

### Publishing to npm

```bash
# Bump version in package.json, then:
git commit -am "release: v1.0.1"
git tag v1.0.1
git push --follow-tags
# GitHub Actions will publish automatically on 'release:' commits to main
# Or publish manually:
npm publish --access public
```

---

## License

[MIT](LICENSE) © Souhail Makni
