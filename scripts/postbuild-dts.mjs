import {
  copyFileSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { join } from 'node:path'

/**
 * Normalise the rolled-up declaration files emitted by vite-plugin-dts.
 *
 * A dual ESM/CJS package needs one declaration file per module kind:
 * - the Vue entry's `.d.cts` uses `export =` because its CommonJS build assigns
 *   `module.exports = Picker` — otherwise TypeScript tells CJS consumers to
 *   read `.default`, which does not exist at runtime;
 * - the core entry uses named exports, so its declaration is shared as-is.
 *
 * Run with `--target vue` or `--target core` right after each build.
 */
const dist = 'dist'
const targetIndex = process.argv.indexOf('--target')
const target = targetIndex === -1 ? 'all' : process.argv[targetIndex + 1]

const read = (name) => readFileSync(join(dist, name), 'utf8')
const write = (name, content) => writeFileSync(join(dist, name), content)

function declarationSources(prefix) {
  return readdirSync(dist).filter(
    (file) =>
      file.endsWith('.d.ts') &&
      !file.endsWith('.d.mts') &&
      !file.endsWith('.d.cts') &&
      file.startsWith(prefix)
  )
}

if (target === 'vue' || target === 'all') {
  const sources = declarationSources('emoji-picker')

  if (sources.length === 0) {
    console.error('[postbuild-dts] no Vue entry .d.ts was emitted')
    process.exit(1)
  }

  const source =
    sources.find((file) => file === 'emoji-picker.d.ts') || sources[0]

  if (source !== 'emoji-picker.d.ts') {
    renameSync(join(dist, source), join(dist, 'emoji-picker.d.ts'))
  }

  const esm = read('emoji-picker.d.ts')

  write('emoji-picker.d.mts', esm)

  const exportedTypes = [
    ...esm.matchAll(/^export declare (?:type|interface) (\w+)/gm),
  ].map((match) => match[1])

  const cjs = esm
    .replace(/^export declare /gm, 'declare ')
    .replace(/^export default _default;?$/gm, '')
    .replace(/^export \{ \};?$/gm, '')
    .trimEnd()

  write(
    'emoji-picker.d.cts',
    [
      cjs,
      '',
      'declare namespace _default {',
      `    export { ${exportedTypes.join(', ')} };`,
      '}',
      '',
      'export = _default;',
      '',
    ].join('\n')
  )

  // Keep the canonical ESM declaration as the one referenced by `module`/`types`.
  copyFileSync(join(dist, 'emoji-picker.d.mts'), join(dist, 'emoji-picker.d.ts'))
}

if (target === 'core' || target === 'all') {
  const sources = declarationSources('core')

  if (sources.length === 0) {
    console.error('[postbuild-dts] no core entry .d.ts was emitted')
    process.exit(1)
  }

  const source = sources.find((file) => file === 'core.d.ts') || sources[0]

  if (source !== 'core.d.ts') {
    renameSync(join(dist, source), join(dist, 'core.d.ts'))
  }

  const coreDts = read('core.d.ts')
  write('core.d.mts', coreDts)
  write('core.d.cts', coreDts)
}

// Side-effect-only module declaration for `vue3-emoji-picker/css`, so the
// subpath resolves for TypeScript instead of failing with "no types".
if (target === 'vue' || target === 'all') {
  write('css.d.ts', 'export {}\n')
}

// Declaration maps still point at the pre-rename filenames.
for (const file of readdirSync(dist)) {
  if (file.endsWith('.d.ts.map')) {
    rmSync(join(dist, file))
  }
}

console.log(`[postbuild-dts] ${target} declarations normalised`)
