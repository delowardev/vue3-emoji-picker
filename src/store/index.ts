import { reactive, readonly, toRaw } from 'vue'
import { DEFAULT_EMOJI, SKIN_TONE_NEUTRAL } from '../constant'
import { Emoji, EmojiRecord, Group, State, Store } from '../types'
import emojis from '../data/emojis.json'
import _groups from '../data/groups.json'
import initialize, { DB_KEY, DB_VERSION, STORE_KEY } from './db'
import { openDB } from 'idb'

// init db
initialize()

const defaultOptions: Record<string, any> = {
  native: false,
  hideSearch: true,
  hideGroupIcons: false,
  hideGroupNames: false,
  staticTexts: {},
  disabledGroups: [],
  groupNames: {},
  displayRecent: false,
  additionalGroups: {},
  groupOrder: [],
  groupIcons: {},
}

async function getRecentEmojis() {
  const db = await openDB(DB_KEY, DB_VERSION)
  const store = db.transaction(STORE_KEY, 'readonly').objectStore(STORE_KEY)
  return await store.getAll()
}

export default function Store(): Store {
  const state = reactive<State>({
    search: '',
    emoji: DEFAULT_EMOJI,
    activeGroup: '',
    skinTone: SKIN_TONE_NEUTRAL,
    options: defaultOptions,
    additionalGroups: {} as EmojiRecord,
    recent: [],
    get emojis() {
      return {
        recent: this.recent,
        ...this.options.additionalGroups,
        ...emojis,
      } as EmojiRecord
    },
    get disabled() {
      let disabled = Array.isArray(this.options.disabledGroups)
        ? this.options.disabledGroups
        : []

      if (!this.options.displayRecent) {
        disabled = ['recent', ...disabled]
      }

      return disabled
    },
    get groups(): Group[] {
      return _groups.filter(
        (group) => !this.disabled.includes(group.key)
      ) as Group[]
    },
    get orderedGroupKeys() {
      const keys = [
        ...this.options.groupOrder,
        Object.keys(this.options.additionalGroups),
        ..._groups.map((group) => group.key),
      ]
      return [...new Set(keys)].filter((key) => !this.disabled.includes(key))
    },
  })

  /**
   * Setup necessary stuff once picker is ready.
   */
  function initialize() {
    // Setup initial recent emojis.
    if (state.options.displayRecent) {
      setInitialRecentEmojis()
    }
  }

  async function getRecent() {
    let recent = await getRecentEmojis()
    if (Array.isArray(recent) && recent.length) {
      recent = JSON.parse(recent[0]?.value || '')
    } else {
      recent = []
    }
    return recent
  }

  function setInitialRecentEmojis() {
    // set recent emojis once options is updated.
    getRecent().then((recent) => {
      state.recent = recent
      updateLocalStore()
    })
  }

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
    state.options = Object.assign({}, state.options, options)

    // Picker is ready 🎉
    initialize()
  }

  /**
   * Add emoji to idb.
   * @return void;
   */
  async function updateLocalStore() {
    const db = await openDB(DB_KEY, DB_VERSION)
    const store = db.transaction(STORE_KEY, 'readwrite').objectStore(STORE_KEY)
    store.put({
      id: 0,
      value: JSON.stringify(state.recent),
    })
    return
  }

  /**
   * Update selected emoji
   * @param emoji
   */
  const updateSelect = (emoji: Emoji) => {
    if (state.options.displayRecent !== true) return
    const index = state.recent.findIndex((item) => item.u === emoji.u)

    if (index > 0) state.recent.splice(index, 1) // remove duplicate
    if (index === 0) return // already in position

    const _emoji = { u: emoji.u, n: toRaw(emoji.n) } as Emoji

    state.recent = [_emoji, ...state.recent]
    // Maximum allowed recent items are 24
    if (state.recent.length > 24) state.recent.length = 24
    updateLocalStore()
  }

  return {
    state: readonly(state) as State,
    updateSearch,
    updateEmoji,
    updateActiveGroup,
    updateSkinTone,
    updateOptions,
    updateSelect,
  }
}
