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
export { createRecents, RECENT_STORAGE_KEY, MAX_RECENT } from './recents'
export type { RecentEntry, Recents, RecentsOptions } from './recents'
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
  disabledGroupsOf,
  resolveGroupNames,
  resolveOrderedGroupKeys,
  resolveGroups,
} from './groups'
