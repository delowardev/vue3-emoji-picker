import { createHash } from 'node:crypto'
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gunzipSync, gzipSync } from 'node:zlib'

/**
 * Regenerate `src/data/emojis.json` and `src/data/groups.json` from a pinned
 * emoji-datasource release and move `EMOJI_DATASOURCE_VERSION` with it, so the
 * data always matches the image sets loaded from the CDN.
 *
 *   node scripts/update-emoji-data.mjs [version] [--summary-file <path>]
 *   node scripts/update-emoji-data.mjs --check
 *
 * `version` defaults to the latest emoji-datasource on npm. `--check` only
 * compares that with the current version and, on GitHub Actions, writes
 * `current`, `latest` and `outdated` to `$GITHUB_OUTPUT`.
 *
 * Descriptive names (`n[0]`) are the CLDR short names from Unicode's
 * emoji-test.txt ("red heart"), because emoji-datasource only ships the
 * Unicode character names ("heavy black heart").
 */
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const EMOJIS_FILE = resolve(root, 'src/data/emojis.json')
const GROUPS_FILE = resolve(root, 'src/data/groups.json')
const IMAGES_FILE = resolve(root, 'src/core/images.ts')
const VERSION_PATTERN = /(export const EMOJI_DATASOURCE_VERSION = ')([^']+)(')/

const REGISTRY = (
  process.env.NPM_CONFIG_REGISTRY || 'https://registry.npmjs.org'
).replace(/\/$/, '')

/** Group keys, titles and icons, in display order (`recent` is runtime only). */
const GROUPS = [
  { key: 'recent', title: 'Recently Used', u: '1f551', categories: [] },
  {
    key: 'smileys_people',
    title: 'Smiles & People',
    u: '1f600',
    categories: ['Smileys & Emotion', 'People & Body'],
  },
  {
    key: 'animals_nature',
    title: 'Animals & Nature',
    u: '1F431',
    categories: ['Animals & Nature'],
  },
  {
    key: 'food_drink',
    title: 'Food & Drink',
    u: '2615',
    categories: ['Food & Drink'],
  },
  {
    key: 'activities',
    title: 'Activities',
    u: '26BD',
    categories: ['Activities'],
  },
  {
    key: 'travel_places',
    title: 'Travel & Places',
    u: '1F697',
    categories: ['Travel & Places'],
  },
  { key: 'objects', title: 'Objects', u: '1F4A1', categories: ['Objects'] },
  { key: 'symbols', title: 'Symbols', u: '1f4af', categories: ['Symbols'] },
  { key: 'flags', title: 'Flags', u: '1f3f3-fe0f', categories: ['Flags'] },
]

/** Bare skin-tone and hair modifiers; not pickable on their own. */
const SKIPPED_CATEGORIES = new Set(['Component'])

/** Items listed per summary section; PR bodies are capped at 64K chars. */
const SUMMARY_LIMIT = 250

const TONES = ['1F3FB', '1F3FC', '1F3FD', '1F3FE', '1F3FF']

/** Every image set that must have artwork for an emoji to be included. */
const REQUIRED_SETS = ['twitter', 'google']

function parseArgs(argv) {
  const args = { version: null, check: false, summaryFile: null }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--check') args.check = true
    else if (arg === '--summary-file') args.summaryFile = argv[++i]
    else if (arg.startsWith('--summary-file=')) {
      args.summaryFile = arg.slice('--summary-file='.length)
    } else if (!arg.startsWith('-') && !args.version) args.version = arg
    else throw new Error(`Unknown argument: ${arg}`)
  }
  return args
}

async function fetchOk(url) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`GET ${url} failed: ${response.status}`)
  }
  return response
}

async function fetchManifest(version) {
  const response = await fetchOk(
    `${REGISTRY}/emoji-datasource/${encodeURIComponent(version || 'latest')}`
  )
  return response.json()
}

