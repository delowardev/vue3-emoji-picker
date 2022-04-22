<template>
  <div class="v3-footer" @mouseleave="updateSkinToneState(false)">
    <div class="v3-foot-left">
      <span class="v3-icon">
        <!-- @todo: render native emoji when state.options.native = true -->
        <img :src="emoji.src" />
      </span>
      <span class="v3-text">
        :{{ emoji[EMOJI_NAME_KEY][1] || emoji[EMOJI_NAME_KEY][0] }}:
      </span>
    </div>

    <template v-if="hasSkinTones">
      <button type="button" class="v3-tone" @click="toggleSkinToneState">
        <span class="v3-text">
          {{ skinToneText }}
        </span>
        <span class="v3-icon">👍</span>
      </button>

      <div :class="skinTone ? 'v3-is-open' : ''" class="v3-skin-tones">
        <button
          v-for="tone in SKIN_TONES"
          :key="tone"
          type="button"
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
import { computed, defineComponent, inject, ref } from 'vue'

/**
 * Internal dependencies
 */
import {
  EMOJI_REMOTE_SRC,
  SKIN_TONES,
  EMOJI_RESULT_KEY,
  EMOJI_NAME_KEY,
} from '../constant'
import { Store } from '../types'

export default defineComponent({
  name: 'Header',
  setup() {
    const { state, updateSkinTone } = inject('store') as Store
    const skinTone = ref(false)
    const skinToneText = computed(
      () => state.options.staticTexts.skinTone || 'Skin tone'
    )
    const hasSkinTones = computed(() => !state.options.disableSkinTones)

    // @todo: type shouldn't be 'any'
    const emoji = computed<any>(() => {
      return {
        ...state.emoji,
        src: EMOJI_REMOTE_SRC + '/' + state.emoji[EMOJI_RESULT_KEY] + '.png',
      }
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

    return {
      emoji,
      SKIN_TONES,
      updateSkinToneState,
      skinTone,
      selectSkinTone,
      toggleSkinToneState,
      EMOJI_RESULT_KEY,
      EMOJI_NAME_KEY,
      skinToneText,
      hasSkinTones,
    }
  },
})
</script>
