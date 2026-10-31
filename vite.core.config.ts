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
  plugins: [dts({ bundleTypes: true })],
  // The second build runs with emptyOutDir: false; do not copy public/ in.
  publicDir: false,
  build: {
    // Same browsers as the 1.x build (Vite 2's "modules" target), so CDN
    // users keep working; bundlers can still down-level further.
    target: ['es2020', 'chrome87', 'edge88', 'firefox78', 'safari14'],
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