function compareVersions(a, b) {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] || 0) - (pb[i] || 0)
    if (diff) return diff
  }
  return 0
}

/** Read one file out of a (gunzipped) ustar archive. */
function extractFromTar(tar, wanted) {
  let offset = 0
  let longName = null
  while (offset + 512 <= tar.length) {
    const header = tar.subarray(offset, offset + 512)
    if (header.every((byte) => byte === 0)) break

    const field = (start, length) =>
      header
        .subarray(start, start + length)
        .toString('utf8')
        .replace(/\0.*$/s, '')
    const size = parseInt(field(124, 12).trim() || '0', 8)
    const type = field(156, 1)
    const prefix = field(345, 155)
    let name = longName || (prefix ? `${prefix}/` : '') + field(0, 100)
    longName = null

    const body = tar.subarray(offset + 512, offset + 512 + size)
    offset += 512 + Math.ceil(size / 512) * 512

    if (type === 'L') {
      longName = body.toString('utf8').replace(/\0.*$/s, '')
      continue
    }
    if ((type === '0' || type === '') && name === wanted) return body
  }
  throw new Error(`${wanted} not found in tarball`)
}

async function loadDatasource(manifest) {
  const { tarball, integrity } = manifest.dist
  const archive = Buffer.from(await (await fetchOk(tarball)).arrayBuffer())

  if (integrity) {
    const [algorithm, expected] = integrity.split('-')
    const actual = createHash(algorithm).update(archive).digest('base64')
    if (actual !== expected) {
      throw new Error(`Integrity check failed for ${tarball}`)
    }
  }

  const json = extractFromTar(gunzipSync(archive), 'package/emoji.json')
  return JSON.parse(json.toString('utf8'))
}

/**
 * CLDR short names keyed by lowercase hyphenated codepoints. Unicode moved the
 * files from /Public/emoji/<v>/ to /Public/<v>.0/emoji/ with Emoji 17.0.
 */
async function loadCldrNames(emojiVersion) {
  const urls = [
    `https://unicode.org/Public/emoji/${emojiVersion}/emoji-test.txt`,
    `https://unicode.org/Public/${emojiVersion}.0/emoji/emoji-test.txt`,
  ]

  for (const url of urls) {
    const response = await fetch(url)
    if (!response.ok) continue

    const names = new Map()
    for (const line of (await response.text()).split('\n')) {
      const match =
        /^([0-9A-F ]+?)\s*;\s*[\w-]+\s*#\s*\S+\s+E[\d.]+\s+(.+)$/.exec(line)
      if (!match) continue

      const key = match[1].trim().toLowerCase().replace(/\s+/g, '-')
      const name = match[2].trim().toLowerCase().replace(/’/g, "'")
      if (!names.has(key)) names.set(key, name)
      // Also index without FE0F, for sequences the datasource qualifies
      // differently from emoji-test.txt.
      const bare = key.replace(/-fe0f/g, '')
      if (!names.has(bare)) names.set(bare, name)
    }
    return { url, names }
  }

  throw new Error(`emoji-test.txt for Emoji ${emojiVersion} not found`)
}

const imageCode = (entry) => entry.image.replace(/\.png$/, '')

const hasRequiredImages = (entry) =>
  REQUIRED_SETS.every((set) => entry[`has_img_${set}`])

/**
 * Only single-tone variations: multi-person emoji also list mixed pairs
 * (`1F3FB-1F3FC`), which a single picker tone cannot select.
 */
function toneVariations(entry) {
  const variations = entry.skin_variations
  if (!variations) return undefined

  const result = []
  for (const tone of TONES) {
    const variation = variations[tone] || variations[`${tone}-${tone}`]
    if (variation && hasRequiredImages(variation)) {
      result.push(imageCode(variation))
    }
  }
  return result.length ? result : undefined
}

