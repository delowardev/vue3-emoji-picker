import type {
  Emoji,
  EmojiOptions,
  EmojiPicker,
  PickerState,
  RecentMode,
} from './types'
import { DEFAULT_EMOJI, SKIN_TONE_NEUTRAL, SKIN_TONES } from './constants'
import { buildLookup, mergeEmojis } from './dataset'
import {
  customRecord,
  resolveCategories,
  resolveCategoryKeys,
} from './categories'
import { resolveI18n } from './i18n'
import { createRecents, MAX_RECENT } from './recents'
import { migrateLegacyRecents } from './legacy'
import { getDefaultStorage } from './storage'
import { filterEmojis } from './search'
import { toSelection } from './selection'

export const SKIN_TONE_STORAGE_KEY = 'vue3-emoji-picker.skin-tone'

/** A known skin tone, or `undefined` for anything else. */
function validTone(tone: unknown): string | undefined {
  return typeof tone === 'string' && SKIN_TONES.includes(tone)
    ? tone
    : undefined
}

export function createDefaultOptions(): EmojiOptions {
  return {
    theme: 'light',
    set: 'apple',
    imageUrl: null,
    perLine: 8,
    emojiSize: 22,
    searchPosition: 'top',
    navPosition: 'top',
    previewPosition: 'bottom',
    skinTonePosition: 'preview',
    categoryHeaders: 'sticky',
    categories: [],
    customCategories: [],
    categoryIcons: {},
    excludeEmojis: [],
    recent: 'none',
    maxRecent: MAX_RECENT,
    i18n: {},
    type: 'inline',
    insertMode: 'caret',
    placement: 'bottom-end',
    offset: 6,
    inputAttrs: {},
    autoFocus: false,
  }
}

/**
 * Create a framework-agnostic picker instance.
 *
 * The returned object owns all state and exposes a `subscribe` callback; it has
 * no dependency on Vue or any other view layer.
 */
export function createPicker(initial: Partial<EmojiOptions> = {}): EmojiPicker {
  let options: EmojiOptions = { ...createDefaultOptions(), ...initial }
  const listeners = new Set<(state: PickerState) => void>()
  let lookup = buildLookup(customRecord(options))

  const storage = options.storage ?? getDefaultStorage()
  const recents = createRecents({
    resolve: (unicode) => lookup.get(unicode),
    storage,
  })

  const recentView = () => ({
    mode: (options.recent === 'frequent' ? 'frequent' : 'recent') as RecentMode,
    max: options.maxRecent,
  })

  // An explicit `skinTone` option wins; otherwise restore the last pick.
  const state: PickerState = {
    search: '',
    skinTone:
      validTone(options.skinTone) ??
      validTone(storage.getItem(SKIN_TONE_STORAGE_KEY)) ??
      SKIN_TONE_NEUTRAL,
    activeGroup: '',
    hovered: DEFAULT_EMOJI as Emoji,
    recent: recents.list(recentView()),
    options,
  }

  const emit = () => {
    for (const listener of listeners) listener(state)
  }

  const saveSkinTone = (tone: unknown) => {
    state.skinTone = validTone(tone) ?? SKIN_TONE_NEUTRAL
    storage.setItem(SKIN_TONE_STORAGE_KEY, state.skinTone)
  }

  // A custom `storage` means the consumer owns persistence; otherwise pick
  // up recents saved by 1.1.x in IndexedDB once.
  if (!initial.storage) {
    migrateLegacyRecents(storage).then((changed) => {
      if (!changed) return
      recents.reload()
      state.recent = recents.list(recentView())
      emit()
    })
  }

  return {
    getState: () => state,

    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },

    setOptions(partial) {
      // Only a changed `skinTone` option moves the tone, so re-sending the
      // same options does not undo a pick made in the UI since.
      if (
        partial.skinTone !== undefined &&
        partial.skinTone !== options.skinTone
      ) {
        saveSkinTone(partial.skinTone)
      }
      options = { ...options, ...partial }
      state.options = options
      lookup = buildLookup(customRecord(options))
      state.recent = recents.list(recentView())
      emit()
    },

    setSearch(value) {
      state.search = value || ''
      emit()
    },

    setSkinTone(tone) {
      saveSkinTone(tone)
      emit()
    },

    setActiveGroup(key) {
      state.activeGroup = key || ''
      emit()
    },

    hover(emoji) {
      state.hovered = emoji || (DEFAULT_EMOJI as Emoji)
      emit()
    },

    select(emoji, { reorderRecent = true } = {}) {
      const payload = toSelection(emoji, state.skinTone)

      if (options.recent !== 'none') {
        const next = recents.add(emoji, recentView())
        // Picking from the recent group itself must not move the emoji
        // under the pointer (issue #75).
        if (reorderRecent) state.recent = next
      }

      emit()
      return payload
    },

    refreshRecent() {
      state.recent = recents.list(recentView())
      emit()
    },

    results() {
      const record = mergeEmojis(customRecord(options), state.recent)
      const visible = new Set(resolveCategoryKeys(options))

      return filterEmojis(
        record,
        state.search,
        state.skinTone,
        Object.keys(record).filter((key) => !visible.has(key)),
        options.excludeEmojis
      )
    },

    categories() {
      return resolveCategories(options)
    },

    i18n() {
      return resolveI18n(options.i18n)
    },

    destroy() {
      listeners.clear()
    },
  }
}
