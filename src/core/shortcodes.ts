import type { CustomCategory, Emoji, EmojiRecord } from './types'
import { customRecord } from './categories'
import { SKIN_TONES } from './constants'
import { defaultEmojis } from './dataset'
import { applySkinTone } from './skinTone'
import { unicodeToEmoji } from './unicode'

/**
 * Matches `:name:` optionally followed by a Slack-style `:skin-tone-N:`
 * suffix, e.g. `:wave:` or `:wave::skin-tone-3:`.
 */
const SHORTCODE_PATTERN = /:([a-z0-9_+-]+):(?::skin-tone-([2-6]):)?/gi

let defaultIndex: Map<string, Emoji> | null = null

function addToIndex(index: Map<string, Emoji>, record: EmojiRecord) {
  for (const group of Object.values(record)) {
    if (!Array.isArray(group)) continue

    for (const emoji of group) {
      if (!emoji || !Array.isArray(emoji.n)) continue

      // n[0] is the descriptive name; the rest are shortcodes.
      for (const name of emoji.n.slice(1)) {
        const key = String(name).toLowerCase()
        if (key && !index.has(key)) index.set(key, emoji)
      }
    }
  }
}

function getIndex(custom?: EmojiRecord): Map<string, Emoji> {
  if (!defaultIndex) {
    defaultIndex = new Map()
    addToIndex(defaultIndex, defaultEmojis)
  }

  if (!custom || Object.keys(custom).length === 0) return defaultIndex

  const index = new Map<string, Emoji>()
  addToIndex(index, custom)
  for (const [key, emoji] of defaultIndex) {
    if (!index.has(key)) index.set(key, emoji)
  }
  return index
}

export interface ShortcodeOptions {
  /** Skin tone unicode (e.g. `1f3fb`) applied when the code has none. */
  skinTone?: string
  /** Custom categories whose shortcodes should also resolve. */
  customCategories?: CustomCategory[]
}

function toneFromSuffix(suffix: string | undefined, fallback?: string) {
  // skin-tone-2 is the lightest tone, i.e. SKIN_TONES[1].
  return suffix ? SKIN_TONES[Number(suffix) - 1] : fallback
}

/**
 * Convert a single shortcode (`wave`, `:wave:`, `:+1::skin-tone-2:`) to its
 * native emoji. Returns an empty string for unknown codes.
 */
export function shortcodeToEmoji(
  shortcode: string,
  options: ShortcodeOptions = {}
): string {
  if (typeof shortcode !== 'string') return ''

  const trimmed = shortcode.trim()
  const wrapped = trimmed.startsWith(':') ? trimmed : `:${trimmed}:`
  const match = new RegExp(`^${SHORTCODE_PATTERN.source}$`, 'i').exec(wrapped)
  if (!match) return ''

  const emoji = getIndex(customRecord(options)).get(match[1].toLowerCase())
  if (!emoji) return ''

  const tone = toneFromSuffix(match[2], options.skinTone)
  return unicodeToEmoji(tone ? applySkinTone(emoji, tone) : emoji.u)
}

/**
 * Replace every known `:shortcode:` in a string with its native emoji.
 * Unknown codes are left untouched.
 */
export function replaceShortcodes(
  text: string,
  options: ShortcodeOptions = {}
): string {
  if (typeof text !== 'string' || !text.includes(':')) return text

  const index = getIndex(customRecord(options))

  return text.replace(SHORTCODE_PATTERN, (whole, name, suffix) => {
    const emoji = index.get(String(name).toLowerCase())
    if (!emoji) return whole

    const tone = toneFromSuffix(suffix, options.skinTone)
    return unicodeToEmoji(tone ? applySkinTone(emoji, tone) : emoji.u)
  })
}
