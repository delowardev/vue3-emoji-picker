import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

/**
 * Demo app build (the playground), separate from the library build.
 * Output goes to `demo-dist/` so it never ends up in the npm package.
 */
export default defineConfig({
  plugins: [vue()],
  build: {
    outDir: 'demo-dist',
    emptyOutDir: true,
  },
})
