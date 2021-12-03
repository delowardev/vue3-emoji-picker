<template>
  <div class="v3-input-emoji-picker">
    <div class="v3-input-picker-root">
      <input
        ref="elem"
        v-model="input"
        type="text"
        class="v3-emoji-picker-input"
        @blur="updateCursor"
      />
      <div
        class="v3-input-picker-wrap"
        :class="open ? 'v3-picker-is-open' : ''"
      >
        <button ref="button" class="v3-input-picker-icon" @click="open = !open">
          <img :src="face" alt="" />
        </button>
        <Picker ref="picker" v-bind="props" @select="onSelect" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { createPopper } from '@popperjs/core'
import Picker from './Picker.vue'
import smileys_people from '../svgs/groups/smileys_people.svg'
import props from '../props'
export default defineComponent({
  name: 'Header',
  components: {
    Picker,
  },
  props: {
    ...props,
    value: {
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
  },
  emits: ['input'],
  setup(props, { emit }) {
    const elem = ref<HTMLInputElement>()
    const button = ref<HTMLButtonElement>()
    const picker = ref<any>()
    const open = ref(false)
    const input = ref(props.value)
    let cursor = -1

    /**
     * Functions
     */
    function onSelect(emoji: any) {
      if (props.mode === 'prepend') {
        input.value = emoji.i + input.value
      } else if (props.mode === 'insert' && cursor !== -1) {
        input.value = `${input.value.slice(0, cursor)}${
          emoji.i
        }${input.value.slice(cursor)}`
        cursor += emoji.i.length
      } else {
        input.value += emoji.i
      }
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

    /**
     * Watcher
     */
    watch(
      () => input.value,
      () => {
        emit('input', input)
      }
    )

    /**
     * Lifecycle
     */
    onMounted(() => {
      if (button.value && picker.value.$el) {
        let offset = props.offset

        if (typeof offset !== 'number') {
          offset = 6
        }

        createPopper(button.value, picker.value.$el, {
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
      props,
      onSelect,
      input,
      elem,
      updateCursor,
      button,
      picker,
    }
  },
})
</script>
