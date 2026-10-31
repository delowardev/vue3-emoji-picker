<template>
  <div class="v3-body">
    <div
      ref="bodyInner"
      :class="platform"
      class="v3-body-inner"
      @keydown="handleKeydown"
    >
      <template v-if="grid.length">
        <div
          v-for="(group, g) of grid"
          :id="group.key"
          :key="group.key"
          :data-group="group.key"
          class="v3-group"
          role="group"
          :aria-label="groupNames[group.key]"
        >
          <h5 v-if="hasGroupNames" :class="isSticky ? `v3-sticky` : ``">
            {{ groupNames[group.key] }}
          </h5>
          <div class="v3-emojis">
            <button
              v-for="(emoji, i) in group.items"
              :key="emoji.r"
              type="button"
              :data-g="g"
              :data-i="i"
              :tabindex="isCursor(g, i) ? 0 : -1"
              :aria-label="emoji.n[0]"
              @mouseenter="handleMouseEnter(emoji)"
              @focus="handleFocus(emoji, g, i)"
              @click="handleClick(emoji, group.key)"
            >
              <!-- Image (custom src, image set or imageUrl) -->
              <img
                v-if="imageOf(emoji) && !failed[emoji.r]"
                :key="imageOf(emoji) as string"
                :src="imageOf(emoji) as string"
                alt=""
                loading="lazy"
                @error="handleError(emoji.r)"
              />

              <!-- Native glyph, also the fallback for missing images -->
              <span v-else aria-hidden="true">{{
                unicodeToEmoji(emoji.r)
              }}</span>
            </button>
          </div>
        </div>
      </template>
      <span v-else class="v3-no-result" role="status">
        {{ noResults }}
      </span>
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
} from 'vue'

/**
 * Internal dependencies
 */
import { Emoji, Store, EmojiExt } from '../types'

import { EMOJI_RESULT_KEY, EMOJI_NAME_KEY, STATIC_TEXTS } from '../constant'
import { filterEmojis, unicodeToEmoji, isMac } from '../helpers'
import { resolveEmojiImage } from '../core/images'

interface GridGroup {
  key: string
  items: EmojiExt[]
}

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
          state.options.disabledGroups,
          state.options.disabledEmojis
        ) as Record<string, EmojiExt[]>
    )

    /** Visible groups in display order; the keyboard grid. */
    const grid = computed<GridGroup[]>(() =>
      state.orderedGroupKeys
        .filter((key) => emojis.value[key]?.length)
        .map((key) => ({ key, items: emojis.value[key] }))
    )

    const _this = getCurrentInstance()
    const hasGroupNames = computed(() => !state.options.hideGroupNames)
    const isSticky = computed(() => !state.options.disableStickyGroupNames)
    const groupNames = computed(() => state.groupNames)
    const noResults = computed(
      () => state.options.staticTexts?.noResults || STATIC_TEXTS.noResults
    )
    /** Unicode values whose image failed to load. */
    const failed = ref<Record<string, boolean>>({})

    const platform = isMac() ? 'is-mac' : ''

    function imageOf(emoji: EmojiExt): string | null {
      if (state.options.native && !emoji.src) return null
      return resolveEmojiImage(emoji, emoji.r, {
        set: state.options.set,
        imageUrl: state.options.imageUrl,
      })
    }

    /**
     * Roving tabindex: exactly one emoji button is tabbable, arrow keys
     * move between buttons (issue: 1,500+ tab stops before).
     */
    const cursor = ref<{ g: number; i: number } | null>(null)

    function isCursor(g: number, i: number) {
      return cursor.value
        ? cursor.value.g === g && cursor.value.i === i
        : g === 0 && i === 0
    }

    function focusAt(g: number, i: number) {
      cursor.value = { g, i }
      const button = bodyInner.value?.querySelector<HTMLButtonElement>(
        `button[data-g="${g}"][data-i="${i}"]`
      )
      button?.focus()
    }

    function focusSearch() {
      bodyInner.value
        ?.closest('.v3-emoji-picker')
        ?.querySelector<HTMLInputElement>('.v3-search input')
        ?.focus()
    }

    function move(key: string, g: number, i: number): [number, number] | null {
      const perLine = Math.max(1, Number(state.options.perLine) || 8)
      const groups = grid.value
      const size = (index: number) => groups[index]?.items.length || 0
      const col = i % perLine

      switch (key) {
        case 'ArrowRight':
          if (i + 1 < size(g)) return [g, i + 1]
          return g + 1 < groups.length ? [g + 1, 0] : null
        case 'ArrowLeft':
          if (i > 0) return [g, i - 1]
          return g > 0 ? [g - 1, size(g - 1) - 1] : null
        case 'ArrowDown':
          if (i + perLine < size(g)) return [g, i + perLine]
          // Last row of a group: go to the same column of the next group.
          if (Math.floor(i / perLine) < Math.floor((size(g) - 1) / perLine))
            return [g, size(g) - 1]
          return g + 1 < groups.length
            ? [g + 1, Math.min(col, size(g + 1) - 1)]
            : null
        case 'ArrowUp': {
          if (i - perLine >= 0) return [g, i - perLine]
          if (g === 0) return null
          const prev = size(g - 1)
          const lastRow = Math.floor((prev - 1) / perLine) * perLine
          return [g - 1, Math.min(lastRow + col, prev - 1)]
        }
        case 'Home':
          return [g, 0]
        case 'End':
          return [g, size(g) - 1]
      }
      return null
    }

    function handleKeydown(event: KeyboardEvent) {
      const target = event.target as HTMLElement
      if (target?.dataset?.g === undefined) return

      const g = Number(target.dataset.g)
      const i = Number(target.dataset.i)
      const next = move(event.key, g, i)

      if (next) {
        event.preventDefault()
        focusAt(next[0], next[1])
      } else if (event.key === 'ArrowUp' && g === 0) {
        event.preventDefault()
        focusSearch()
      }
    }

    function handleFocus(emoji: EmojiExt, g: number, i: number) {
      cursor.value = { g, i }
      updateEmoji(emoji)
    }

    function handleMouseEnter(emoji: Emoji) {
      updateEmoji(emoji)
    }

    function handleClick(emoji: EmojiExt, group?: string) {
      updateSelect(emoji, group === 'recent')
      _this?.emit('select', {
        ...emoji,
        t: state.skinTone,
        i: unicodeToEmoji(emoji.r),
      })
    }

    function handleError(unicode: string) {
      failed.value[unicode] = true
    }

    // Results reflow on search; restart keyboard navigation at the top.
    watch(
      () => state.search,
      () => {
        cursor.value = null
      }
    )

    watch(
      () => state.activeGroup,
      (key) => {
        // Look up by data attribute: ids collide when two pickers share a
        // page, and keys are not guaranteed to be valid CSS selectors.
        const target = Array.from(
          bodyInner.value?.querySelectorAll<HTMLElement>('[data-group]') || []
        ).find((element) => element.dataset.group === key)

        if (target && bodyInner.value) {
          bodyInner.value.scrollTop =
            target.offsetTop - bodyInner.value.offsetTop
        }
      }
    )

    return {
      grid,
      bodyInner,
      handleClick,
      handleError,
      handleMouseEnter,
      handleFocus,
      handleKeydown,
      isCursor,
      imageOf,
      unicodeToEmoji,
      EMOJI_RESULT_KEY,
      EMOJI_NAME_KEY,
      hasGroupNames,
      isSticky,
      platform,
      groupNames,
      noResults,
      failed,
    }
  },
})
</script>
