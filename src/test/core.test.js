import { describe, expect, it, vi } from 'vitest'
import {
  applySkinTone,
  createMemoryStorage,
  createPicker,
  getEmojiImageUrl,
  resolveEmojiImage,
  replaceShortcodes,
  searchEmojis,
  shortcodeToEmoji,
  unicodeToEmoji,
} from '../core'
import emojis from '../data/emojis.json'

const flat = (record) => Object.values(record).flat()

describe('core (framework-agnostic)', () => {
  it('filters without any view layer', () => {
    const picker = createPicker({ storage: createMemoryStorage() })
    picker.setSearch('thumbsup')

    const results = flat(picker.results())

    expect(results).toHaveLength(1)
    expect(results[0].u).toBe('1f44d')
  })

  it('applies skin tones', () => {
    const picker = createPicker({ storage: createMemoryStorage() })
    picker.setSkinTone('1f3fb')

    const baby = flat(picker.results()).find((emoji) => emoji.u === '1f476')

    expect(baby.r).toBe('1f476-1f3fb')
  })

  it('returns the payload a view layer needs on select', () => {
    const picker = createPicker({ storage: createMemoryStorage() })
    const thumbs = flat(picker.results()).find((emoji) => emoji.u === '1f44d')
    const payload = picker.select(thumbs)

    expect(payload.i).toBe('👍')
    expect(payload.t).toBe('neutral')
    expect(payload.r).toBe('1f44d')
  })

  it('persists recents across instances sharing storage', () => {
    const storage = createMemoryStorage()
    const first = createPicker({ storage, recent: 'recent' })
    first.select(flat(first.results()).find((emoji) => emoji.u === '1f476'))

    const second = createPicker({ storage, recent: 'recent' })

    expect(second.getState().recent.map((emoji) => emoji.u)).toEqual(['1f476'])
  })

  it('notifies subscribers until unsubscribed', () => {
    const picker = createPicker({ storage: createMemoryStorage() })
    const listener = vi.fn()
    const unsubscribe = picker.subscribe(listener)

    picker.setSearch('joy')
    expect(listener).toHaveBeenCalled()

    const calls = listener.mock.calls.length
    unsubscribe()
    picker.setSearch('cat')

    expect(listener.mock.calls.length).toBe(calls)
  })

  it('resolves categories, names and order', () => {
    const picker = createPicker({
      storage: createMemoryStorage(),
      i18n: { categories: { smileys_people: 'Faces' } },
      customCategories: [
        { key: 'my_custom_group', emojis: [{ name: 'x', unicode: 'x' }] },
        { key: 'team', name: 'Our team', emojis: [] },
      ],
      categories: ['flags', 'my_custom_group', 'team', 'smileys_people'],
    })
    const categories = picker.categories()

    expect(categories.map((c) => c.key)).toEqual([
      'flags',
      'my_custom_group',
      'team',
      'smileys_people',
    ])
    expect(categories[1].title).toBe('My Custom Group')
    expect(categories[2].title).toBe('Our team')
    expect(categories[3].title).toBe('Faces')
    expect(Object.keys(picker.results())).not.toContain('animals_nature')
  })

  it('shows every category by default, recent only when enabled', () => {
    const picker = createPicker({ storage: createMemoryStorage() })
    expect(picker.categories().map((c) => c.key)).not.toContain('recent')
    expect(picker.categories()).toHaveLength(8)

    picker.setOptions({ recent: 'frequent' })
    expect(picker.categories()[0].key).toBe('recent')
  })

  it('emits a readable selection payload', () => {
    const picker = createPicker({ storage: createMemoryStorage() })
    picker.setSkinTone('1f3fd')
    const thumbs = flat(picker.results()).find((emoji) => emoji.u === '1f44d')
    const payload = picker.select(thumbs)

    expect(payload).toMatchObject({
      native: '👍🏽',
      unicode: '1f44d-1f3fd',
      baseUnicode: '1f44d',
      name: 'thumbs up',
      skinTone: '1f3fd',
    })
    expect(payload.shortcodes).toContain('+1')
  })

  it('accepts readable custom emoji', () => {
    const picker = createPicker({
      storage: createMemoryStorage(),
      customCategories: [
        {
          key: 'team',
          emojis: [
            {
              name: 'party parrot',
              shortcodes: ['parrot'],
              unicode: 'x-parrot',
              src: '/p.gif',
            },
          ],
        },
      ],
    })
    picker.setSearch('parrot')
    const [parrot] = picker.results().team

    expect(parrot).toMatchObject({
      n: ['party parrot', 'parrot'],
      u: 'x-parrot',
      src: '/p.gif',
    })
    expect(picker.select(parrot)).toMatchObject({
      name: 'party parrot',
      src: '/p.gif',
    })
  })

  it('resolves i18n over English', () => {
    const picker = createPicker({
      storage: createMemoryStorage(),
      i18n: { search: 'Buscar', skinTones: ['Por defecto'] },
    })
    const i18n = picker.i18n()

    expect(i18n.search).toBe('Buscar')
    expect(i18n.noResults).toBe('No emoji found')
    expect(i18n.skinTones).toEqual([
      'Por defecto',
      'Light',
      'Medium-light',
      'Medium',
      'Medium-dark',
      'Dark',
    ])
    expect(i18n.categories.flags).toBe('Flags')
  })

  it('exposes the pure helpers too', () => {
    expect(unicodeToEmoji('1f602')).toBe('😂')

    const baby = emojis.smileys_people.find((emoji) => emoji.u === '1f476')
    expect(applySkinTone(baby, '1f3ff')).toContain('1f3ff')

    expect(flat(searchEmojis(emojis, 'joy_cat', 'neutral', []))).toHaveLength(1)
  })
})

