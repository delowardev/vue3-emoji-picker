<template>
  <div class="v3-body">
    <div ref="bodyInner" :class="platform" class="v3-body-inner">
      <template v-if="orderedKeys.length">
        <div v-for="key of orderedKeys" :id="key" :key="key" class="v3-group">
          <h5 v-if="hasGroupNames" :class="isSticky ? `v3-sticky` : ``">
            {{ groupNames[key] }}
          </h5>
          <div class="v3-emojis">
            <button
              v-for="emoji in emojis[key]"
              :key="emoji.r"
              type="button"
              @mouseenter="handleMouseEnter(emoji)"
              @click="handleClick(emoji)"
            >
              <!-- Native emoji -->
              <span v-if="native">{{ unicodeToEmoji(emoji.r) }}</span>

              <!-- Load from CDN when options.native = true -->
              <img
                v-else
                :src="EMOJI_REMOTE_SRC + `/${emoji.r}.png`"
                :alt="emoji.n[0]"
                @error="handleError($event, emoji.r)"
              />
            </button>
          </div>
        </div>
      </template>
      <span v-else class="v3-no-result"> No emoji has been found! </span>
    </div>
  </div>
</template>

<script lang="ts">
/**
 * External dependencies
 */
import {
  defineComponent,
  watch,
  ref,
  computed,
  getCurrentInstance,
  inject,
  toRaw,
} from 'vue'

/**
 * Internal dependencies
 */
import { EmojiRecord, Emoji, Store } from '../types'

import {
  EMOJI_REMOTE_SRC,
  GROUP_NAMES,
  EMOJI_RESULT_KEY,
  EMOJI_NAME_KEY,
} from '../constant'
import {
  filterEmojis,
  unicodeToEmoji,
  isMac,
  snakeToCapitalizedCase,
} from '../helpers'

export default defineComponent({
  name: 'Body',
  setup() {
    const { state, updateEmoji, updateSelect } = inject('store') as Store
    const bodyInner = ref<HTMLElement | null>(null)
    const emojis = computed<EmojiRecord>(() => {
      return filterEmojis(
        state.emojis,
        state.search,
        state.skinTone,
        state.options.disabledGroups
      )
    })

    const _this = getCurrentInstance()
    const hasGroupNames = computed(() => !state.options.hideGroupNames)
    const isSticky = computed(() => !state.options.disableStickyGroupNames)
    const groupNames = toRaw(state.options.groupNames)
    const orderedKeys = state.orderedGroupKeys

    if (state.options.additionalGroups) {
      Object.keys(state.options.additionalGroups).map((k) => {
        if (state.options.groupNames[k]) {
          // Custom name is defined use that one
          groupNames[k] = state.options.groupNames[k]
        } else {
          // Name group name from snake case to capitalized wording, e.g. my_custom_group to My Custom Group
          groupNames[k] = snakeToCapitalizedCase(k)
        }
      })
    }

    const platform = isMac() ? 'is-mac' : ''

    function handleMouseEnter(emoji: Emoji) {
      updateEmoji(emoji)
    }

    function handleClick(emoji: Emoji) {
      updateSelect(emoji)
      _this?.emit('select', {
        ...emoji,
        t: state.skinTone,
        i: unicodeToEmoji(emoji.r),
      })
    }

    function handleError(event: Event, unicode: string) {
      const button = (event?.target as HTMLImageElement)?.closest('button')
      if (button) {
        button.innerHTML = unicodeToEmoji(unicode)
      }
    }

    watch(
      () => state.activeGroup,
      () => {
        const target = bodyInner.value?.querySelector('#' + state.activeGroup)
        if (target) {
          // @ts-ignore
          target.parentNode.scrollTop =
            // @ts-ignore
            target.offsetTop - target.parentNode.offsetTop
        }
      }
    )

    console.log(state.orderedGroupKeys)

    return {
      emojis,
      bodyInner,
      EMOJI_REMOTE_SRC,
      GROUP_NAMES,
      handleClick,
      handleError,
      handleMouseEnter,
      native: state.options.native,
      unicodeToEmoji,
      EMOJI_RESULT_KEY,
      EMOJI_NAME_KEY,
      hasGroupNames,
      isSticky,
      platform,
      groupNames,
      orderedKeys,
    }
  },
})
</script>
