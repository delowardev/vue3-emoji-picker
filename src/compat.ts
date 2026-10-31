/**
 * 1.x → 2.x prop compatibility.
 *
 * Every 1.x prop still works in 2.x: it is translated to its 2.x option and
 * a one-time warning names the replacement. This module is removed in 3.0.
 */
import type {
  CustomCategory,
  EmojiOptions,
  EmojiRecord,
  I18nInput,
} from './core/types'
import { BUILTIN_CATEGORIES, RECENT_CATEGORY } from './core/categories'

export const UPGRADE_GUIDE =
  'https://github.com/delowardev/vue3-emoji-picker/blob/main/UPGRADE.md'

/** 1.x prop (camelCase) → replacement shown in the warning. */
export const LEGACY_PROPS: Record<string, string> = {
  native: 'set="native"',
  hideSearch: 'search-position="none"',
  hideGroupIcons: 'nav-position="none"',
  hideGroupNames: 'category-headers="none"',
  disableStickyGroupNames: 'category-headers="static"',
  disableSkinTones: 'skin-tone-position="none"',
  staticTexts: 'i18n',
  groupNames: 'i18n.categories',
  groupOrder: 'categories',
  disabledGroups: 'categories',
  additionalGroups: 'custom-categories',
  groupIcons: 'category-icons',
  displayRecent: 'recent="recent"',
  pickerType: 'type',
  mode: 'insert-mode',
  text: 'v-model (modelValue)',
}

const kebab = (name: string) =>
  name.replace(/[A-Z]/g, (char) => '-' + char.toLowerCase())

const warned = new Set<string>()

function isProduction() {
  try {
    return (
      typeof process !== 'undefined' && process.env?.NODE_ENV === 'production'
    )
  } catch {
    return false
  }
}

export function warnDeprecated(name: string): void {
  if (warned.has(name) || isProduction()) return
  warned.add(name)
  console.warn(
    `[vue3-emoji-picker] "${kebab(name)}" is deprecated and will be removed ` +
      `in v3. Use ${LEGACY_PROPS[name]} instead. See ${UPGRADE_GUIDE}`
  )
}

/** Test helper: allow warnings to fire again. */
export function resetDeprecationWarnings(): void {
  warned.clear()
}

type LegacyProps = Partial<{
  native: boolean
  hideSearch: boolean
  hideGroupIcons: boolean
  hideGroupNames: boolean
  disableStickyGroupNames: boolean
  disableSkinTones: boolean
  staticTexts: Record<string, string>
  groupNames: Record<string, string>
  groupOrder: string[]
  disabledGroups: string[]
  additionalGroups: EmojiRecord
  groupIcons: Record<string, string>
  displayRecent: boolean
  pickerType: string
  mode: string
}>

/**
 * Translate the 1.x props that were passed (not `undefined`) into 2.x
 * options. `text` is handled by the component, since it is the v-model.
 */
export function legacyToOptions(
  props: LegacyProps,
  warn: (name: string) => void = warnDeprecated
): Partial<EmojiOptions> {
  const used = (name: keyof LegacyProps) => {
    if (props[name] === undefined || props[name] === null) return false
    warn(name)
    return true
  }
  const options: Partial<EmojiOptions> = {}

  if (used('native') && props.native) options.set = 'native'
  if (used('hideSearch') && props.hideSearch) options.searchPosition = 'none'
  if (used('hideGroupIcons') && props.hideGroupIcons) {
    options.navPosition = 'none'
  }
  if (used('disableSkinTones') && props.disableSkinTones) {
    options.skinTonePosition = 'none'
  }

  const sticky = used('disableStickyGroupNames')
    ? !props.disableStickyGroupNames
    : true
  if (used('hideGroupNames') && props.hideGroupNames) {
    options.categoryHeaders = 'none'
  } else if (!sticky) {
    options.categoryHeaders = 'static'
  }

  const i18n: I18nInput = {}
  if (used('staticTexts')) {
    const texts = props.staticTexts || {}
    if (texts.placeholder) i18n.search = texts.placeholder
    if (texts.skinTone) i18n.skinTone = texts.skinTone
  }
  if (used('groupNames')) i18n.categories = { ...props.groupNames }
  if (Object.keys(i18n).length) options.i18n = i18n

  const custom = used('additionalGroups') ? props.additionalGroups || {} : {}
  if (Object.keys(custom).length) {
    options.customCategories = Object.entries(custom).map(
      ([key, emojis]): CustomCategory => ({ key, emojis: emojis || [] })
    )
  }

  // 1.x order: group-order, then additional groups, then the dataset order
  // (which starts with `recent`), minus disabled groups.
  const order = used('groupOrder') ? props.groupOrder || [] : []
  const disabled = used('disabledGroups') ? props.disabledGroups || [] : []
  if (order.length || disabled.length || Object.keys(custom).length) {
    options.categories = [
      ...new Set([
        ...order,
        ...Object.keys(custom),
        RECENT_CATEGORY,
        ...BUILTIN_CATEGORIES,
      ]),
    ].filter((key) => !disabled.includes(key))
  }

  if (used('groupIcons')) options.categoryIcons = { ...props.groupIcons }
  if (used('displayRecent')) {
    options.recent = props.displayRecent ? 'recent' : 'none'
  }
  if (used('pickerType')) {
    const type = props.pickerType
    options.type = type === 'input' || type === 'textarea' ? type : 'inline'
  }
  if (used('mode')) {
    const mode = props.mode
    options.insertMode =
      mode === 'append' || mode === 'prepend' ? mode : 'caret'
  }

  return options
}
