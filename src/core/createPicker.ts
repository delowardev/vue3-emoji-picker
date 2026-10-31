import type {
  Emoji,
  EmojiExt,
  EmojiOptions,
  EmojiPicker,
  PickerState,
} from './types'
import { EMOJI_EMOJI_KEY, EMOJI_SKIN_TONE_KEY } from './types'
import {
  DEFAULT_EMOJI,
  EMOJI_RESULT_KEY,
  SKIN_TONE_NEUTRAL,
  STATIC_TEXTS,
} from './constants'
import { buildLookup, mergeEmojis } from './dataset'
import {
  disabledGroupsOf,
  resolveGroupNames,
  resolveGroups,
  resolveOrderedGroupKeys,
} from './groups'
import { createRecents, MAX_RECENT } from './recents'
import { filterEmojis } from './search'
import { applySkinTone } from './skinTone'
import { unicodeToEmoji } from './unicode'

export function createDefaultOptions(): EmojiOptions {
  return {
    native: false,
    hideSearch: false,
    hideGroupIcons: false,
    hideGroupNames: false,
    hideFooter: false,
    staticTexts: { ...STATIC_TEXTS },
    disableStickyGroupNames: false,
    disabledGroups: [],
    disabledEmojis: [],
    groupNames: {},
    disableSkinTones: false,
    displayRecent: false,
    additionalGroups: {},
    groupOrder: [],
    groupIcons: {},
    mode: 'insert',
    offset: 6,
    placement: 'bottom-end',
    inputAttrs: {},
    colorTheme: 'light',
    set: 'apple',
    imageUrl: null,
    perLine: 8,
    emojiSize: 22,
    recentMode: 'recent',
    maxRecent: MAX_RECENT,
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
  let lookup = buildLookup(options.additionalGroups)

  const recents = createRecents({
    resolve: (unicode) => lookup.get(unicode),
    storage: options.storage,
  })

  const recentView = () => ({
    mode: options.recentMode,
    max: options.maxRecent,
  })

  const state: PickerState = {
    search: '',
    skinTone: SKIN_TONE_NEUTRAL,
    activeGroup: '',
    hovered: DEFAULT_EMOJI as Emoji,
    recent: recents.list(recentView()),
    options,
  }

  const emit = () => {
    for (const listener of listeners) listener(state)
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
      options = { ...options, ...partial }
      state.options = options
      lookup = buildLookup(options.additionalGroups)
      state.recent = recents.list(recentView())
      emit()
    },

    setSearch(value) {
      state.search = value || ''
      emit()
    },

    setSkinTone(tone) {
      state.skinTone = tone || SKIN_TONE_NEUTRAL
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
      const resolved = applySkinTone(emoji, state.skinTone)
      const payload = {
        ...emoji,
        [EMOJI_RESULT_KEY]: resolved,
        [EMOJI_SKIN_TONE_KEY]: state.skinTone,
        [EMOJI_EMOJI_KEY]: unicodeToEmoji(resolved),
      } as EmojiExt

      if (options.displayRecent) {
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
      return filterEmojis(
        mergeEmojis(options.additionalGroups, state.recent),
        state.search,
        state.skinTone,
        disabledGroupsOf(options),
        options.disabledEmojis
      )
    },

    groups() {
      return resolveGroups(options)
    },

    orderedGroupKeys() {
      return resolveOrderedGroupKeys(options)
    },

    groupNames() {
      return resolveGroupNames(options)
    },

    destroy() {
      listeners.clear()
    },
  }
}
