<template>
  <div class="v3-body">
    <div ref="bodyInner" :class="platform" class="v3-body-inner">
      <template v-if="orderedKeys.length">
        <div v-for="key of orderedKeys" :id="key" :key="key" class="v3-group">
          <h5
            v-show="emojis[key]"
            v-if="hasGroupNames"
            :class="isSticky ? `v3-sticky` : ``"
          >
            {{ groupNames[key] }}
          </h5>
          <div v-show="emojis[key]" class="v3-emojis">
            <button
              v-for="emoji in emojis[key]"
              :key="emoji.r"
              type="button"
              @mouseenter="handleMouseEnter(emoji)"
              @click="handleClick(emoji)"
            >
              <!-- Native emoji -->
              <span v-if="native">{{ unicodeToEmoji(emoji.r) }}</span>

              <!-- Load from CDN when options.native = false -->
              <img
                v-else-if="!failed[emoji.r]"
                :src="EMOJI_REMOTE_SRC + '/' + emoji.r + '.png'"
                :alt="emoji.n[0]"
                @error="handleError(emoji.r)"
              />

              <!-- Fallback for missing images (no innerHTML: keeps Vue's DOM) -->
              <span v-else>{{ unicodeToEmoji(emoji.r) }}</span>
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
import { Emoji, Store, EmojiExt } from '../types'

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
  emits: {
    select: (_emoji: EmojiExt) => true,
  },
  setup() {
    const { state, updateEmoji, updateSelect } = inject('store') as Store
    const bodyInner = ref<HTMLElement | null>(null)
    const emojis = computed<Record<string, EmojiExt[]>>(
      () =>
        filterEmojis(
          state.emojis,
          state.search,
          state.skinTone,
          state.options.disabledGroups
        ) as Record<string, EmojiExt[]>
    )

    const _this = getCurrentInstance()
    const hasGroupNames = computed(() => !state.options.hideGroupNames)
    const isSticky = computed(() => !state.options.disableStickyGroupNames)
    const groupNames = toRaw(state.options.groupNames)
    const orderedKeys = state.orderedGroupKeys
    /** Unicode values whose PNG failed to load. */
    const failed = ref<Record<string, boolean>>({})

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

    function handleClick(emoji: EmojiExt) {
      updateSelect(emoji)
      _this?.emit('select', {
        ...emoji,
        t: state.skinTone,
        i: unicodeToEmoji(emoji.r),
      })
    }

    function handleError(unicode: string) {
      failed.value[unicode] = true
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
      failed,
    }
  },
})
</script>
