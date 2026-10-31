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

/** Artwork used to render emoji. `native` uses the system font. */
export type EmojiSet = 'native' | 'apple' | 'google' | 'twitter' | 'facebook'

/** `recent`: most recently used first. `frequent`: most used first. */
export type RecentMode = 'recent' | 'frequent'

export type GroupNames = Record<GroupKeys, string>

export interface Group {
  key: GroupKeys
  title: string
  u: string
}

/**
 * An emoji in the dataset's compact shape: `n` names (descriptive name,
 * then shortcodes), `u` unicode, `v` skin tone variations.
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
 * The `select` payload.
 *
 * Readable fields (`native`, `unicode`, `name`, …) are the 2.x API. The
 * single-letter keys are kept for 1.x compatibility and will be removed in
 * 3.0: `i` = native, `r` = unicode, `n` = [name, ...shortcodes], `t` =
 * skinTone, `u` = unicode without skin tone.
 */
export interface EmojiExt extends Emoji {
  /** The emoji character, e.g. "👍🏽". */
  native: string
  /** Unicode sequence including the skin tone, e.g. "1f44d-1f3fd". */
  unicode: string
  /** Unicode sequence without skin tone, e.g. "1f44d". */
  baseUnicode: string
  /** Descriptive name, e.g. "thumbs up". */
  name: string
  /** Shortcodes without colons, e.g. ["+1", "thumbsup"]. */
  shortcodes: string[]
  /** Active skin tone: "neutral" or a modifier such as "1f3fd". */
  skinTone: string
  /** Image URL for custom emoji. */
  src?: string
  /** @deprecated use `unicode` */
  [EMOJI_RESULT_KEY]: string
  /** @deprecated use `skinTone` */
  [EMOJI_SKIN_TONE_KEY]: string
  /** @deprecated use `native` */
  [EMOJI_EMOJI_KEY]: string
}

export type EmojiRecord = Record<string, Emoji[]>

export interface StorageAdapter {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

/** Every user-facing string. Pass a partial object to override some. */
export interface I18n {
  /** Search input placeholder. */
  search: string
  /** Accessible label of the search input. */
  searchLabel: string
  /** Accessible label of the category bar. */
  categoriesLabel: string
  noResults: string
  /** Skin tone button text. */
  skinTone: string
  /** Names of the six skin tones, from default to dark. */
  skinTones: string[]
  /** Category names by key, including custom categories. */
  categories: Record<string, string>
}

export type I18nInput = Partial<Omit<I18n, 'categories'>> & {
  categories?: Record<string, string>
}

/**
 * A custom emoji. Readable keys are preferred; the short keys used by the
 * bundled dataset (`n`, `u`, `v`) are also accepted.
 */
export interface CustomEmoji {
  /** Descriptive name, e.g. "party parrot". */
  name?: string
  /** Shortcodes without colons, e.g. ['party_parrot']. */
  shortcodes?: string[]
  /** Unique id; a unicode sequence for real emoji. */
  unicode?: string
  /** Skin tone variations (unicode sequences). */
  skins?: string[]
  /** Image URL. Rendered instead of the native glyph or image set. */
  src?: string
  n?: string[]
  u?: string
  v?: string[]
}

export interface CustomCategory {
  /** Unique key, also usable in `categories` and `i18n.categories`. */
  key: string
  name?: string
  /** Icon URL for the category bar. */
  icon?: string
  emojis: Array<CustomEmoji | Emoji>
}

export type PickerType = 'inline' | 'input' | 'textarea'
export type InsertMode = 'caret' | 'append' | 'prepend'

export interface EmojiOptions {
  theme: ColorTheme
  /** Artwork; `native` uses the system font. */
  set: EmojiSet
  /** Custom image URL resolver; overrides `set`. */
  imageUrl: ((unicode: string) => string) | null
  /** Emoji per row. */
  perLine: number
  /** Emoji font/image size in px. */
  emojiSize: number

  searchPosition: 'top' | 'none'
  navPosition: 'top' | 'none'
  previewPosition: 'bottom' | 'none'
  skinTonePosition: 'preview' | 'none'
  categoryHeaders: 'sticky' | 'static' | 'none'

  /**
   * Categories to show, in order, e.g. `['recent', 'smileys_people']`.
   * Empty shows everything: recent, custom categories, then built-ins.
   */
  categories: string[]
  customCategories: CustomCategory[]
  /** Icon URL per category key. */
  categoryIcons: Record<string, string>
  /** Unicode ids (e.g. `1f595`) to leave out everywhere. */
  excludeEmojis: string[]

  recent: 'none' | RecentMode
  /** Maximum number of recent emoji shown. */
  maxRecent: number

  i18n: I18nInput

  type: PickerType
  insertMode: InsertMode
  /** Popup placement for input/textarea types (Popper placement). */
  placement: string
  /** Popup offset in px for input/textarea types. */
  offset: number
  /** Attributes bound to the input/textarea. */
  inputAttrs: Record<string, unknown>
  /** Focus search on mount (inline) or when the popup opens. */
  autoFocus: boolean

  /** Defaults to localStorage, falling back to in-memory. */
  storage?: StorageAdapter
}

export interface CategoryInfo {
  key: string
  title: string
  /** Built-in icon unicode; empty for custom categories. */
  u: string
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
   * `{ reorderRecent: false }` when the pick comes from the recent category
   * so the list does not shuffle under the pointer; the new order is
   * persisted and shown on the next `setOptions` or `refreshRecent`.
   */
  select(emoji: Emoji, options?: { reorderRecent?: boolean }): EmojiExt
  /** Re-read the recent list from storage into state. */
  refreshRecent(): void
  /** Emoji filtered by search, skin tone, categories and exclusions. */
  results(): EmojiRecord
  /** Visible categories in display order, with resolved names. */
  categories(): CategoryInfo[]
  /** Resolved strings. */
  i18n(): I18n
  destroy(): void
}

export interface State {
  emojis: EmojiRecord
  search: string
  emoji: Emoji
  activeGroup: string
  skinTone: string
  options: EmojiOptions
  recent: Emoji[]
  /** Visible category keys in display order. */
  categoryKeys: string[]
  /** Visible categories with resolved names. */
  categories: CategoryInfo[]
  /** Resolved category names by key. */
  categoryNames: Record<string, string>
  /** Resolved strings. */
  i18n: I18n
}

export interface Store {
  state: State
  updateSearch: (v: string) => void
  updateEmoji: (v: Emoji) => void
  updateSelect: (v: Emoji, fromRecent?: boolean) => void
  refreshRecent: () => void
  updateActiveGroup: (v: string) => void
  updateSkinTone: (v: string) => void
  updateOptions: (v: Partial<EmojiOptions>) => void
}
