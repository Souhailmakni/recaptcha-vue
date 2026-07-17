# recaptcha-vue

> Lightweight, zero-dependency Vue 3 component for **Google reCAPTCHA v2 (checkbox)**  
> with full TypeScript support, Vite library build, and first-class Laravel + Inertia.js integration.

[![npm](https://img.shields.io/npm/v/recaptcha-vue)](https://www.npmjs.com/package/recaptcha-vue)
[![license](https://img.shields.io/npm/l/recaptcha-vue)](LICENSE)
[![CI](https://github.com/Souhailmakni/recaptcha-vue/actions/workflows/ci.yml/badge.svg)](https://github.com/Souhailmakni/recaptcha-vue/actions)
[![node](https://img.shields.io/node/v/recaptcha-vue?cacheSeconds=3600)](package.json)
[![known vulnerabilities](https://snyk.io/test/npm/recaptcha-vue/badge.svg)](https://snyk.io/test/npm/recaptcha-vue)

Coverage (generated locally with `yarn test:coverage`, no external service):

| Statements | Branches | Functions | Lines |
|---|---|---|---|
| ![Statements](https://img.shields.io/badge/statements-100%25-brightgreen.svg?style=flat) | ![Branches](https://img.shields.io/badge/branches-94.11%25-brightgreen.svg?style=flat) | ![Functions](https://img.shields.io/badge/functions-100%25-brightgreen.svg?style=flat) | ![Lines](https://img.shields.io/badge/lines-100%25-brightgreen.svg?style=flat) |

---

## Table of contents

- [Features](#features)
- [Requirements](#requirements)
- [Security](#security)
- [Installation](#installation)
- [Quick start](#quick-start)
- [Token expiry and resetting](#token-expiry-and-resetting)
- [Props](#props)
- [Events](#events)
- [Exposed API](#exposed-api-via-ref)
- [`useRecaptcha` composable](#userecaptcha-composable)
- [v-model](#v-model)
- [Laravel + Inertia.js integration](#laravel--inertiajs-integration)
- [Dark theme example](#dark-theme-example)
- [Multiple instances on one page](#multiple-instances-on-one-page)
- [Local development](#local-development)
- [License](#license)

---

## Features

- **Vue 3** Composition API + `<script setup>`
- **TypeScript**: full types for props, emits, and the exposed API
- **`useRecaptcha` composable**: reactive `token` & `isVerified` state
- **v-model** support: bind the verified token directly
- **Multiple instances**: safe to use more than one widget per page
- **Theming**: `light` / `dark`, `normal` / `compact`
- **Language**: pass any BCP 47 code (`hl` param)
- **Load timeout**: emits `error` if the script never loads
- **Laravel + Inertia.js**: ready-to-use controller & form examples
- **ESM + CJS** dual build via Vite

---

## Requirements

| | Version |
|---|---|
| Node.js | `>=20.19.0` (see [`.nvmrc`](.nvmrc)) |
| Vue | `^3.3.0` (peer dependency) |

---

## Security

`recaptcha-vue` ships with **zero runtime dependencies**. The published package
only depends on Vue (as a peer dependency), so there's no third-party code in the
bundle consumers install.

CI ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) runs `yarn audit` on
every push and pull request:

- **Production dependencies** are audited with `yarn audit --groups dependencies`
  and the build fails on any known vulnerability. This currently has nothing to
  audit (zero runtime deps), and guards against anything introduced in the future.
- **Dev dependencies** (build/test tooling such as `vite-plugin-dts` and
  `@vue/test-utils`) are audited separately and reported, without failing the
  build. These packages never ship to consumers, and some pull in vulnerable
  transitive sub-dependencies upstream that can't be fixed locally. They're
  tracked for visibility rather than blocking merges.

Run `yarn audit` (or `yarn run audit` for the production-only check) locally at
any time.

---

## Installation

```bash
npm install recaptcha-vue
# or
yarn add recaptcha-vue
# or
pnpm add recaptcha-vue
```

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

## Token expiry and resetting

> [!IMPORTANT]
> Read this before wiring up a form. The most common integration bug with any
> reCAPTCHA v2 wrapper is a form that works once in testing, then silently
> submits a stale or already-used token in production. (Separately: your
> server must verify the token regardless of expiry, see
> [Client state is not verification](#client-state-is-not-verification).)

A verified token is only valid for **about 2 minutes** ([Google's own limit](https://developers.google.com/recaptcha/docs/faq#my-users-are-getting-a-please-try-again-error-why)),
and it's **single-use**: once you've submitted it to your backend, that exact
token cannot be verified again, whether verification succeeded or failed.
Two failure modes follow directly from that:

1. **The user waits too long.** The checkbox stays visually "checked," but
   the token behind it has expired. Handle this with `@expire`/`onExpire`
   (from `useRecaptcha`), which flips `isVerified` back to `false` so your
   submit button disables itself again instead of sending a dead token.
2. **The user submits, something else fails, they retry.** Say the token
   verifies fine but a different field (email format, password match, etc.)
   fails server-side validation. If you don't reset the widget, the user
   fixes that field and resubmits the *same* token, which your backend now
   rejects, and it looks like reCAPTCHA itself is broken.

The fix for both is the same one-liner, and it belongs in every code path
that leaves the form, success or failure:

```ts
recaptchaRef.value?.reset()
```

Concretely: call `.reset()` in your success handler, in your error handler,
and anywhere else you're about to let the user try submitting again. Don't
call it only in the success path. See the [Laravel + Inertia.js example](#laravel--inertiajs-integration)
below for `onSuccess`/`onError` reset calls in a real form.

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
| `modelValue` | `string` | `''` | v-model, holds the verified token |

---

## Events

| Event | Payload | Description |
|---|---|---|
| `verify` | `token: string` | User completed the challenge; token ready to send to server |
| `expire` | - | Token expired; user must re-verify |
| `error` | - | Widget or network error |
| `widget-id` | `id: number` | Internal widget ID after render |
| `update:modelValue` | `token: string` | v-model update |

"Ready to send to server" is doing a lot of work in that first row. See
[Client state is not verification](#client-state-is-not-verification) for
why sending it isn't the same as being verified.

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
  token,       // Ref<string>: current token ('' when expired / error)
  isVerified,  // Ref<boolean>: true when a valid token exists (client-side only, see below)
  onVerify,    // (token: string) => void
  onExpire,    // () => void
  onError,     // () => void
  reset,       // () => void: clears local state (call recaptchaRef.reset() too)
} = useRecaptcha()
```

### Client state is not verification

> [!WARNING]
> `isVerified` and `token` are client-side state only. They exist to drive
> UX, e.g. disabling the submit button until the checkbox is solved, and
> they are never proof that verification actually happened. Any client can
> set them to whatever it wants before the request reaches your server.
>
> Your server must independently POST the token to
> `https://www.google.com/recaptcha/api/siteverify` with your secret key,
> check the `success` field, and reject the request when it's false. See
> [Laravel + Inertia.js integration](#laravel--inertiajs-integration) for a
> full working example of that check.
>
> Tokens are also single-use and expire after about 2 minutes (see
> [Token expiry and resetting](#token-expiry-and-resetting)). A reused or
> expired token comes back from `siteverify` as `success: false` with
> `error-codes: ["timeout-or-duplicate"]`, so that response already tells
> you which case you're in without any extra client-side bookkeeping.

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

### Front-end (ContactForm.vue)

See [`examples/inertia/ContactForm.vue`](examples/inertia/ContactForm.vue) for a full working example using `useForm` from `@inertiajs/vue3`.

Key points:
1. Store the verified token in `form.recaptcha_token`
2. Always reset the widget after a successful **or** failed submission

**Walkthrough: server rejects an expired or reused token.** This is the
scenario that actually breaks in production, so here's exactly what happens,
step by step, with the example above and [`ContactController.php`](examples/laravel/ContactController.php):

1. The token expires (idle too long) or was already used in a prior request.
   The checkbox still looks checked; nothing in the UI has changed yet.
2. The user submits. Your controller's `Http::asForm()->post(...)` call to
   Google comes back with `success: false`, so it throws a
   `ValidationException` on the `recaptcha_token` key. Laravel turns that
   into a 422 with `errors: { recaptcha_token: [...] }`.
3. Inertia's `form.post()` sees the 422 and calls `onError`, populating
   `form.errors.recaptcha_token` (which the template renders) - it does
   **not** touch `form.name`, `form.email`, or `form.message`. Inertia only
   clears form data when you explicitly call `form.reset()`, and this
   example deliberately doesn't call it here.
4. Our `onError` handler calls `recaptchaRef.value?.reset()`, which reloads
   the widget and clears the local `token`/`isVerified` state. The checkbox
   goes back to unchecked.
5. The user sees their name/email/message exactly as they left them, plus
   the recaptcha error, re-checks the box, and resubmits. Nothing they
   already typed is lost.

The one thing to get right: don't call `form.reset()` in the same handler
that resets the widget on error. That's what wipes the rest of the form
along with the stale token.

### Back-end (ContactController.php)

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

## Local development

Clone the repo and install dependencies:

```bash
git clone https://github.com/Souhailmakni/recaptcha-vue.git
cd recaptcha-vue
yarn install
```

### Demo app

`yarn dev` serves a small demo at [`index.html`](index.html) / [`demo/`](demo) that
exercises the component through both the `v-model` API and the `useRecaptcha`
composable. It works out of the box with Google's official test site key (always
passes, never use it in production). No `.env` file required:

```bash
yarn dev
```

To try your own site key instead, copy `.env.example` to `.env` and set
`VITE_RECAPTCHA_SITE_KEY`.

The `demo/` directory and root `index.html` are excluded from the published npm
package (see the `files` field in `package.json`) and from the TypeScript project
used for `typecheck`/`build` (see `tsconfig.json`), so they have no effect on
consumers of the library.

### Scripts

| Command | Description |
|---|---|
| `yarn dev` | Start the demo app with hot reload |
| `yarn typecheck` | Type-check `src/` with `vue-tsc` |
| `yarn test` | Run the test suite once with Vitest |
| `yarn test:watch` | Run the test suite in watch mode |
| `yarn test:coverage` | Run the test suite with coverage and update the README badges |
| `yarn audit` | Audit production dependencies for known vulnerabilities |
| `yarn build` | Type-check, then build the ESM + CJS library bundles to `dist/` |
| `yarn lint` | Lint and auto-fix `src/` with ESLint |

---

## License

[MIT](LICENSE) © Souhail Makni
