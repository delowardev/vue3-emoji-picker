import type { DefineComponent } from 'vue'
import Picker from './components/Picker.vue'
import './styles/index.scss'
import type { EmojiExt, EmojiOptions, EmojiRecord } from './types'

export type {
  CategoryInfo,
  ColorTheme,
  CustomCategory,
  CustomEmoji,
  Emoji,
  EmojiExt,
  EmojiOptions,
  EmojiRecord,
  EmojiSet,
  Group,
  GroupKeys,
  GroupNames,
  I18n,
  I18nInput,
  InsertMode,
  PickerType,
  RecentMode,
  State,
} from './types'

/**
 * Props of the `EmojiPicker` component. The 2.x props are the core options
 * (see `EmojiOptions`); 1.x props still work until 3.0.
 */
export interface EmojiPickerProps extends Partial<
  Omit<EmojiOptions, 'storage'>
> {
  /** Field text for `type="input"` / `"textarea"` (`v-model`). */
  modelValue?: string
  onSelect?: (emoji: EmojiExt) => void
  'onUpdate:modelValue'?: (value: string) => void

  /** @deprecated Use `set="native"`. */
  native?: boolean
  /** @deprecated Use `search-position="none"`. */
  hideSearch?: boolean
  /** @deprecated Use `nav-position="none"`. */
  hideGroupIcons?: boolean
  /** @deprecated Use `category-headers="none"`. */
  hideGroupNames?: boolean
  /** @deprecated Use `category-headers="static"`. */
  disableStickyGroupNames?: boolean
  /** @deprecated Use `skin-tone-position="none"`. */
  disableSkinTones?: boolean
  /** @deprecated Use `i18n`. */
  staticTexts?: Record<string, string>
  /** @deprecated Use `i18n.categories`. */
  groupNames?: Record<string, string>
  /** @deprecated Use `categories`. */
  groupOrder?: string[]
  /** @deprecated Use `categories`. */
  disabledGroups?: string[]
  /** @deprecated Use `custom-categories`. */
  additionalGroups?: EmojiRecord
  /** @deprecated Use `category-icons`. */
  groupIcons?: Record<string, string>
  /** @deprecated Use `recent="recent"`. */
  displayRecent?: boolean
  /** @deprecated Use `type`. */
  pickerType?: string
  /** @deprecated Use `insert-mode`. */
  mode?: string
  /** @deprecated Use `v-model`. */
  text?: string
  /** @deprecated Use `@update:model-value`. */
  'onUpdate:text'?: (value: string) => void
}

/**
 * Typed with the one-argument `DefineComponent`, which every Vue 3 version
 * understands. The inferred component type uses Vue 3.5-only generics and
 * would break type checking for consumers on Vue 3.2–3.4.
 */
const EmojiPicker = Picker as unknown as DefineComponent<EmojiPickerProps>

export default EmojiPicker
