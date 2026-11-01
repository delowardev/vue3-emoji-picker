import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [vue(), dts({ bundleTypes: true })],
  // The demo favicon lives in public/ but must not be copied into the
  // published bundle (it used to ship inside dist/).
  publicDir: command === 'build' ? false : 'public',
  build: {
    // Same browsers as the 1.x build (Vite 2's "modules" target), so CDN
    // users keep working; bundlers can still down-level further.
    target: ['es2020', 'chrome87', 'edge88', 'firefox78', 'safari14'],
    lib: {
      entry: fileURLToPath(new URL('src/export.ts', import.meta.url)),
      name: 'EmojiPicker',
      formats: ['es', 'umd'],
      // `type: module` makes .js mean ESM, so the CommonJS build must be .cjs.
      fileName: (format) =>
        format === 'es' ? 'emoji-picker.mjs' : 'emoji-picker.cjs',
      // Keep `dist/style.css` (the `./css` export); newer Vite names the
      // file after the package by default.
      cssFileName: 'style',
    },
    rolldownOptions: {
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue',
        },
      },
    },
  },
}))
