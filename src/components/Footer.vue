<template>
  <div class="v3-footer" @mouseleave="updateSkinToneState(false)">
    <div v-if="hasPreview" class="v3-foot-left">
      <span :class="platform" class="v3-icon">
        <span v-if="!emoji.src || hasError">{{ unicodeToEmoji(emoji.r) }}</span>
        <img
          v-else
          :alt="unicodeToEmoji(emoji.r)"
          :src="emoji.src"
          @error="hasError = true"
        />
      </span>
      <span class="v3-text">
        :{{ emoji[EMOJI_NAME_KEY][1] || emoji[EMOJI_NAME_KEY][0] }}:
      </span>
    </div>

    <template v-if="hasSkinTones">
      <button
        type="button"
        class="v3-tone"
        :aria-expanded="skinTone ? 'true' : 'false'"
        @click="toggleSkinToneState"
      >
        <span class="v3-text">
          {{ skinToneText }}
        </span>
        <span :class="`v3-icon v3-tone-${stateSkinTone}`" />
      </button>

      <div
        :class="skinTone ? 'v3-is-open' : ''"
        class="v3-skin-tones"
        role="radiogroup"
        :aria-label="skinToneText"
      >
        <button
          v-for="(tone, index) in SKIN_TONES"
          :key="tone"
          type="button"
          role="radio"
          :aria-checked="stateSkinTone === tone ? 'true' : 'false'"
          :aria-label="toneLabels[index] || tone"
          :tabindex="skinTone ? 0 : -1"
          :class="['v3-skin-tone-' + tone, 'v3-skin-tone']"
          @click="selectSkinTone(tone)"
        />
      </div>
    </template>
  </div>
</template>

<script lang="ts">
/**
 * External dependencies
 */
import { computed, defineComponent, inject, ref, watch } from 'vue'

/**
 * Internal dependencies
 */
import { SKIN_TONES, EMOJI_RESULT_KEY, EMOJI_NAME_KEY } from '../constant'
import { Store } from '../types'
import { unicodeToEmoji, isMac } from '../helpers'
import { resolveEmojiImage } from '../core/images'

export default defineComponent({
  name: 'PickerFooter',
  setup() {
    const { state, updateSkinTone } = inject('store') as Store
    const skinTone = ref(false)
    const hasError = ref(false)
    const stateSkinTone = computed(() => state.skinTone)
    const skinToneText = computed(() => state.i18n.skinTone)
    const hasSkinTones = computed(
      () => state.options.skinTonePosition !== 'none'
    )
    const hasPreview = computed(() => state.options.previewPosition !== 'none')
    const toneLabels = computed(() => state.i18n.skinTones)
    const platform = isMac() ? 'is-mac' : ''

    const emoji = computed<any>(() => {
      const unicode = state.emoji[EMOJI_RESULT_KEY] || state.emoji.u
      const src =
        state.options.set === 'native' && !state.emoji.src
          ? null
          : resolveEmojiImage(state.emoji, unicode, {
              set: state.options.set,
              imageUrl: state.options.imageUrl,
            })

      return { ...state.emoji, r: unicode, src }
    })

    function updateSkinToneState(open = true) {
      skinTone.value = open
    }

    function toggleSkinToneState() {
      skinTone.value = !skinTone.value
    }

    function selectSkinTone(tone: string) {
      updateSkinTone(tone)
      updateSkinToneState(false)
    }

    watch(
      () => state.emoji,
      () => {
        hasError.value = false
      }
    )

    return {
      emoji,
      SKIN_TONES,
      updateSkinToneState,
      skinTone,
      stateSkinTone,
      selectSkinTone,
      toggleSkinToneState,
      EMOJI_RESULT_KEY,
      EMOJI_NAME_KEY,
      skinToneText,
      hasSkinTones,
      toneLabels,
      hasPreview,
      unicodeToEmoji,
      platform,
      hasError,
    }
  },
})
</script>
