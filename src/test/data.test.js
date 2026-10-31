import { describe, it, expect } from 'vitest'
import emojis from '../data/emojis.json'
import groups from '../data/groups.json'
import { EMOJI_DATASOURCE_VERSION } from '../core/images'

const GROUP_KEYS = [
  'smileys_people',
  'animals_nature',
  'food_drink',
  'activities',
  'travel_places',
  'objects',
  'symbols',
  'flags',
]
const TONES = ['1f3fb', '1f3fc', '1f3fd', '1f3fe', '1f3ff']
const CODE = /^[0-9a-f]{4,5}(-[0-9a-f]{4,5})*$/

const all = Object.values(emojis).flat()

describe('bundled emoji data', () => {
  it('uses the expected group keys in order', () => {
    expect(Object.keys(emojis)).toEqual(GROUP_KEYS)
    expect(groups.map((group) => group.key)).toEqual(['recent', ...GROUP_KEYS])
    for (const key of GROUP_KEYS) expect(emojis[key].length).toBeGreaterThan(0)
  })

  it('has group icons that exist in the data', () => {
    const codes = new Set(all.map((emoji) => emoji.u))
    for (const group of groups) {
      expect(typeof group.title).toBe('string')
      if (group.key !== 'recent') expect(codes).toContain(group.u.toLowerCase())
    }
  })

  it('only uses the n, u and v fields', () => {
    for (const emoji of all) {
      expect(['n', 'u', 'v']).toEqual(
        expect.arrayContaining(Object.keys(emoji))
      )
    }
  })

  it('has a lowercase descriptive name for every emoji', () => {
    for (const emoji of all) {
      expect(Array.isArray(emoji.n)).toBe(true)
      expect(emoji.n[0]).toBeTruthy()
      expect(emoji.n[0]).toBe(emoji.n[0].toLowerCase())
    }
  })

  it('uses lowercase hyphenated codepoints for u and v', () => {
    for (const emoji of all) {
      expect(emoji.u).toMatch(CODE)
      for (const variation of emoji.v || []) expect(variation).toMatch(CODE)
    }
  })

  it('puts a skin-tone code in every variation', () => {
    for (const emoji of all.filter((emoji) => emoji.v)) {
      expect(emoji.v.length).toBeGreaterThan(0)
      for (const variation of emoji.v) {
        const tones = variation
          .split('-')
          .filter((part) => TONES.includes(part))
        expect(tones.length).toBeGreaterThan(0)
        // A variation is selected by a single tone, so it must not mix tones.
        expect(new Set(tones).size).toBe(1)
      }
    }
  })

  it('has no duplicate unicode', () => {
    const seen = new Set()
    for (const emoji of all) {
      for (const code of [emoji.u, ...(emoji.v || [])]) {
        expect(seen.has(code), code).toBe(false)
        seen.add(code)
      }
    }
  })

  it('has no shortcode shared by two emoji', () => {
    const owners = new Map()
    for (const emoji of all) {
      for (const shortcode of emoji.n.slice(1)) {
        expect(shortcode).toMatch(/^[a-z0-9_+-]+$/)
        const owner = owners.get(shortcode)
        expect(owner === undefined || owner === emoji.u, shortcode).toBe(true)
        owners.set(shortcode, emoji.u)
      }
    }
  })

  it('pins an exact emoji-datasource version', () => {
    expect(EMOJI_DATASOURCE_VERSION).toMatch(/^\d+\.\d+\.\d+$/)
  })
})
