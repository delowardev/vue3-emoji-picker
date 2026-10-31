import type { Emoji, EmojiExt } from './types'
import { applySkinTone } from './skinTone'
import { unicodeToEmoji } from './unicode'

/** Build the `select` payload: readable fields plus the 1.x short keys. */
export function toSelection(emoji: Emoji, skinTone: string): EmojiExt {
  const unicode = applySkinTone(emoji, skinTone)
  const names = Array.isArray(emoji.n) ? emoji.n : []
  const native = unicodeToEmoji(unicode)

  return {
    ...emoji,
    native,
    unicode,
    baseUnicode: emoji.u,
    name: names[0] || '',
    shortcodes: names.slice(1),
    skinTone,
    r: unicode,
    t: skinTone,
    i: native,
  }
}
