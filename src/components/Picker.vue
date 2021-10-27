<template>
  <div class="v3-emoji-picker">
    <Header />
    <Body @select="select" />
    <Footer />
  </div>
</template>

<script lang="ts">
import {computed, defineComponent, ref} from "vue";
import Body from "./Body.vue";
import Header from "./Header.vue";
import Footer from "./Footer.vue";
import state from "../store";
import { Emoji } from "../types";
import { unicodeToEmoji } from "../helpers"
import { EMOJI_REMOTE_SRC } from "../constant"


export default defineComponent({
  name: "Picker",
  components: {
    Body,
    Header,
    Footer
  },
  setup(_, { emit }) {

    function select(emoji: any): any {
      emit("select", {
        ...emoji,
        i: unicodeToEmoji(emoji.u)
      })
    }

    const emoji = computed(() => {
      return {
        ...state.emoji,
        native: unicodeToEmoji(state.emoji.u),
        src: EMOJI_REMOTE_SRC + '/' + state.emoji.u + '.png'
      }
    })

    return {
      groups: state.groups,
      emoji,
      select,
    };
  }
});
</script>
