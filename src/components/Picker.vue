<template>
  <picker-root
    :type="type"
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
import { COLOR_THEMES, GROUP_NAMES, STATIC_TEXTS } from '../constant'
import Store from '../store'
import PickerRoot from './Root.vue'
import { ColorTheme, EmojiExt } from '../types'

export default defineComponent({
  name: 'Picker',
  components: {
    PickerRoot,
  },
  props: {
    native: {
      type: Boolean,
      default: false,
    },
    hideSearch: {
      type: Boolean,
      default: false,
    },
    hideGroupIcons: {
      type: Boolean,
      default: false,
    },
    hideGroupNames: {
      type: Boolean,
      default: false,
    },
    staticTexts: {
      type: Object,
      default: () => ({}),
    },
    disableStickyGroupNames: {
      type: Boolean,
      default: false,
    },
    disabledGroups: {
      type: Array,
      default: () => [],
    },
    groupNames: {
      type: Object,
      default: () => ({}),
    },
    disableSkinTones: {
      type: Boolean,
      default: false,
    },
    text: {
      type: String,
      default: '',
    },
    mode: {
      type: String,
      default: 'insert', // or append, prepend
    },
    offset: {
      type: Number,
      default: 6,
    },
    additionalGroups: {
      type: Object,
      default: () => ({}),
    },
    groupOrder: {
      type: Array,
      default: () => [],
    },
    groupIcons: {
      type: Object,
      default: () => ({}),
    },
    pickerType: {
      type: String,
      default: '',
    },
    displayRecent: {
      type: Boolean,
      default: false,
    },
    theme: {
      type: String as PropType<ColorTheme>,
      default: 'light',
    },
  },
  emits: {
    'update:text': (_text: string) => true,
    select: (_emoji: EmojiExt) => true,
  },
  setup(props, { emit }) {
    const input = ref(props.text)

    /**
     * Handle text change event
     * @param text - text value
     */
    function onChangeText(text: string | undefined) {
      input.value = text || ''
      emit('update:text', input.value)
    }

    /**
     * Map props to store options. Rebuilt when props change so the picker no
     * longer freezes every prop at its mount-time value.
     */
    const toOptions = (values: typeof props) => ({
      native: values.native,
      hideSearch: values.hideSearch,
      hideGroupIcons: values.hideGroupIcons,
      hideGroupNames: values.hideGroupNames,
      staticTexts: { ...STATIC_TEXTS, ...values.staticTexts },
      disableStickyGroupNames: values.disableStickyGroupNames,
      disabledGroups: values.disabledGroups,
      groupNames: { ...GROUP_NAMES, ...values.groupNames },
      disableSkinTones: values.disableSkinTones,
      displayRecent: values.displayRecent,
      additionalGroups: values.additionalGroups,
      mode: values.mode,
      offset: values.offset,
      groupOrder: values.groupOrder,
      groupIcons: values.groupIcons,
      colorTheme: COLOR_THEMES.includes(values.theme) ? values.theme : 'light',
    })

    /**
     * Create a brand new store and
     */
    const store = Store()

    /**
     * Initializing initial props
     */
    store.updateOptions(toOptions(props))

    // Only push an update when a value actually changed: parents routinely
    // pass fresh object literals on every render.
    watch(
      () => toOptions(props),
      (next, previous) => {
        if (JSON.stringify(next) === JSON.stringify(previous)) return
        store.updateOptions(next)
      }
    )

    // Treat `text` as a controlled prop (issue #65).
    watch(
      () => props.text,
      (value) => {
        if (value !== input.value) input.value = value || ''
      }
    )

    /**
     * (provide) make available for entire app.
     */
    provide('store', store)

    /**
     * Return vars
     */

    return {
      type: computed(() => props.pickerType),
      input,
      onChangeText,
    }
  },
})
</script>
