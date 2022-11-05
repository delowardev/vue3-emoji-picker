<template>
  <h2>Default</h2>
  <picker :native="false" :display-recent="true" @select="onSelect" />

  <h2>Native</h2>
  <picker :native="true" @select="onSelect" />

  <h2>Additional groups</h2>
  <picker :additional-groups="additionalGroups" @select="onSelect" />

  <h2>With input</h2>
  <picker
    :text="text"
    picker-type="input"
    @select="onSelect"
    @update:text="onChangeText"
  />

  <h2>With textarea</h2>
  <picker
    :text="text"
    picker-type="textarea"
    @select="onSelect"
    @update:text="onChangeText"
  />

  <h2>With group ordering and additional groups</h2>
  <picker
    :additional-groups="additionalGroups"
    :group-names="{
      smileys_people: 'Smileys!',
      my_custom_group: 'Custom Group',
    }"
    :group-order="['flags', 'my_custom_group', 'smileys_people']"
    :group-icons="{ my_custom_group: custom }"
    @select="onSelect"
  />
</template>

<script lang="ts">
/**
 * External dependencies
 */
import { defineComponent, ref } from 'vue'

/**
 * Internal dependencies
 */
import Picker from './components/Picker.vue'

/**
 * SVGs
 */
import custom from './svgs/groups/custom.svg'

export default defineComponent({
  name: 'App',
  components: {
    Picker,
  },
  setup() {
    const text = ref('input')

    /**
     * Handle text change
     * @param new_text
     */
    function onChangeText(new_text: string | undefined) {
      text.value = new_text || ''
    }

    function onSelect(emoji: any) {
      alert(`${emoji.i} selected, check console log for emoji details.`)
      console.log(emoji)
    }

    const additionalGroups = {
      my_custom_group: [
        { n: ['grinning face', 'grinning'], u: '1f600' },
        { n: ['grinning face with smiling eyes', 'grin'], u: '1f601' },
      ],
    }

    /**
     * Return vars
     */
    return {
      onChangeText,
      text,
      onSelect,
      additionalGroups,
      custom,
    }
  },
})
</script>

<style lang="scss">
h2 {
  margin-top: 60px;
}
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin: 60px auto 0;
  max-width: 560px;
}
.input-wrap {
  input {
    display: block;
    height: 40px;
    width: 400px;
    margin: 0 auto 30px;
    padding: 0 20px;
  }
}
</style>
