import { describe, it, expect } from 'vitest'
import {
  unicodeToEmoji,
  filterEmojis,
  snakeToCapitalizedCase,
} from '../helpers'
import emojis from '../data/emojis.json'

describe('helpers', () => {
  // Test unicodeToEmoji
  it('unicodeToEmoji: test valid input', () => {
    expect(unicodeToEmoji('1f602')).toBe('😂')
  })

  // Test filterEmojis
  it('filterEmojis: test search result', () => {
    const result = filterEmojis(emojis, 'grinning face', 'neutral', [])
    expect(result).toStrictEqual({
      smileys_emotion: [
        {
          n: ['grinning face', 'grinning', 'grinning_face'],
          r: '1f600',
          u: '1f600',
        },
        {
          n: [
            'grinning face with big eyes',
            'smiley',
            'grinning_face_with_big_eyes',
          ],
          r: '1f603',
          u: '1f603',
        },
        {
          n: [
            'grinning face with smiling eyes',
            'smile',
            'grinning_face_with_smiling_eyes',
          ],
          r: '1f604',
          u: '1f604',
        },
        {
          n: [
            'grinning face with sweat',
            'sweat_smile',
            'grinning_face_with_sweat',
          ],
          r: '1f605',
          u: '1f605',
        },
      ],
    })
  })

  // Test snakeToCapitalizedCase
  it('snakeToCapitalizedCase: Test valid input', () => {
    expect(snakeToCapitalizedCase('hello_world_a')).toBe('Hello World A')
  })
})
