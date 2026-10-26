import { describe, it, expect } from 'vitest'
import { filterEmojis, unicodeToEmoji } from '../helpers'
import emojis from '../data/emojis.json'

const flatten = (record) => Object.values(record).flat()
const search = (query) => flatten(filterEmojis(emojis, query, 'neutral', []))

const TONES = ['1f3fb', '1f3fc', '1f3fd', '1f3fe', '1f3ff']

describe('skin tones', () => {
  it('applies every tone to every tone-capable emoji', () => {
    for (const tone of TONES) {
      const capable = flatten(filterEmojis(emojis, '', tone, [])).filter(
        (emoji) => Array.isArray(emoji.v)
      )

      expect(capable.length).toBe(212)

      for (const emoji of capable) {
        // Regression: `findIndex(...) || -1` collapsed index 0 to -1 and
        // silently dropped the lightest tone for all 212 emoji.
        expect(emoji.r).toContain(tone)
      }
    }
  })

  it('keeps the base unicode for the neutral tone', () => {
    for (const emoji of flatten(filterEmojis(emojis, '', 'neutral', []))) {
      expect(emoji.r).toBe(emoji.u)
    }
  })

  it('falls back to the base unicode when a tone is unavailable', () => {
    const emoji = { n: ['test'], u: '1f600' }
    const [result] = flatten(filterEmojis({ test: [emoji] }, '', '1f3fb', []))
    expect(result.r).toBe('1f600')
  })
})

describe('alias search', () => {
  it('finds emoji by shortcode alias', () => {
    const cases = [
      ['thumbsup', '1f44d'],
      ['+1', '1f44d'],
      ['thumbs up', '1f44d'],
      ['joy_cat', '1f639'],
    ]

    for (const [query, unicode] of cases) {
      const results = search(query)
      expect(
        results.some((emoji) => emoji.u === unicode),
        `searching "${query}" should find ${unicode}`
      ).toBe(true)
    }
  })

  it('ranks an exact alias match first', () => {
    const [first] = search('joy')
    expect(first.n[0]).toBe('face with tears of joy')
  })

  it('is case insensitive', () => {
    expect(search('THUMBSUP').map((emoji) => emoji.u)).toEqual(
      search('thumbsup').map((emoji) => emoji.u)
    )
  })

  it('returns nothing for an unknown keyword', () => {
    expect(search('zzzznotanemoji')).toEqual([])
  })

  it('excludes disabled groups', () => {
    const result = filterEmojis(emojis, '', 'neutral', ['flags'])
    expect(Object.keys(result)).not.toContain('flags')
  })
})

describe('unicodeToEmoji', () => {
  it('converts a single code point', () => {
    expect(unicodeToEmoji('1f602')).toBe('😂')
  })

  it('converts a sequence', () => {
    expect(unicodeToEmoji('1f1fa-1f1f8')).toBe('🇺🇸')
  })

  it('returns an empty string instead of throwing on bad input', () => {
    expect(unicodeToEmoji('')).toBe('')
    expect(unicodeToEmoji('not-hex')).toBe('')
    expect(unicodeToEmoji(undefined)).toBe('')
  })
})

describe('malformed additionalGroups', () => {
  it('skips invalid entries instead of throwing', () => {
    const groups = { custom: [null, undefined, { u: '1f600' }] }

    expect(() => filterEmojis(groups, 'face', 'neutral', [])).not.toThrow()
    expect(() => filterEmojis(groups, '', 'neutral', [])).not.toThrow()
  })
})
