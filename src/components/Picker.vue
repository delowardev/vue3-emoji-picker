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
import { defineComponent, provide, ref } from 'vue'

/**
 * Internal dependencies
 */
import { GROUP_NAMES, STATIC_TEXTS } from '../constant'
import Store from '../store'
import PickerRoot from './Root.vue'

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
  },
  emits: ['update:text', 'select'],
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
     * Create a brand new store and
     */
    const store = Store()

    /**
     * Initializing initial props
     */
    store.updateOptions({
      native: props.native,
      hideSearch: props.hideSearch,
      hideGroupIcons: props.hideGroupIcons,
      hideGroupNames: props.hideGroupNames,
      staticTexts: { ...STATIC_TEXTS, ...props.staticTexts },
      disableStickyGroupNames: props.disableStickyGroupNames,
      disabledGroups: props.disabledGroups,
      groupNames: { ...GROUP_NAMES, ...props.groupNames },
      disableSkinTones: props.disableSkinTones,
      displayRecent: props.displayRecent,
      additionalGroups: props.additionalGroups,
      mode: props.mode,
      offset: props.offset,
      groupOrder: props.groupOrder,
      groupIcons: props.groupIcons,
    })

    /**
     * (provide) make available for entire app.
     */
    provide('store', store)

    /**
     * Return vars
     */

    return {
      type: props.pickerType,
      input,
      onChangeText,
    }
  },
})
</script>
