import {
  EMOJI_NAME_KEY,
  EMOJI_RESULT_KEY,
  EMOJI_UNICODE_KEY,
  EMOJI_VARIATIONS_KEY,
} from './constant'

export type GroupKeys =
  | 'smileys_people'
  | 'animals_nature'
  | 'food_drink'
  | 'activities'
  | 'travel_places'
  | 'objects'
  | 'symbols'
  | 'flags'
  | 'recent'

export type ColorTheme = 'dark' | 'light' | 'auto'

export type GroupNames = Record<GroupKeys, string>

export interface Group {
  key: GroupKeys
  title: string
  u: string
}

/**
 * An emoji record as accepted in `additionalGroups`.
 *
 * `r` (the resolved unicode for the active skin tone) is optional on input —
 * the picker adds it while filtering. Requiring it made the type impossible to
 * construct from the shape documented in the README.
 */
export interface Emoji {
  [EMOJI_NAME_KEY]: string[]
  [EMOJI_UNICODE_KEY]: string
  [EMOJI_VARIATIONS_KEY]?: string[]
  [EMOJI_RESULT_KEY]?: string
  src?: string
}

export const EMOJI_SKIN_TONE_KEY = 't'

export const EMOJI_EMOJI_KEY = 'i'

/**
 * An emoji as emitted by the `select` event: the resolved unicode plus the
 * active skin tone and the native character are always present.
 */
export interface EmojiExt extends Emoji {
  [EMOJI_RESULT_KEY]: string
  [EMOJI_SKIN_TONE_KEY]: string
  [EMOJI_EMOJI_KEY]: string
}

export type EmojiRecord = Record<string, Emoji[]>

export interface State {
  groups: Group[]
  emojis: EmojiRecord
  additionalGroups: EmojiRecord
  search: string
  emoji: Emoji
  activeGroup: string
  skinTone: string
  options: Record<string, any>
  recent: Emoji[]
  /** Resolved display names, including additional groups. */
  groupNames: Record<string, string>
  orderedGroupKeys: string[]
  disabled: string[]
}

export interface Store {
  state: State
  updateSearch: (v: string) => void
  updateEmoji: (v: Emoji) => void
  updateSelect: (v: Emoji) => void
  updateActiveGroup: (v: string) => void
  updateSkinTone: (v: string) => void
  updateOptions: (v: Record<string, any>) => void
}
