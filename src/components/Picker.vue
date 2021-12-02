<template>
  <div class="v3-emoji-picker">
    <Header />
    <Body />
    <Footer />
  </div>
</template>

<script lang="ts">
import { defineComponent, provide } from "vue";
import Body from "./Body.vue";
import Header from "./Header.vue";
import Footer from "./Footer.vue";
import { GROUP_NAMES, STATIC_TEXTS } from "../constant"
import Store from "../store";


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
    disabledGroups: {
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

    /**
     * Create a brand new store and
     * (provide) make available for entire app.
     */
    const store = Store();
    provide("store", store);

    // set-up initial props
    store.updateOptions({
      native: props.native,
      hideSearch: props.hideSearch,
      hideGroupIcons: props.hideGroupIcons,
      hideGroupNames: props.hideGroupNames,
      staticTexts: {
        ...STATIC_TEXTS,
        ...props.staticTexts
      },
      disableStickyGroupNames: props.disableStickyGroupNames,
      disabledGroups: props.disabledGroups,
      groupNames: {
        ...GROUP_NAMES,
        ...props.groupNames
      },
      disableSkinTones: props.disableSkinTones,
    })

  }
});
</script>
