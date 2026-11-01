import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default defineConfig((env) =>
  mergeConfig(viteConfig(env), {
    test: {
      // Mounting the full picker (1,906 emoji) can exceed the 5s default
      // under coverage instrumentation.
      testTimeout: 20000,
      coverage: {
        provider: 'v8',
        include: ['src/**'],
        exclude: ['src/test/**'],
      },
    },
  })
)