function buildData(datasource, cldrNames) {
  const groupByCategory = new Map()
  for (const group of GROUPS) {
    for (const category of group.categories) {
      groupByCategory.set(category, group.key)
    }
  }

  const record = {}
  for (const group of GROUPS) {
    if (group.categories.length) record[group.key] = []
  }

  // Obsolete entries (mostly gender-neutral bases the datasource renders as
  // the man variant) are dropped, but their shortcodes move to the
  // replacement so existing `:cop:` / `:runner:` text keeps resolving.
  const inherited = new Map()
  for (const entry of datasource) {
    if (!entry.obsoleted_by) continue
    const names = inherited.get(entry.obsoleted_by) || []
    inherited.set(entry.obsoleted_by, [...names, ...entry.short_names])
  }

  const fallbackNames = []
  const sorted = [...datasource].sort((a, b) => a.sort_order - b.sort_order)

  for (const entry of sorted) {
    if (SKIPPED_CATEGORIES.has(entry.category)) continue
    if (entry.obsoleted_by) continue
    if (!hasRequiredImages(entry)) continue

    const key = groupByCategory.get(entry.category)
    if (!key) throw new Error(`Unmapped category: ${entry.category}`)

    const u = imageCode(entry)
    let name = cldrNames.get(u) || cldrNames.get(u.replace(/-fe0f/g, ''))
    if (!name) {
      name = entry.name.toLowerCase()
      fallbackNames.push(u)
    }

    const shortcodes = [
      ...new Set([
        ...entry.short_names,
        ...(inherited.get(entry.unified) || []),
      ]),
    ]
    const emoji = { n: [name, ...shortcodes], u }
    const v = toneVariations(entry)
    if (v) emoji.v = v
    record[key].push(emoji)
  }

  return { record, fallbackNames }
}

async function format(text, filepath) {
  const prettier = await import('prettier')
  const api = prettier.default || prettier
  const options = (await api.resolveConfig(filepath)) || {}
  return api.format(text, { ...options, filepath })
}

