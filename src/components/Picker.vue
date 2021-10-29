<template>
  <div class="v3-emoji-picker">
    <Header />
    <Body />
    <Footer />
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import Body from "./Body.vue";
import Header from "./Header.vue";
import Footer from "./Footer.vue";
import { updateOptions } from "../store/composition"


export default defineComponent({
  name: "Picker",
  props: {
    native: {
      type: Boolean,
      default: false
    }
  },
  components: {
    Body,
    Header,
    Footer
  },
  setup(props) {

    // set-up initial props
    updateOptions({
      native: props.native
    })

  }
});
</script>
