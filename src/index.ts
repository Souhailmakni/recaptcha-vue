import type { App } from 'vue'
import VueRecaptcha from './components/VueRecaptcha.vue'
import { useRecaptcha } from './composables/useRecaptcha'
import type { RecaptchaProps, RecaptchaEmits } from './types'

export { VueRecaptcha, useRecaptcha }
export type { RecaptchaProps, RecaptchaEmits }

/** Vue plugin — registers <VueRecaptcha> globally */
export default {
  install(app: App) {
    app.component('VueRecaptcha', VueRecaptcha)
  },
}
