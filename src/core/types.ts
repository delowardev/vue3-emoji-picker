import {
  EMOJI_NAME_KEY,
  EMOJI_RESULT_KEY,
  EMOJI_UNICODE_KEY,
  EMOJI_VARIATIONS_KEY,
} from './constants'

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
 * the picker adds it while filtering.
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
 * An emoji as emitted by `select`: the resolved unicode plus the active skin
 * tone and the native character are always present.
 */
export interface EmojiExt extends Emoji {
  [EMOJI_RESULT_KEY]: string
  [EMOJI_SKIN_TONE_KEY]: string
  [EMOJI_EMOJI_KEY]: string
}

export type EmojiRecord = Record<string, Emoji[]>

export interface StorageAdapter {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export interface EmojiOptions {
  native: boolean
  hideSearch: boolean
  hideGroupIcons: boolean
  hideGroupNames: boolean
  hideFooter: boolean
  staticTexts: Record<string, string>
  disableStickyGroupNames: boolean
  disabledGroups: string[]
  /** Unicode ids (e.g. `1f595`) to leave out of every group and search. */
  disabledEmojis: string[]
  groupNames: Record<string, string>
  disableSkinTones: boolean
  displayRecent: boolean
  additionalGroups: EmojiRecord
  groupOrder: string[]
  groupIcons: Record<string, string>
  mode: 'insert' | 'append' | 'prepend'
  offset: number
  placement: string
  inputAttrs: Record<string, unknown>
  colorTheme: ColorTheme
  /** Defaults to localStorage, falling back to in-memory. */
  storage?: StorageAdapter
}

export interface PickerState {
  search: string
  skinTone: string
  activeGroup: string
  hovered: Emoji
  recent: Emoji[]
  options: EmojiOptions
}

export interface EmojiPicker {
  /** Live state. Treat as read-only. */
  getState(): PickerState
  subscribe(listener: (state: PickerState) => void): () => void
  setOptions(options: Partial<EmojiOptions>): void
  setSearch(value: string): void
  setSkinTone(tone: string): void
  setActiveGroup(key: string): void
  hover(emoji: Emoji): void
  /**
   * Resolve the selection payload and record it as recent. Pass
   * `{ reorderRecent: false }` when the pick comes from the recent group so
   * the list does not shuffle under the pointer; the new order is persisted
   * and shown on the next `setOptions` or `refreshRecent`.
   */
  select(emoji: Emoji, options?: { reorderRecent?: boolean }): EmojiExt
  /** Re-read the recent list from storage into state. */
  refreshRecent(): void
  /** Emoji filtered by search, skin tone and disabled groups. */
  results(): EmojiRecord
  groups(): Array<{ key: string; title: string; u: string }>
  orderedGroupKeys(): string[]
  groupNames(): Record<string, string>
  destroy(): void
}

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
  updateSelect: (v: Emoji, fromRecent?: boolean) => void
  refreshRecent: () => void
  updateActiveGroup: (v: string) => void
  updateSkinTone: (v: string) => void
  updateOptions: (v: Record<string, any>) => void
}
