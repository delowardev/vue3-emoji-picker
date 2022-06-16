import { reactive, readonly } from 'vue'
import { DEFAULT_EMOJI, SKIN_TONE_NEUTRAL } from '../constant'
import { Emoji, EmojiRecord, Group, State, Store } from '../types'
import emojis from '../data/emojis.json'
import _groups from '../data/groups.json'

const defaultOptions: Record<string, any> = {
  native: false,
  hideSearch: true,
  hideGroupIcons: false,
  hideGroupNames: false,
  staticTexts: {},
  disabledGroups: [],
  groupNames: {},
}

export default function Store(): Store {
  const state = reactive<State>({
    emojis: emojis as EmojiRecord,
    search: '',
    emoji: DEFAULT_EMOJI,
    activeGroup: '',
    skinTone: SKIN_TONE_NEUTRAL,
    options: defaultOptions,
    get groups(): Group[] {
      const disabled = Array.isArray(this.options.disabledGroups)
        ? this.options.disabledGroups
        : []
      return _groups.filter((group) => !disabled.includes(group.key)) as Group[]
    },
  })

  /**
   * Update search text.
   * @param value - string.
   */
  const updateSearch = (value: string) => {
    state.search = value
  }

  /**
   * Update currently selected emoji.
   * @param value - Emoji.
   */
  const updateEmoji = (value: Emoji) => {
    state.emoji = value
  }

  /**
   * Update active emoji group/category.
   * @param group - GroupName
   */
  const updateActiveGroup = (group: string) => {
    state.activeGroup = group
  }

  /**
   * Update emoji skin tone
   * @param tone - skin tone value
   */
  const updateSkinTone = (tone = SKIN_TONE_NEUTRAL) => {
    state.skinTone = tone
  }

  /**
   * Update/merge options.
   * @param options
   */
  const updateOptions = (options: Record<string, any>) => {
    state.options = Object.assign(state.options, options)
  }

  return {
    state: readonly(state) as State,
    updateSearch,
    updateEmoji,
    updateActiveGroup,
    updateSkinTone,
    updateOptions,
  }
}
