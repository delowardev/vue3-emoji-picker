import { ColorTheme, Emoji, GroupNames } from './types'

export const EMOJI_REMOTE_SRC =
  'https://cdn.jsdelivr.net/npm/emoji-datasource-apple@6.0.1/img/apple/64'

// ./data/groups.json
export const GROUP_NAMES: GroupNames = {
  recent: 'Recently used',
  smileys_people: 'Smiles & People',
  animals_nature: 'Animals & Nature',
  food_drink: 'Food & Drink',
  activities: 'Activities',
  travel_places: 'Travel places',
  objects: 'Objects',
  symbols: 'Symbols',
  flags: 'Flags',
}

export const EMOJI_UNICODE_KEY = 'u'
export const EMOJI_NAME_KEY = 'n'
export const EMOJI_VARIATIONS_KEY = 'v'
export const EMOJI_RESULT_KEY = 'r'

export const DEFAULT_EMOJI: Emoji = {
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

export const STATIC_TEXTS = {
  placeholder: 'Search emoji',
  skinTone: 'Skin tone',
}

export const COLOR_THEMES: Array<ColorTheme> = ['light', 'dark', 'auto']
