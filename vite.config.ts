import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    vue(),
    dts({
      include: ['src/**/*.ts', 'src/**/*.vue'],
      insertTypesEntry: true,
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'RecaptchaVue',
      fileName: 'recaptcha-vue',
      formats: ['es', 'umd'],
    },
    target: 'esnext',
    sourcemap: true,
    minify: 'oxc',   // ← was 'esbuild', Vite 8 uses oxc now
    rollupOptions: {
      // Vue must come from the consuming app's own instance, not be bundled here -
      // two separate Vue runtimes in one page silently breaks refs/reactivity
      // across the boundary (Vue's "current rendering instance" tracking is
      // module-scoped, so a bundled copy never matches the host app's copy).
      external: ['vue'],
      output: {
        globals: { vue: 'Vue' },
      },
    },
  },
  resolve: {
    dedupe: ['vue'],
  },
})