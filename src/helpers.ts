import { Emoji, EmojiRecord, Group, GroupKeys } from './types'
import {
  SKIN_TONE_NEUTRAL,
  EMOJI_VARIATIONS_KEY,
  EMOJI_UNICODE_KEY,
  EMOJI_NAME_KEY,
  EMOJI_RESULT_KEY,
} from './constant'

/**
 * Convert unicode to native emoji
 *
 * @param unicode - emoji unicode
 */
export function unicodeToEmoji(unicode: string) {
  return unicode
    .split('-')
    .map((hex) => parseInt(hex, 16))
    .map((hex) => String.fromCodePoint(hex))
    .join('')
}

/**
 * Filter emoji by search keyword
 *
 * @param emojis - Emoji data
 * @param keyword - filter keyword
 * @param skinTone - current skin tones
 * @param disabledGroups - groups to be excluded
 */
export function filterEmojis(
  emojis: EmojiRecord,
  keyword: string,
  skinTone: string,
  disabledGroups: Group[] = []
): EmojiRecord {
  const _emojiData = {} as EmojiRecord

  Object.keys(emojis).forEach((key) => {
    /**
     * Exclude disabled emoji group from the record
     */
    // @ts-ignore
    if (disabledGroups.includes(key)) {
      return
    }

    const _emojis: Emoji[] = []
    emojis[key as GroupKeys].forEach((emoji) => {
      // if search key match
      if (emoji[EMOJI_NAME_KEY][0].includes(keyword.toLocaleLowerCase())) {
        let result = emoji[EMOJI_UNICODE_KEY]

        // check skin tone
        if (
          skinTone !== SKIN_TONE_NEUTRAL &&
          Array.isArray(emoji[EMOJI_VARIATIONS_KEY])
        ) {
          const v_index =
            emoji[EMOJI_VARIATIONS_KEY]?.findIndex((v) =>
              v.includes(skinTone)
            ) || -1
          if (v_index !== -1 && emoji[EMOJI_VARIATIONS_KEY]) {
            // @ts-ignore
            result = emoji[EMOJI_VARIATIONS_KEY][v_index]
          }
        }

        return _emojis.push({
          ...emoji,
          [EMOJI_RESULT_KEY]: result,
        })
      }
    })

    if (_emojis.length) {
      _emojiData[key as GroupKeys] = _emojis
    }
  })
  return _emojiData
}

/**
 * Check if userAgent is mac.
 *
 * @return boolean;
 */
export function isMac() {
  let platform =
    // @ts-ignore
    navigator?.userAgentData?.platform || navigator?.platform || 'unknown'
  return platform.toUpperCase().indexOf('MAC') !== -1
}

/**
 * Sort ordening groups
 *
 * @return Array
 */
export function sortGroupOrdening(
  a: string,
  b: string,
  groupOrderArray: string[]
) {
  const aIdx = groupOrderArray.findIndex((g) => g === a)
  const bIdx = groupOrderArray.findIndex((g) => g === b)

  if (aIdx === -1) return 1
  if (bIdx === -1) return -1
  if (aIdx > bIdx) return 1
  if (aIdx < bIdx) return -1
  return 0
}
