export * from './types'
export * from './constants'

export { unicodeToEmoji } from './unicode'
export { applySkinTone } from './skinTone'
export { snakeToCapitalizedCase } from './names'
export { filterEmojis, searchEmojis, normalizeKeyword } from './search'
export { isMac, hasIndexedDB } from './environment'
export { shortcodeToEmoji, replaceShortcodes } from './shortcodes'
export type { ShortcodeOptions } from './shortcodes'

export { createPicker, createDefaultOptions } from './createPicker'
export {
  createRecents,
  RECENT_STORAGE_KEY,
  MAX_RECENT,
  MAX_STORED_RECENT,
} from './recents'
export type {
  RecentEntry,
  Recents,
  RecentsOptions,
  RecentView,
} from './recents'
export {
  EMOJI_SETS,
  EMOJI_DATASOURCE_VERSION,
  getEmojiImageUrl,
  resolveEmojiImage,
} from './images'
export type { ImageResolverOptions } from './images'
export {
  migrateLegacyRecents,
  LEGACY_DB_NAME,
  LEGACY_STORE_NAME,
  LEGACY_MIGRATED_KEY,
} from './legacy'
export {
  createMemoryStorage,
  createLocalStorageAdapter,
  getDefaultStorage,
} from './storage'
export {
  defaultEmojis,
  defaultGroups,
  buildLookup,
  mergeEmojis,
} from './dataset'
export {
  BUILTIN_CATEGORIES,
  RECENT_CATEGORY,
  customRecord,
  normalizeEmoji,
  resolveCategories,
  resolveCategoryKeys,
  resolveCategoryNames,
  customCategoryIcons,
} from './categories'
export { EN_I18N, resolveI18n } from './i18n'
export { toSelection } from './selection'
