<template>
  <div class="v3-body">
    <div class="v3-body-inner" ref="BodyInner">
      <div class="v3-group" v-for="(group, key) in emojis" :id="key" :key="key">
        <h5>{{ GROUP_NAMES[key] }}</h5>
        <div class="v3-emojis">
          <button
            @click="handleClick(emoji.u)"
            v-for="emoji in group"
            :key="emoji.u"
          >
            <!--            &nbsp;{{-->
            <!--              emoji.u-->
            <!--                  .split("-")-->
            <!--                  .map(hex => parseInt(hex, 16))-->
            <!--                  .map(hex => String.fromCodePoint(hex))-->
            <!--                  .join('')-->
            <!--            }}-->

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
import { EmojiRecord } from "../types";
import { EMOJI_REMOTE_SRC, GROUP_NAMES } from "../constant";
import { filterEmojis } from "../helpers";

export default defineComponent({
  name: "PickerBody",
  props: {
    activeGroup: String
  },

  setup(props) {
    const BodyInner = ref<HTMLElement | null>(null);

    const emojis = computed<EmojiRecord>(() => filterEmojis(state.emojis, state.search))

    function handleClick(unicode: string) {
      console.log(unicode);
    }

    // @todo: handle error
    function handleError(event: Event, unicode: string) {
      console.log(unicode);
    }

    watch(
      () => props.activeGroup,
      () => {
        //  BodyInner.value.getElementById(props.activeGroup)?.scrollIntoView();
        document
          .getElementById(props.activeGroup as string)
          ?.scrollIntoView({ behavior: "smooth" });
      }
    );
    return {
      emojis,
      BodyInner,
      EMOJI_REMOTE_SRC,
      GROUP_NAMES,
      handleClick,
      handleError
    };
  }
});
</script>
