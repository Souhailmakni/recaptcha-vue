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
  },
  resolve: {
    dedupe: ['vue'],
  },
})