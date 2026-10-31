<template>
  <picker-root
    :type="options.type"
    :text="input"
    @select="$emit('select', $event)"
    @update:text="onChangeText"
  />
</template>

<script lang="ts">
/**
 * External dependencies
 */
import { computed, defineComponent, provide, ref, PropType, watch } from 'vue'

/**
 * Internal dependencies
 */
import { COLOR_THEMES } from '../constant'
import Store from '../store'
import PickerRoot from './Root.vue'
import { createDefaultOptions } from '../core/createPicker'
import { legacyToOptions, warnDeprecated } from '../compat'
import type {
  ColorTheme,
  CustomCategory,
  EmojiExt,
  EmojiOptions,
  EmojiRecord,
  EmojiSet,
  I18nInput,
  InsertMode,
  PickerType,
  RecentMode,
} from '../types'

/** Props are `undefined` unless passed, so core defaults apply. */
const optional = <T,>(type: unknown) => ({
  type: type as PropType<T>,
  default: undefined,
})

/** 2.x props, mapped 1:1 onto core options. */
const OPTION_PROPS = [
  'theme',
  'set',
  'imageUrl',
  'perLine',
  'emojiSize',
  'searchPosition',
  'navPosition',
  'previewPosition',
  'skinTonePosition',
  'categoryHeaders',
  'categories',
  'customCategories',
  'categoryIcons',
  'excludeEmojis',
  'recent',
  'maxRecent',
  'i18n',
  'type',
  'insertMode',
  'placement',
  'offset',
  'inputAttrs',
  'autoFocus',
] as const

export default defineComponent({
  name: 'Picker',
  components: {
    PickerRoot,
  },
  props: {
    modelValue: optional<string>(String),

    theme: optional<ColorTheme>(String),
    set: optional<EmojiSet>(String),
    imageUrl: optional<(unicode: string) => string>(Function),
    perLine: optional<number>(Number),
    emojiSize: optional<number>(Number),

    searchPosition: optional<'top' | 'none'>(String),
    navPosition: optional<'top' | 'none'>(String),
    previewPosition: optional<'bottom' | 'none'>(String),
    skinTonePosition: optional<'preview' | 'none'>(String),
    categoryHeaders: optional<'sticky' | 'static' | 'none'>(String),

    categories: optional<string[]>(Array),
    customCategories: optional<CustomCategory[]>(Array),
    categoryIcons: optional<Record<string, string>>(Object),
    excludeEmojis: optional<string[]>(Array),

    recent: optional<'none' | RecentMode>(String),
    maxRecent: optional<number>(Number),

    i18n: optional<I18nInput>(Object),

    type: optional<PickerType>(String),
    insertMode: optional<InsertMode>(String),
    placement: optional<string>(String),
    offset: optional<number>(Number),
    inputAttrs: optional<Record<string, unknown>>(Object),
    autoFocus: optional<boolean>(Boolean),

    /** @deprecated 1.x props — see UPGRADE.md. Removed in 3.0. */
    native: optional<boolean>(Boolean),
    hideSearch: optional<boolean>(Boolean),
    hideGroupIcons: optional<boolean>(Boolean),
    hideGroupNames: optional<boolean>(Boolean),
    disableStickyGroupNames: optional<boolean>(Boolean),
    disableSkinTones: optional<boolean>(Boolean),
    staticTexts: optional<Record<string, string>>(Object),
    groupNames: optional<Record<string, string>>(Object),
    groupOrder: optional<string[]>(Array),
    disabledGroups: optional<string[]>(Array),
    additionalGroups: optional<EmojiRecord>(Object),
    groupIcons: optional<Record<string, string>>(Object),
    displayRecent: optional<boolean>(Boolean),
    pickerType: optional<string>(String),
    mode: optional<string>(String),
    text: optional<string>(String),
  },
  emits: {
    'update:modelValue': (_value: string) => true,
    /** @deprecated use v-model (`update:modelValue`) */
    'update:text': (_value: string) => true,
    select: (_emoji: EmojiExt) => true,
  },
  setup(props, { emit }) {
    if (props.text !== undefined) warnDeprecated('text')

    const value = () => props.modelValue ?? props.text ?? ''
    const input = ref(value())

    function onChangeText(next: string | undefined) {
      input.value = next || ''
      emit('update:modelValue', input.value)
      emit('update:text', input.value)
    }

    /**
     * Resolve every option from scratch: defaults, then translated 1.x
     * props, then 2.x props. Rebuilt whenever a prop changes.
     */
    const options = computed<EmojiOptions>(() => {
      const resolved: EmojiOptions = {
        ...createDefaultOptions(),
        ...legacyToOptions(props),
      }
      const target = resolved as unknown as Record<string, unknown>

      for (const key of OPTION_PROPS) {
        const prop = props[key]
        if (prop !== undefined && prop !== null) target[key] = prop
      }

      if (!COLOR_THEMES.includes(resolved.theme)) resolved.theme = 'light'
      return resolved
    })

    const store = Store()
    store.updateOptions(options.value)

    // Only push an update when a value actually changed: parents routinely
    // pass fresh object literals on every render.
    watch(options, (next, previous) => {
      // JSON drops functions, so compare `imageUrl` by reference.
      if (
        next.imageUrl === previous.imageUrl &&
        JSON.stringify(next) === JSON.stringify(previous)
      ) {
        return
      }
      store.updateOptions(next)
    })

    // `modelValue` (and 1.x `text`) is controlled (issue #65).
    watch(value, (next) => {
      if (next !== input.value) input.value = next
    })

    provide('store', store)

    return {
      options,
      input,
      onChangeText,
    }
  },
})
</script>
