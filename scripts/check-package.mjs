import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Packaging gate.
 *
 * 1. Every path referenced by `main` / `module` / `types` / `exports` must exist.
 * 2. The packed tarball must contain only intended files — the build used to
 *    ship a demo favicon inside `dist/`.
 */
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'))

const referenced = new Set()
const collect = (value) => {
  if (typeof value === 'string') referenced.add(value)
  else if (value && typeof value === 'object') Object.values(value).forEach(collect)
}
collect(pkg.main)
collect(pkg.module)
collect(pkg.types)
collect(pkg.exports)

const missing = []
for (const target of referenced) {
  if (!target.startsWith('./')) continue
  if (!existsSync(resolve(root, target))) missing.push(target)
}

if (missing.length > 0) {
  console.error('[test:pack] paths declared in package.json do not exist:')
  for (const target of missing) console.error(`  - ${target}`)
  process.exit(1)
}

let packed
try {
  const stdout = execFileSync(
    'npm',
    ['pack', '--dry-run', '--json', '--ignore-scripts'],
    { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
  )
  packed = JSON.parse(stdout.slice(stdout.indexOf('[')))
} catch (error) {
  console.error('[test:pack] could not inspect the packed tarball:')
  console.error(error.stdout || error.message)
  process.exit(1)
}

const files = (packed[0]?.files ?? []).map((file) => file.path)

const required = [
  'dist/emoji-picker.mjs',
  'dist/emoji-picker.cjs',
  'dist/emoji-picker.d.ts',
  'dist/emoji-picker.d.mts',
  'dist/emoji-picker.d.cts',
  'dist/style.css',
  'package.json',
  'README.md',
  'LICENSE',
]

const absent = required.filter((file) => !files.includes(file))
if (absent.length > 0) {
  console.error('[test:pack] expected files are missing from the tarball:')
  for (const file of absent) console.error(`  - ${file}`)
  process.exit(1)
}

const forbidden = files.filter(
  (file) =>
    file.startsWith('src/') ||
    file.startsWith('public/') ||
    file.startsWith('scripts/') ||
    file === 'dist/favicon.ico' ||
    file.endsWith('.map')
)
if (forbidden.length > 0) {
  console.error('[test:pack] unintended files would be published:')
  for (const file of forbidden) console.error(`  - ${file}`)
  process.exit(1)
}

console.log(`[test:pack] ok — ${files.length} files, no stray assets`)
