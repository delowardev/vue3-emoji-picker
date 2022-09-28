import { reactive, readonly, toRaw } from 'vue'
import { DEFAULT_EMOJI, SKIN_TONE_NEUTRAL } from '../constant'
import { Emoji, EmojiRecord, Group, GroupKeys, State, Store } from '../types'
import emojis from '../data/emojis.json'
import _groups from '../data/groups.json'
import initialize, { DB_KEY, DB_VERSION, STORE_KEY } from './db'
import { openDB } from 'idb'

const groupKeys = _groups.map((group) => group.key)

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
  disableRecent: false,
  additionalGroups: [],
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
        ...emojis,
      } as EmojiRecord
    },
    get groups(): Group[] {
      let disabled = Array.isArray(this.options.disabledGroups)
        ? this.options.disabledGroups
        : []

      if (this.options.disableRecent) {
        disabled = ['recent', ...disabled]
      }

      return _groups.filter((group) => !disabled.includes(group.key)) as Group[]
    },
  })

  /**
   * Setup necessary stuff once picker is ready.
   */
  function initialize() {
    // Setup initial recent emojis.
    if (!state.options.disableRecent) {
      setInitialRecentEmojis()
    }

    // Setup additional groups
    setupAdditionalGroups()
  }

  /**
   * Setup user defined additional groups
   */
  function setupAdditionalGroups() {
    const groups = state.options.additionalGroups
    let finalGroups = {} as EmojiRecord

    // exit if invalid groups.
    if (!Array.isArray(groups) || !groups.length) return

    for (let group of groups) {
      // group key validation.
      if (!group.key) {
        console.error(`additionalGroups: Group key is required.`)
        continue
      }

      if (groupKeys.includes(group.key)) {
        console.error(
          `additionalGroups: Please don't use reserved keys. Reserved keys are: ${groupKeys}`
        )
        continue
      }

      // group title validation
      if (!group.title) {
        console.error(`additionalGroups: Group title is required.`)
        continue
      }

      // group emojis validation
      if (!Array.isArray(group.emojis) || !group.emojis.length) {
        console.error(`additionalGroups: Invalid or empty emojis.`)
        continue
      }

      finalGroups = Object.assign({}, finalGroups, {
        [group.key]: group.emojis as Emoji[],
      })
    }

    state.additionalGroups = finalGroups
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
    state.options = Object.assign(state.options, options)

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
    if (state.options.disableRecent === true) return
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
