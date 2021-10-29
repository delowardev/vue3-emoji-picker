<template>
  <div @mouseleave="updateSkinToneState(false)" class="v3-footer">
    <div class="v3-foot-left">
      <span class="v3-icon"><img :src="emoji.src" /></span>
      <span class="v3-text">:{{ emoji.n[1] || emoji.n[0] }}:</span>
    </div>

    <button class="v3-tone" @click="toggleSkinToneState">
      <span class="v3-text">Skin tone</span>
      <span class="v3-icon">👍</span>
    </button>

    <div class="v3-skin-tones" :class="skinTone ? 'v3-is-open' : ''">
      <button @click="selectSkinTone(tone)" :class="['v3-skin-tone-' + tone, 'v3-skin-tone']" v-for="tone in SKIN_TONES" :key="tone" />
    </div>

  </div>
</template>


<script lang="ts">
import {computed, defineComponent, ref} from "vue";
import state from "../store";
import {unicodeToEmoji} from "../helpers";
import { EMOJI_REMOTE_SRC, SKIN_TONES } from "../constant";
import { updateSkinTone} from "../store/composition";

export default defineComponent({
  name: "Header",
  setup() {

    const skinTone = ref(false)

    const emoji = computed(() => {
      return {
        ...state.emoji,
        native: unicodeToEmoji(state.emoji.u),
        src: EMOJI_REMOTE_SRC + '/' + state.emoji.u + '.png'
      }
    })

    function updateSkinToneState( open = true ) {
      skinTone.value = open;
    }

    function toggleSkinToneState() {
      skinTone.value = !skinTone.value;
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
      toggleSkinToneState
    }
  }
})

</script>
