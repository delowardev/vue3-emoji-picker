import { createSSRApp, h } from 'vue'
import { renderToString } from '@vue/server-renderer'

/**
 * SSR / Node smoke test.
 *
 * Importing the built ESM entry in a Node process used to trigger
 * `ReferenceError: indexedDB is not defined` as an *unhandled rejection*, which
 * still allowed `renderToString` to succeed — so consumers saw a working page
 * and a leaking server log. This gate fails on either symptom.
 */
const rejections = []
process.on('unhandledRejection', (reason) => rejections.push(reason))

let html = ''
try {
  const { default: Picker } = await import('../dist/emoji-picker.mjs')
  html = await renderToString(createSSRApp({ render: () => h(Picker) }))
} catch (error) {
  console.error('[test:ssr] import or render threw:')
  console.error(error)
  process.exit(1)
}

// Let pending microtasks/macrotasks surface any rejection.
await new Promise((resolve) => setTimeout(resolve, 250))

if (rejections.length > 0) {
  for (const rejection of rejections) {
    console.error('[test:ssr] unhandled rejection:', rejection)
  }
  process.exit(1)
}

if (!html || !html.includes('v3-emoji-picker')) {
  console.error(`[test:ssr] unexpected render output (length: ${html.length})`)
  process.exit(1)
}

console.log(
  `[test:ssr] ok — imported and server-rendered ${html.length} bytes with no unhandled rejections`
)
