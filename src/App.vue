<template>

  <div class="input-wrap">
    <input v-model="inputValue" type="text" placeholder="Hello world">
  </div>

  <Picker
      :native="false"
      :search="true"
      :groupsIcons="true"
      @select="updateEmoji"
  />
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import Picker from "./components/Picker.vue";

export default defineComponent({
  name: 'App',
  components: {
    Picker
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
  margin-top: 60px;
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
