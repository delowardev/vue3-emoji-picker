import { reactive, readonly } from 'vue'
import {
  createPicker,
  customRecord,
  resolveCategories,
  resolveCategoryKeys,
  resolveCategoryNames,
  resolveI18n,
} from '../core'
import type {
  CategoryInfo,
  Emoji,
  EmojiOptions,
  EmojiRecord,
  I18n,
  State,
  Store,
} from '../types'
import emojis from '../data/emojis.json'

/**
 * Vue bridge over the framework-agnostic core.
 *
 * The core owns search, skin tones, recents and option resolution; this module
 * mirrors the core state into a Vue `reactive` object and forwards mutations.
 */
export default function Store(): Store {
  const picker = createPicker()
  const initial = picker.getState()

  const state = reactive<State>({
    search: initial.search,
    emoji: initial.hovered,
    activeGroup: initial.activeGroup,
    skinTone: initial.skinTone,
    options: initial.options,
    recent: initial.recent,

    get emojis() {
      return {
        recent: this.recent,
        ...customRecord(this.options),
        ...emojis,
      } as EmojiRecord
    },

    get categoryKeys(): string[] {
      return resolveCategoryKeys(this.options)
    },

    get categories(): CategoryInfo[] {
      return resolveCategories(this.options)
    },

    get categoryNames(): Record<string, string> {
      return resolveCategoryNames(this.options)
    },

    get i18n(): I18n {
      return resolveI18n(this.options.i18n)
    },
  })

  picker.subscribe((next) => {
    state.search = next.search
    state.emoji = next.hovered
    state.activeGroup = next.activeGroup
    state.skinTone = next.skinTone
    state.recent = next.recent
    state.options = next.options
  })

  return {
    state: readonly(state) as State,
    updateSearch: (value: string) => picker.setSearch(value),
    updateEmoji: (value: Emoji) => picker.hover(value),
    updateActiveGroup: (group: string) => picker.setActiveGroup(group),
    updateSkinTone: (tone = 'neutral') => picker.setSkinTone(tone),
    updateOptions: (options: Partial<EmojiOptions>) =>
      picker.setOptions(options),
    updateSelect: (emoji: Emoji, fromRecent = false) => {
      picker.select(emoji, { reorderRecent: !fromRecent })
    },
    refreshRecent: () => picker.refreshRecent(),
  }
}
