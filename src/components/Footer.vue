<template>
  <div class="v3-footer">
    <div class="v3-foot-left">
      <span class="v3-icon"><img :src="emoji.src" /></span>
      <span class="v3-text">:{{ emoji.n[1] || emoji.n[0] }}:</span>
    </div>
    <button class="v3-tone">
      <span class="v3-text">Skin tone</span>
      <span class="v3-icon">👍</span>
    </button>
  </div>
</template>


<script lang="ts">
import {computed, defineComponent} from "vue";
import state from "../store";
import {unicodeToEmoji} from "../helpers";
import { EMOJI_REMOTE_SRC } from "../constant";


export default defineComponent({
  name: "Header",
  setup() {

    const emoji = computed(() => {
      return {
        ...state.emoji,
        native: unicodeToEmoji(state.emoji.u),
        src: EMOJI_REMOTE_SRC + '/' + state.emoji.u + '.png'
      }
    })

    return {
      emoji,
    }
  }
})

</script>
