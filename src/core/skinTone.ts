import type { Emoji } from './types'
import {
  EMOJI_UNICODE_KEY,
  EMOJI_VARIATIONS_KEY,
  SKIN_TONE_NEUTRAL,
} from './constants'

/**
 * Resolve the unicode for the requested skin tone.
 *
 * Variations are matched by their tone segment rather than by array position —
 * relying on the index silently dropped the first tone (`0 || -1` is `-1`).
 */
export function applySkinTone(emoji: Emoji, skinTone: string): string {
  const base = emoji[EMOJI_UNICODE_KEY]
  if (!skinTone || skinTone === SKIN_TONE_NEUTRAL) return base

  const variations = emoji[EMOJI_VARIATIONS_KEY]
  if (!Array.isArray(variations)) return base

  const match = variations.find((variation) =>
    variation.split('-').includes(skinTone)
  )
  return match || base
}
