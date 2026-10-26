import { Emoji, EmojiRecord, GroupKeys } from './types'
import {
  SKIN_TONE_NEUTRAL,
  EMOJI_VARIATIONS_KEY,
  EMOJI_UNICODE_KEY,
  EMOJI_NAME_KEY,
  EMOJI_RESULT_KEY,
} from './constant'

interface SearchEntry {
  /** Normalised aliases, e.g. ["thumbs up sign", "+1", "thumbsup"] */
  aliases: string[]
  /** Every word appearing in any alias */
  words: string[]
  /** Comma-prefixed token list used for fast substring lookups */
  tokens: string
}

/**
 * Per-emoji search metadata is memoised on the emoji object itself. Dataset
 * objects are stable references, so this survives the `state.emojis` getter
 * returning a fresh record on every access.
 */
const searchCache = new WeakMap<object, SearchEntry>()

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[:_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function getSearchEntry(emoji: Emoji): SearchEntry {
  const cached = searchCache.get(emoji as object)
  if (cached) return cached

  const names = Array.isArray(emoji[EMOJI_NAME_KEY])
    ? emoji[EMOJI_NAME_KEY]
    : []

  const aliases = [
    ...new Set(
      names
        .filter((name) => typeof name === 'string' && name.trim())
        .map((name) => normalize(String(name)))
        .filter(Boolean)
    ),
  ]
  const words = [...new Set(aliases.flatMap((alias) => alias.split(' ')))]
  const tokens = [
    ...new Set(aliases.flatMap((alias) => [alias, ...alias.split(' ')])),
  ]

  const entry: SearchEntry = {
    aliases,
    words,
    tokens: ',' + tokens.join(','),
  }

  searchCache.set(emoji as object, entry)
  return entry
}

/**
 * Score an emoji against a query.
 *
 * Tiers: exact alias < alias prefix < word match < token prefix < substring.
 * Returns `null` when the emoji does not match (multi-word queries are AND).
 */
function scoreEmoji(
  entry: SearchEntry,
  query: string,
  words: string[]
): number | null {
  if (entry.aliases.length === 0) return null
  if (entry.aliases.includes(query)) return 0
  if (entry.aliases.some((alias) => alias.startsWith(query))) return 5

  let total = 0
  for (const word of words) {
    if (entry.words.includes(word)) {
      total += 20
    } else if (entry.tokens.includes(',' + word)) {
      total += 30
    } else if (entry.aliases.some((alias) => alias.includes(word))) {
      total += 40
    } else {
      return null
    }
  }
  return total
}

const nameOf = (emoji: Emoji): string =>
  Array.isArray(emoji[EMOJI_NAME_KEY]) && emoji[EMOJI_NAME_KEY][0]
    ? String(emoji[EMOJI_NAME_KEY][0])
    : ''

/**
 * Resolve the unicode for the requested skin tone.
 *
 * Variations are matched by their tone segment rather than by array position —
 * relying on the index silently dropped the first tone (`0 || -1` is `-1`).
 */
function applySkinTone(emoji: Emoji, skinTone: string): string {
  const base = emoji[EMOJI_UNICODE_KEY]
  if (skinTone === SKIN_TONE_NEUTRAL) return base

  const variations = emoji[EMOJI_VARIATIONS_KEY]
  if (!Array.isArray(variations)) return base

  const match = variations.find((variation) =>
    variation.split('-').includes(skinTone)
  )
  return match || base
}

/**
 * Convert unicode to native emoji
 *
 * @param unicode - emoji unicode
 */
export function unicodeToEmoji(unicode: string): string {
  if (typeof unicode !== 'string' || !unicode.trim()) return ''

  const codePoints = unicode
    .split('-')
    .map((hex) => parseInt(hex, 16))
    .filter(
      (codePoint) =>
        Number.isInteger(codePoint) && codePoint > 0 && codePoint <= 0x10ffff
    )

  if (codePoints.length === 0) return ''

  try {
    return codePoints
      .map((codePoint) => String.fromCodePoint(codePoint))
      .join('')
  } catch {
    return ''
  }
}

/**
 * Filter emoji by search keyword.
 *
 * Matches against *every* alias, not just the canonical name, so shortcodes
 * such as `thumbsup`, `+1` and `joy_cat` are searchable.
 *
 * @param emojis - Emoji data
 * @param keyword - filter keyword
 * @param skinTone - current skin tone
 * @param disabledGroups - group keys to be excluded
 */
export function filterEmojis(
  emojis: EmojiRecord,
  keyword: string,
  skinTone: string,
  disabledGroups: string[] = []
): EmojiRecord {
  const _emojiData = {} as EmojiRecord
  const query = normalize(keyword || '')
  const words = query ? [...new Set(query.split(' '))] : []

  Object.keys(emojis).forEach((key) => {
    /**
     * Exclude disabled emoji group from the record
     */
    if (disabledGroups.includes(key)) return

    const group = emojis[key as GroupKeys]
    if (!Array.isArray(group)) return

    const matches: Array<{ emoji: Emoji; score: number }> = []

    group.forEach((emoji) => {
      if (!emoji || typeof emoji !== 'object') return
      const score = query ? scoreEmoji(getSearchEntry(emoji), query, words) : 0
      if (score === null) return
      matches.push({ emoji, score })
    })

    if (matches.length === 0) return

    if (query) {
      matches.sort(
        (a, b) =>
          a.score - b.score || nameOf(a.emoji).localeCompare(nameOf(b.emoji))
      )
    }

    _emojiData[key as GroupKeys] = matches.map(({ emoji }) => ({
      ...emoji,
      [EMOJI_RESULT_KEY]: applySkinTone(emoji, skinTone),
    }))
  })

  return _emojiData
}

/**
 * Check if the current platform is macOS.
 *
 * `navigator` is not defined in Node or in some workers, and optional chaining
 * does not guard an undeclared global, so the reference itself is guarded.
 */
export function isMac(): boolean {
  if (typeof navigator === 'undefined') return false

  const nav = navigator as Navigator & {
    userAgentData?: { platform?: string }
  }
  const platform = nav.userAgentData?.platform || nav.platform || 'unknown'
  return platform.toUpperCase().indexOf('MAC') !== -1
}

/**
 * Change snake case to capitalisk words, e.g. my_custom_group to My Custom Group
 *
 * @returns string
 */
export function snakeToCapitalizedCase(string: string) {
  return string.replace(/^_*(.)|_+(.)/g, (_s, c, d) =>
    c ? c.toUpperCase() : ' ' + d.toUpperCase()
  )
}
