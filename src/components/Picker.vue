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
import {GROUP_NAMES, STATIC_TEXTS} from "../constant"


export default defineComponent({
  name: "Picker",
  props: {
    native: {
      type: Boolean,
      default: false
    },
    hideSearch: {
      type: Boolean,
      default: false
    },
    hideGroupIcons: {
      type: Boolean,
      default: false
    },
    hideGroupNames: {
      type: Boolean,
      default: false
    },
    staticTexts: {
      type: Object,
      default: {}
    },
    disableStickyGroupNames: {
      type: Boolean,
      default: false
    },
    disableGroups: {
      type: Array,
      default: []
    },
    groupNames: {
      type: Object,
      default: {}
    },
    disableSkinTones: {
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
      native: props.native,
      hideSearch: props.hideSearch,
      hideGroupIcons: props.hideGroupIcons,
      hideGroupNames: props.hideGroupNames,
      staticTexts: {
        ...STATIC_TEXTS,
        ...props.staticTexts
      },
      disableStickyGroupNames: props.disableStickyGroupNames,
      disableGroups: props.disableGroups,
      groupNames: {
        ...GROUP_NAMES,
        ...props.groupNames
      },
      disableSkinTones: props.disableSkinTones,
    })

  }
});
</script>
