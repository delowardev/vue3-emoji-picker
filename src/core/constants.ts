import type { ColorTheme } from './types'

export const EMOJI_REMOTE_SRC =
  'https://cdn.jsdelivr.net/npm/emoji-datasource-apple@6.0.1/img/apple/64'

export const EMOJI_UNICODE_KEY = 'u'
export const EMOJI_NAME_KEY = 'n'
export const EMOJI_VARIATIONS_KEY = 'v'
export const EMOJI_RESULT_KEY = 'r'

export const DEFAULT_EMOJI = {
  [EMOJI_NAME_KEY]: ['grinning face', 'grinning'],
  [EMOJI_UNICODE_KEY]: '1f600',
  [EMOJI_RESULT_KEY]: '1f600',
}

export const SKIN_TONE_NEUTRAL = 'neutral'
export const SKIN_TONE_LIGHT = '1f3fb'
export const SKIN_TONE_MEDIUM_LIGHT = '1f3fc'
export const SKIN_TONE_MEDIUM = '1f3fd'
export const SKIN_TONE_MEDIUM_DARK = '1f3fe'
export const SKIN_TONE_DARK = '1f3ff'

export const SKIN_TONES = [
  SKIN_TONE_NEUTRAL,
  SKIN_TONE_LIGHT,
  SKIN_TONE_MEDIUM_LIGHT,
  SKIN_TONE_MEDIUM,
  SKIN_TONE_MEDIUM_DARK,
  SKIN_TONE_DARK,
]

export const COLOR_THEMES: Array<ColorTheme> = ['light', 'dark', 'auto']
