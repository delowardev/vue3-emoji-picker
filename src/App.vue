<template>

  <div class="input-wrap">
    <input v-model="inputValue" type="text" placeholder="Hello world">
  </div>

  <Picker
      :native="false"
      @select="updateEmoji"
  />

  <h2> Input Picker </h2>
  <Input />


</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import Picker from "./components/Picker.vue";
import Input from "./components/Input.vue";

export default defineComponent({
  name: 'App',
  components: {
    Picker,
    Input
  },
  setup() {

    const inputValue = ref("")

    function updateEmoji(emoji: any) {
      console.log(emoji)
      inputValue.value += emoji.i
    }

    return {
      inputValue,
      updateEmoji
    }
  }
})
</script>

<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  max-width: 960px;
  margin: 60px auto 0;
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
