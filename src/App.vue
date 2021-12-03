<template>
  <h2>Default</h2>
  <div class="input-wrap">
    <input v-model="inputValue" type="text" placeholder="Hello world" />
  </div>
  <Picker :native="false" @select="updateEmoji" />

  <h2>With Input Picker</h2>
  <Input />
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import Picker from './components/Picker.vue'
import Input from './components/Input.vue'

export default defineComponent({
  name: 'App',
  components: {
    Picker,
    Input,
  },
  setup() {
    const inputValue = ref('')

    function updateEmoji(emoji: any) {
      console.log(emoji)
      inputValue.value += emoji.i
    }

    return {
      inputValue,
      updateEmoji,
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
  margin: 0 auto;
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