const flatten = (record) => Object.values(record).flat()
const gzipSize = (text) => gzipSync(text, { level: 9 }).length
const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`

function diff(before, after) {
  const old = new Map(flatten(before).map((emoji) => [emoji.u, emoji]))
  const next = new Map(flatten(after).map((emoji) => [emoji.u, emoji]))

  const added = [...next.values()].filter((emoji) => !old.has(emoji.u))
  const removed = [...old.values()].filter((emoji) => !next.has(emoji.u))
  const renamed = [...next.values()]
    .filter((emoji) => old.has(emoji.u) && old.get(emoji.u).n[0] !== emoji.n[0])
    .map((emoji) => ({
      u: emoji.u,
      from: old.get(emoji.u).n[0],
      to: emoji.n[0],
    }))

  return { added, removed, renamed }
}

const glyph = (u) =>
  String.fromCodePoint(...u.split('-').map((code) => parseInt(code, 16)))

function renderSummary({
  from,
  to,
  before,
  after,
  changes,
  cldrUrl,
  fallbackNames,
}) {
  const line = (emoji) => `- ${glyph(emoji.u)} \`${emoji.u}\` ${emoji.n[0]}`
  const section = (title, items) =>
    items.length
      ? [
          `<details><summary>${title} (${items.length})</summary>`,
          '',
          ...items.slice(0, SUMMARY_LIMIT),
          ...(items.length > SUMMARY_LIMIT
            ? [`- …and ${items.length - SUMMARY_LIMIT} more`]
            : []),
          '',
          '</details>',
          '',
        ]
      : []

  return [
    `emoji-datasource **${from}** → **${to}**`,
    '',
    '| | Before | After |',
    '| --- | ---: | ---: |',
    `| Emoji | ${flatten(before.record).length} | ${
      flatten(after.record).length
    } |`,
    `| \`emojis.json\` gzipped | ${kb(before.gzip)} | ${kb(after.gzip)} |`,
    '',
    `Added ${changes.added.length}, removed ${changes.removed.length}, renamed ${changes.renamed.length}.`,
    `Names from ${cldrUrl}.`,
    fallbackNames.length
      ? `No CLDR name for ${fallbackNames.join(', ')}; used the Unicode name.`
      : '',
    '',
    ...section('Added', changes.added.map(line)),
    ...section('Removed', changes.removed.map(line)),
    ...section(
      'Renamed',
      changes.renamed.map(
        ({ u, from: a, to: b }) => `- ${glyph(u)} \`${u}\` ${a} → ${b}`
      )
    ),
  ].join('\n')
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const imagesSource = readFileSync(IMAGES_FILE, 'utf8')
  const current = VERSION_PATTERN.exec(imagesSource)?.[2]
  if (!current) throw new Error(`EMOJI_DATASOURCE_VERSION not found`)

  const manifest = await fetchManifest(args.version)
  const target = manifest.version

  if (args.check) {
    const outdated = compareVersions(target, current) > 0
    console.log(`current=${current} latest=${target} outdated=${outdated}`)
    if (process.env.GITHUB_OUTPUT) {
      appendFileSync(
        process.env.GITHUB_OUTPUT,
        `current=${current}\nlatest=${target}\noutdated=${outdated}\n`
      )
    }
    return
  }

  const datasource = await loadDatasource(manifest)
  const emojiVersion = datasource
    .map((entry) => entry.added_in)
    .sort(compareVersions)
    .pop()
  const { url: cldrUrl, names } = await loadCldrNames(emojiVersion)
  const { record, fallbackNames } = buildData(datasource, names)

  const groups = GROUPS.map(({ key, title, u }) => ({ key, title, u }))
  const allCodes = new Set(flatten(record).map((emoji) => emoji.u))
  for (const group of groups) {
    if (group.key !== 'recent' && !allCodes.has(group.u.toLowerCase())) {
      throw new Error(`Group icon ${group.u} (${group.key}) is not in the data`)
    }
  }

  const beforeText = readFileSync(EMOJIS_FILE, 'utf8')
  const before = { record: JSON.parse(beforeText), gzip: gzipSize(beforeText) }
  const emojisText = await format(JSON.stringify(record, null, 2), EMOJIS_FILE)
  const after = { record, gzip: gzipSize(emojisText) }

  writeFileSync(EMOJIS_FILE, emojisText)
  writeFileSync(
    GROUPS_FILE,
    await format(JSON.stringify(groups, null, 2), GROUPS_FILE)
  )
  writeFileSync(
    IMAGES_FILE,
    imagesSource.replace(VERSION_PATTERN, `$1${target}$3`)
  )

  const changes = diff(before.record, after.record)
  const summary = renderSummary({
    from: current,
    to: target,
    before,
    after,
    changes,
    cldrUrl,
    fallbackNames,
  })

  console.log(
    [
      `emoji-datasource ${current} -> ${target} (Emoji ${emojiVersion})`,
      `emoji: ${flatten(before.record).length} -> ${flatten(record).length}`,
      `emojis.json gzipped: ${kb(before.gzip)} -> ${kb(after.gzip)}`,
      `added ${changes.added.length}, removed ${changes.removed.length}, renamed ${changes.renamed.length}`,
      ...changes.added.map((e) => `  + ${e.u} ${e.n[0]}`),
      ...changes.removed.map((e) => `  - ${e.u} ${e.n[0]}`),
      ...changes.renamed.map((e) => `  ~ ${e.u} ${e.from} -> ${e.to}`),
      fallbackNames.length
        ? `no CLDR name (used Unicode name): ${fallbackNames.join(', ')}`
        : '',
    ]
      .filter(Boolean)
      .join('\n')
  )

  if (args.summaryFile) writeFileSync(args.summaryFile, summary + '\n')
}

main().catch((error) => {
  console.error(error.message || error)
  process.exit(1)
})
