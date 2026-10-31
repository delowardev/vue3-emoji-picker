import type { I18n, I18nInput } from './types'

/** English strings; the default and the shape every locale follows. */
export const EN_I18N: I18n = {
  search: 'Search emoji',
  searchLabel: 'Search emoji',
  categoriesLabel: 'Emoji categories',
  noResults: 'No emoji found',
  skinTone: 'Skin tone',
  skinTones: [
    'Default',
    'Light',
    'Medium-light',
    'Medium',
    'Medium-dark',
    'Dark',
  ],
  categories: {
    recent: 'Recently used',
    smileys_people: 'Smileys & People',
    animals_nature: 'Animals & Nature',
    food_drink: 'Food & Drink',
    activities: 'Activities',
    travel_places: 'Travel & Places',
    objects: 'Objects',
    symbols: 'Symbols',
    flags: 'Flags',
  },
}

/** Merge partial strings over English. Empty values fall back too. */
export function resolveI18n(input: I18nInput = {}): I18n {
  const result: I18n = { ...EN_I18N, categories: { ...EN_I18N.categories } }

  for (const [key, value] of Object.entries(input || {})) {
    if (key === 'categories') continue
    if (key === 'skinTones') {
      if (Array.isArray(value) && value.length) {
        result.skinTones = EN_I18N.skinTones.map(
          (fallback, index) => (value as string[])[index] || fallback
        )
      }
      continue
    }
    if (typeof value === 'string' && value) {
      ;(result as unknown as Record<string, string>)[key] = value
    }
  }

  for (const [key, value] of Object.entries(input?.categories || {})) {
    if (typeof value === 'string' && value) result.categories[key] = value
  }

  return result
}
