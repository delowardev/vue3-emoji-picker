import type { Emoji, EmojiRecord, Group } from './types'
import emojis from '../data/emojis.json'
import groups from '../data/groups.json'

export const defaultEmojis = emojis as EmojiRecord

export const defaultGroups = groups as Group[]

/**
 * Build a unicode -> emoji lookup across the bundled dataset and any custom
 * groups. Custom groups are merged first so bundled emoji win on conflicts,
 * matching the order used by {@link mergeEmojis}.
 */
export function buildLookup(extra?: EmojiRecord): Map<string, Emoji> {
  const map = new Map<string, Emoji>()

  for (const record of [extra, defaultEmojis]) {
    if (!record) continue

    for (const group of Object.values(record)) {
      if (!Array.isArray(group)) continue

      for (const emoji of group) {
        if (emoji && typeof emoji.u === 'string') map.set(emoji.u, emoji)
      }
    }
  }

  return map
}

/** Record shape consumed by search: recent first, then custom, then bundled. */
export function mergeEmojis(
  custom: EmojiRecord | undefined,
  recent: Emoji[]
): EmojiRecord {
  return {
    recent,
    ...(custom || {}),
    ...defaultEmojis,
  }
}
