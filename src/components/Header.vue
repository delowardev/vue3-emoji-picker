<template>
  <div v-if="hasGroupIcons || hasSearch" class="v3-header">
    <div
      v-if="hasGroupIcons"
      class="v3-groups"
      role="toolbar"
      :aria-label="texts.categoriesLabel"
    >
      <button
        v-for="group of orderedGroups"
        :key="group.key"
        type="button"
        class="v3-group"
        :class="{
          'v3-is-hidden': !icons[group.key],
        }"
        :aria-label="group.title"
        @click="updateActiveGroup(group.key)"
      >
        <span :title="group.title" class="v3-icon">
          <img :src="icons[group.key]" alt="" />
        </span>
      </button>
    </div>
    <div v-if="hasGroupIcons && hasSearch" class="v3-spacing" />
    <div v-if="hasSearch" class="v3-search">
      <input
        ref="searchInput"
        v-model="searchValue"
        type="search"
        :placeholder="placeholder"
        :aria-label="texts.searchLabel || placeholder"
        @keydown="onSearchKeydown"
      />
    </div>
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
import { Group, Store } from '../types'
import { snakeToCapitalizedCase } from '../helpers'
import { STATIC_TEXTS } from '../constant'

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
  setup() {
    const { state, updateSearch, updateActiveGroup } = inject('store') as Store

    const hasSearch = computed(() => !state.options.hideSearch)
    const searchInput = ref<HTMLInputElement | null>(null)
    const texts = computed(() => ({
      ...STATIC_TEXTS,
      ...state.options.staticTexts,
    }))

    function emojiButtons(): HTMLButtonElement[] {
      const root = searchInput.value?.closest('.v3-emoji-picker')
      return Array.from(
        root?.querySelectorAll<HTMLButtonElement>('.v3-emojis button') || []
      )
    }

    /** ArrowDown moves into the grid; Enter picks the first result. */
    function onSearchKeydown(event: KeyboardEvent) {
      if (event.key === 'ArrowDown') {
        const buttons = emojiButtons()
        const current = buttons.find((button) => button.tabIndex === 0)
        const target = current || buttons[0]
        if (target) {
          event.preventDefault()
          target.focus()
        }
      } else if (event.key === 'Enter') {
        const [first] = emojiButtons()
        if (first) {
          event.preventDefault()
          first.click()
        }
      }
    }
    const hasGroupIcons = computed(() => !state.options.hideGroupIcons)
    const placeholder = computed(
      () => state.options.staticTexts.placeholder || ''
    )

    const searchValue = computed({
      get: () => state.search,
      set: (value: string) => updateSearch(value),
    })

    /**
     * Recomputed whenever groups, names, order or disabled groups change.
     * This used to be snapshotted in `setup()`, so none of those props could
     * take effect after mount.
     */
    const orderedGroups = computed<Group[]>(() => {
      const groups = [
        ...state.groups.map((group) => ({
          ...group,
          title: state.groupNames[group.key] || group.title,
        })),
        ...Object.keys(state.options.additionalGroups || {}).map((key) => ({
          key,
          title: state.groupNames[key] || snakeToCapitalizedCase(key),
          u: '',
        })),
      ] as Group[]

      return state.orderedGroupKeys
        .map((key) => groups.find((group) => group.key === key))
        .filter((group): group is Group => Boolean(group))
    })

    const icons = computed<Record<string, string>>(() => ({
      smileys_people,
      animals_nature,
      food_drink,
      activities,
      travel_places,
      objects,
      symbols,
      flags,
      // `recent` must come before the user-provided icons so it can be
      // overridden — the README documents that it can.
      recent,
      ...state.options.groupIcons,
    }))

    return {
      orderedGroups,
      searchValue,
      searchInput,
      texts,
      onSearchKeydown,
      updateActiveGroup,
      hasSearch,
      hasGroupIcons,
      placeholder,
      icons,
    }
  },
})
</script>
