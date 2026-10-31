import type {
  CategoryInfo,
  CustomCategory,
  CustomEmoji,
  Emoji,
  EmojiOptions,
  EmojiRecord,
} from './types'
import { defaultGroups } from './dataset'
import { resolveI18n } from './i18n'
import { snakeToCapitalizedCase } from './names'

export const RECENT_CATEGORY = 'recent'

/** Built-in category keys in dataset order, without `recent`. */
export const BUILTIN_CATEGORIES: string[] = defaultGroups
  .map((group) => group.key as string)
  .filter((key) => key !== RECENT_CATEGORY)

/**
 * Accept a custom emoji in the readable shape (`name`, `shortcodes`,
 * `unicode`, `skins`) or the compact dataset shape (`n`, `u`, `v`).
 */
export function normalizeEmoji(input: CustomEmoji | Emoji): Emoji | null {
  if (!input || typeof input !== 'object') return null

  const value = input as CustomEmoji
  const u = value.unicode ?? value.u
  if (typeof u !== 'string' || !u) return null

  const names = Array.isArray(value.n)
    ? value.n
    : [value.name || u, ...(value.shortcodes || [])]
  const emoji: Emoji = { n: names.map(String), u }

  const v = value.skins ?? value.v
  if (Array.isArray(v) && v.length) emoji.v = v
  if (value.src) emoji.src = value.src

  return emoji
}

const recordCache = new WeakMap<CustomCategory[], EmojiRecord>()

/** Custom categories as an emoji record keyed by category key. */
export function customRecord(options: {
  customCategories?: CustomCategory[]
}): EmojiRecord {
  const categories = options.customCategories
  if (!Array.isArray(categories) || categories.length === 0) return {}

  const cached = recordCache.get(categories)
  if (cached) return cached

  const record: EmojiRecord = {}
  for (const category of categories) {
    if (!category || typeof category.key !== 'string' || !category.key) {
      continue
    }
    record[category.key] = (category.emojis || [])
      .map(normalizeEmoji)
      .filter((emoji): emoji is Emoji => emoji !== null)
  }

  recordCache.set(categories, record)
  return record
}

/** Visible category keys in display order. */
export function resolveCategoryKeys(
  options: Pick<EmojiOptions, 'categories' | 'customCategories' | 'recent'>
): string[] {
  const custom = Object.keys(customRecord(options))
  const known = new Set([RECENT_CATEGORY, ...custom, ...BUILTIN_CATEGORIES])

  const requested =
    Array.isArray(options.categories) && options.categories.length
      ? options.categories
      : [RECENT_CATEGORY, ...custom, ...BUILTIN_CATEGORIES]

  return [...new Set(requested)].filter(
    (key) =>
      known.has(key) &&
      (key !== RECENT_CATEGORY || (options.recent && options.recent !== 'none'))
  )
}

/** Category names: i18n first, then a custom category's `name`. */
export function resolveCategoryNames(
  options: Pick<EmojiOptions, 'customCategories' | 'i18n'>
): Record<string, string> {
  const i18n = resolveI18n(options.i18n)
  const names: Record<string, string> = { ...i18n.categories }

  for (const category of options.customCategories || []) {
    if (!category?.key) continue
    names[category.key] =
      options.i18n?.categories?.[category.key] ||
      category.name ||
      snakeToCapitalizedCase(category.key)
  }

  return names
}

export function resolveCategories(options: EmojiOptions): CategoryInfo[] {
  const names = resolveCategoryNames(options)
  const icons = new Map(defaultGroups.map((group) => [group.key, group.u]))

  return resolveCategoryKeys(options).map((key) => ({
    key,
    title: names[key] || snakeToCapitalizedCase(key),
    u: icons.get(key as never) || '',
  }))
}

/** Icon URL per custom category, from `customCategories[].icon`. */
export function customCategoryIcons(
  options: Pick<EmojiOptions, 'customCategories'>
): Record<string, string> {
  const icons: Record<string, string> = {}
  for (const category of options.customCategories || []) {
    if (category?.key && category.icon) icons[category.key] = category.icon
  }
  return icons
}
