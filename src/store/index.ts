import { reactive, readonly } from 'vue'
import { DEFAULT_EMOJI, SKIN_TONE_NEUTRAL } from '../constant'
import { Emoji, EmojiRecord, Group, State, Store } from '../types'
import emojis from '../data/emojis.json'
import _groups from '../data/groups.json'
import { snakeToCapitalizedCase } from '../helpers'
import { readJson, writeJson } from './storage'

const RECENT_STORAGE_KEY = 'recent'
const MAX_RECENT = 24

/**
 * A persisted recent selection.
 *
 * Only the unicode id is stored, so the emoji is resolved against the current
 * dataset at render time. That keeps the active skin tone correct (previously
 * the object had no variations, so recents always rendered neutral) and lets
 * removed emoji disappear instead of rendering as stale copies.
 */
export interface RecentEntry {
  /** Emoji unicode, the dataset key. */
  u: string
  /** Selection count, kept for frequency ordering later. */
  count: number
  /** Last selection timestamp, used for most-recently-used ordering. */
  at: number
}

const EMOJI_BY_UNICODE = new Map<string, Emoji>()
for (const group of Object.values(emojis as EmojiRecord)) {
  if (!Array.isArray(group)) continue
  for (const emoji of group) {
    if (emoji && typeof emoji.u === 'string') {
      EMOJI_BY_UNICODE.set(emoji.u, emoji)
    }
  }
}

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

function readRecentEntries(): RecentEntry[] {
  const stored = readJson<unknown>(RECENT_STORAGE_KEY, [])
  if (!Array.isArray(stored)) return []

  const entries: RecentEntry[] = []

  for (const value of stored) {
    if (!value || typeof value !== 'object') continue

    const entry = value as Partial<RecentEntry>
    if (typeof entry.u !== 'string' || !entry.u) continue

    entries.push({
      u: entry.u,
      count:
        typeof entry.count === 'number' && entry.count > 0 ? entry.count : 1,
      at: typeof entry.at === 'number' && entry.at > 0 ? entry.at : 0,
    })
  }

  return entries.slice(0, MAX_RECENT)
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
    get groupNames(): Record<string, string> {
      const names: Record<string, string> = { ...this.options.groupNames }
      const additional = this.options.additionalGroups

      if (additional && typeof additional === 'object') {
        for (const key of Object.keys(additional)) {
          if (!names[key]) names[key] = snakeToCapitalizedCase(key)
        }
      }

      return names
    },
    get orderedGroupKeys() {
      const keys = [
        ...this.options.groupOrder,
        ...Object.keys(this.options.additionalGroups),
        ..._groups.map((group) => group.key),
      ]
      return [...new Set(keys)].filter((key) => !this.disabled.includes(key))
    },
  })

  /** Persisted recents, in most-recently-used order. */
  let recentEntries: RecentEntry[] = []

  function lookup(): Map<string, Emoji> {
    const map = new Map(EMOJI_BY_UNICODE)
    const extra = state.options.additionalGroups as EmojiRecord | undefined

    if (extra && typeof extra === 'object') {
      for (const group of Object.values(extra)) {
        if (!Array.isArray(group)) continue
        for (const emoji of group) {
          if (emoji && typeof emoji.u === 'string') {
            map.set(emoji.u, emoji)
          }
        }
      }
    }

    return map
  }

  function resolveRecent(entries: RecentEntry[]): Emoji[] {
    const map = lookup()
    const resolved: Emoji[] = []

    for (const entry of entries) {
      const emoji = map.get(entry.u)
      if (emoji) resolved.push(emoji)
    }

    return resolved
  }

  /**
   * Setup necessary stuff once picker is ready.
   */
  function initializeOptions() {
    loadRecent()
  }

  function loadRecent(): void {
    if (state.options.displayRecent !== true) {
      recentEntries = []
      state.recent = []
      return
    }

    recentEntries = readRecentEntries()
    state.recent = resolveRecent(recentEntries)
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
    initializeOptions()
  }

  /**
   * Update selected emoji
   * @param emoji
   */
  const updateSelect = (emoji: Emoji) => {
    if (state.options.displayRecent !== true) return
    if (!emoji || typeof emoji.u !== 'string') return

    const existing = recentEntries.find((entry) => entry.u === emoji.u)
    const next: RecentEntry[] = [
      {
        u: emoji.u,
        count: (existing ? existing.count : 0) + 1,
        at: Date.now(),
      },
      ...recentEntries.filter((entry) => entry.u !== emoji.u),
    ].slice(0, MAX_RECENT)

    recentEntries = next
    state.recent = resolveRecent(next)
    writeJson(RECENT_STORAGE_KEY, next)
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
