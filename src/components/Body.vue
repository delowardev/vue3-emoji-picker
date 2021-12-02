<template>
  <div class="v3-body">
    <div ref="bodyInner" class="v3-body-inner">
      <template v-if="Object.keys(emojis).length">
        <div
          v-for="(group, key) in emojis"
          :id="key"
          :key="key"
          class="v3-group"
        >
          <h5 v-if="hasGroupNames">
            {{ GROUP_NAMES[key] }}
          </h5>
          <div class="v3-emojis">
            <button
              v-for="emoji in group"
              :key="emoji.r"
              @mouseenter="handleMouseEnter(emoji)"
              @click="handleClick(emoji)"
            >
              <!-- Native emoi -->
              <span v-if="native">
                {{ unicodeToEmoji(emoji.r) }}
              </span>

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
import {
  defineComponent,
  watch,
  ref,
  computed,
  getCurrentInstance,
  inject,
} from 'vue'
import { EmojiRecord, Emoji, Store } from '../types'
import {
  EMOJI_REMOTE_SRC,
  GROUP_NAMES,
  EMOJI_RESULT_KEY,
  EMOJI_NAME_KEY,
} from '../constant'
import { filterEmojis, unicodeToEmoji } from '../helpers'

export default defineComponent({
  name: 'Body',
  setup() {
    const { state, updateEmoji } = inject('store') as Store
    const bodyInner = ref<HTMLElement | null>(null)
    const emojis = computed<EmojiRecord>(() =>
      filterEmojis(
        state.emojis,
        state.search,
        state.skinTone,
        state.options.disabledGroups
      )
    )
    const _this = getCurrentInstance()
    const hasGroupNames = computed(() => !state.options.hideGroupNames)
    const isSticky = computed(() => !state.options.disableStickyGroupNames)
    const groupNames = computed(() => state.options.groupNames)

    function handleMouseEnter(emoji: Emoji) {
      updateEmoji(emoji)
    }

    function handleClick(emoji: Emoji) {
      _this?.parent?.emit('select', {
        ...emoji,
        t: state.skinTone,
        i: unicodeToEmoji(emoji.r),
      })
    }

    // @todo: handle error
    function handleError(event: Event, unicode: string) {
      console.log(unicode)
    }

    watch(
      () => state.activeGroup,
      () => {
        bodyInner.value
          ?.querySelector('#' + state.activeGroup)
          ?.scrollIntoView({ behavior: 'smooth' })
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
      groupNames,
    }
  },
})
</script>
