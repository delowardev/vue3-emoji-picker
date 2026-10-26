import { copyFileSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Normalise the rolled-up declaration file emitted by vite-plugin-dts.
 *
 * A dual ESM/CJS package needs one declaration file per module kind:
 * - `.d.mts` keeps `export default` (correct for the ESM build),
 * - `.d.cts` uses `export =` because the CommonJS build assigns
 *   `module.exports = Picker` — otherwise TypeScript tells CJS consumers to
 *   read `.default`, which does not exist at runtime.
 */
const dist = 'dist'
const canonical = 'emoji-picker.d.ts'

let files
try {
  files = readdirSync(dist)
} catch {
  console.error(`[postbuild-dts] "${dist}/" does not exist — run vite build first`)
  process.exit(1)
}

const declarations = files.filter(
  (file) => file.endsWith('.d.ts') && !file.endsWith('.d.mts') && !file.endsWith('.d.cts')
)

if (declarations.length === 0) {
  console.error('[postbuild-dts] no .d.ts was emitted by vite-plugin-dts')
  process.exit(1)
}

const source =
  declarations.find((file) => file === canonical) ||
  declarations.find((file) => file.startsWith('emoji-picker')) ||
  declarations[0]

if (source !== canonical) {
  renameSync(join(dist, source), join(dist, canonical))
}

const esm = readFileSync(join(dist, canonical), 'utf8')

// ESM declaration: unchanged.
writeFileSync(join(dist, 'emoji-picker.d.mts'), esm)

const exportedTypes = [...esm.matchAll(/^export declare (?:type|interface) (\w+)/gm)].map(
  (match) => match[1]
)

const cjs = esm
  .replace(/^export declare /gm, 'declare ')
  .replace(/^export default _default;?$/gm, '')
  .replace(/^export \{ \};?$/gm, '')
  .trimEnd()

const cjsWithExportAssignment = [
  cjs,
  '',
  'declare namespace _default {',
  `    export { ${exportedTypes.join(', ')} };`,
  '}',
  '',
  'export = _default;',
  '',
].join('\n')

writeFileSync(join(dist, 'emoji-picker.d.cts'), cjsWithExportAssignment)

// Side-effect-only module declaration for `vue3-emoji-picker/css`, so the
// subpath resolves for TypeScript instead of failing with "no types".
writeFileSync(join(dist, 'css.d.ts'), 'export {}\n')

// Declaration maps still point at the pre-rename filename.
for (const file of readdirSync(dist)) {
  if (file.endsWith('.d.ts.map')) {
    rmSync(join(dist, file))
  }
}

// Keep the canonical ESM declaration as the one referenced by `module`/`types`.
copyFileSync(join(dist, 'emoji-picker.d.mts'), join(dist, canonical))

console.log(
  `[postbuild-dts] ${source} -> ${canonical}, .d.mts, .d.cts (export =), css.d.ts`
)
