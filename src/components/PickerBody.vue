<template>
  <div class="v3-body">
    <div class="v3-body-inner">
      <div class="v3-group" v-for="(group, key) in emojis" :id="key">
        <h5>{{ key }}</h5>
        <div class="v3-emojis">
          <span v-for="emoji in group">
<!--            &nbsp;{{-->
<!--              emoji.u-->
<!--                  .split("-")-->
<!--                  .map(hex => parseInt(hex, 16))-->
<!--                  .map(hex => String.fromCodePoint(hex))-->
<!--                  .join('')-->
<!--            }}-->

            <img :src="EMOJI_REMOTE_SRC + `/${emoji.u}.png`" :alt="emoji.n">

          </span>
        </div>
      </div>
    </div>

  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import state from "../store"
import { EmojiRecord } from "../types"

import { EMOJI_REMOTE_SRC } from "../constant";

export default defineComponent({
  name: "PickerBody",
  setup() {
    return {
      emojis: state.emojis as EmojiRecord,
      EMOJI_REMOTE_SRC
    }

  }
})
</script>
