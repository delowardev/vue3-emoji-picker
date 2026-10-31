import { afterEach, describe, expect, it } from 'vitest'
import {
  createPicker,
  LEGACY_MIGRATED_KEY,
  migrateLegacyRecents,
  RECENT_STORAGE_KEY,
} from '../core'

/**
 * Minimal IndexedDB stand-in holding the 1.1.x layout: database `EMJ`,
 * store `emojis`, one record `{ id: 0, value: JSON.stringify(recent) }`.
 */
function installLegacyDB(recent) {
  const state = { exists: recent !== undefined, deleted: false }

  const later = (req, result) =>
    setTimeout(() => {
      req.result = result
      req.onsuccess?.()
    })

  const db = {
    objectStoreNames: { contains: (name) => name === 'emojis' },
    transaction: () => ({
      objectStore: () => ({
        getAll() {
          const req = {}
          later(req, [{ id: 0, value: JSON.stringify(recent) }])
          return req
        },
      }),
    }),
    close() {},
  }

  globalThis.indexedDB = {
    databases: async () => (state.exists ? [{ name: 'EMJ', version: 3 }] : []),
    open() {
      const req = {}
      later(req, db)
      return req
    },
    deleteDatabase() {
      state.deleted = true
      state.exists = false
    },
  }

  return state
}

/** Isolated storage; createMemoryStorage() shares one map across calls. */
function createMemoryStorage() {
  const data = new Map()
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
  }
}

afterEach(() => {
  delete globalThis.indexedDB
})

describe('legacy IndexedDB recents', () => {
  it('moves 1.1.x recents into storage once and deletes the database', async () => {
    const db = installLegacyDB([
      { u: '1f600', n: ['grinning face'] },
      { u: '1f44d', n: ['thumbs up sign'] },
    ])
    const storage = createMemoryStorage()

    expect(await migrateLegacyRecents(storage)).toBe(true)
    expect(db.deleted).toBe(true)
    expect(
      JSON.parse(storage.getItem(RECENT_STORAGE_KEY)).map((e) => e.u)
    ).toEqual(['1f600', '1f44d'])
    expect(storage.getItem(LEGACY_MIGRATED_KEY)).toBe('1')

    // Second run is a no-op.
    expect(await migrateLegacyRecents(storage)).toBe(false)
  })

  it('keeps newer picks first and skips duplicates', async () => {
    installLegacyDB([{ u: '1f600' }, { u: '1f602' }])
    const storage = createMemoryStorage()
    storage.setItem(
      RECENT_STORAGE_KEY,
      JSON.stringify([{ u: '1f602', count: 3, at: 1000 }])
    )

    await migrateLegacyRecents(storage)

    const entries = JSON.parse(storage.getItem(RECENT_STORAGE_KEY))
    expect(entries.map((e) => e.u)).toEqual(['1f602', '1f600'])
    expect(entries[0].count).toBe(3)
  })

  it('does nothing without a legacy database or without IndexedDB', async () => {
    installLegacyDB(undefined)
    expect(await migrateLegacyRecents(createMemoryStorage())).toBe(false)

    delete globalThis.indexedDB
    expect(await migrateLegacyRecents(createMemoryStorage())).toBe(false)
  })

  it('is picked up by a picker using default storage', async () => {
    installLegacyDB([{ u: '1f44d' }])
    globalThis.window = { localStorage: createMemoryStorage() }

    try {
      const picker = createPicker({ recent: 'recent' })
      await new Promise((resolve) => picker.subscribe(resolve))

      expect(picker.getState().recent.map((e) => e.u)).toEqual(['1f44d'])
    } finally {
      delete globalThis.window
    }
  })
})
