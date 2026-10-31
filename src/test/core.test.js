import { describe, expect, it, vi } from 'vitest'
import {
  applySkinTone,
  createMemoryStorage,
  createPicker,
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
    const first = createPicker({ storage, displayRecent: true })
    first.select(flat(first.results()).find((emoji) => emoji.u === '1f476'))

    const second = createPicker({ storage, displayRecent: true })

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

  it('resolves groups, names and order', () => {
    const picker = createPicker({
      storage: createMemoryStorage(),
      groupNames: { smileys_people: 'Faces' },
      additionalGroups: { my_custom_group: [{ n: ['x'], u: 'x' }] },
      groupOrder: ['flags'],
    })

    expect(picker.groupNames().smileys_people).toBe('Faces')
    expect(picker.groupNames().my_custom_group).toBe('My Custom Group')
    expect(picker.orderedGroupKeys()[0]).toBe('flags')
    expect(
      picker.groups().some((group) => group.key === 'my_custom_group')
    ).toBe(true)
  })

  it('excludes disabled groups', () => {
    const picker = createPicker({ storage: createMemoryStorage() })
    picker.setOptions({ disabledGroups: ['flags'] })

    expect(Object.keys(picker.results())).not.toContain('flags')
    expect(picker.orderedGroupKeys()).not.toContain('flags')
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
      disabledEmojis: ['1f44d'],
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
    const additionalGroups = {
      custom: [{ n: ['party', 'party_face'], u: '1f973' }],
    }

    expect(replaceShortcodes(':party_face:', { additionalGroups })).toBe(
      '\u{1f973}'
    )
  })
})
