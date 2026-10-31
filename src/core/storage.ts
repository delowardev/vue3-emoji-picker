import type { StorageAdapter } from './types'

/**
 * In-memory storage. Used when localStorage is unavailable (SSR, Node,
 * workers, private-mode quota errors) so persistence degrades instead of
 * throwing. Module-level so values survive across picker instances.
 */
const memory = new Map<string, string>()

export function createMemoryStorage(): StorageAdapter {
  return {
    getItem: (key) => (memory.has(key) ? (memory.get(key) as string) : null),
    setItem: (key, value) => {
      memory.set(key, String(value))
    },
    removeItem: (key) => {
      memory.delete(key)
    },
  }
}

function resolveLocalStorage(): Storage | null {
  try {
    if (typeof localStorage !== 'undefined') return localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage
    }
  } catch {
    // Access can throw in sandboxed iframes or when storage is disabled.
  }

  return null
}

export function createLocalStorageAdapter(): StorageAdapter | null {
  const storage = resolveLocalStorage()
  if (!storage) return null

  return {
    getItem: (key) => {
      try {
        return storage.getItem(key)
      } catch {
        return null
      }
    },
    setItem: (key, value) => {
      try {
        storage.setItem(key, String(value))
      } catch {
        // Quota or private mode: ignore.
      }
    },
    removeItem: (key) => {
      try {
        storage.removeItem(key)
      } catch {
        // Ignore.
      }
    },
  }
}

/**
 * Resolved lazily (not at module scope) so a consumer that installs a
 * localStorage shim after import still gets persistence.
 */
export function getDefaultStorage(): StorageAdapter {
  return createLocalStorageAdapter() ?? createMemoryStorage()
}
