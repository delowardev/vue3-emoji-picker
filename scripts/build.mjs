import { execFileSync } from 'node:child_process'
import { copyFileSync, readFileSync, writeFileSync } from 'node:fs'

/**
 * Orchestrates the two library builds.
 *
 * vite-plugin-dts always writes its rolled-up declaration to
 * `package.json#types`, so the Vue and core builds would overwrite each other.
 * Point `types` at the core entry for the second build and restore the file
 * afterwards — including when a build fails.
 */
const pkgPath = 'package.json'
const original = readFileSync(pkgPath, 'utf8')
const pkg = JSON.parse(original)

const run = (bin, args) =>
  execFileSync(process.execPath, [bin, ...args], { stdio: 'inherit' })

const runScript = (args) =>
  execFileSync(process.execPath, args, { stdio: 'inherit' })

const writeTypesPath = (types) => {
  pkg.types = types
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
}

try {
  run('node_modules/vue-tsc/bin/vue-tsc.js', ['--noEmit'])

  writeTypesPath('./dist/emoji-picker.d.ts')
  run('node_modules/vite/bin/vite.js', ['build'])
  runScript(['scripts/postbuild-dts.mjs', '--target', 'vue'])

  // 1.1.x file names, kept so CDN <script> / import URLs keep working.
  copyFileSync('dist/emoji-picker.cjs', 'dist/emoji-picker.umd.js')
  copyFileSync('dist/emoji-picker.mjs', 'dist/emoji-picker.es.js')

  writeTypesPath('./dist/core.d.ts')
  run('node_modules/vite/bin/vite.js', [
    'build',
    '--config',
    'vite.core.config.ts',
  ])
  runScript(['scripts/postbuild-dts.mjs', '--target', 'core'])
} finally {
  writeFileSync(pkgPath, original)
}
