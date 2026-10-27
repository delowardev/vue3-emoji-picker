import type { Emoji, StorageAdapter } from './types'
import { getDefaultStorage } from './storage'

export const RECENT_STORAGE_KEY = 'vue3-emoji-picker.recent'
export const MAX_RECENT = 24

/**
 * A persisted recent selection.
 *
 * Only the unicode id is stored, so the emoji is resolved against the current
 * dataset at render time. That keeps the active skin tone correct and lets
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

export interface Recents {
  entries(): RecentEntry[]
  list(): Emoji[]
  add(emoji: Emoji): Emoji[]
  clear(): void
}

export interface RecentsOptions {
  resolve: (unicode: string) => Emoji | undefined
  storage?: StorageAdapter
  max?: number
}

function readEntries(storage: StorageAdapter, max: number): RecentEntry[] {
  let raw: string | null = null

  try {
    raw = storage.getItem(RECENT_STORAGE_KEY)
  } catch {
    return []
  }

  if (!raw) return []

  let stored: unknown
  try {
    stored = JSON.parse(raw)
  } catch {
    return []
  }

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

  return entries.slice(0, max)
}

function writeEntries(storage: StorageAdapter, entries: RecentEntry[]): void {
  try {
    storage.setItem(RECENT_STORAGE_KEY, JSON.stringify(entries))
  } catch {
    // Storage unavailable: recents simply do not persist.
  }
}

export function createRecents(options: RecentsOptions): Recents {
  const storage = options.storage ?? getDefaultStorage()
  const max = options.max ?? MAX_RECENT
  let entries = readEntries(storage, max)

  const list = (): Emoji[] => {
    const resolved: Emoji[] = []

    for (const entry of entries) {
      const emoji = options.resolve(entry.u)
      if (emoji) resolved.push(emoji)
    }

    return resolved
  }

  return {
    entries: () => entries,
    list,
    add(emoji: Emoji): Emoji[] {
      if (!emoji || typeof emoji.u !== 'string') return list()

      const existing = entries.find((entry) => entry.u === emoji.u)
      entries = [
        {
          u: emoji.u,
          count: (existing ? existing.count : 0) + 1,
          at: Date.now(),
        },
        ...entries.filter((entry) => entry.u !== emoji.u),
      ].slice(0, max)

      writeEntries(storage, entries)
      return list()
    },
    clear(): void {
      entries = []
      writeEntries(storage, entries)
    },
  }
}
