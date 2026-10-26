import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [vue(), dts({ rollupTypes: true })],
  // The demo favicon lives in public/ but must not be copied into the
  // published bundle (it used to ship inside dist/).
  publicDir: command === 'build' ? false : 'public',
  build: {
    lib: {
      entry: fileURLToPath(new URL('src/export.ts', import.meta.url)),
      name: 'EmojiPicker',
      formats: ['es', 'umd'],
      // `type: module` makes .js mean ESM, so the CommonJS build must be .cjs.
      fileName: (format) =>
        format === 'es' ? 'emoji-picker.mjs' : 'emoji-picker.cjs',
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue',
        },
      },
    },
  },
}))
