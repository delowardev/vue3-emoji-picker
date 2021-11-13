<template>
  <div v-if="hasGroupIcons || hasSearch" class="v3-header">
    <div v-if="hasGroupIcons" class="v3-groups">
      <button
          class="v3-group"
          v-for="group in groups"
          :key="group.key"
          @click="updateActiveGroup(group.key)"
      >
          <span :title="group.title" class="v3-icon">
            <img :src="icons[group.key]" alt="" />
          </span>
      </button>
    </div>
    <div v-if="hasGroupIcons && hasSearch" class="v3-spacing"></div>
    <div v-if="hasSearch" class="v3-search">
      <input v-model="searchValue" type="text" placeholder="Search emoji" />
    </div>
  </div>
</template>


<script lang="ts">
import {computed, defineComponent, ref} from "vue";
import state from "../store";
import { GroupKeys } from "../types";


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
import { updateSearch, updateActiveGroup } from "../store/composition";

export default defineComponent({
  name: "Header",
  setup() {

    const hasSearch = computed(() => state.options.search);
    const hasGroupIcons = computed(() => state.options.groupIcons);

    const searchValue = computed({
      get: () => state.search,
      set: (value: string) => updateSearch(value)
    })


    return {
      groups: state.groups,
      searchValue,
      updateActiveGroup,
      hasSearch,
      hasGroupIcons,
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
    }
  }
})

</script>
