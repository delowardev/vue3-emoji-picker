import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import Store from '../store'
import { filterEmojis } from '../helpers'
import emojis from '../data/emojis.json'

const STORAGE_KEY = 'vue3-emoji-picker.recent'

let data

function installStorage() {
  data = new Map()
  globalThis.window = {
    localStorage: {
      getItem: (key) => (data.has(key) ? data.get(key) : null),
      setItem: (key, value) => {
        data.set(key, String(value))
      },
      removeItem: (key) => {
        data.delete(key)
      },
    },
  }
}

const findEmoji = (u) =>
  Object.values(emojis)
    .flat()
    .find((emoji) => emoji.u === u)

beforeEach(() => {
  installStorage()
})

afterEach(() => {
  delete globalThis.window
})

describe('recent emojis', () => {
  it('persists the unicode id and restores it in a new store', () => {
    const store = Store()
    store.updateOptions({ displayRecent: true })
    store.updateSelect(findEmoji('1f476'))

    expect(store.state.recent.map((emoji) => emoji.u)).toEqual(['1f476'])

    const reloaded = Store()
    reloaded.updateOptions({ displayRecent: true })

    expect(reloaded.state.recent.map((emoji) => emoji.u)).toEqual(['1f476'])
  })

  it('applies the active skin tone to restored recents', () => {
    const store = Store()
    store.updateOptions({ displayRecent: true })
    store.updateSelect(findEmoji('1f476'))

    const reloaded = Store()
    reloaded.updateOptions({ displayRecent: true })

    const result = filterEmojis(
      { recent: reloaded.state.recent },
      '',
      '1f3fb',
      []
    )
    const [restored] = result.recent

    expect(restored.r).toBe('1f476-1f3fb')
  })

  it('keeps most-recently-used order and de-duplicates', () => {
    const store = Store()
    store.updateOptions({ displayRecent: true })
    store.updateSelect(findEmoji('1f600'))
    store.updateSelect(findEmoji('1f601'))
    store.updateSelect(findEmoji('1f600'))

    expect(store.state.recent.map((emoji) => emoji.u)).toEqual([
      '1f600',
      '1f601',
    ])
  })

  it('does not reorder when picking from the recent group (#75)', () => {
    const store = Store()
    store.updateOptions({ displayRecent: true })
    store.updateSelect(findEmoji('1f600'))
    store.updateSelect(findEmoji('1f601'))

    store.updateSelect(findEmoji('1f600'), true)

    expect(store.state.recent.map((emoji) => emoji.u)).toEqual([
      '1f601',
      '1f600',
    ])

    store.refreshRecent()

    expect(store.state.recent.map((emoji) => emoji.u)).toEqual([
      '1f600',
      '1f601',
    ])
  })

  it('increments the stored selection count', () => {
    const store = Store()
    store.updateOptions({ displayRecent: true })
    store.updateSelect(findEmoji('1f600'))
    store.updateSelect(findEmoji('1f600'))

    const stored = JSON.parse(data.get(STORAGE_KEY))
    expect(stored[0]).toMatchObject({ u: '1f600', count: 2 })
  })

  it('caps the list at 24 entries', () => {
    const store = Store()
    store.updateOptions({ displayRecent: true })

    for (const emoji of Object.values(emojis).flat().slice(0, 30)) {
      store.updateSelect(emoji)
    }

    expect(store.state.recent).toHaveLength(24)
  })

  it('ignores corrupt storage instead of throwing', () => {
    data.set(STORAGE_KEY, '{not json')

    const store = Store()
    expect(() => store.updateOptions({ displayRecent: true })).not.toThrow()
    expect(store.state.recent).toEqual([])
  })

  it('resolves emoji coming from additional groups', () => {
    const custom = { n: ['party parrot'], u: 'parrot' }
    const store = Store()

    store.updateOptions({
      displayRecent: true,
      additionalGroups: { custom: [custom] },
    })
    store.updateSelect(custom)

    expect(store.state.recent[0].n[0]).toBe('party parrot')
  })

  it('does not throw without a window (SSR)', () => {
    delete globalThis.window

    const store = Store()
    expect(() => store.updateOptions({ displayRecent: true })).not.toThrow()
    expect(store.state.recent).toEqual([])
  })
})

describe('group names', () => {
  it('merges custom names and derives additional group names', () => {
    const store = Store()

    store.updateOptions({
      groupNames: { smileys_people: 'Faces' },
      additionalGroups: { my_custom_group: [{ n: ['x'], u: 'x' }] },
    })

    expect(store.state.groupNames.smileys_people).toBe('Faces')
    expect(store.state.groupNames.my_custom_group).toBe('My Custom Group')
  })

  it('reflects option updates after creation', () => {
    const store = Store()

    store.updateOptions({ native: false })
    expect(store.state.options.native).toBe(false)

    store.updateOptions({ native: true })
    expect(store.state.options.native).toBe(true)
  })
})
