import { reactive, readonly } from 'vue'
import {
  createPicker,
  disabledGroupsOf,
  resolveGroupNames,
  resolveOrderedGroupKeys,
} from '../core'
import type {
  Emoji,
  EmojiOptions,
  EmojiRecord,
  Group,
  State,
  Store,
} from '../types'
import emojis from '../data/emojis.json'
import _groups from '../data/groups.json'

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
    options: initial.options as unknown as Record<string, any>,
    additionalGroups: {} as EmojiRecord,
    recent: initial.recent,

    get emojis() {
      return {
        recent: this.recent,
        ...(this.options.additionalGroups || {}),
        ...emojis,
      } as EmojiRecord
    },

    get disabled() {
      return disabledGroupsOf(this.options as unknown as EmojiOptions)
    },

    get groups(): Group[] {
      return _groups.filter(
        (group) => !this.disabled.includes(group.key)
      ) as Group[]
    },

    get groupNames(): Record<string, string> {
      return resolveGroupNames(this.options as unknown as EmojiOptions)
    },

    get orderedGroupKeys() {
      return resolveOrderedGroupKeys(
        this.options as unknown as EmojiOptions,
        this.disabled
      )
    },
  })

  picker.subscribe((next) => {
    state.search = next.search
    state.emoji = next.hovered
    state.activeGroup = next.activeGroup
    state.skinTone = next.skinTone
    state.recent = next.recent
    state.options = next.options as unknown as Record<string, any>
  })

  return {
    state: readonly(state) as State,
    updateSearch: (value: string) => picker.setSearch(value),
    updateEmoji: (value: Emoji) => picker.hover(value),
    updateActiveGroup: (group: string) => picker.setActiveGroup(group),
    updateSkinTone: (tone = 'neutral') => picker.setSkinTone(tone),
    updateOptions: (options: Record<string, any>) =>
      picker.setOptions(options as Partial<EmojiOptions>),
    updateSelect: (emoji: Emoji) => {
      picker.select(emoji)
    },
  }
}
