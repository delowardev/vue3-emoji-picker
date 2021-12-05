<template>
  <h2>Default</h2>
  <picker />

  <h2>With input</h2>
  <picker :text="text" picker-type="input" @update:text="onChangeText" />
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

    /**
     * Return vars
     */
    return {
      onChangeText,
      text,
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
