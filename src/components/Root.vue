<template>
  <div
    v-if="isInputType"
    class="v3-input-emoji-picker"
    :class="'v3-color-theme-' + colorTheme"
  >
    <div class="v3-input-picker-root">
      <input
        v-if="type === 'input'"
        ref="elem"
        v-bind="inputAttrs"
        :value="input"
        type="text"
        class="v3-emoji-picker-input"
        @input="onChangeText"
        @blur="updateCursor"
      />
      <textarea
        v-else
        ref="elem"
        v-bind="inputAttrs"
        :value="input"
        class="v3-emoji-picker-textarea"
        @input="onChangeText"
        @blur="updateCursor"
      />
      <div
        class="v3-input-picker-wrap"
        :class="open ? 'v3-picker-is-open' : ''"
      >
        <button
          ref="button"
          type="button"
          class="v3-input-picker-icon"
          @click="toggle"
        >
          <img :src="face" alt="" />
        </button>

        <div
          ref="picker"
          class="v3-emoji-picker"
          :class="'v3-color-theme-' + colorTheme"
          :style="cssVars"
          @keydown.esc="close"
        >
          <PickerHeader />
          <PickerBody @select="onSelect" />
          <PickerFooter v-if="hasFooter" />
        </div>
      </div>
    </div>
  </div>
  <div
    v-else
    ref="inline"
    class="v3-emoji-picker"
    :class="'v3-color-theme-' + colorTheme"
    :style="cssVars"
  >
    <PickerHeader />
    <PickerBody @select="onSelect" />
    <PickerFooter v-if="hasFooter" />
  </div>
</template>

<script lang="ts">
/**
 * External dependencies
 */
import {
  defineComponent,
  ref,
  onMounted,
  onBeforeUnmount,
  inject,
  computed,
  watch,
  nextTick,
} from 'vue'
import { createPopper, Instance, Placement } from '@popperjs/core'

/**
 * Internal dependencies
 */
import smileys_people from '../svgs/groups/smileys_people.svg'
import PickerBody from './Body.vue'
import PickerHeader from './Header.vue'
import PickerFooter from './Footer.vue'
import { EmojiExt, Store } from '../types'

export default defineComponent({
  name: 'PickerRoot',
  components: {
    PickerHeader,
    PickerBody,
    PickerFooter,
  },
  props: {
    type: {
      type: String,
      default: '',
    },
    text: {
      type: String,
      default: '',
    },
  },
  emits: {
    select: (_emoji: EmojiExt) => true,
    'update:text': (_value: string) => true,
  },
  setup(props, { emit }) {
    const elem = ref<HTMLInputElement>()
    const button = ref<HTMLButtonElement>()
    const picker = ref<any>()
    const open = ref(false)
    const input = ref(props.text)
    const isInputType = computed(
      () => props.type === 'input' || props.type === 'textarea'
    )
    let cursor = -1
    const { state, refreshRecent } = inject('store') as Store
    const colorTheme = computed(() => state.options.theme)
    const hasFooter = computed(
      () =>
        state.options.previewPosition !== 'none' ||
        state.options.skinTonePosition !== 'none'
    )
    const inputAttrs = computed(() => state.options.inputAttrs || {})
    let popper: Instance | null = null

    // Treat `text` as a controlled prop (issue #65).
    watch(
      () => props.text,
      (value) => {
        if (value !== input.value) input.value = value || ''
      }
    )

    /**
     * Functions
     */
    function onSelect(emoji: EmojiExt) {
      if (isInputType.value) {
        const mode = state.options.insertMode
        if (mode === 'prepend') {
          input.value = emoji.i + input.value
        } else if (mode === 'caret' && cursor !== -1) {
          input.value = `${input.value.slice(0, cursor)}${
            emoji.i
          }${input.value.slice(cursor)}`
          cursor += emoji.i.length
        } else {
          input.value += emoji.i
        }
        emit('update:text', input.value)
      }

      emit('select', emoji)
    }

    function updateCursor() {
      if (elem.value) {
        cursor = elem.value?.selectionEnd || -1
      }
    }

    function clickListener(event: MouseEvent) {
      const isOutside = !(event.target as HTMLElement)?.closest(
        '.v3-input-picker-wrap'
      )
      if (isOutside && open.value) {
        open.value = false
      }
    }

    const inline = ref<HTMLElement>()

    /** Layout props exposed as CSS custom properties. */
    const cssVars = computed(() => ({
      '--v3-per-line': String(state.options.perLine || 8),
      '--v3-emoji-size': `${state.options.emojiSize || 22}px`,
      // Header, search, headings and footer scale with the emoji size.
      '--v3-auto-scale': String(
        Math.min(2, Math.max(0.75, (state.options.emojiSize || 22) / 22))
      ),
    }))

    function focusSearch(root?: HTMLElement) {
      root?.querySelector<HTMLInputElement>('.v3-search input')?.focus()
    }

    function toggle() {
      open.value = !open.value
      // Show selections from the previous session in their new order.
      if (open.value) {
        refreshRecent()
        if (state.options.autoFocus) nextTick(() => focusSearch(picker.value))
      }
    }

    /** Escape closes the popup and returns focus to the field. */
    function close() {
      if (!open.value) return
      open.value = false
      elem.value?.focus()
    }

    function popperOptions() {
      const offset =
        typeof state.options.offset === 'number' ? state.options.offset : 6
      const placement = (state.options.placement || 'bottom-end') as Placement

      return {
        placement,
        modifiers: [{ name: 'offset', options: { offset: [0, offset] } }],
      }
    }

    function setupPopper() {
      // Anchor to the field, not the icon: `*-start` / `*-end` then align
      // with the field's edges instead of the small icon at its right.
      if (elem.value && picker.value && isInputType.value) {
        popper = createPopper(elem.value, picker.value, popperOptions())
        document.body.addEventListener('click', clickListener)
      }
    }

    function destroyPopper() {
      popper?.destroy()
      popper = null
      document.body.removeEventListener('click', clickListener)
    }

    // `offset` and `placement` can change after mount.
    watch(
      () => [state.options.offset, state.options.placement],
      () => popper?.setOptions(popperOptions())
    )

    // The input wrapper only exists for input/textarea picker types.
    watch(isInputType, async () => {
      await nextTick()
      destroyPopper()
      setupPopper()
    })

    function onChangeText(event: any) {
      input.value = event.target.value || ''
      emit('update:text', input.value)
    }

    /**
     * Lifecycle
     */
    onMounted(() => {
      setupPopper()
      if (state.options.autoFocus && !isInputType.value) {
        focusSearch(inline.value)
      }
    })

    // cleanup
    onBeforeUnmount(() => {
      destroyPopper()
    })

    /**
     * Return vars
     */
    return {
      face: smileys_people,
      open,
      onSelect,
      input,
      elem,
      updateCursor,
      button,
      picker,
      isInputType,
      onChangeText,
      colorTheme,
      hasFooter,
      inputAttrs,
      toggle,
      close,
      cssVars,
      inline,
    }
  },
})
</script>
