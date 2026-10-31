import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import dts from 'vite-plugin-dts'

/**
 * Framework-agnostic core build.
 *
 * Produces `dist/core.mjs` / `dist/core.cjs` and must never contain a Vue
 * import — `scripts/check-package.mjs` enforces that.
 */
export default defineConfig({
  plugins: [dts({ rollupTypes: true })],
  // The second build runs with emptyOutDir: false; do not copy public/ in.
  publicDir: false,
  build: {
    // The Vue build runs first and owns dist/.
    emptyOutDir: false,
    lib: {
      entry: fileURLToPath(new URL('src/core.ts', import.meta.url)),
      name: 'EmojiPickerCore',
      formats: ['es', 'cjs'],
      fileName: (format) => (format === 'es' ? 'core.mjs' : 'core.cjs'),
    },
  },
})
