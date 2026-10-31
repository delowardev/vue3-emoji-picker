import type { Emoji, RecentMode, StorageAdapter } from './types'
import { getDefaultStorage } from './storage'

export const RECENT_STORAGE_KEY = 'vue3-emoji-picker.recent'
export const MAX_RECENT = 24

/** Entries kept in storage, so `maxRecent` and `frequent` have history. */
export const MAX_STORED_RECENT = 100

export interface RecentView {
  mode?: RecentMode
  max?: number
}

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
  list(view?: RecentView): Emoji[]
  add(emoji: Emoji, view?: RecentView): Emoji[]
  /** Re-read entries from storage (e.g. after a migration wrote to it). */
  reload(): void
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
  const max = options.max ?? MAX_STORED_RECENT
  let entries = readEntries(storage, max)

  const list = ({
    mode = 'recent',
    max: limit = MAX_RECENT,
  }: RecentView = {}) => {
    const resolved: Emoji[] = []
    const ordered =
      mode === 'frequent'
        ? [...entries].sort((a, b) => b.count - a.count || b.at - a.at)
        : entries

    for (const entry of ordered) {
      if (resolved.length >= limit) break
      const emoji = options.resolve(entry.u)
      if (emoji) resolved.push(emoji)
    }

    return resolved
  }

  return {
    entries: () => entries,
    list,
    add(emoji: Emoji, view?: RecentView): Emoji[] {
      if (!emoji || typeof emoji.u !== 'string') return list(view)

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
      return list(view)
    },
    reload(): void {
      entries = readEntries(storage, max)
    },
    clear(): void {
      entries = []
      writeEntries(storage, entries)
    },
  }
}
