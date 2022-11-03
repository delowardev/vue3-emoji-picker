import { describe, it, expect } from 'vitest'
import { unicodeToEmoji, filterEmojis } from '../helpers'
import emojis from '../data/emojis.json'

describe('helpers', () => {
  // Test unicodeToEmoji
  it('unicodeToEmoji: test valid input', () => {
    expect(unicodeToEmoji('1f602')).toBe('😂')
  })

  // Test filterEmojis
  it('filterEmojis: test search result', () => {
    const result = filterEmojis(emojis, 'face with tears of joy', 'neutral', [])
    expect(result).toStrictEqual({
      smileys_people: [
        {
          n: ['face with tears of joy', 'joy'],
          r: '1f602',
          u: '1f602',
        },
        {
          n: ['cat face with tears of joy', 'joy_cat'],
          r: '1f639',
          u: '1f639',
        },
      ],
    })
  })
})
