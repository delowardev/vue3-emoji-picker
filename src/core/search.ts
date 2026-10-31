import type { Emoji, EmojiRecord, GroupKeys } from './types'
import { EMOJI_NAME_KEY, EMOJI_RESULT_KEY } from './constants'
import { applySkinTone } from './skinTone'

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
 * objects are stable references, so this survives callers building a fresh
 * record on every render.
 */
const searchCache = new WeakMap<object, SearchEntry>()

export function normalizeKeyword(value: string): string {
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
        .map((name) => normalizeKeyword(String(name)))
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
 * Filter emoji by search keyword.
 *
 * Matches against *every* alias, not just the canonical name, so shortcodes
 * such as `thumbsup`, `+1` and `joy_cat` are searchable.
 */
export function filterEmojis(
  emojis: EmojiRecord,
  keyword: string,
  skinTone: string,
  disabledGroups: string[] = [],
  disabledEmojis: string[] = []
): EmojiRecord {
  const result = {} as EmojiRecord
  const hidden = new Set(disabledEmojis)
  const query = normalizeKeyword(keyword || '')
  const words = query ? [...new Set(query.split(' '))] : []

  for (const key of Object.keys(emojis)) {
    if (disabledGroups.includes(key)) continue

    const group = emojis[key as GroupKeys]
    if (!Array.isArray(group)) continue

    const matches: Array<{ emoji: Emoji; score: number }> = []

    for (const emoji of group) {
      if (!emoji || typeof emoji !== 'object') continue
      if (hidden.has(emoji.u)) continue
      const score = query ? scoreEmoji(getSearchEntry(emoji), query, words) : 0
      if (score === null) continue
      matches.push({ emoji, score })
    }

    if (matches.length === 0) continue

    if (query) {
      matches.sort(
        (a, b) =>
          a.score - b.score || nameOf(a.emoji).localeCompare(nameOf(b.emoji))
      )
    }

    result[key as GroupKeys] = matches.map(({ emoji }) => ({
      ...emoji,
      [EMOJI_RESULT_KEY]: applySkinTone(emoji, skinTone),
    }))
  }

  return result
}

/** Alias with a clearer name for non-Vue consumers. */
export const searchEmojis = filterEmojis
