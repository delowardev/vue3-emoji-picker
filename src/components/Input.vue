<template>
  <div class="v3-input-emoji-picker">
    <div class="v3-input-picker-root">
      <input v-model="input" type="text" class="v3-emoji-picker-input">
      <div class="v3-input-picker-wrap">
        <button @click="open = !open" class="v3-input-picker-icon">
          <img :src="face" alt="">
        </button>
        <Picker
            v-bind="props"
            v-if="open"
            @select="onSelect"
        />
      </div>
    </div>
  </div>
</template>


<script lang="ts">
import {defineComponent, ref, computed, watch} from "vue";
import Picker from "./Picker.vue";
import smileys_people from "../svgs/groups/smileys_people.svg";
import props from "../props";

export default defineComponent({
  name: "Header",
  components: {
    Picker
  },
  props: {
    ...props,
    value: {
      type: String,
      default: ''
    }
  },
  setup( props, { emit } ) {

    const open = ref(false);
    const input = ref(props.value);

    function onSelect(emoji: any) {
      input.value += emoji.i;
    }

    watch(() => input.value, () => {
      emit('input', input);
    })

    return {
      face: smileys_people,
      open,
      props,
      onSelect,
      input
    }
  }
})

</script>
