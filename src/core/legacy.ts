import type { StorageAdapter } from './types'
import { RECENT_STORAGE_KEY } from './recents'

/** IndexedDB names used by 1.1.x to store recent emoji. */
export const LEGACY_DB_NAME = 'EMJ'
export const LEGACY_STORE_NAME = 'emojis'
export const LEGACY_MIGRATED_KEY = 'vue3-emoji-picker.migrated'

function request<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

/** Open the legacy database without creating it when it does not exist. */
function openExisting(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    const req = indexedDB.open(LEGACY_DB_NAME)
    let created = false

    req.onupgradeneeded = () => {
      // Only fires for a brand-new database: nothing to migrate.
      created = true
      req.transaction?.abort()
    }
    req.onsuccess = () => {
      if (created) {
        req.result.close()
        resolve(null)
      } else {
        resolve(req.result)
      }
    }
    req.onerror = () => resolve(null)
    req.onblocked = () => resolve(null)
  })
}

async function readLegacyUnicodes(): Promise<string[] | null> {
  if (typeof indexedDB.databases === 'function') {
    const databases = await indexedDB.databases()
    if (!databases.some((db) => db.name === LEGACY_DB_NAME)) return null
  }

  const db = await openExisting()
  if (!db) return null

  try {
    if (!db.objectStoreNames.contains(LEGACY_STORE_NAME)) return []

    const records = await request(
      db
        .transaction(LEGACY_STORE_NAME, 'readonly')
        .objectStore(LEGACY_STORE_NAME)
        .getAll()
    )
    const parsed = JSON.parse(records?.[0]?.value || '[]')

    return Array.isArray(parsed)
      ? parsed
          .map((item) => item && item.u)
          .filter((u): u is string => typeof u === 'string' && u !== '')
      : []
  } finally {
    db.close()
  }
}

/**
 * Move recent emoji saved by 1.1.x (IndexedDB) into the 1.2 storage format,
 * then delete the old database. Runs at most once per storage; never throws.
 *
 * @returns true when entries were added to `storage`.
 */
export async function migrateLegacyRecents(
  storage: StorageAdapter
): Promise<boolean> {
  try {
    if (typeof indexedDB === 'undefined') return false
    if (storage.getItem(LEGACY_MIGRATED_KEY)) return false
    // Mark first so concurrent pickers on one page don't migrate twice.
    storage.setItem(LEGACY_MIGRATED_KEY, '1')

    const legacy = await readLegacyUnicodes()
    if (legacy === null) return false

    indexedDB.deleteDatabase(LEGACY_DB_NAME)
    if (legacy.length === 0) return false

    let current: Array<{ u: string; count: number; at: number }> = []
    try {
      const parsed = JSON.parse(storage.getItem(RECENT_STORAGE_KEY) || '[]')
      if (Array.isArray(parsed)) current = parsed
    } catch {
      current = []
    }

    const known = new Set(current.map((entry) => entry && entry.u))
    // Older than anything picked since the upgrade, in the original order.
    const oldest = Math.min(Date.now(), ...current.map((e) => e.at || 0))
    const added = [...new Set(legacy)]
      .filter((u) => !known.has(u))
      .map((u, index) => ({ u, count: 1, at: oldest - 1 - index }))

    if (added.length === 0) return false

    storage.setItem(RECENT_STORAGE_KEY, JSON.stringify([...current, ...added]))
    return true
  } catch {
    return false
  }
}
