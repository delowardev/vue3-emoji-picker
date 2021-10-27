<template>
  <div class="v3-body">
    <div class="v3-body-inner" ref="bodyInner">
      <div class="v3-group" v-for="(group, key) in emojis" :id="key" :key="key">
        <h5>{{ GROUP_NAMES[key] }}</h5>
        <div class="v3-emojis">
          <button
            @mouseenter="handleMouseEnter(emoji)"
            @click="handleClick(emoji)"
            v-for="emoji in group"
            :key="emoji.u"
          >
            <img
              @error="handleError($event, emoji.u)"
              :src="EMOJI_REMOTE_SRC + `/${emoji.u}.png`"
              :alt="emoji.n[0]"
            />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent, watch, ref, computed} from "vue";
import state from "../store";
import { EmojiRecord, Emoji } from "../types";
import { EMOJI_REMOTE_SRC, GROUP_NAMES } from "../constant";
import { filterEmojis } from "../helpers";
import { updateEmoji } from "../store/composition"

export default defineComponent({
  name: "PickerBody",
  props: {
    activeGroup: String
  },
  emits: ["select"],
  setup(props, { emit }) {
    const bodyInner = ref<HTMLElement | null>(null);

    const emojis = computed<EmojiRecord>(() => filterEmojis(state.emojis, state.search))

    function handleMouseEnter(emoji: Emoji) {
      updateEmoji(emoji);
    }

    function handleClick(emoji: Emoji) {
      emit("select", emoji);
    }

    // @todo: handle error
    function handleError(event: Event, unicode: string) {
      console.log(unicode);
    }

    watch(
      () => props.activeGroup,
      () => {
        bodyInner.value
          ?.querySelector('#' + props.activeGroup)
          ?.scrollIntoView({ behavior: "smooth" });
      }
    );

    return {
      emojis,
      bodyInner,
      EMOJI_REMOTE_SRC,
      GROUP_NAMES,
      handleClick,
      handleError,
      handleMouseEnter
    };
  }
});
</script>
