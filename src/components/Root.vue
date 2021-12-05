<template>
  <div v-if="isInputType" class="v3-input-emoji-picker">
    <div class="v3-input-picker-root">
      <input
        v-if="type === 'input'"
        ref="elem"
        :value="input"
        type="text"
        class="v3-emoji-picker-input"
        @input="onChangeText"
        @blur="updateCursor"
      />
      <textarea
        v-else
        ref="elem"
        :value="input"
        class="v3-emoji-picker-textarea"
        @input="onChangeText"
        @blur="updateCursor"
      />
      <div
        class="v3-input-picker-wrap"
        :class="open ? 'v3-picker-is-open' : ''"
      >
        <button ref="button" class="v3-input-picker-icon" @click="open = !open">
          <img :src="face" alt="" />
        </button>

        <div ref="picker" class="v3-emoji-picker">
          <Header />
          <Body @select="onSelect" />
          <Footer />
        </div>
      </div>
    </div>
  </div>
  <div v-else class="v3-emoji-picker">
    <Header />
    <Body @select="onSelect" />
    <Footer />
  </div>
</template>

<script lang="ts">
/**
 * External dependencies
 */
import { defineComponent, ref, onMounted, onBeforeUnmount, inject } from 'vue'
import { createPopper } from '@popperjs/core'

/**
 * Internal dependencies
 */
import smileys_people from '../svgs/groups/smileys_people.svg'
import Body from './Body.vue'
import Header from './Header.vue'
import Footer from './Footer.vue'
import { Store } from '../types'

export default defineComponent({
  name: 'PickerRoot',
  components: {
    Header,
    Body,
    Footer,
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
  emits: ['update:text'],
  setup(props, { emit }) {
    const elem = ref<HTMLInputElement>()
    const button = ref<HTMLButtonElement>()
    const picker = ref<any>()
    const open = ref(false)
    const input = ref(props.text)
    const isInputType = props.type === 'input' || props.type === 'textarea'
    let cursor = -1
    const { state } = inject('store') as Store

    /**
     * Functions
     */
    function onSelect(emoji: any) {
      const mode = state.options.mode
      if (mode === 'prepend') {
        input.value = emoji.i + input.value
      } else if (mode === 'insert' && cursor !== -1) {
        input.value = `${input.value.slice(0, cursor)}${
          emoji.i
        }${input.value.slice(cursor)}`
        cursor += emoji.i.length
      } else {
        input.value += emoji.i
      }

      emit('update:text', input.value)
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

    function setupPopper() {
      if (button.value && picker.value && isInputType) {
        let offset = state.options.offset

        if (typeof offset !== 'number') {
          offset = 6
        }

        createPopper(button.value, picker.value, {
          placement: 'bottom-end',
          modifiers: [
            {
              name: 'offset',
              options: {
                offset: [0, offset],
              },
            },
          ],
        })

        document.body.addEventListener('click', clickListener)
      }
    }

    function onChangeText(event: any) {
      input.value = event.target.value || ''
      emit('update:text', input.value)
    }

    /**
     * Lifecycle
     */
    onMounted(() => {
      setupPopper()
    })

    // cleanup
    onBeforeUnmount(() => {
      document.body.removeEventListener('click', clickListener)
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
    }
  },
})
</script>
