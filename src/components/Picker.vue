<template>
  <div class="v3-emoji-picker">
    <div class="v3-header">
      <div class="v3-groups">
        <button
          class="v3-group"
          v-for="group in groups"
          :key="group.key"
          @click="updateGroup(group.key)"
        >
          <span :title="group.title" class="v3-icon">
            <img :src="icons[group.key]" alt="" />
          </span>
        </button>
      </div>
      <div class="v3-search">
        <input v-model="searchValue" type="text" placeholder="Search emoji" />
      </div>
    </div>

    <PickerBody @select="select" :activeGroup="activeGroup" />

    <div class="v3-footer">
      <div class="v3-foot-left">
        <span class="v3-icon"><img :src="emoji.src" /></span>
        <span class="v3-text">:{{ emoji.n[1] || emoji.n[0] }}:</span>
      </div>
      <button class="v3-tone">
        <span class="v3-text">Skin Tone</span>
        <span class="v3-icon">👍</span>
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import {computed, defineComponent, ref} from "vue";
import PickerBody from "./PickerBody.vue";
import state from "../store";
import { updateSearch } from "../store/composition"
import { Emoji, GroupKeys } from "../types";
import { unicodeToEmoji } from "../helpers"
import { EMOJI_REMOTE_SRC } from "../constant"

/**
 * Group/Category Images
 */
import smileys_people from "../svgs/groups/smileys_people.svg";
import animals_nature from "../svgs/groups/animals_nature.svg";
import food_drink from "../svgs/groups/food_drink.svg";
import activities from "../svgs/groups/activities.svg";
import travel_places from "../svgs/groups/travel_places.svg";
import objects from "../svgs/groups/objects.svg";
import symbols from "../svgs/groups/symbols.svg";
import flags from "../svgs/groups/flags.svg";

export default defineComponent({
  name: "Picker",
  components: {
    PickerBody
  },
  setup(_, { emit }) {

    const activeGroup = ref<string>("");

    function updateGroup( group: string) {
      activeGroup.value = group;
    }

    function select(emoji: Emoji) {
      emit("select", {
        ...emoji,
        i: unicodeToEmoji(emoji.u)
      })
    }

    const searchValue = computed({
      get: () => state.search,
      set: (value: string) => updateSearch(value)
    })

    const emoji = computed(() => {
      return {
        ...state.emoji,
        native: unicodeToEmoji(state.emoji.u),
        src: EMOJI_REMOTE_SRC + '/' + state.emoji.u + '.png'
      }
    })

    return {
      groups: state.groups,
      searchValue,
      emoji,
      activeGroup,
      updateGroup,
      select,
      icons: {
        smileys_people,
        animals_nature,
        food_drink,
        activities,
        travel_places,
        objects,
        symbols,
        flags
      } as Record<GroupKeys, string>
    };
  }
});
</script>