describe('disabled emojis', () => {
  it('removes emoji by unicode from groups and search', () => {
    const picker = createPicker({
      storage: createMemoryStorage(),
      excludeEmojis: ['1f44d'],
    })

    expect(flat(picker.results()).some((emoji) => emoji.u === '1f44d')).toBe(
      false
    )

    picker.setSearch('thumbsup')
    expect(flat(picker.results())).toHaveLength(0)
  })
})

describe('shortcodes', () => {
  it('converts a single shortcode', () => {
    expect(shortcodeToEmoji('wave')).toBe('\u{1f44b}')
    expect(shortcodeToEmoji(':+1:')).toBe('\u{1f44d}')
    expect(shortcodeToEmoji(':nope:')).toBe('')
  })

  it('applies Slack-style and default skin tones', () => {
    expect(shortcodeToEmoji(':wave::skin-tone-2:')).toBe('\u{1f44b}\u{1f3fb}')
    expect(shortcodeToEmoji('wave', { skinTone: '1f3ff' })).toBe(
      '\u{1f44b}\u{1f3ff}'
    )
  })

  it('replaces shortcodes in text and keeps unknown ones', () => {
    expect(replaceShortcodes('hi :wave: at 10:30 :nope: :joy_cat:')).toBe(
      'hi \u{1f44b} at 10:30 :nope: \u{1f639}'
    )
  })

  it('resolves shortcodes from additional groups', () => {
    const customCategories = [
      { key: 'custom', emojis: [{ n: ['party', 'party_face'], u: '1f973' }] },
    ]
    expect(replaceShortcodes(':party_face:', { customCategories })).toBe(
      '\u{1f973}'
    )
  })
})

describe('recent modes', () => {
  const pick = (picker, u) =>
    picker.select(flat(picker.results()).find((emoji) => emoji.u === u))

  it('orders by frequency and caps by maxRecent', () => {
    const picker = createPicker({
      storage: createMemoryStorage(),
      recent: 'frequent',
      maxRecent: 2,
    })
    pick(picker, '1f600')
    pick(picker, '1f601')
    pick(picker, '1f601')
    pick(picker, '1f602')

    expect(picker.getState().recent.map((emoji) => emoji.u)).toEqual([
      '1f601',
      '1f602',
    ])

    picker.setOptions({ recent: 'recent', maxRecent: 3 })
    expect(picker.getState().recent.map((emoji) => emoji.u)).toEqual([
      '1f602',
      '1f601',
      '1f600',
    ])
  })
})

describe('image urls', () => {
  it('resolves sets, custom resolvers and custom src', () => {
    const emoji = { n: ['x'], u: '1f600' }
    expect(resolveEmojiImage(emoji, '1f600', { set: 'google' })).toBe(
      getEmojiImageUrl('1f600', 'google')
    )
    expect(resolveEmojiImage(emoji, '1f600', { set: 'native' })).toBe(null)
    expect(
      resolveEmojiImage(emoji, '1f600', { imageUrl: (u) => `/e/${u}` })
    ).toBe('/e/1f600')
    expect(resolveEmojiImage({ ...emoji, src: '/a.png' }, '1f600')).toBe(
      '/a.png'
    )
  })
})
