<template>
  <div v-if="hasGroupIcons || hasSearch" class="v3-header">
    <div v-if="hasGroupIcons" class="v3-groups">
      <button
        v-for="group in groups"
        :key="group.key"
        type="button"
        class="v3-group"
        @click="updateActiveGroup(group.key)"
      >
        <span :title="group.title" class="v3-icon">
          <img :src="icons[group.key]" alt="" />
        </span>
      </button>
    </div>
    <div v-if="hasGroupIcons && hasSearch" class="v3-spacing" />
    <div v-if="hasSearch" class="v3-search">
      <input v-model="searchValue" type="text" :placeholder="placeholder" />
    </div>
  </div>
</template>

<script lang="ts">
/**
 * External dependencies
 */
import { computed, defineComponent, inject } from 'vue'

/**
 * Internal dependencies
 */
import { Store } from '../types'
import { snakeToCapitalizedCase, sortGroupOrder } from '../helpers'

/**
 * Group/Category Images
 */
import smileys_people from '../svgs/groups/smileys_people.svg'
import animals_nature from '../svgs/groups/animals_nature.svg'
import food_drink from '../svgs/groups/food_drink.svg'
import activities from '../svgs/groups/activities.svg'
import travel_places from '../svgs/groups/travel_places.svg'
import objects from '../svgs/groups/objects.svg'
import symbols from '../svgs/groups/symbols.svg'
import flags from '../svgs/groups/flags.svg'
import recent from '../svgs/groups/recent.svg'

export default defineComponent({
  name: 'Header',
  props: {
    additionalGroups: {
      type: Object,
      default: () => ({}),
    },
    groupOrder: {
      type: Array,
      default: () => [],
    },
    groupIcons: {
      type: Object,
      default: () => ({}),
    },
    groupNames: {
      type: Object,
      default: () => ({}),
    },
  },
  setup(props) {
    const { state, updateSearch, updateActiveGroup } = inject('store') as Store

    const hasSearch = computed(() => !state.options.hideSearch)
    const hasGroupIcons = computed(() => !state.options.hideGroupIcons)
    const placeholder = computed(
      () => state.options.staticTexts.placeholder || ''
    )

    const searchValue = computed({
      get: () => state.search,
      set: (value: string) => updateSearch(value),
    })

    let groups = [
      ...state.groups,
      ...Object.keys(props.additionalGroups).map((g) => ({
        key: g,
        title: props.groupNames[g]
          ? props.groupNames[g]
          : snakeToCapitalizedCase(g),
      })),
    ]

    if (props.groupOrder.length) {
      groups = groups.sort((a, b) =>
        sortGroupOrder(a.key, b.key, props.groupOrder as string[])
      )
    }

    return {
      groups,
      searchValue,
      updateActiveGroup,
      hasSearch,
      hasGroupIcons,
      placeholder,
      icons: {
        smileys_people,
        animals_nature,
        food_drink,
        activities,
        travel_places,
        objects,
        symbols,
        flags,
        ...props.groupIcons,
        recent,
      } as Record<string, string>,
    }
  },
})
</script>
